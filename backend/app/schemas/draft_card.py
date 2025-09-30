from pydantic import BaseModel
from typing import Optional

class DraftCardRead(BaseModel):
    id: int
    prompt: str
    answer: str
    source_file: Optional[str] = None
    status: str
    class Config: from_attributes = True

class DraftAcceptRequest(BaseModel):
    draft_ids: list[int]
    deck_id: int
