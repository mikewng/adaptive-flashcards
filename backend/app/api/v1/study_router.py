from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import date, datetime, timezone
from typing import List
from difflib import SequenceMatcher
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import Card, Review, StudySession, CardMetrics, User
from app.schemas.review import ReviewCreate
from app.schemas.study_session import (
    StudySessionStart,
    StudySessionEnd,
    StudySessionRead,
    StudySessionAnalytics,
    StudyCardResponse,
    AnswerSubmit,
    AnswerSubmitResponse
)
from app.services.scheduler import apply_sm2_formula

router = APIRouter()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def normalize_answer(text: str) -> str:
    """
    Normalize answer text for better fuzzy matching.
    Handles common variations like punctuation, extra spaces, articles, etc.
    """
    import re

    # Convert to lowercase and strip
    text = text.lower().strip()

    # Remove common punctuation
    text = re.sub(r'[.,!?;:\-\'"()\[\]{}]', '', text)

    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)

    # Remove common articles at the start (the, a, an)
    text = re.sub(r'^(the|a|an)\s+', '', text)

    return text


# ============================================================================
# SESSION MANAGEMENT ENDPOINTS
# ============================================================================

# Add session with user and deck info
@router.post("/session/start", response_model=StudySessionRead)
def start_study_session(
    payload: StudySessionStart,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    session = StudySession(
        user_id=user.id,
        deck_id=payload.deck_id,
        started_at=datetime.now(timezone.utc),
        session_type=payload.session_type
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session

# Ends session with session id
@router.post("/session/end", response_model=StudySessionAnalytics)
def end_study_session(
    payload: StudySessionEnd,
    db: Session = Depends(get_db)
):
    session = db.get(StudySession, payload.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    if session.ended_at is not None:
        raise HTTPException(400, "Session already ended")

    session.ended_at = datetime.now(timezone.utc)

    reviews = db.query(Review).filter(Review.session_id == session.id).all()

    if reviews:
        total_time = sum(r.took_ms for r in reviews)
        session.cards_studied = len(reviews)
        session.correct_count = sum(1 for r in reviews if r.response >= 3)
        session.incorrect_count = sum(1 for r in reviews if r.response < 3)
        session.average_time_per_card = total_time // len(reviews) if reviews else 0

    db.commit()
    db.refresh(session)

    accuracy_rate = (session.correct_count / session.cards_studied * 100) if session.cards_studied > 0 else 0.0
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


@router.get("/session/{session_id}", response_model=StudySessionRead)
def get_study_session(
    session_id: int,
    db: Session = Depends(get_db)
):
    session = db.get(StudySession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    return session


# ============================================================================
# CARD RETRIEVAL ENDPOINTS
# ============================================================================

@router.get("/deck/{deck_id}/due", response_model=List[StudyCardResponse])
def get_due_cards(
    deck_id: int,
    limit: int = Query(20, ge=1, le=100, description="Maximum number of cards to return"),
    db: Session = Depends(get_db)
):
    stmt = (
        select(Card)
        .where(
            Card.deck_id == deck_id,
            Card.suspended == False,
            Card.due_date <= datetime.now(timezone.utc)
        )
        .order_by(Card.due_date.asc())
        .limit(limit)
    )

    cards = db.scalars(stmt).all()

    return [
        StudyCardResponse(
            id=card.id,
            question=card.question,
            answer=None
        )
        for card in cards
    ]


@router.get("/deck/{deck_id}/new", response_model=List[StudyCardResponse])
def get_new_cards(
    deck_id: int,
    limit: int = Query(20, ge=1, le=100, description="Maximum number of cards to return"),
    db: Session = Depends(get_db)
):
    stmt = (
        select(Card)
        .where(
            Card.deck_id == deck_id,
            Card.suspended == False,
            Card.reps == 0
        )
        .order_by(Card.created_at.asc())
        .limit(limit)
    )

    cards = db.scalars(stmt).all()

    return [
        StudyCardResponse(
            id=card.id,
            question=card.question,
            answer=None
        )
        for card in cards
    ]


@router.get("/deck/{deck_id}/all", response_model=List[StudyCardResponse])
def get_all_cards(
    deck_id: int,
    limit: int = Query(50, ge=1, le=200, description="Maximum number of cards to return"),
    db: Session = Depends(get_db)
):
    stmt = (
        select(Card)
        .where(
            Card.deck_id == deck_id,
            Card.suspended == False
        )
        .order_by(Card.created_at.desc())
        .limit(limit)
    )

    cards = db.scalars(stmt).all()

    return [
        StudyCardResponse(
            id=card.id,
            question=card.question,
            answer=None
        )
        for card in cards
    ]


# ============================================================================
# ANSWER SUBMISSION ENDPOINT
# ============================================================================

@router.post("/submit", response_model=AnswerSubmitResponse)
def submit_answer(
    payload: AnswerSubmit,
    db: Session = Depends(get_db)
):
    """
    Submit an answer with detailed metrics.

    This endpoint:
    1. Validates the answer using fuzzy matching (tolerates typos, punctuation, articles)
    2. Calculates similarity score (0.0-1.0) using SequenceMatcher
    3. Maps similarity to SM-2 response quality (0-4):
       - 95%+ = Perfect recall (4)
       - 80-94% = Correct with hesitation (3)
       - 60-79% = Recalled with difficulty (2)
       - 40-59% = Incorrect but remembered something (1)
       - <40% = Complete blank (0)
    4. Updates card statistics using SM-2 algorithm
    5. Records detailed metrics for ML training
    6. Returns feedback to user
    """
    # Get card
    card = db.get(Card, payload.card_id)
    if not card:
        raise HTTPException(404, "Card not found")

    # Get session
    session = db.get(StudySession, payload.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # Calculate similarity score using fuzzy matching
    # First, normalize both answers to handle common variations
    user_answer_normalized = normalize_answer(payload.user_input)
    correct_answer_normalized = normalize_answer(card.answer)

    # Use SequenceMatcher for fuzzy string matching (0.0 to 1.0)
    similarity_score = SequenceMatcher(
        None,
        user_answer_normalized,
        correct_answer_normalized
    ).ratio()

    # Consider "correct" if similarity is above 95%
    is_correct = similarity_score >= 0.95

    # Map similarity to SM-2 response quality (0-4)
    if similarity_score >= 0.95:
        response_quality = 4  # Perfect recall
    elif similarity_score >= 0.8:
        response_quality = 3  # Correct with hesitation
    elif similarity_score >= 0.6:
        response_quality = 2  # Recalled with difficulty
    elif similarity_score >= 0.4:
        response_quality = 1  # Incorrect but remembered something
    else:
        response_quality = 0  # Complete blank

    review = Review(
        card_id=card.id,
        user_id=session.user_id,
        session_id=session.id,
        response=response_quality,
        took_ms=payload.time_taken_ms
    )
    db.add(review)
    db.flush()

    apply_sm2_formula(card, response_quality)

    # Update card statistics
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
        card.avg_response_time = payload.time_taken_ms
    else:
        card.avg_response_time = (
            (card.avg_response_time * (card.times_seen - 1) + payload.time_taken_ms)
            // card.times_seen
        )

    # Create detailed metrics record for ML
    now = datetime.now(timezone.utc)
    hour = now.hour

    if 5 <= hour < 12:
        time_of_day = "morning"
    elif 12 <= hour < 17:
        time_of_day = "afternoon"
    elif 17 <= hour < 21:
        time_of_day = "evening"
    else:
        time_of_day = "night"

    metrics = CardMetrics(
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
