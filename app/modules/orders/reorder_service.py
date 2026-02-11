from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta

from app.modules.orders.model import Order, OrderStatus
from app.modules.orders.service import create_order
from app.modules.orders.item_service import add_items_to_order
from app.modules.slots.service import book_slot
from app.modules.notifications.service import notify_user


def calculate_eta(order: Order, db: Session) -> datetime:
    """Calculate estimated time of arrival for order completion"""
    from app.modules.slots.model import Slot

    slot = db.query(Slot).filter(Slot.id == order.slot_id).first()
    if not slot:
        # Default ETA: 30 minutes from now
        return datetime.utcnow() + timedelta(minutes=30)

    # Base ETA is slot end time
    base_eta = slot.end_time

    # Add preparation time based on order complexity
    from app.modules.orders.item_service import get_order_items
    items = get_order_items(order.id, db)

    # Simple heuristic: 2 minutes per item + 5 minutes base
    prep_time = len(items) * 2 + 5
    eta = base_eta + timedelta(minutes=prep_time)

    return eta


def detect_delay(order: Order, db: Session) -> bool:
    """Detect if order is delayed beyond ETA"""
    if not order.estimated_ready_at:
        return False

    # Order is delayed if current time > ETA + 10 minutes buffer
    delay_threshold = order.estimated_ready_at + timedelta(minutes=10)
    return datetime.utcnow() > delay_threshold


def create_reorder(original_order_id: int, user_id: int, db: Session):
    """Create a reorder from an existing completed order"""

    # Find original order
    original_order = db.query(Order).filter(
        Order.id == original_order_id,
        Order.user_id == user_id,
        Order.status == OrderStatus.COMPLETED
    ).first()

    if not original_order:
        raise HTTPException(status_code=404, detail="Original order not found or not eligible for reorder")

    # Check if original order is recent (within 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    if original_order.created_at < seven_days_ago:
        raise HTTPException(status_code=400, detail="Order is too old for reorder")

    # Get original order items
    from app.modules.orders.item_service import get_order_items
    original_items = get_order_items(original_order_id, db)

    if not original_items:
        raise HTTPException(status_code=400, detail="No items found in original order")

    # Find available slot (same vendor, similar time)
    from app.modules.slots.model import Slot
    now = datetime.utcnow()

    # Look for slots in next 2 hours from same vendor
    available_slots = db.query(Slot).filter(
        Slot.vendor_id == original_order.vendor_id,
        Slot.start_time > now,
        Slot.start_time < now + timedelta(hours=2),
        Slot.current_orders < Slot.max_orders
    ).order_by(Slot.start_time).limit(5).all()

    if not available_slots:
        raise HTTPException(status_code=400, detail="No available slots for reorder")

    # Use first available slot
    target_slot = available_slots[0]

    try:
        # Create new order
        new_order = create_order(user_id, target_slot.id, db)

        # Copy items from original order
        from app.modules.orders.item_schemas import OrderItemCreate
        reorder_items = [
            OrderItemCreate(
                menu_item_id=item.menu_item_id,
                quantity=item.quantity
            ) for item in original_items
        ]

        total_amount = add_items_to_order(new_order, reorder_items, db)

        # Calculate ETA
        eta = calculate_eta(new_order, db)
        new_order.estimated_ready_at = eta

        db.commit()
        db.refresh(new_order)

        # Notify user
        user = db.query(Order).join(Order.user).filter(Order.id == new_order.id).first()
        if user:
            notify_user(
                user_id=user.user_id,
                phone=user.user.phone if hasattr(user.user, 'phone') else None,
                title="Reorder Placed",
                message=f"Your reorder #{new_order.id} has been placed successfully.",
                db=db
            )

        return {
            "order_id": new_order.id,
            "status": new_order.status.value,
            "total_amount": total_amount,
            "estimated_ready_at": eta.isoformat(),
            "slot_time": f"{target_slot.start_time.strftime('%I:%M %p')} - {target_slot.end_time.strftime('%I:%M %p')}"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create reorder: {str(e)}")


def get_order_eta(order_id: int, user_id: int, db: Session):
    """Get ETA for an order"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Order was cancelled")

    # Calculate ETA if not set
    if not order.estimated_ready_at:
        order.estimated_ready_at = calculate_eta(order, db)
        db.commit()

    # Check for delays
    is_delayed = detect_delay(order, db)

    return {
        "order_id": order.id,
        "status": order.status.value,
        "estimated_ready_at": order.estimated_ready_at.isoformat(),
        "is_delayed": is_delayed,
        "delay_minutes": (datetime.utcnow() - order.estimated_ready_at).total_seconds() / 60 if is_delayed else 0
    }
