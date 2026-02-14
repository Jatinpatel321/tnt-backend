from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


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

    model_config = ConfigDict(from_attributes=True)
