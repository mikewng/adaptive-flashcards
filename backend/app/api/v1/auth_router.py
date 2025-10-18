from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.dependencies import get_current_user, oauth2_scheme
from app.models.models import User, RefreshToken, TokenBlacklist
from app.schemas.user import UserCreate, UserRead
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, LogoutRequest

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    print("PW: ",payload.password)
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.post("/login", response_model=TokenResponse)
def login(
    db: Session = Depends(get_db),
    form: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Create both access and refresh tokens
    access_token = create_access_token(user.id)
    refresh_token_str, refresh_expires = create_refresh_token(user.id)

    # Store refresh token in database
    refresh_token_record = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=refresh_expires
    )
    db.add(refresh_token_record)
    db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token_str)

@router.get("/me", response_model=UserRead)
def me(current=Depends(get_current_user)):
    return current

@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a new access token and refresh token"""
    # Decode and validate refresh token
    token_data = decode_token(payload.refresh_token)
    if not token_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    # Verify token type
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    # Check if refresh token exists in database and is not expired
    refresh_token_record = db.query(RefreshToken).filter(
        RefreshToken.token == payload.refresh_token
    ).first()

    if not refresh_token_record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found")

    if refresh_token_record.expires_at < datetime.now(timezone.utc):
        # Clean up expired token
        db.delete(refresh_token_record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    # Get user
    user_id = int(token_data.get("sub"))
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Create new access token and refresh token
    new_access_token = create_access_token(user.id)
    new_refresh_token_str, new_refresh_expires = create_refresh_token(user.id)

    # Delete old refresh token and store new one (token rotation)
    db.delete(refresh_token_record)
    new_refresh_token_record = RefreshToken(
        user_id=user.id,
        token=new_refresh_token_str,
        expires_at=new_refresh_expires
    )
    db.add(new_refresh_token_record)
    db.commit()

    return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token_str)

@router.post("/logout", status_code=200)
def logout(
    payload: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
):
    """Logout by blacklisting the current access token and revoking the refresh token"""
    # Decode the access token to get its expiry
    from app.core.config import settings
    token_data = decode_token(token)

    if token_data:
        # Blacklist the current access token
        token_expiry = datetime.fromtimestamp(token_data.get("exp"), tz=timezone.utc)
        blacklist_entry = TokenBlacklist(
            token=token,
            expires_at=token_expiry
        )
        db.add(blacklist_entry)

    # If refresh token is provided, delete it from database
    if payload.refresh_token:
        refresh_token_record = db.query(RefreshToken).filter(
            RefreshToken.token == payload.refresh_token,
            RefreshToken.user_id == current_user.id
        ).first()

        if refresh_token_record:
            db.delete(refresh_token_record)

    # Optionally: Delete all refresh tokens for this user (logout from all devices)
    # Uncomment the line below to enable logout from all devices:
    # db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).delete()

    db.commit()
    return {"message": "Logged out successfully"}
