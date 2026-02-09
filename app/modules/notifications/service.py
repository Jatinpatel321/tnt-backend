from sqlalchemy.orm import Session
from app.modules.notifications.model import Notification
from app.core.sms import send_sms


def notify_user(
    user_id: int,
    phone: str,
    title: str,
    message: str,
    db: Session,
    send_sms_flag: bool = True
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message
    )

    db.add(notification)

    if send_sms_flag:
        send_sms(phone, message)
