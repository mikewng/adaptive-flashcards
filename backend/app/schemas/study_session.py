from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# Session Management Schemas
class StudySessionStart(BaseModel):
    deck_id: int
    session_type: str = Field(default="writing", description="Type of study session (writing, multiple_choice, etc.)")

class StudySessionEnd(BaseModel):
    session_id: int

class StudySessionRead(BaseModel):
    id: int
    user_id: int
    deck_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    cards_studied: int
    correct_count: int
    incorrect_count: int
    session_type: str
    average_time_per_card: int

    class Config:
        from_attributes = True

class StudySessionAnalytics(StudySessionRead):
    """Extended session data with analytics"""
    accuracy_rate: float = Field(description="Percentage of correct answers")
    total_time_spent: int = Field(description="Total time in milliseconds")

# Card Retrieval Schemas
class StudyCardResponse(BaseModel):
    """Card response for study (answer hidden initially)"""
    id: int
    question: str
    answer: Optional[str] = None  # Hidden until after submission

    class Config:
        from_attributes = True

# Answer Submission Schemas
class AnswerSubmit(BaseModel):
    session_id: int
    card_id: int
    user_input: str
    time_taken_ms: int

    # Optional detailed metrics
    typed_chars: Optional[int] = None
    backspace_count: Optional[int] = None
    hesitation_detected: Optional[bool] = None
    typing_speed_cpm: Optional[int] = None
    self_rated_difficulty: Optional[int] = Field(None, ge=1, le=5)

class AnswerSubmitResponse(BaseModel):
    correct: bool
    similarity_score: float = Field(description="How close the answer was (0-1)")
    correct_answer: str
    response_quality: int = Field(ge=0, le=4, description="SM-2 response quality (0-4)")
    next_due_date: datetime
    card_id: int

# Card Analytics Schemas
class CardAttempt(BaseModel):
    """Individual attempt/review of a card"""
    date: datetime
    correct: bool
    time_taken: int  # milliseconds
    similarity_score: Optional[float] = None
    mode: str

    class Config:
        from_attributes = True

class CardAnalytics(BaseModel):
    """Analytics data for a specific card"""
    card_id: int
    total_reviews: int
    correct_reviews: int
    accuracy_rate: float
    avg_response_time: int  # milliseconds
    current_interval_days: int
    accuracy_trend: float  # Percentage change in recent accuracy
    recent_attempts: List[CardAttempt]
    times_seen: int
    last_reviewed: Optional[datetime] = None

    class Config:
        from_attributes = True
