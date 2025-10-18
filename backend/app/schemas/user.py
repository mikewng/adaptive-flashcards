from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    timezone: str = Field(default="UTC", description="IANA timezone (e.g., 'America/New_York', 'Europe/London')")

class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    timezone: Optional[str] = None

class UserRead(UserBase):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    timezone: str
    created_at: datetime
    class Config: from_attributes = True
