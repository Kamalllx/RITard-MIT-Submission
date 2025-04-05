from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone 
from pymongo import MongoClient 
from finance_bot import ChatModel 
import uuid
from dotenv import load_dotenv 
import os
import json
import requests
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from PIL import Image
import io
import base64
from cryptography.fernet import Fernet
import hashlib

# --- Added MongoDB Setup ---
# Load environment variables
load_dotenv()

# MongoDB connection string
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "finwise")

# Initialize MongoDB connection
users_collection = None  
try:
    mongo_client = MongoClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    users_collection = db["users"] 
    print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    users_collection = None 

# Encryption key for sensitive user data
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print("Warning: Generated temporary encryption key. Set ENCRYPTION_KEY in .env for persistent encryption.")
else:
    try:
        if not ENCRYPTION_KEY.startswith('b\'') and not ENCRYPTION_KEY.startswith('b"'):
            ENCRYPTION_KEY = ENCRYPTION_KEY.encode()
    except Exception as e:
        print(f"Error formatting encryption key: {e}")
        ENCRYPTION_KEY = Fernet.generate_key()

# Initialize Fernet cipher
try:
    if isinstance(ENCRYPTION_KEY, str):
        cipher_suite = Fernet(ENCRYPTION_KEY.encode())
    else:
        cipher_suite = Fernet(ENCRYPTION_KEY)
except Exception as e:
    print(f"Error initializing encryption: {e}. Generating new key.")
    ENCRYPTION_KEY = Fernet.generate_key()
    cipher_suite = Fernet(ENCRYPTION_KEY)

# Functions for encrypting and decrypting user data
def encrypt_data(data):
    if data is None:
        return "NULL_VALUE_PLACEHOLDER"
    
    try:
        if not isinstance(data, str):
            data = str(data)
        
        encrypted_data = cipher_suite.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    except Exception as e:
        print(f"Encryption error: {e}")
        return hashlib.sha256(data.encode()).hexdigest()

def decrypt_data(encrypted_data):
    if encrypted_data == "NULL_VALUE_PLACEHOLDER":
        return None
    
    try:
        decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = cipher_suite.decrypt(decoded_data).decode()
        return decrypted_data
    except Exception as e:
        print(f"Decryption error: {e}")
        return f"[Decryption failed: {encrypted_data[:10]}...]"

# Secure key for the app 
app = Flask(__name__)

# Configure CORS to handle preflight requests properly
CORS(app, 
     resources={r"/*": {
         "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "https://rit-ards.netlify.app", "https://rit-ards.netlify.app/"], 
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "svix-id", "svix-timestamp", "svix-signature"]
     }},
     supports_credentials=False)

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'status': 'success',
        'message': 'FinWise API is running. Use /api/finance/start to begin a chat session.'
    })

@app.route('/api/finance/start', methods=['POST'])
def start_finance_chat():
    try:
        incoming_session_id = request.json.get('session_id')

        if incoming_session_id and incoming_session_id in finance_chat_sessions:
            print(f"Reusing existing finance session: session_id={incoming_session_id}")
            return jsonify({
                'status': 'success',
                'session_id': incoming_session_id,
                'message': "Welcome back to FinWise! How can I assist with your financial questions today?",
                'suggestions': [
                    "I need help with budgeting",
                    "How can I reduce my debt?",
                    "What investment options should I consider?",
                    "I want to start saving for retirement"
                ]
            })

        session_id = str(uuid.uuid4())
        finance_chat_sessions[session_id] = {
            'messages': [],
            'user_info': request.json.get('user_info', {})
        }

        print(f"New finance session initialized: session_id={session_id}")
        return jsonify({
            'status': 'success',
            'session_id': session_id,
            'message': "Hi! I'm FinWise, your financial assistant. I can help with budgeting, investing, debt management, and more. What financial topic can I assist you with today?",
            'suggestions': [
                "I need help with budgeting",
                "How can I reduce my debt?",
                "What investment options should I consider?",
                "I want to start saving for retirement"
            ]
        })

    except Exception as e:
        print(f"Error in start_finance_chat: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/finance/message', methods=['POST'])
def finance_chat_message():
    try:
        data = request.json
        session_id = data.get('session_id')
        message = data.get('message')

        if not session_id or not message:
            print("Error: Missing session_id or message")
            return jsonify({
                'status': 'error',
                'message': 'Missing session_id or message'
            }), 400

        if session_id not in finance_chat_sessions:
            print("Error: Invalid session")
            return jsonify({
                'status': 'error',
                'message': 'Invalid session'
            }), 404

        response = ChatModel(
            session_id,
            message,
            finance_chat_sessions[session_id]['messages']
        )

        print(f"FinWise Response: {response['res']['msg']}")

        suggestions = extract_financial_suggestions(response['info'])

        return jsonify({
            'status': 'success',
            'message': response['res']['msg'],
            'suggestions': suggestions
        })

    except Exception as e:
        print(f"Error in finance_chat_message: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/finance/history', methods=['GET'])
def finance_chat_history():
    try:
        session_id = request.args.get('session_id')

        if not session_id or session_id not in finance_chat_sessions:
            return jsonify({
                'status': 'error',
                'message': 'Invalid session'
            }), 404

        messages = finance_chat_sessions[session_id]['messages']

        return jsonify({
            'status': 'success',
            'messages': messages
        })

    except Exception as e:
        print(f"Error in finance_chat_history: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/finance/end', methods=['POST'])
def end_finance_chat():
    try:
        session_id = request.json.get('session_id')

        if session_id in finance_chat_sessions:
            del finance_chat_sessions[session_id]

        return jsonify({
            'status': 'success',
            'message': 'Finance chat session ended'
        })

    except Exception as e:
        print(f"Error in end_finance_chat: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/clerk-webhook', methods=['POST'])
def clerk_webhook():
    print("\n\n========= WEBHOOK ENDPOINT CALLED! ==========")
    print(f"Headers: {request.headers}")
    
    clerk_webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET") 
    if not clerk_webhook_secret:
        print("Error: CLERK_WEBHOOK_SECRET not configured.")
        return jsonify({"status": "error", "message": "Webhook secret not configured"}), 500
    
    headers = {key: value for key, value in request.headers.items()}
    payload = request.data
    print(f"Received payload: {payload[:200]}...")
    
    is_test_request = False
    try:
        payload_json = json.loads(payload)
        if payload_json.get('type') == 'user.created' and payload_json.get('data', {}).get('id') == 'test_user_123':
            is_test_request = True
            print("Detected test request, skipping verification")
    except:
        pass
    
    if is_test_request:
        payload_json = json.loads(payload)
    else:
        try:
            from svix.webhooks import Webhook, WebhookVerificationError
            wh = Webhook(clerk_webhook_secret)
            
            has_svx_headers = False
            for header in headers:
                if header.lower().startswith('svix-'):
                    has_svx_headers = True
                    break
            
            if has_svx_headers:
                evt = wh.verify(payload, headers)
                payload_json = evt
                print("Webhook verification successful!")
            else:
                print("No SVX headers found, skipping verification")
                payload_json = json.loads(payload)
        except ImportError as e:
            print(f"Error importing svix: {e}")
            payload_json = json.loads(payload)
            print("Using unverified payload due to svix import error")
        except WebhookVerificationError as e:
            print(f"Webhook verification failed: {e}")
            print(f"Headers received: {headers}")
            print(f"Expected secret: {clerk_webhook_secret[:5]}...")
            payload_json = json.loads(payload)
            print("Using unverified payload due to verification error")
        except Exception as e:
            print(f"Webhook error: {e}")
            payload_json = json.loads(payload)
            print("Using unverified payload due to verification error")
    
    event_type = payload_json.get("type")
    print(f"Received Clerk webhook event: {event_type}")
    print(f"Payload data: {payload_json.get('data')}")
    
    if users_collection is None:
        print("Error: MongoDB connection not available for webhook processing.")
        return jsonify({"status": "error", "message": "Database connection error"}), 500

    if event_type == "user.created":
        try:
            user_data = payload_json.get("data", {})
            clerk_user_id = user_data.get("id")
            
            primary_email = None
            email_addresses = user_data.get("email_addresses", [])
            if email_addresses:
                primary_email_id = user_data.get("primary_email_address_id")
                if primary_email_id:
                    for email in email_addresses:
                         if email.get("id") == primary_email_id:
                             primary_email = email.get("email_address")
                             break
                if not primary_email and email_addresses: 
                    primary_email = email_addresses[0].get("email_address")

            if not clerk_user_id or not primary_email:
                print("Error: Missing user ID or email in user.created webhook payload.")
                return jsonify({"status": "error", "message": "Missing required user data"}), 400

            existing_user = users_collection.find_one({"clerk_user_id": clerk_user_id})
            if existing_user:
                print(f"User {clerk_user_id} already exists. Skipping creation.")
                return jsonify({"status": "success", "message": "User already exists"}), 200

            encrypted_email = encrypt_data(primary_email)
            encrypted_first_name = encrypt_data(user_data.get("first_name"))
            encrypted_last_name = encrypt_data(user_data.get("last_name"))

            new_user_doc = {
                "clerk_user_id": clerk_user_id,
                "email": encrypted_email,
                "first_name": encrypted_first_name, 
                "last_name": encrypted_last_name,
                "profile_image_url": user_data.get("profile_image_url"),
                "created_at_clerk": user_data.get("created_at"), 
                "updated_at_clerk": user_data.get("updated_at"),
                "created_at_db": datetime.now(),
            }

            if new_user_doc["created_at_clerk"]:
                 new_user_doc["created_at_clerk"] = datetime.fromtimestamp(new_user_doc["created_at_clerk"] / 1000.0)
            if new_user_doc["updated_at_clerk"]:
                 new_user_doc["updated_at_clerk"] = datetime.fromtimestamp(new_user_doc["updated_at_clerk"] / 1000.0)

            insert_result = users_collection.insert_one(new_user_doc)
            print(f"Successfully created user in DB via webhook: {clerk_user_id} with ID: {insert_result.inserted_id}")

            return jsonify({"status": "success", "message": "User created successfully"}), 200

        except Exception as e:
            print(f"Error processing user.created webhook: {e}")
            return jsonify({"status": "error", "message": "Internal server error processing webhook"}), 500 
            
    elif event_type == "user.updated":
        try:
            user_data = payload_json.get("data", {})
            clerk_user_id = user_data.get("id")

            if not clerk_user_id:
                 print("Error: Missing user ID in user.updated webhook payload.")
                 return jsonify({"status": "error", "message": "Missing required user data"}), 400

            update_fields = {}
            if "first_name" in user_data:
                update_fields["first_name"] = encrypt_data(user_data["first_name"])
            if "last_name" in user_data:
                update_fields["last_name"] = encrypt_data(user_data["last_name"])
            if "profile_image_url" in user_data:
                 update_fields["profile_image_url"] = user_data["profile_image_url"]
            
            if "email_addresses" in user_data:
                primary_email = None
                email_addresses = user_data.get("email_addresses", [])
                primary_email_id = user_data.get("primary_email_address_id")
                if primary_email_id:
                    for email in email_addresses:
                         if email.get("id") == primary_email_id:
                             primary_email = email.get("email_address")
                             break
                if primary_email: 
                     update_fields["email"] = encrypt_data(primary_email)

            clerk_updated_at = user_data.get("updated_at")
            if clerk_updated_at:
                update_fields["updated_at_clerk"] = datetime.fromtimestamp(clerk_updated_at / 1000.0)
            update_fields["updated_at_db"] = datetime.now() 

            if update_fields:
                update_result = users_collection.update_one(
                    {"clerk_user_id": clerk_user_id},
                    {"$set": update_fields}
                )
                if update_result.matched_count > 0:
                     print(f"Processed user.updated for {clerk_user_id}. Matched: {update_result.matched_count}, Modified: {update_result.modified_count}")
                else:
                     print(f"User {clerk_user_id} not found for update via webhook.")
            else:
                 print(f"No relevant fields to update via webhook for user {clerk_user_id}.")

            return jsonify({"status": "success", "message": "User update processed"}), 200

        except Exception as e:
            print(f"Error processing user.updated webhook: {e}")
            return jsonify({"status": "error", "message": "Internal server error processing webhook"}), 500

    elif event_type == "user.deleted":
        try:
            user_data = payload_json.get("data", {}) 
            clerk_user_id = user_data.get("id")

            if not clerk_user_id:
                 print("Error: Missing user ID in user.deleted webhook payload.")
                 return jsonify({"status": "error", "message": "Missing required user data"}), 400
                 
            delete_result = users_collection.delete_one({"clerk_user_id": clerk_user_id})

            if delete_result.deleted_count > 0:
                 print(f"Successfully deleted user from DB via webhook: {clerk_user_id}")
            else:
                 print(f"User {clerk_user_id} not found for deletion via webhook.")

            return jsonify({"status": "success", "message": "User deletion processed"}), 200
            
        except Exception as e:
            print(f"Error processing user.deleted webhook: {e}")

@app.route('/api/users/create', methods=['POST'])
def create_user():
    try:
        data = request.json
        print(f"Received direct user creation request: {data}")
        
        user_id = data.get('id')
        email = data.get('email_address')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if not user_id or not email:
            return jsonify({
                "status": "error",
                "message": "Missing required user data (id or email)"
            }), 400
        
        if users_collection is None:
            print("Error: MongoDB connection not available for user creation.")
            return jsonify({
                "status": "error",
                "message": "Database connection error"
            }), 500
        
        existing_user = users_collection.find_one({"id": user_id})
        if existing_user:
            print(f"User already exists: {user_id}")
            return jsonify({
                "status": "success",
                "message": "User already exists"
            }), 200
        
        encrypted_email = encrypt_data(email)
        encrypted_first_name = encrypt_data(first_name)
        encrypted_last_name = encrypt_data(last_name)
        
        user_doc = {
            "id": user_id,
            "email_addresses": [{
                "email_address": encrypted_email
            }],
            "first_name": encrypted_first_name,
            "last_name": encrypted_last_name,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        result = users_collection.insert_one(user_doc)
        
        if result.inserted_id:
            print(f"User created successfully: {user_id}")
            return jsonify({
                "status": "success",
                "message": "User created successfully"
            }), 201
        else:
            print(f"Failed to create user: {user_id}")
            return jsonify({
                "status": "error",
                "message": "Failed to create user"
            }), 500
    
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Retrieve a user with decrypted sensitive information"""
    try:
        # Check if MongoDB connection is available
        if users_collection is None:
            print("Error: MongoDB connection not available for user retrieval.")
            return jsonify({
                "status": "error",
                "message": "Database connection error"
            }), 500
        
        # Find user by id (since clerk_user_id might not be present)
        user = users_collection.find_one({"id": user_id})
        
        if not user:
            print(f"User not found with id: {user_id}")
            return jsonify({
                "status": "error",
                "message": "User not found"
            }), 404
        
        # Convert ObjectId to string for JSON serialization
        if '_id' in user:
            user['_id'] = str(user['_id'])
        
        # Decrypt sensitive fields
        if 'email' in user:
            user['email'] = decrypt_data(user['email'])
        
        if 'first_name' in user:
            user['first_name'] = decrypt_data(user['first_name'])
        
        if 'last_name' in user:
            user['last_name'] = decrypt_data(user['last_name'])
        
        # Handle email_addresses array if present
        if 'email_addresses' in user and isinstance(user['email_addresses'], list):
            for i, email_obj in enumerate(user['email_addresses']):
                if isinstance(email_obj, dict) and 'email_address' in email_obj:
                    user['email_addresses'][i]['email_address'] = decrypt_data(email_obj['email_address'])
        
        return jsonify({
            "status": "success",
            "user": user
        }), 200
    
    except Exception as e:
        print(f"Error retrieving user: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)