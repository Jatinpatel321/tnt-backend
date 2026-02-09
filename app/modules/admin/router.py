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
