import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("tnt.sms")


class SMSConfigError(RuntimeError):
    pass


def _send_twilio(phone: str, message: str) -> None:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.SMS_FROM:
        raise SMSConfigError("Missing Twilio SMS configuration")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
    data = {
        "To": phone,
        "From": settings.SMS_FROM,
        "Body": message,
    }

    response = httpx.post(
        url,
        data=data,
        auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
        timeout=10.0,
    )
    response.raise_for_status()


def _send_msg91(phone: str, message: str) -> None:
    if not settings.MSG91_AUTH_KEY or not settings.MSG91_SENDER_ID:
        raise SMSConfigError("Missing MSG91 SMS configuration")

    url = "https://api.msg91.com/api/v5/flow/"
    headers = {
        "authkey": settings.MSG91_AUTH_KEY,
        "content-type": "application/json",
    }
    payload = {
        "route": settings.MSG91_ROUTE,
        "sender": settings.MSG91_SENDER_ID,
        "mobiles": phone,
        "message": message,
    }

    response = httpx.post(url, json=payload, headers=headers, timeout=10.0)
    response.raise_for_status()


def send_sms(phone: str, message: str) -> None:
    if not settings.SMS_ENABLED:
        logger.info("sms_disabled provider=%s", settings.SMS_PROVIDER)
        return

    provider = settings.SMS_PROVIDER

    try:
        if provider == "twilio":
            _send_twilio(phone, message)
        elif provider == "msg91":
            _send_msg91(phone, message)
        else:
            raise SMSConfigError(f"Unsupported SMS_PROVIDER: {provider}")
    except httpx.HTTPError as exc:
        logger.exception("sms_send_http_error provider=%s phone=%s", provider, phone)
        raise RuntimeError("SMS provider request failed") from exc
