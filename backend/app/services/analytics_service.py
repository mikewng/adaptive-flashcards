"""
Service layer for analytics calculations and reporting.
"""
from typing import List
from sqlalchemy.orm import Session
from app.models.models import Card, Review, StudySession, CardMetrics
from app.schemas.study_session import CardAnalytics, CardAttempt


class AnalyticsService:
    """Handles analytics calculations for cards and sessions."""

    @staticmethod
    def get_card_analytics(db: Session, card: Card, user_id: int) -> CardAnalytics:
        """
        Get detailed analytics for a specific card.

        Returns:
        - Total reviews and correct count
        - Accuracy rate and trend
        - Average response time
        - Recent attempt history (last 10)
        - Current spaced repetition interval

        Args:
            db: Database session
            card: The card to analyze
            user_id: ID of the user requesting analytics

        Returns:
            Card analytics with performance metrics
        """
        # Get all reviews for this card by this user
        reviews = db.query(Review).filter(
            Review.card_id == card.id,
            Review.user_id == user_id
        ).order_by(Review.reviewed_at.desc()).all()

        total_reviews = len(reviews)
        correct_reviews = sum(1 for r in reviews if r.response >= 3)  # SM-2: 3+ is correct

        # Calculate accuracy trend
        accuracy_trend = AnalyticsService._calculate_accuracy_trend(reviews)

        # Get detailed metrics for recent attempts
        recent_attempts = AnalyticsService._get_recent_attempts(db, reviews[:10])

        return CardAnalytics(
            card_id=card.id,
            total_reviews=total_reviews,
            correct_reviews=correct_reviews,
            accuracy_rate=card.accuracy_rate,
            avg_response_time=card.avg_response_time,
            current_interval_days=card.interval_days,
            accuracy_trend=accuracy_trend,
            recent_attempts=recent_attempts,
            times_seen=card.times_seen,
            last_reviewed=card.last_reviewed
        )

    @staticmethod
    def _calculate_accuracy_trend(reviews: List[Review]) -> float:
        """
        Calculate accuracy trend by comparing recent vs older performance.

        Args:
            reviews: List of reviews ordered by date (newest first)

        Returns:
            Trend in percentage points (positive = improving, negative = declining)
        """
        accuracy_trend = 0.0

        if len(reviews) >= 6:
            # Compare last 3 vs previous 3
            recent_reviews = reviews[:3]
            older_reviews = reviews[3:6]

            recent_correct = sum(1 for r in recent_reviews if r.response >= 3)
            older_correct = sum(1 for r in older_reviews if r.response >= 3)

            recent_accuracy = (recent_correct / len(recent_reviews)) * 100
            older_accuracy = (older_correct / len(older_reviews)) * 100

            accuracy_trend = recent_accuracy - older_accuracy

        return accuracy_trend

    @staticmethod
    def _get_recent_attempts(db: Session, reviews: List[Review]) -> List[CardAttempt]:
        """
        Get detailed attempt history for recent reviews.

        Args:
            db: Database session
            reviews: List of recent reviews

        Returns:
            List of card attempts with detailed metrics
        """
        recent_attempts = []

        for review in reviews:
            # Try to get detailed metrics
            metrics = db.query(CardMetrics).filter(
                CardMetrics.review_id == review.id
            ).first()

            # Determine mode from session
            session = db.get(StudySession, review.session_id) if review.session_id else None
            mode = session.session_type.title() if session else "Study"

            # Map mode to frontend expectations
            mode_map = {
                "writing": "Writing",
                "multiple_choice": "MC",
                "flashcards": "Flashcard"
            }
            mode = mode_map.get(mode.lower(), mode)

            attempt = CardAttempt(
                date=review.reviewed_at,
                correct=review.response >= 3,
                time_taken=review.took_ms,
                similarity_score=metrics.similarity_score * 100 if metrics and metrics.similarity_score else None,
                mode=mode
            )
            recent_attempts.append(attempt)

        return recent_attempts
