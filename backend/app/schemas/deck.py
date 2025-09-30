from pydantic import BaseModel
from datetime import datetime

class DeckCreate(BaseModel):
    name: str
    description: str | None = ""

class DeckRead(DeckCreate):
    id: int
    created_at: datetime
    class Config: from_attributes = True
