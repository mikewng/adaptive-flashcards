"""
Repository for card-related database operations.
"""
from datetime import datetime, timezone
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import Card


class CardRepository:
    """Handles database queries for cards."""

    @staticmethod
    def get_due_cards(db: Session, deck_id: int, limit: int) -> List[Card]:
        """
        Get cards that are due for review in a specific deck.

        Args:
            db: Database session
            deck_id: ID of the deck
            limit: Maximum number of cards to return

        Returns:
            List of due cards, ordered by due date
        """
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
        return list(db.scalars(stmt).all())

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
