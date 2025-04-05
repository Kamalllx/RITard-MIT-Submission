import requests
import json

# Webhook test data
webhook_data = {
    "type": "user.created",
    "data": {
        "id": "test_user_123",
        "first_name": "Test",
        "last_name": "User",
        "email_addresses": [
            {
                "id": "ema_123",
                "email_address": "test@example.com"
            }
        ],
        "primary_email_address_id": "ema_123",
        "created_at": 1617753600000,
        "updated_at": 1617753600000,
        "profile_image_url": "https://example.com/profile.jpg"
    }
}

# Updated ngrok URL
webhook_url = "https://91f8-2409-40f2-2005-393d-a827-fda5-f0f-b5c2.ngrok-free.app/api/clerk-webhook"

# Send the request
print(f"Sending test webhook to {webhook_url}")
response = requests.post(
    webhook_url,
    headers={"Content-Type": "application/json"},
    data=json.dumps(webhook_data)
)

# Print the response
print(f"Status code: {response.status_code}")
try:
    print(f"Response: {response.json()}")
except:
    print(f"Raw response: {response.text}")
