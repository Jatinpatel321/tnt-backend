from pydantic import BaseModel
from enum import Enum
from datetime import datetime


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class OrderResponse(BaseModel):
    id: int
    slot_id: int
    vendor_id: int
    status: OrderStatus
    created_at: datetime

    class Config:
        from_attributes = True
