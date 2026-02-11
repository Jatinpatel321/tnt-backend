
import random
from fastapi import HTTPException
from app.core.redis import redis_client

OTP_TTL = 300          # 5 minutes
SEND_LIMIT = 3         # max OTPs
SEND_WINDOW = 600      # 10 minutes
MAX_ATTEMPTS = 5       # max wrong tries


def generate_otp(phone: str) -> str:
    send_count_key = f"otp:send_count:{phone}"

    send_count = redis_client.get(send_count_key)
    if send_count and int(send_count) >= SEND_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="OTP request limit exceeded. Try later."
        )

    # For testing: use fixed OTP for phone ending with 1111
    if phone.endswith("1111"):
        otp = "123456"
    else:
        otp = str(random.randint(100000, 999999))

    redis_client.setex(f"otp:{phone}", OTP_TTL, otp)
    redis_client.incr(send_count_key)
    redis_client.expire(send_count_key, SEND_WINDOW)

    return otp


def verify_otp(phone: str, otp: str) -> bool:
    otp_key = f"otp:{phone}"
    attempts_key = f"otp:attempts:{phone}"

    stored_otp = redis_client.get(otp_key)
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP expired")

    attempts = redis_client.get(attempts_key)
    if attempts and int(attempts) >= MAX_ATTEMPTS:
        redis_client.delete(otp_key)
        raise HTTPException(status_code=429, detail="Too many wrong attempts")

    if stored_otp != otp:
        redis_client.incr(attempts_key)
        redis_client.expire(attempts_key, OTP_TTL)
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # ✅ Success — cleanup
    redis_client.delete(otp_key)
    redis_client.delete(attempts_key)

    return True
