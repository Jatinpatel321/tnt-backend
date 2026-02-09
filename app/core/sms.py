def send_sms(phone: str, message: str):
    """
    Plug any provider here:
    - Twilio
    - MSG91
    - Fast2SMS
    """
    print(f"[SMS to {phone}] {message}")
