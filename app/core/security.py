import os
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.time_utils import utcnow_naive

security = HTTPBearer()


# 🔥 LOAD .env EXPLICITLY
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "test_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")



def create_access_token(data: dict, expires_delta: int):
    to_encode = data.copy()
    expire = utcnow_naive() + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        phone = payload.get("phone")
        role = payload.get("role")

        if user_id is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=401, detail="Invalid token subject")

        return {
            "id": user_id,
            "phone": phone,
            "role": role
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# 🔥 STEP 2 — ROLE CHECKER (ADD THIS AT THE BOTTOM)
def require_role(required_role: str):
    def role_checker(user=Depends(get_current_user)):
        if user["role"] != required_role:
            raise HTTPException(status_code=403, detail="Access denied")
        return user
    return role_checker


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get current user ID from JWT token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token subject")
