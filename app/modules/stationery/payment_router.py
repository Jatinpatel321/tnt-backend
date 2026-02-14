import hashlib
import hmac
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.razorpay_client import client
from app.core.security import get_current_user
from app.modules.ledger.model import LedgerSource, LedgerType
from app.modules.ledger.service import add_ledger_entry
from app.modules.notifications.service import notify_user
from app.modules.stationery.job_model import StationeryJob
from app.modules.stationery.job_model import JobStatus
from app.modules.stationery.service_model import StationeryService
from app.modules.users.model import User

router = APIRouter(prefix="/stationery/payments", tags=["Stationery Payments"])


@router.post("/initiate/{job_id}")
def initiate_job_payment(
    job_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_user = db.query(User).filter(User.id == user["id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    job = db.query(StationeryJob).filter(StationeryJob.id == job_id).first()

    if not job or job.user_id != db_user.id:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.status != JobStatus.READY:
        raise HTTPException(status_code=400, detail="Job not ready for payment")

    if job.is_paid:
        raise HTTPException(status_code=400, detail="Job already paid")

    if not job.amount or job.amount <= 0:
        service = db.query(StationeryService).filter(StationeryService.id == job.service_id).first()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        job.amount = job.quantity * service.price_per_unit



    razorpay_order = client.order.create({
        "amount": job.amount,
        "currency": "INR",
        "payment_capture": 1
    })

    job.razorpay_order_id = razorpay_order["id"]
    db.commit()

    return {
        "razorpay_order_id": razorpay_order["id"],
        "amount": job.amount,
        "key": os.getenv("RAZORPAY_KEY_ID")
    }

@router.post("/verify/{job_id}")
def verify_job_payment(
    job_id: int,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_user = db.query(User).filter(User.id == user["id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    job = db.query(StationeryJob).filter(StationeryJob.id == job_id).first()
    if not job or job.user_id != db_user.id:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.is_paid:
        raise HTTPException(status_code=400, detail="Job already paid")

    if job.razorpay_order_id and job.razorpay_order_id != razorpay_order_id:
        raise HTTPException(status_code=400, detail="Order ID mismatch")

    body = f"{razorpay_order_id}|{razorpay_payment_id}"
    secret = os.getenv("RAZORPAY_KEY_SECRET")

    expected_signature = hmac.new(
        bytes(secret, "utf-8"),
        bytes(body, "utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    job.is_paid = True
    job.razorpay_payment_id = razorpay_payment_id
    job.razorpay_signature = razorpay_signature
    db.commit()

    student = db.query(User).filter(User.id == job.user_id).first()

    notify_user(
        user_id=student.id,
        phone=student.phone,
        title="Payment Successful",
        message="Your stationery job payment has been processed successfully.",
        db=db
    )

    # Add ledger entry for the payment
    add_ledger_entry(
        order_id=None,
        payment_id=razorpay_payment_id,
        amount=job.amount,
        entry_type=LedgerType.CREDIT,
        source=LedgerSource.PAYMENT,
        description="Stationery job payment",
        db=db
    )

    return {"message": "Stationery payment successful"}
