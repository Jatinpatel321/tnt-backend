from pydantic import BaseModel
from datetime import datetime


class OrderHistoryResponse(BaseModel):
    status: str
    changed_at: datetime

    class Config:
        from_attributes = True
