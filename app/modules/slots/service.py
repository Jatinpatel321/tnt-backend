from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.modules.slots.model import Slot, SlotStatus
from app.core.redis import redis_client
import time

LOCK_TTL = 5  # seconds


def book_slot(slot_id: int, db: Session):
    lock_key = f"slot_lock:{slot_id}"

    # 🔒 Try acquiring lock
    lock_acquired = redis_client.set(
        lock_key,
        "locked",
        nx=True,
        ex=LOCK_TTL
    )

    if not lock_acquired:
        raise HTTPException(
            status_code=429,
            detail="Slot is being booked, try again"
        )

    try:
        slot = db.query(Slot).filter(Slot.id == slot_id).first()

        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        if slot.current_orders >= slot.max_orders:
            slot.status = SlotStatus.FULL
            db.commit()
            raise HTTPException(status_code=400, detail="Slot full")

        # ✅ Safe increment
        slot.current_orders += 1

        if slot.current_orders >= slot.max_orders:
            slot.status = SlotStatus.FULL
        elif slot.current_orders >= int(slot.max_orders * 0.7):
            slot.status = SlotStatus.LIMITED

        db.commit()
        db.refresh(slot)
        return slot

    finally:
        # 🔓 Release lock
        redis_client.delete(lock_key)
