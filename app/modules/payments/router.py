from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.modules.payments.service import initiate_payment, verify_payment

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/razorpay/initiate/{order_id}")
def initiate(order_id: int, db: Session = Depends(get_db)):
    return initiate_payment(order_id, amount=5000, db=db)  # ₹50


@router.post("/razorpay/verify/{payment_id}")
def verify(
    payment_id: int,
    razorpay_payment_id: str,
    razorpay_signature: str,
    db: Session = Depends(get_db)
):
    return verify_payment(
        payment_id,
        razorpay_payment_id,
        razorpay_signature,
        db
    )

@router.post("/razorpay/refund/{payment_id}")
def refund(payment_id: int, db: Session = Depends(get_db)):
    from app.modules.payments.service import refund_payment
    return refund_payment(payment_id, db)
