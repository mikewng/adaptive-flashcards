from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    decks = relationship("Deck", back_populates="owner")


class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="decks")
    cards = relationship("Card", back_populates="deck")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    ease = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    reps = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    due_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    suspended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    deck = relationship("Deck", back_populates="cards")
    reviews = relationship("Review", back_populates="card")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    response = Column(Integer, nullable=False)  # 0–4
    took_ms = Column(Integer, nullable=False)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    card = relationship("Card", back_populates="reviews")


class DraftCard(Base):
    __tablename__ = "draft_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="SET NULL"))
    prompt = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    source_file = Column(String, nullable=True)
    status = Column(String, default="pending")