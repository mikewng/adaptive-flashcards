from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, TokenBlacklist

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=False)

def get_db_dep(db: Session = Depends(get_db)) -> Session:
    return db

def is_token_blacklisted(token: str, db: Session) -> bool:
    """Check if a token has been blacklisted (revoked)"""
    return db.query(TokenBlacklist).filter(TokenBlacklist.token == token).first() is not None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    creds_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
                              headers={"WWW-Authenticate": "Bearer"})

    # Check if token is blacklisted
    if is_token_blacklisted(token, db):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked",
                           headers={"WWW-Authenticate": "Bearer"})

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        sub = payload.get("sub")
        token_type = payload.get("type")

        # Ensure this is an access token, not a refresh token
        if token_type != "access":
            raise creds_exc

        if sub is None:
            raise creds_exc
    except JWTError:
        raise creds_exc

    user = db.get(User, int(sub))
    if not user:
        raise creds_exc
    return user

def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)) -> Optional[User]:
    """Get current user if authenticated, otherwise return None. Used for public endpoints."""
    if token is None:
        return None

    # Check if token is blacklisted
    if is_token_blacklisted(token, db):
        return None

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        sub = payload.get("sub")
        token_type = payload.get("type")

        # Ensure this is an access token
        if token_type != "access":
            return None

        if sub is None:
            return None
        user = db.get(User, int(sub))
        return user
    except JWTError:
        return None
