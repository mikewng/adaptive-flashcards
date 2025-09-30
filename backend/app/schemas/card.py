from pydantic import BaseModel
from datetime import datetime, date

class CardCreate(BaseModel):
    deck_id: int
    question: str
    answer: str

class CardRead(BaseModel):
    id: int
    deck_id: int
    question: str
    answer: str
    ease: float
    interval_days: int
    reps: int
    lapses: int
    due_date: datetime | date
    suspended: bool
    created_at: datetime
    class Config: from_attributes = True
