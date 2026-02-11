from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.modules.auth.schemas import LoginRequest, VerifyOTPRequest
from app.core.security import create_access_token
from app.core.deps import get_db
from app.modules.users import User
from fastapi import APIRouter, HTTPException
from app.modules.auth.otp_service import generate_otp
from app.modules.auth.otp_service import verify_otp
from app.core.security import create_access_token
from sqlalchemy.orm import Session
from fastapi import Depends
from app.core.deps import get_db
from app.modules.users.model import User



router = APIRouter(prefix="/auth", tags=["Auth"])




@router.post("/send-otp")
def send_otp(body: LoginRequest):
    otp = generate_otp(body.phone)

    # TEMP: log OTP (remove in prod)
    print(f"OTP for {body.phone}: {otp}")

    return {"message": "OTP sent"}

@router.post("/verify-otp")
def verify_otp_login(
    body: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    from app.modules.users.model import User, UserRole
    from app.modules.auth.otp_service import verify_otp
    from app.core.security import create_access_token

    if not verify_otp(body.phone, body.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user = db.query(User).filter(User.phone == body.phone).first()

    # 🔥 AUTO-REGISTER IF NEW USER
    if not user:
        user = User(
            phone=body.phone,
            role=UserRole.student  # default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(
        data={
            "sub": user.phone,
            "role": user.role.value
        },
        expires_delta=60
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "is_new_user": user.name is None,
        "role": user.role.value
    }
