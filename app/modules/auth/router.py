from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import create_access_token
from app.modules.auth.otp_service import generate_otp, verify_otp
from app.modules.auth.schemas import LoginRequest, VerifyOTPRequest
from app.modules.users.model import User, UserRole

router = APIRouter(prefix="/auth", tags=["Auth"])




@router.post("/send-otp")
def send_otp(body: LoginRequest):
    otp = generate_otp(body.phone)

    return {"message": "OTP sent"}

@router.post("/verify-otp")
def verify_otp_login(
    body: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    if not verify_otp(body.phone, body.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(User).filter(User.phone == body.phone).first()

    # 🔥 AUTO-REGISTER IF NEW USER
    if not user:
        user = User(
            phone=body.phone,
            role=UserRole.STUDENT  # default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(
        data={
            "sub": str(user.id),
            "phone": user.phone,
            "role": user.role.value
        },
        expires_delta=60
    )

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "phone": user.phone,
                "name": user.name,
                "role": user.role.value,
                "university_id": user.university_id,
                "is_active": user.is_active,
                "is_approved": user.is_approved
            },
            "is_new_user": user.name is None
        }
    }
