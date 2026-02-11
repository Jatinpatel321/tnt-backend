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
def get_me(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.put("/me")
def update_profile(
    name: str,
    university_id: str | None = None,
    preferences: dict | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    from app.modules.users.model import User

    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Ownership check
    if db_user.phone != user["phone"]:
        raise HTTPException(status_code=403, detail="Cannot edit other user's profile")

    # Validate department/year for students/faculty
    if db_user.role.value in ["student", "faculty"] and not university_id:
        raise HTTPException(status_code=400, detail="University ID required for students/faculty")

    db_user.name = name
    if university_id is not None:
        db_user.university_id = university_id
    if preferences is not None:
        db_user.preferences = preferences

    db.commit()
    return {"message": "Profile updated"}
