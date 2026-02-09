from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import get_current_user, require_role

from app.modules.users.model import User
from app.modules.orders.model import Order, OrderStatus
from app.modules.orders.schemas import OrderResponse
from app.modules.orders.service import create_order, update_order_status

from app.modules.orders.item_schemas import OrderItemCreate
from app.modules.orders.item_service import add_items_to_order

from app.modules.orders.history_model import OrderHistory
from app.modules.orders.history_schemas import OrderHistoryResponse
from app.modules.notifications.service import notify_user

router = APIRouter(prefix="/orders", tags=["Orders"])


# 🧾 PLACE ORDER (WITH ITEMS)
@router.post("/{slot_id}")
def place_order(
    slot_id: int,
    items: list[OrderItemCreate],
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    db_user = db.query(User).filter(User.phone == user["phone"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    order = create_order(
        user_id=db_user.id,
        slot_id=slot_id,
        db=db
    )

    total_amount = add_items_to_order(order, items, db)
    db.commit()

    # 🔔 Notify student
    notify_user(
        user_id=db_user.id,
        phone=db_user.phone,
        title="Order Placed",
        message=f"Your order #{order.id} has been placed successfully.",
        db=db
    )

    return {
        "order_id": order.id,
        "status": order.status,
        "total_amount": total_amount
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
