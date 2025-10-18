from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

Base = declarative_base()
metadata = Base.metadata

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    decks = relationship("Deck", back_populates="owner")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    is_private = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="decks")
    cards = relationship("Card", back_populates="deck")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    # SM-2 algorithm fields
    ease = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    reps = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    due_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    suspended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Performance tracking fields
    accuracy_rate = Column(Float, default=0.0)  # Overall accuracy percentage (0-100)
    avg_response_time = Column(Integer, default=0)  # Average time in milliseconds
    typo_count = Column(Integer, default=0)  # Track common typos in writing mode
    last_reviewed = Column(DateTime, nullable=True)  # Last time card was studied
    proficiency_score = Column(Float, default=0.0)  # 0-100 composite score for ML
    times_seen = Column(Integer, default=0)  # Total times card shown to user

    deck = relationship("Deck", back_populates="cards")
    reviews = relationship("Review", back_populates="card")


class StudySession(Base):
    """Track complete study sessions for analytics"""
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="CASCADE"))
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    cards_studied = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    session_type = Column(String, default="writing")  # writing, multiple_choice, etc.
    average_time_per_card = Column(Integer, default=0)  # milliseconds

    user = relationship("User")
    deck = relationship("Deck")
    reviews = relationship("Review", back_populates="session")
    metrics = relationship("CardMetrics", back_populates="session")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="SET NULL"), nullable=True)
    response = Column(Integer, nullable=False)  # 0–4
    took_ms = Column(Integer, nullable=False)
    reviewed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    card = relationship("Card", back_populates="reviews")
    session = relationship("StudySession", back_populates="reviews")


class DraftCard(Base):
    __tablename__ = "draft_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    deck_id = Column(Integer, ForeignKey("decks.id", ondelete="SET NULL"))
    prompt = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    source_file = Column(String, nullable=True)
    status = Column(String, default="pending")


class CardMetrics(Base):
    """Detailed metrics for each card review - ML training data"""
    __tablename__ = "card_metrics"

    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"))
    session_id = Column(Integer, ForeignKey("study_sessions.id", ondelete="CASCADE"))
    review_id = Column(Integer, ForeignKey("reviews.id", ondelete="CASCADE"))

    # User Input Analysis
    user_input = Column(Text, nullable=False)
    was_correct = Column(Boolean, nullable=False)
    similarity_score = Column(Float)  # 0-1 for fuzzy matching
    time_taken_ms = Column(Integer, nullable=False)

    # Typing Behavior (for writing mode)
    typed_chars = Column(Integer, default=0)
    backspace_count = Column(Integer, default=0)
    hesitation_detected = Column(Boolean, default=False)  # Long pauses
    typing_speed_cpm = Column(Integer, default=0)  # Characters per minute

    # Context Features for ML
    time_of_day = Column(String)  # morning, afternoon, evening, night
    day_of_week = Column(String)  # monday, tuesday, etc.
    session_position = Column(Integer)  # Card position in session (1, 2, 3...)
    previous_card_correct = Column(Boolean, nullable=True)  # Context from previous card

    # User Feedback
    self_rated_difficulty = Column(Integer, nullable=True)  # 1-5 scale

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    card = relationship("Card")
    session = relationship("StudySession", back_populates="metrics")
    review = relationship("Review")


class RefreshToken(Base):
    """Store refresh tokens for authentication"""
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="refresh_tokens")


class TokenBlacklist(Base):
    """Store revoked/blacklisted tokens (for logout)"""
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    blacklisted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)  # Store token expiry so we can clean up old entries