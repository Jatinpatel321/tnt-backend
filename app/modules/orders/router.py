from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.load_insights import get_load_label, is_express_pickup_eligible
from app.core.security import get_current_user, require_role
from app.core.time_utils import utcnow_naive
from app.core.university_policy import get_university_policy, is_hour_in_break_window
from app.modules.menu.model import MenuItem
from app.modules.notifications.service import notify_user
from app.modules.orders.history_model import OrderHistory
from app.modules.orders.history_schemas import OrderHistoryResponse
from app.modules.orders.item_schemas import OrderItemCreate
from app.modules.orders.item_service import add_items_to_order
from app.modules.orders.model import Order, OrderStatus
from app.modules.orders.qr_service import (
    confirm_pickup,
    generate_qr_code,
    get_order_by_qr,
)
from app.modules.orders.reorder_service import create_reorder, get_order_eta
from app.modules.orders.schemas import OrderResponse
from app.modules.orders.service import create_order, update_order_status
from app.modules.slots.model import Slot
from app.modules.users.model import User

router = APIRouter(prefix="/orders", tags=["Orders"])


# 🧾 PLACE ORDER (WITH ITEMS)
@router.post("/{slot_id}")
def place_order(
    slot_id: int,
    items: list[OrderItemCreate],
    idempotency_key: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    from app.core.redis import redis_client

    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    slot = db.query(Slot).filter(Slot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    policy = get_university_policy()
    if policy.get("enabled", False):
        if not is_hour_in_break_window(
            slot.start_time.hour,
            int(policy.get("break_start_hour", 12)),
            int(policy.get("break_end_hour", 14)),
        ):
            raise HTTPException(status_code=400, detail="Orders are allowed only during university break window")

        now = utcnow_naive()
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        existing_orders = (
            db.query(Order)
            .filter(
                Order.user_id == db_user.id,
                Order.created_at >= day_start,
                Order.created_at < day_end,
                Order.status != OrderStatus.CANCELLED,
            )
            .count()
        )
        if existing_orders >= int(policy.get("max_orders_per_user", 3)):
            raise HTTPException(status_code=400, detail="Maximum orders per user reached for this day")

    # 🔑 Idempotency check
    if idempotency_key:
        key = f"idempotency:order:{user['phone']}:{idempotency_key}"
        if redis_client.exists(key):
            raise HTTPException(status_code=409, detail="Duplicate request")
        redis_client.setex(key, 3600, "1")  # 1 hour TTL

    # 🛒 Cart validation - ensure all items from same vendor
    if items:
        vendor_ids = set()
        for item in items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            if not menu_item:
                raise HTTPException(status_code=400, detail=f"Menu item {item.menu_item_id} not found")
            if not menu_item.is_available:
                raise HTTPException(status_code=400, detail=f"Menu item {item.menu_item_id} not available")
            vendor_ids.add(menu_item.vendor_id)

        if len(vendor_ids) > 1:
            raise HTTPException(status_code=400, detail="Cannot order from multiple vendors")

    order = create_order(
        user_id=db_user.id,
        slot_id=slot_id,
        db=db
    )

    total_amount = add_items_to_order(order, items, db)
    order.total_amount = total_amount

    # ⏱️ Calculate ETA (15-30 minutes based on slot congestion)
    congestion_factor = slot.congestion_level if hasattr(slot, 'congestion_level') else 0
    base_eta = 15  # minutes
    eta_minutes = base_eta + int(congestion_factor / 10)  # Add up to 10 minutes for congestion
    order.eta_minutes = eta_minutes

    db.commit()

    # 🔔 Notify student
    notify_user(
        user_id=db_user.id,
        phone=db_user.phone,
        title="Order Placed",
        message=f"Your order #{order.id} has been placed successfully. ETA: {eta_minutes} minutes.",
        db=db
    )

    return {
        "order_id": order.id,
        "status": order.status,
        "total_amount": total_amount,
        "eta_minutes": eta_minutes,
        "pickup_load_label": get_load_label(slot.current_orders, slot.max_orders),
        "express_pickup_eligible": is_express_pickup_eligible(slot.current_orders, slot.max_orders),
    }


# 👤 STUDENT — MY ORDERS
@router.get("/my", response_model=list[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_user = db.query(User).filter(User.phone == user["phone"]).first()

    return (
        db.query(Order)
        .filter(Order.user_id == db_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


# 🧑‍🍳 VENDOR — INCOMING ORDERS
@router.get("/vendor", response_model=list[OrderResponse])
def vendor_orders(
    db: Session = Depends(get_db),
    user=Depends(require_role("vendor"))
):
    vendor = db.query(User).filter(User.phone == user["phone"]).first()

    return (
        db.query(Order)
        .filter(Order.vendor_id == vendor.id)
        .order_by(Order.created_at.desc())
        .all()
    )


# ✅ VENDOR — CONFIRM ORDER
@router.post("/{order_id}/confirm")
def confirm_order(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("vendor"))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_order_status(order, OrderStatus.CONFIRMED, "vendor", db)
    db.commit()

    student = db.query(User).filter(User.id == order.user_id).first()

    notify_user(
        user_id=student.id,
        phone=student.phone,
        title="Order Confirmed",
        message=f"Your order #{order.id} has been confirmed.",
        db=db
    )

    return {"message": "Order confirmed"}


# ✅ VENDOR — COMPLETE ORDER
@router.post("/{order_id}/complete")
def complete_order(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("vendor"))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_order_status(order, OrderStatus.COMPLETED, "vendor", db)
    db.commit()

    student = db.query(User).filter(User.id == order.user_id).first()

    notify_user(
        user_id=student.id,
        phone=student.phone,
        title="Order Completed",
        message=f"Your order #{order.id} is ready for pickup.",
        db=db
    )

    return {"message": "Order completed"}


# ❌ STUDENT — CANCEL ORDER
@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order or order.user_id != db_user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    update_order_status(order, OrderStatus.CANCELLED, "student", db)
    db.commit()

    notify_user(
        user_id=db_user.id,
        phone=db_user.phone,
        title="Order Cancelled",
        message=f"Your order #{order.id} has been cancelled.",
        db=db
    )

    return {"message": "Order cancelled"}


# 🕒 ORDER TIMELINE
@router.get("/{order_id}/timeline", response_model=list[OrderHistoryResponse])
def order_timeline(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order or order.user_id != db_user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    return (
        db.query(OrderHistory)
        .filter(OrderHistory.order_id == order_id)
        .order_by(OrderHistory.changed_at)
        .all()
    )


@router.post("/{order_id}/reorder")
def reorder_order(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return create_reorder(order_id, db_user.id, db)


@router.get("/{order_id}/eta")
def order_eta(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return get_order_eta(order_id, db_user.id, db)


# 🧾 VENDOR — ORDER DETAILS
@router.get("/vendor/{order_id}")
def vendor_order_details(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("vendor"))
):
    from app.modules.orders.details_service import get_vendor_order_details

    vendor = db.query(User).filter(User.phone == user["phone"]).first()

    if not vendor.is_approved:
        raise HTTPException(status_code=403, detail="Vendor not approved")

    return get_vendor_order_details(order_id, vendor.id, db)


# 📱 QR PICKUP ENDPOINTS

@router.post("/{order_id}/qr", response_model=dict)
def generate_qr_endpoint(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Generate QR code for order pickup."""
    try:
        qr_code = generate_qr_code(order_id, db)
        return {"qr_code": qr_code}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/qr/pickup/confirm", response_model=dict)
@router.post("/qr/confirm", response_model=dict)
def confirm_pickup_endpoint(
    qr_code: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("vendor"))
):
    """Confirm pickup using QR code."""
    vendor = db.query(User).filter(User.phone == user["phone"]).first()
    success = confirm_pickup(qr_code, vendor.id, db)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid QR code or pickup not allowed")
    return {"message": "Pickup confirmed successfully"}


@router.get("/qr/{qr_code}", response_model=dict)
def get_order_by_qr_endpoint(
    qr_code: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("vendor"))
):
    """Get order details by QR code for vendor verification."""
    vendor = db.query(User).filter(User.phone == user["phone"]).first()
    order = get_order_by_qr(qr_code, db)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.vendor_id != vendor.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "order_id": order.id,
        "user_id": order.user_id,
        "status": order.status.value,
        "created_at": order.created_at.isoformat()
    }
