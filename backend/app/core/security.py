from datetime import datetime, timedelta, timezone
from typing import Any
import secrets

from jose import jwt, JWTError
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8'))

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(subject: str | int, expires_minutes: int | None = None) -> str:
    """Create a short-lived access token (default: 30 minutes)"""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: dict[str, Any] = {"sub": str(subject), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def create_refresh_token(subject: str | int, expires_days: int | None = None) -> tuple[str, datetime]:
    """Create a long-lived refresh token (default: 30 days). Returns (token, expiry_datetime)"""
    expire = datetime.now(timezone.utc) + timedelta(
        days=expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    # Use a secure random token for refresh tokens
    token_data = secrets.token_urlsafe(32)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "type": "refresh",
        "jti": token_data  # Unique token ID
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)
    return token, expire

def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate a JWT token. Returns payload or None if invalid."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        return payload
    except JWTError:
        return None
