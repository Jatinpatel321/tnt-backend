from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.core.security import get_current_user
from app.modules.notifications.model import Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == user["id"])
        .order_by(Notification.created_at.desc())
        .all()
    )
