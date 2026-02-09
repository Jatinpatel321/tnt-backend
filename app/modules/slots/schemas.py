from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class SlotStatus(str, Enum):
    available = "available"
    limited = "limited"
    full = "full"

class SlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime
    max_orders: int

class SlotResponse(BaseModel):
    id: int
    vendor_id: int
    start_time: datetime
    end_time: datetime
    max_orders: int
    current_orders: int
    status: SlotStatus

    class Config:
        from_attributes = True
