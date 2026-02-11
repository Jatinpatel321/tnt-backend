import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_qr_pickup():
    print("🧪 Testing QR Pickup System")

    # Step 1: Send OTP
    print("\n1. Sending OTP...")
    otp_response = requests.post(f"{BASE_URL}/auth/send-otp", json={"phone": "1234567890"})
    print(f"OTP Response: {otp_response.status_code}")
    if otp_response.status_code != 200:
        print("Failed to send OTP")
        return

    # Step 2: Verify OTP (assuming OTP is 123456 for testing)
    print("\n2. Verifying OTP...")
    verify_response = requests.post(f"{BASE_URL}/auth/verify-otp", json={"phone": "1234567890", "otp": "123456"})
    print(f"Verify Response: {verify_response.status_code}")
    if verify_response.status_code != 200:
        print("Failed to verify OTP")
        return

    token = verify_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Got token: {token[:20]}...")

    # Step 3: Create an order (need to place an order first)
    print("\n3. Creating order...")
    # First get slots
    slots_response = requests.get(f"{BASE_URL}/slots", headers=headers)
    if slots_response.status_code != 200:
        print("Failed to get slots")
        return

    slots = slots_response.json()
    if not slots:
        print("No slots available")
        return

    slot_id = slots[0]["id"]
    print(f"Using slot: {slot_id}")

    # Place order with dummy items
    order_response = requests.post(f"{BASE_URL}/orders/{slot_id}", json=[
        {"menu_item_id": 1, "quantity": 1}
    ], headers=headers)

    if order_response.status_code != 200:
        print(f"Failed to place order: {order_response.text}")
        return

    order_data = order_response.json()
    order_id = order_data["order_id"]
    print(f"Created order: {order_id}")

    # Step 4: Complete the order (mark as ready for pickup)
    print("\n4. Completing order...")
    complete_response = requests.post(f"{BASE_URL}/orders/{order_id}/complete", headers=headers)
    print(f"Complete Response: {complete_response.status_code}")
    if complete_response.status_code != 200:
        print(f"Failed to complete order: {complete_response.text}")
        return

    # Step 5: Generate QR code
    print("\n5. Generating QR code...")
    qr_response = requests.post(f"{BASE_URL}/orders/{order_id}/qr", headers=headers)
    print(f"QR Response: {qr_response.status_code}")
    if qr_response.status_code != 200:
        print(f"Failed to generate QR: {qr_response.text}")
        return

    qr_data = qr_response.json()
    qr_code = qr_data["qr_code"]
    print(f"Generated QR: {qr_code}")

    # Step 6: Get order by QR (vendor verification)
    print("\n6. Getting order by QR...")
    get_qr_response = requests.get(f"{BASE_URL}/orders/qr/{qr_code}", headers=headers)
    print(f"Get QR Response: {get_qr_response.status_code}")
    if get_qr_response.status_code != 200:
        print(f"Failed to get order by QR: {get_qr_response.text}")
        return

    print(f"Order details: {get_qr_response.json()}")

    # Step 7: Confirm pickup
    print("\n7. Confirming pickup...")
    confirm_response = requests.post(f"{BASE_URL}/orders/qr/confirm", json={"qr_code": qr_code}, headers=headers)
    print(f"Confirm Response: {confirm_response.status_code}")
    if confirm_response.status_code != 200:
        print(f"Failed to confirm pickup: {confirm_response.text}")
        return

    print("✅ QR Pickup test completed successfully!")

if __name__ == "__main__":
    test_qr_pickup()
