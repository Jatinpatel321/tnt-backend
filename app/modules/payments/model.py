import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String

from app.core.time_utils import utcnow_naive
from app.database.base import Base


class PaymentStatus(enum.Enum):
    INITIATED = "initiated"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)

    amount = Column(Integer, nullable=False)  # paise
    status = Column(Enum(PaymentStatus), default=PaymentStatus.INITIATED)

    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)

    razorpay_refund_id = Column(String, nullable=True)
    refunded_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utcnow_naive)
