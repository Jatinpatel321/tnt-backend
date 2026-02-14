import hashlib
import hmac
import os

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.razorpay_client import client
from app.core.time_utils import utcnow_naive
from app.modules.ledger.model import LedgerSource, LedgerType
from app.modules.ledger.service import add_ledger_entry
from app.modules.notifications.service import notify_user
from app.modules.orders.model import Order, OrderStatus
from app.modules.payments.model import Payment, PaymentStatus
from app.modules.users.model import User


def initiate_payment(order_id: int, db: Session):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    amount = int(order.total_amount or 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Order amount is invalid")

    razorpay_order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "payment_capture": 1
    })

    payment = Payment(
        order_id=order_id,
        amount=amount,
        razorpay_order_id=razorpay_order["id"],
        status=PaymentStatus.INITIATED
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount,
        "key": os.getenv("RAZORPAY_KEY_ID")
    }


def verify_payment(
    payment_id: int,
    razorpay_payment_id: str,
    razorpay_signature: str,
    db: Session
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    body = f"{payment.razorpay_order_id}|{razorpay_payment_id}"
    secret = os.getenv("RAZORPAY_KEY_SECRET")

    expected_signature = hmac.new(
        bytes(secret, "utf-8"),
        bytes(body, "utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != razorpay_signature:
        payment.status = PaymentStatus.FAILED
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # ✅ SUCCESS
    payment.status = PaymentStatus.SUCCESS
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    order.status = OrderStatus.CONFIRMED

    add_ledger_entry(
        order_id=payment.order_id,
        payment_id=payment.id,
        amount=payment.amount,
        entry_type=LedgerType.CREDIT,
        source=LedgerSource.PAYMENT,
        description="Payment received",
        db=db
    )

    db.commit()
    return {"message": "Payment verified successfully"}



def refund_payment(payment_id: int, user: dict, db):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    role = (user.get("role") or "").lower()
    is_admin = role in {"admin", "super_admin"}
    if not is_admin and order.user_id != user.get("id"):
        raise HTTPException(status_code=403, detail="Not authorized to refund this payment")

    if payment.status != PaymentStatus.SUCCESS:
        raise HTTPException(
            status_code=400,
            detail="Only successful payments can be refunded"
        )

    # 🔁 Razorpay refund
    refund = client.payment.refund(
        payment.razorpay_payment_id,
        {
            "amount": payment.amount
        }
    )

    payment.status = PaymentStatus.REFUNDED
    payment.razorpay_refund_id = refund["id"]
    payment.refunded_at = utcnow_naive()

    order.status = OrderStatus.CANCELLED

    add_ledger_entry(
        order_id=payment.order_id,
        payment_id=payment.id,
        amount=payment.amount,
        entry_type=LedgerType.DEBIT,
        source=LedgerSource.REFUND,
        description="Refund issued",
        db=db
    )

    db.commit()

    user = db.query(User).filter(User.id == order.user_id).first()

    notify_user(
        user_id=user.id,
        phone=user.phone,
        title="Refund Processed",
        message="Your refund has been processed successfully.",
        db=db
    )

    return {
        "message": "Refund initiated successfully",
        "refund_id": refund["id"]
    }
