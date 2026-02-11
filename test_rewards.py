import requests
import json

BASE_URL = "http://localhost:8000"

def test_rewards_flow():
    print("🧪 Testing Rewards System")

    # Step 1: Send OTP
    print("\n1. Sending OTP...")
    otp_response = requests.post(f"{BASE_URL}/auth/send-otp", json={"phone": "9999999999"})
    print(f"OTP Response: {otp_response.status_code}")
    if otp_response.status_code != 200:
        print("Failed to send OTP")
        return

    # Extract OTP from response (in real app, this would be sent via SMS)
    otp_data = otp_response.json()
    print(f"OTP sent: {otp_data}")

    # For testing, we'll assume OTP is "123456" or extract from logs
    # In production, you'd receive this via SMS
    test_otp = "123456"

    # Step 2: Verify OTP and login
    print("\n2. Verifying OTP and logging in...")
    verify_response = requests.post(f"{BASE_URL}/auth/verify-otp", json={
        "phone": "9999999999",
        "otp": test_otp
    })
    print(f"Verify Response: {verify_response.status_code}")
    if verify_response.status_code != 200:
        print("Failed to verify OTP")
        return

    verify_data = verify_response.json()
    token = verify_data.get("access_token")
    print(f"Login successful. Token: {token[:20]}...")

    headers = {"Authorization": f"Bearer {token}"}

    # Step 3: Check initial points
    print("\n3. Checking initial points...")
    points_response = requests.get(f"{BASE_URL}/rewards/points", headers=headers)
    print(f"Points Response: {points_response.status_code}")
    if points_response.status_code == 200:
        points_data = points_response.json()
        print(f"Initial points: {points_data['current_points']}")

    # Step 4: Get available redemptions
    print("\n4. Getting available redemptions...")
    redemptions_response = requests.get(f"{BASE_URL}/rewards/redemptions", headers=headers)
    print(f"Redemptions Response: {redemptions_response.status_code}")
    if redemptions_response.status_code == 200:
        redemptions_data = redemptions_response.json()
        print(f"Available redemptions: {len(redemptions_data)} options")

    # Step 5: Initialize reward rules (admin function)
    print("\n5. Initializing reward rules...")
    rules_response = requests.post(f"{BASE_URL}/rewards/initialize-rules", headers=headers)
    print(f"Rules Response: {rules_response.status_code}")
    if rules_response.status_code == 200:
        print("Reward rules initialized")

    # Step 6: Create a test order to earn points
    print("\n6. Creating test order to earn points...")
    # First get available slots
    slots_response = requests.get(f"{BASE_URL}/slots", headers=headers)
    if slots_response.status_code == 200:
        slots_data = slots_response.json()
        if slots_data:
            slot_id = slots_data[0]['id']
            print(f"Using slot ID: {slot_id}")

            # Create order
            order_response = requests.post(f"{BASE_URL}/orders", json={"slot_id": slot_id}, headers=headers)
            print(f"Order Response: {order_response.status_code}")
            if order_response.status_code == 200:
                order_data = order_response.json()
                order_id = order_data['id']
                print(f"Order created: {order_id}")

                # Simulate order completion to earn points
                # In real scenario, vendor would mark as completed
                # For testing, we'll call the internal service
                print("Note: Points will be awarded when order is marked as completed by vendor")

    # Step 7: Check points after order
    print("\n7. Checking points after order...")
    points_response = requests.get(f"{BASE_URL}/rewards/points", headers=headers)
    if points_response.status_code == 200:
        points_data = points_response.json()
        print(f"Points after order: {points_data['current_points']}")

    # Step 8: Test redemption (if enough points)
    if points_data['current_points'] >= 50:  # Minimum for discount_percentage
        print("\n8. Testing points redemption...")
        redeem_response = requests.post(f"{BASE_URL}/rewards/redeem", json={
            "redemption_type": "discount_percentage",
            "points_used": 50,
            "value": 10  # 10% discount
        }, headers=headers)
        print(f"Redeem Response: {redeem_response.status_code}")
        if redeem_response.status_code == 200:
            redeem_data = redeem_response.json()
            print(f"Redemption successful: {redeem_data}")

            # Check points after redemption
            points_response = requests.get(f"{BASE_URL}/rewards/points", headers=headers)
            if points_response.status_code == 200:
                points_data = points_response.json()
                print(f"Points after redemption: {points_data['current_points']}")

    print("\n✅ Rewards system test completed!")

if __name__ == "__main__":
    test_rewards_flow()
