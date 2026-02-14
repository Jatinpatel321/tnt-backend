from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.orders.history_model import OrderHistory
from app.modules.orders.model import Order, OrderStatus
from app.modules.rewards.service import process_order_completion_rewards
from app.modules.slots.model import Slot


def create_order(user_id: int, slot_id: int, db: Session):
    slot = db.query(Slot).filter(Slot.id == slot_id).first()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    order = Order(
        user_id=user_id,
        slot_id=slot_id,
        vendor_id=slot.vendor_id,
        status=OrderStatus.PENDING
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return order


def update_order_status(
    order: Order,
    new_status: OrderStatus,
    actor_role: str,
    db: Session
):
    # 🧑 Student rules
    if actor_role == "student":
        if new_status != OrderStatus.CANCELLED:
            raise HTTPException(
                status_code=403,
                detail="Students can only cancel orders"
            )
        if order.status != OrderStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail="Order cannot be cancelled"
            )

    # 🧑‍🍳 Vendor rules
    if actor_role == "vendor":
        if new_status == OrderStatus.CONFIRMED and order.status != OrderStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail="Only pending orders can be confirmed"
            )

        if new_status == OrderStatus.COMPLETED and order.status != OrderStatus.CONFIRMED:
            raise HTTPException(
                status_code=400,
                detail="Order must be confirmed before completion"
            )

    # ✅ update order
    order.status = new_status

    # ✅ record history
    history = OrderHistory(
        order_id=order.id,
        status=new_status
    )
    db.add(history)

    if new_status == OrderStatus.COMPLETED:
        process_order_completion_rewards(order.id, db)
