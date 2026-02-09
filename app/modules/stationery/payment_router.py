from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import get_current_user
from app.core.razorpay_client import client
from app.modules.stationery.job_model import StationeryJob
from app.modules.ledger.service import add_ledger_entry
from app.modules.ledger.model import LedgerType, LedgerSource
from app.modules.notifications.service import notify_user
from app.modules.users.model import User

import os
import hmac, hashlib, os

router = APIRouter(prefix="/stationery/payments", tags=["Stationery Payments"])


@router.post("/initiate/{job_id}")
def initiate_job_payment(
    job_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    job = db.query(StationeryJob).filter(
        StationeryJob.id == job_id,
        StationeryJob.status == "ready",
        StationeryJob.is_paid == False
    ).first()

    if not job:
        raise HTTPException(status_code=400, detail="Job not ready for payment")

    razorpay_order = client.order.create({
        "amount": job.amount,
        "currency": "INR",
        "payment_capture": 1
    })

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
    db: Session = Depends(get_db)
):
    job = db.query(StationeryJob).filter(
        StationeryJob.id == job_id
    ).first()

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
    db.commit()

    return {"message": "Stationery payment successful"}


add_ledger_entry(
    order_id=None,
    payment_id=None,
    amount=job.amount,
    entry_type=LedgerType.CREDIT,
    source=LedgerSource.PAYMENT,
    description="Stationery job payment",
    db=db
)