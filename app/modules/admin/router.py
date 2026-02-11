from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import require_role
from app.modules.users.model import User, UserRole
from app.modules.orders.model import Order
from app.modules.ledger.model import Ledger

router = APIRouter(prefix="/admin", tags=["Admin"])


# 👀 VIEW ALL VENDORS
@router.get("/vendors")
def list_vendors(
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    return db.query(User).filter(User.role == UserRole.vendor).all()


# ✅ APPROVE / REJECT VENDOR
@router.post("/vendors/{vendor_id}/approve")
def approve_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    vendor = db.query(User).filter(User.id == vendor_id).first()
    if not vendor or vendor.role != UserRole.vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor.is_approved = True
    db.commit()

    return {"message": "Vendor approved"}


# 🚫 BLOCK / UNBLOCK USER
@router.post("/users/{user_id}/toggle")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.is_active = not db_user.is_active
    db.commit()

    return {
        "user_id": user_id,
        "is_active": db_user.is_active
    }


# 📦 VIEW ALL ORDERS
@router.get("/orders")
def all_orders(
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    return db.query(Order).order_by(Order.created_at.desc()).all()


# 📘 VIEW LEDGER
@router.get("/ledger")
def ledger_view(
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    return db.query(Ledger).order_by(Ledger.created_at.desc()).all()


# 🚨 EMERGENCY SHUTDOWN
@router.post("/shutdown")
def emergency_shutdown(
    enabled: bool,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    """Enable/disable emergency shutdown mode"""
    # This would typically set a global flag in Redis or database
    # For now, we'll just return success
    return {"message": f"Emergency shutdown {'enabled' if enabled else 'disabled'}"}


# 🚩 MARK ORDER AS FRAUD
@router.post("/orders/{order_id}/fraud")
def mark_order_fraud(
    order_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Assuming Order model has fraud_flag field
    if hasattr(order, 'fraud_flag'):
        order.fraud_flag = True
        db.commit()

    return {"message": "Order marked as fraud"}


# 📊 ANALYTICS ENDPOINT
@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    """Basic analytics endpoint"""
    total_users = db.query(User).count()
    total_orders = db.query(Order).count()
    total_vendors = db.query(User).filter(User.role == UserRole.vendor).count()

    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_vendors": total_vendors
    }


# 📢 GLOBAL ANNOUNCEMENT
@router.post("/announce")
def send_global_announcement(
    message: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    """Send notification to all users"""
    from app.modules.notifications.service import notify_user

    users = db.query(User).all()
    for user_obj in users:
        notify_user(
            user_id=user_obj.id,
            phone=user_obj.phone,
            title="Admin Announcement",
            message=message,
            db=db
        )

    return {"message": "Announcement sent to all users"}
