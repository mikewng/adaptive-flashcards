"""
Repository for card-related database operations.
"""
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import Card


class CardRepository:
    """Handles database queries for cards."""

    @staticmethod
    def get_due_cards(
        db: Session,
        deck_id: int,
        limit: int,
        use_ml_ranking: bool = True,
        user_id: Optional[int] = None
    ) -> List[Card]:
        """
        Get cards that are due for review in a specific deck.

        Args:
            db: Database session
            deck_id: ID of the deck
            limit: Maximum number of cards to return
            use_ml_ranking: If True, rank by ML likelihood (lowest first)
            user_id: Optional user ID for ML personalization

        Returns:
            List of due cards, ordered by priority
        """
        stmt = (
            select(Card)
            .where(
                Card.deck_id == deck_id,
                Card.suspended == False,
                Card.due_date <= datetime.now(timezone.utc)
            )
            .order_by(Card.due_date.asc())
        )

        cards = list(db.scalars(stmt).all())

        # If ML ranking is enabled, reorder by likelihood
        if use_ml_ranking and cards:
            try:
                from app.ml.inference.predictor import ml_service

                # Only use ML if model is loaded
                if ml_service.is_model_loaded():
                    cards_with_likelihood = ml_service.rank_cards_by_priority(
                        cards, db, user_id
                    )
                    cards = [card for card, _ in cards_with_likelihood]
            except Exception as e:
                print(f"ML ranking failed, falling back to due_date order: {e}")

        return cards[:limit]

    @staticmethod
    def get_new_cards(db: Session, deck_id: int, limit: int) -> List[Card]:
        """
        Get new cards (never reviewed) from a specific deck.

        Args:
            db: Database session
            deck_id: ID of the deck
            limit: Maximum number of cards to return

        Returns:
            List of new cards, ordered by creation date
        """
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
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_all_cards(db: Session, deck_id: int, limit: int) -> List[Card]:
        """
        Get all cards from a specific deck.

        Args:
            db: Database session
            deck_id: ID of the deck
            limit: Maximum number of cards to return

        Returns:
            List of all cards, ordered by creation date (newest first)
        """
        stmt = (
            select(Card)
            .where(
                Card.deck_id == deck_id,
                Card.suspended == False
            )
            .order_by(Card.created_at.desc())
            .limit(limit)
        )
        return list(db.scalars(stmt).all())
