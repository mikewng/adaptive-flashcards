"""
Service layer for study session and answer submission logic.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.models import Card, Review, StudySession, CardMetrics
from app.schemas.study_session import (
    AnswerSubmit,
    AnswerSubmitResponse,
    StudySessionAnalytics
)
from app.services.scheduler import apply_sm2_formula
from app.utils.text_utils import (
    calculate_similarity,
    map_similarity_to_quality
)


class StudyService:
    """Handles business logic for study sessions and reviews."""

    @staticmethod
    def end_session_and_get_analytics(
        db: Session,
        session: StudySession
    ) -> StudySessionAnalytics:
        """
        End a study session and calculate analytics.

        Args:
            db: Database session
            session: The study session to end

        Returns:
            Study session analytics with performance metrics
        """
        session.ended_at = datetime.now(timezone.utc)

        # Get all reviews for this session
        reviews = db.query(Review).filter(Review.session_id == session.id).all()

        if reviews:
            total_time = sum(r.took_ms for r in reviews)
            session.cards_studied = len(reviews)
            session.correct_count = sum(1 for r in reviews if r.response >= 3)
            session.incorrect_count = sum(1 for r in reviews if r.response < 3)
            session.average_time_per_card = total_time // len(reviews)

        db.commit()
        db.refresh(session)

        # Calculate derived metrics
        accuracy_rate = (
            (session.correct_count / session.cards_studied * 100)
            if session.cards_studied > 0
            else 0.0
        )
        total_time_spent = sum(r.took_ms for r in reviews)

        return StudySessionAnalytics(
            id=session.id,
            user_id=session.user_id,
            deck_id=session.deck_id,
            started_at=session.started_at,
            ended_at=session.ended_at,
            cards_studied=session.cards_studied,
            correct_count=session.correct_count,
            incorrect_count=session.incorrect_count,
            session_type=session.session_type,
            average_time_per_card=session.average_time_per_card,
            accuracy_rate=accuracy_rate,
            total_time_spent=total_time_spent
        )

    @staticmethod
    def submit_answer(
        db: Session,
        card: Card,
        session: StudySession,
        payload: AnswerSubmit
    ) -> AnswerSubmitResponse:
        """
        Process answer submission with detailed metrics.

        This method:
        1. Validates the answer using fuzzy matching
        2. Calculates similarity score (0.0-1.0)
        3. Maps similarity to SM-2 response quality (0-4)
        4. Updates card statistics using SM-2 algorithm
        5. Records detailed metrics for ML training
        6. Returns feedback to user

        Args:
            db: Database session
            card: The card being reviewed
            session: The current study session
            payload: Answer submission data

        Returns:
            Answer submission response with feedback
        """
        # Calculate similarity score using fuzzy matching
        similarity_score = calculate_similarity(payload.user_input, card.answer)

        # Consider "correct" if similarity is above 95%
        is_correct = similarity_score >= 0.95

        # Map similarity to SM-2 response quality (0-4)
        response_quality = map_similarity_to_quality(similarity_score)

        # Create review record
        review = Review(
            card_id=card.id,
            user_id=session.user_id,
            session_id=session.id,
            response=response_quality,
            took_ms=payload.time_taken_ms
        )
        db.add(review)
        db.flush()

        # Apply SM-2 algorithm to update card scheduling
        apply_sm2_formula(card, response_quality)

        # Update card statistics
        StudyService._update_card_statistics(card, is_correct, payload.time_taken_ms)

        # Create detailed metrics record for ML
        metrics = StudyService._create_metrics_record(
            card=card,
            session=session,
            review=review,
            payload=payload,
            is_correct=is_correct,
            similarity_score=similarity_score
        )
        db.add(metrics)

        db.commit()

        return AnswerSubmitResponse(
            correct=is_correct,
            similarity_score=similarity_score,
            correct_answer=card.answer,
            response_quality=response_quality,
            next_due_date=card.due_date,
            card_id=card.id
        )

    @staticmethod
    def _update_card_statistics(card: Card, is_correct: bool, time_taken_ms: int):
        """
        Update card statistics after a review.

        Args:
            card: The card to update
            is_correct: Whether the answer was correct
            time_taken_ms: Time taken to answer in milliseconds
        """
        card.times_seen += 1
        card.last_reviewed = datetime.now(timezone.utc)

        # Update accuracy rate (running average)
        if card.times_seen == 1:
            card.accuracy_rate = 100.0 if is_correct else 0.0
        else:
            # Weighted average
            card.accuracy_rate = (
                (card.accuracy_rate * (card.times_seen - 1) + (100.0 if is_correct else 0.0))
                / card.times_seen
            )

        # Update average response time
        if card.times_seen == 1:
            card.avg_response_time = time_taken_ms
        else:
            card.avg_response_time = (
                (card.avg_response_time * (card.times_seen - 1) + time_taken_ms)
                // card.times_seen
            )

    @staticmethod
    def _create_metrics_record(
        card: Card,
        session: StudySession,
        review: Review,
        payload: AnswerSubmit,
        is_correct: bool,
        similarity_score: float
    ) -> CardMetrics:
        """
        Create detailed metrics record for ML training.

        Args:
            card: The card being reviewed
            session: The current study session
            review: The review record
            payload: Answer submission data
            is_correct: Whether the answer was correct
            similarity_score: Similarity score (0.0-1.0)

        Returns:
            CardMetrics instance
        """
        now = datetime.now(timezone.utc)
        hour = now.hour

        # Determine time of day
        if 5 <= hour < 12:
            time_of_day = "morning"
        elif 12 <= hour < 17:
            time_of_day = "afternoon"
        elif 17 <= hour < 21:
            time_of_day = "evening"
        else:
            time_of_day = "night"

        return CardMetrics(
            card_id=card.id,
            session_id=session.id,
            review_id=review.id,
            user_input=payload.user_input,
            was_correct=is_correct,
            similarity_score=similarity_score,
            time_taken_ms=payload.time_taken_ms,
            typed_chars=payload.typed_chars or 0,
            backspace_count=payload.backspace_count or 0,
            hesitation_detected=payload.hesitation_detected or False,
            typing_speed_cpm=payload.typing_speed_cpm or 0,
            time_of_day=time_of_day,
            day_of_week=now.strftime("%A").lower(),
            session_position=session.cards_studied + 1,
            self_rated_difficulty=payload.self_rated_difficulty
        )
