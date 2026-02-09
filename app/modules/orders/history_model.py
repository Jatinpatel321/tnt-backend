from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum
from app.database.base import Base
from datetime import datetime
from app.modules.orders.model import OrderStatus


class OrderHistory(Base):
    __tablename__ = "order_history"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    status = Column(Enum(OrderStatus), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
