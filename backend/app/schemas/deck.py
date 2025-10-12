from pydantic import BaseModel
from datetime import datetime

class DeckCreate(BaseModel):
    name: str
    description: str | None = ""

class DeckRead(DeckCreate):
    id: int
    created_at: datetime
    card_count: int = 0  # Total number of cards in the deck
    due_count: int = 0   # Number of cards due for review (optional, for study indicators)

    class Config: from_attributes = True
