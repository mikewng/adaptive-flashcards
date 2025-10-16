from pydantic import BaseModel
from datetime import datetime

class DeckCreate(BaseModel):
    name: str
    description: str | None = ""
    is_private: bool = True  # Defaults to private

class DeckRead(DeckCreate):
    id: int
    created_at: datetime
    card_count: int = 0  # Total number of cards in the deck
    due_count: int = 0   # Number of cards due for review (optional, for study indicators)
    owner_username: str | None = None  # For public deck browsing (optional)

    class Config: from_attributes = True

class DeckUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_private: bool | None = None

class PublicDeckRead(BaseModel):
    """Schema for public deck browsing - includes owner info"""
    id: int
    name: str
    description: str | None
    created_at: datetime
    card_count: int = 0
    owner_username: str

    class Config: from_attributes = True
