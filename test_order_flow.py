import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def login(phone):
    # Send OTP
    response = requests.post(f"{BASE_URL}/auth/send-otp", json={"phone": phone})
    if response.status_code != 200:
        print(f"Send OTP failed for {phone}: {response.text}")
        return None

    # For testing, assume OTP is 123456 (check otp_service.py)
    otp = "123456"
    response = requests.post(f"{BASE_URL}/auth/verify-otp", json={"phone": phone, "otp": otp})
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Verify OTP failed for {phone}: {response.text}")
        return None

def create_slot(token, start_time, end_time, max_orders):
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "max_orders": max_orders
    }
    response = requests.post(f"{BASE_URL}/slots/", json=data, headers=headers)
    if response.status_code == 200:
        return response.json()["id"]
    else:
        print(f"Create slot failed: {response.text}")
        return None

def place_order(token, slot_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/orders/{slot_id}", headers=headers)
    if response.status_code == 200:
        return response.json()["id"]
    else:
        print(f"Place order failed: {response.text}")
        return None

def get_my_orders(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/orders/my", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Get orders failed: {response.text}")
        return []

def cancel_order(token, order_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/orders/{order_id}/cancel", headers=headers)
    print(f"Cancel order {order_id}: {response.status_code} - {response.text}")

def confirm_order(token, order_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/orders/{order_id}/confirm", headers=headers)
    print(f"Confirm order {order_id}: {response.status_code} - {response.text}")

def complete_order(token, order_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/orders/{order_id}/complete", headers=headers)
    print(f"Complete order {order_id}: {response.status_code} - {response.text}")

def initiate_payment(token, order_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/payments/initiate/{order_id}", headers=headers)
    if response.status_code == 200:
        return response.json()["id"]
    else:
        print(f"Initiate payment failed: {response.text}")
        return None

def complete_payment(token, payment_id, success):
    headers = {"Authorization": f"Bearer {token}"}
    data = {"success": success}
    response = requests.post(f"{BASE_URL}/payments/complete/{payment_id}", json=data, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Complete payment failed: {response.text}")
        return None

def test_flow():
    # Login
    student_token = login("1111111111")
    vendor_token = login("2222222222")
    if not student_token or not vendor_token:
        return

    # Create slot
    start_time = datetime.utcnow() + timedelta(hours=1)
    end_time = start_time + timedelta(hours=2)
    slot_id = create_slot(vendor_token, start_time, end_time, 10)
    if not slot_id:
        return

    print("=== Student places order ===")
    order_id = place_order(student_token, slot_id)
    if not order_id:
        return

    orders = get_my_orders(student_token)
    print(f"Order status: {orders[0]['status'] if orders else 'None'}")

    print("=== Student cancels order ===")
    cancel_order(student_token, order_id)

    print("=== Student places another order ===")
    order_id2 = place_order(student_token, slot_id)
    if not order_id2:
        return

    print("=== Vendor confirms order ===")
    confirm_order(vendor_token, order_id2)

    print("=== Vendor completes order ===")
    complete_order(vendor_token, order_id2)

    print("=== Invalid: Student tries to confirm ===")
    confirm_order(student_token, order_id2)  # Should 403

    print("=== Invalid: Vendor tries to complete before confirm ===")
    order_id3 = place_order(student_token, slot_id)
    if order_id3:
        complete_order(vendor_token, order_id3)  # Should 400

    print("=== Invalid: Cancel after confirm ===")
    order_id4 = place_order(student_token, slot_id)
    if order_id4:
        confirm_order(vendor_token, order_id4)
        cancel_order(student_token, order_id4)  # Should 400

    print("=== Payment Flow Test ===")
    # Place order for payment test
    order_id5 = place_order(student_token, slot_id)
    if not order_id5:
        return

    orders = get_my_orders(student_token)
    print(f"Order {order_id5} status before payment: {orders[0]['status'] if orders else 'None'}")

    # Initiate payment
    payment_id = initiate_payment(student_token, order_id5)
    if not payment_id:
        return
    print(f"Payment initiated: {payment_id}")

    # Complete payment with success
    payment_result = complete_payment(student_token, payment_id, True)
    if payment_result:
        print(f"Payment completed successfully: {payment_result}")

    # Check order status
    orders = get_my_orders(student_token)
    print(f"Order {order_id5} status after successful payment: {orders[0]['status'] if orders else 'None'}")

    # Place another order for failure test
    order_id6 = place_order(student_token, slot_id)
    if not order_id6:
        return

    # Initiate payment
    payment_id2 = initiate_payment(student_token, order_id6)
    if not payment_id2:
        return
    print(f"Payment initiated for failure test: {payment_id2}")

    # Complete payment with failure
    payment_result2 = complete_payment(student_token, payment_id2, False)
    if payment_result2:
        print(f"Payment failed: {payment_result2}")

    # Check order status
    orders = get_my_orders(student_token)
    print(f"Order {order_id6} status after failed payment: {orders[0]['status'] if orders else 'None'}")

if __name__ == "__main__":
    test_flow()
