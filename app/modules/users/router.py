from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.modules.users.model import User
from app.modules.users.schemas import UserCreate, UserResponse
from app.modules.users.model import UserRole
from app.core.security import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone == user.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    new_user = User(
    phone=user.phone,
    name=user.name,
    role=UserRole(user.role.value),  # 🔥 FIX
    university_id=user.university_id
)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/me", response_model=UserResponse)
def get_me():
    # Placeholder (auth-protected version comes later)
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.put("/me")
def update_profile(
    name: str,
    university_id: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    from app.modules.users.model import User

    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    db_user.name = name
    db_user.university_id = university_id

    db.commit()
    return {"message": "Profile updated"}
