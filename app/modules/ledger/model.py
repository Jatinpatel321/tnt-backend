from sqlalchemy import Column, Integer, ForeignKey, Enum, DateTime, String
from app.database.base import Base
from datetime import datetime
import enum


class LedgerType(enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"


class LedgerSource(enum.Enum):
    PAYMENT = "payment"
    REFUND = "refund"


class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)

    amount = Column(Integer, nullable=False)  # paise
    entry_type = Column(Enum(LedgerType), nullable=False)
    source = Column(Enum(LedgerSource), nullable=False)

    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
