from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.models import Card, StudySession, User, Deck
from app.schemas.study_session import (
    StudySessionStart,
    StudySessionEnd,
    StudySessionRead,
    StudySessionAnalytics,
    StudyCardResponse,
    AnswerSubmit,
    AnswerSubmitResponse,
    CardAnalytics
)
from app.services.study_service import StudyService
from app.services.analytics_service import AnalyticsService
from app.repositories.card_repository import CardRepository

router = APIRouter()


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

    return StudyService.end_session_and_get_analytics(db, session)


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
    cards = CardRepository.get_due_cards(db, deck_id, limit)

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
    cards = CardRepository.get_new_cards(db, deck_id, limit)

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
    cards = CardRepository.get_all_cards(db, deck_id, limit)

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

    return StudyService.submit_answer(db, card, session, payload)


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics/card/{card_id}", response_model=CardAnalytics)
def get_card_analytics(
    card_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Get detailed analytics for a specific card.

    Returns:
    - Total reviews and correct count
    - Accuracy rate and trend
    - Average response time
    - Recent attempt history (last 10)
    - Current spaced repetition interval
    """
    # Get the card
    card = db.get(Card, card_id)
    if not card:
        raise HTTPException(404, "Card not found")

    # Verify user owns this card's deck
    deck = db.get(Deck, card.deck_id)
    if not deck or deck.user_id != user.id:
        raise HTTPException(403, "Access denied")

    return AnalyticsService.get_card_analytics(db, card, user.id)
