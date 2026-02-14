import enum

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String

from app.core.time_utils import utcnow_naive
from app.database.base import Base


class OrderStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    READY_FOR_PICKUP = "ready_for_pickup"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    total_amount = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=utcnow_naive)

    # QR Pickup fields
    qr_code = Column(String(255), unique=True, nullable=True)
    pickup_confirmed_at = Column(DateTime, nullable=True)
    pickup_confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_time = Column(Float, nullable=False)
