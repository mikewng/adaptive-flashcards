from pydantic import BaseModel, Field
from datetime import datetime

class ReviewCreate(BaseModel):
    card_id: int
    response: int = Field(ge=0, le=4)
    took_ms: int

class ReviewRead(BaseModel):
    id: int
    card_id: int
    response: int
    took_ms: int
    reviewed_at: datetime
    class Config: from_attributes = True