from fastapi import APIRouter, Request, Header, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.razorpay_webhook import verify_webhook_signature
from app.modules.payments.model import Payment, PaymentStatus
from app.modules.orders.model import Order, OrderStatus

router = APIRouter(prefix="/webhooks/razorpay", tags=["Razorpay Webhooks"])


@router.post("/")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    body = await request.body()

    verify_webhook_signature(body, x_razorpay_signature)

    payload = await request.json()
    event = payload.get("event")
    entity = payload["payload"]["payment"]["entity"]

    razorpay_payment_id = entity.get("id")

    payment = (
        db.query(Payment)
        .filter(Payment.razorpay_payment_id == razorpay_payment_id)
        .first()
    )

    if not payment:
        return {"status": "ignored"}

    order = db.query(Order).filter(Order.id == payment.order_id).first()

    # ✅ PAYMENT SUCCESS
    if event == "payment.captured":
        payment.status = PaymentStatus.SUCCESS
        order.status = OrderStatus.CONFIRMED

    # ❌ PAYMENT FAILED
    elif event == "payment.failed":
        payment.status = PaymentStatus.FAILED
        order.status = OrderStatus.CANCELLED

    # 🔁 REFUND PROCESSED
    elif event == "refund.processed":
        payment.status = PaymentStatus.REFUNDED
        order.status = OrderStatus.CANCELLED

    db.commit()
    return {"status": "ok"}
