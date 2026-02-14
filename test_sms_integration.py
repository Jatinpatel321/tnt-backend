import pytest

from app.core.config import settings
from app.core.sms import SMSConfigError, send_sms
from app.core.startup_checks import validate_production_settings


class _FakeResponse:
    def raise_for_status(self):
        return None


def test_send_sms_disabled_skips_provider_call(monkeypatch):
    monkeypatch.setattr(settings, "SMS_ENABLED", False)

    def _should_not_call(*args, **kwargs):
        raise AssertionError("Provider should not be called when SMS is disabled")

    monkeypatch.setattr("app.core.sms.httpx.post", _should_not_call)

    send_sms("+911234567890", "hello")


def test_send_sms_twilio_calls_provider(monkeypatch):
    monkeypatch.setattr(settings, "SMS_ENABLED", True)
    monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", "AC_test")
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "auth_test")
    monkeypatch.setattr(settings, "SMS_FROM", "+911111111111")

    captured = {}

    def _fake_post(url, data=None, auth=None, timeout=None):
        captured["url"] = url
        captured["data"] = data
        captured["auth"] = auth
        captured["timeout"] = timeout
        return _FakeResponse()

    monkeypatch.setattr("app.core.sms.httpx.post", _fake_post)

    send_sms("+919999999999", "TNT test message")

    assert "api.twilio.com" in captured["url"]
    assert captured["data"]["To"] == "+919999999999"
    assert captured["data"]["Body"] == "TNT test message"


def test_send_sms_twilio_missing_config_raises(monkeypatch):
    monkeypatch.setattr(settings, "SMS_ENABLED", True)
    monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", None)
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", None)
    monkeypatch.setattr(settings, "SMS_FROM", None)

    with pytest.raises(SMSConfigError):
        send_sms("+919999999999", "TNT test message")


def test_validate_production_settings_rejects_missing_sms_config(monkeypatch):
    monkeypatch.setattr(settings, "SMS_ENABLED", True)
    monkeypatch.setattr(settings, "SMS_PROVIDER", "twilio")
    monkeypatch.setattr(settings, "TWILIO_ACCOUNT_SID", None)
    monkeypatch.setattr(settings, "TWILIO_AUTH_TOKEN", "auth_test")
    monkeypatch.setattr(settings, "SMS_FROM", "+911111111111")

    with pytest.raises(RuntimeError):
        validate_production_settings("production", ["https://app.example.com"])
