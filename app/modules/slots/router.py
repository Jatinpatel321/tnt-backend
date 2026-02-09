from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.deps import get_db
from app.core.security import require_role
from app.modules.slots.model import Slot, SlotStatus
from app.modules.slots.schemas import SlotCreate, SlotResponse
from app.modules.slots.service import book_slot
from app.modules.users.model import User

router = APIRouter(prefix="/slots", tags=["Slots"])


@router.post("/", response_model=SlotResponse)
def create_slot(
    slot: SlotCreate,
    db: Session = Depends(get_db),
    user=Depends(require_role("vendor"))
):
    if slot.end_time <= slot.start_time:
        raise HTTPException(status_code=400, detail="Invalid slot timing")

    # Query the user to get the ID
    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not db_user.is_approved:
        raise HTTPException(status_code=403, detail="Vendor not approved")

    new_slot = Slot(
        vendor_id=db_user.id,
        start_time=slot.start_time,
        end_time=slot.end_time,
        max_orders=slot.max_orders,
        current_orders=0,
        status=SlotStatus.AVAILABLE
    )

    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)

    return new_slot

@router.post("/{slot_id}/book")
def book(slot_id: int, db: Session = Depends(get_db)):
    slot = book_slot(slot_id, db)
    return {
        "message": "Slot booked",
        "slot_id": slot.id,
        "current_orders": slot.current_orders,
        "status": slot.status
    }
