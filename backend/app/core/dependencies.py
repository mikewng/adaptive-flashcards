from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

def get_db_dep(db: Session = Depends(get_db)) -> Session:
    return db

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    creds_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials",
                              headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
        sub = payload.get("sub")
        if sub is None:
            raise creds_exc
    except JWTError:
        raise creds_exc
    user = db.get(User, int(sub))
    if not user:
        raise creds_exc
    return user
