# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from datetime import datetime
# from pymongo import MongoClient
# from finance_bot import ChatModel
# import uuid
# from dotenv import load_dotenv
# import os
# from twilio.twiml.messaging_response import MessagingResponse
# from twilio.rest import Client
# from PIL import Image
# import io
# import requests
# import json

# app = Flask(__name__)
# CORS(app, supports_credentials=True)

# # Secure key for the app
# app.secret_key = 'your-secure-financial-key-here'  # Replace with a secure secret key

# # Store chat sessions
# finance_chat_sessions = {}

# # Create transactions folder if it doesn't exist
# if not os.path.exists('transactions'):
#     os.makedirs('transactions', mode=0o755)

# @app.route('/', methods=['GET'])
# def index():
#     """Root endpoint to verify API is running"""
#     return jsonify({
#         'status': 'success',
#         'message': 'FinWise API is running. Use /api/finance/start to begin a chat session.'
#     })

# @app.route('/api/finance/start', methods=['POST'])
# def start_finance_chat():
#     """Initialize a new finance chat session or resume an existing one"""
#     try:
#         # Get the session ID from the frontend if provided
#         incoming_session_id = request.json.get('session_id')

#         # Reuse the session if it exists
#         if incoming_session_id and incoming_session_id in finance_chat_sessions:
#             print(f"Reusing existing finance session: session_id={incoming_session_id}")
#             return jsonify({
#                 'status': 'success',
#                 'session_id': incoming_session_id,
#                 'message': "Welcome back to FinWise! How can I assist with your financial questions today?",
#                 'suggestions': [
#                     "I need help with budgeting",
#                     "How can I reduce my debt?",
#                     "What investment options should I consider?",
#                     "I want to start saving for retirement"
#                 ]
#             })

#         # Otherwise, create a new session
#         session_id = str(uuid.uuid4())
#         finance_chat_sessions[session_id] = {
#             'messages': [],
#             'user_info': request.json.get('user_info', {})
#         }

#         print(f"New finance session initialized: session_id={session_id}")
#         return jsonify({
#             'status': 'success',
#             'session_id': session_id,
#             'message': "Hi! I'm FinWise, your financial assistant. I can help with budgeting, investing, debt management, and more. What financial topic can I assist you with today?",
#             'suggestions': [
#                 "I need help with budgeting",
#                 "How can I reduce my debt?",
#                 "What investment options should I consider?",
#                 "I want to start saving for retirement"
#             ]
#         })

#     except Exception as e:
#         print(f"Error in start_finance_chat: {e}")
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500

# @app.route('/api/finance/message', methods=['POST'])
# def finance_chat_message():
#     """Handle finance chat messages"""
#     try:
#         data = request.json
#         session_id = data.get('session_id')
#         message = data.get('message')

#         # Debug: Log incoming request
#         print(f"Incoming finance request: session_id={session_id}, message={message}")

#         # Validate input
#         if not session_id or not message:
#             print("Error: Missing session_id or message")
#             return jsonify({
#                 'status': 'error',
#                 'message': 'Missing session_id or message'
#             }), 400

#         # Check if session exists
#         if session_id not in finance_chat_sessions:
#             print("Error: Invalid session")
#             return jsonify({
#                 'status': 'error',
#                 'message': 'Invalid session'
#             }), 404

#         # Get response from finance bot model
#         response = ChatModel(
#             session_id,
#             message,
#             finance_chat_sessions[session_id]['messages']
#         )

#         # Debug: Log LLM response
#         print(f"FinWise Response: {response['res']['msg']}")

#         suggestions = extract_financial_suggestions(response['info'])

#         return jsonify({
#             'status': 'success',
#             'message': response['res']['msg'],
#             'suggestions': suggestions
#         })

#     except Exception as e:
#         print(f"Error in finance_chat_message: {e}")
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500

# @app.route('/api/finance/history', methods=['GET'])
# def finance_chat_history():
#     """Retrieve chat history for a finance session"""
#     try:
#         session_id = request.args.get('session_id')

#         if not session_id or session_id not in finance_chat_sessions:
#             return jsonify({
#                 'status': 'error',
#                 'message': 'Invalid session'
#             }), 404

#         messages = finance_chat_sessions[session_id]['messages']

#         return jsonify({
#             'status': 'success',
#             'messages': messages
#         })

#     except Exception as e:
#         print(f"Error in finance_chat_history: {e}")
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500

# @app.route('/api/finance/end', methods=['POST'])
# def end_finance_chat():
#     """End a finance chat session"""
#     try:
#         session_id = request.json.get('session_id')

#         if session_id in finance_chat_sessions:
#             del finance_chat_sessions[session_id]

#         return jsonify({
#             'status': 'success',
#             'message': 'Finance chat session ended'
#         })

#     except Exception as e:
#         print(f"Error in end_finance_chat: {e}")
#         return jsonify({
#             'status': 'error',
#             'message': str(e)
#         }), 500

# @app.route('/whatsapp-webhook', methods=['POST'])
# def whatsapp_webhook():
#     """Handle incoming WhatsApp messages and images"""
#     try:
#         # Get basic info
#         sender_number = request.values.get('From', '').replace('whatsapp:', '')
#         num_media = int(request.values.get('NumMedia', 0))

#         # Remove +91 prefix from sender number
#         clean_number = sender_number.replace('+91', '')

#         # Create transactions folder with absolute path
#         full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'transactions')
#         if not os.path.exists(full_path):
#             os.makedirs(full_path, mode=0o755)
#             print(f"Created transactions folder at: {full_path}")

#         # Check if message contains an image
#         if num_media > 0:
#             try:
#                 # Get media URL directly
#                 media_url = request.values.get('MediaUrl0')
#                 print(f"Got media URL: {media_url}")

#                 # Get Twilio credentials
#                 account_sid = 'ACe255088910ba6398c9ca24a50d84f797'
#                 auth_token = '784a53c0495fdd494cc800b4bd97de1d'

#                 # Configure proxy for PythonAnywhere
#                 proxies = None
#                 if 'http_proxy' in os.environ:
#                     proxies = {
#                         'http': os.environ['http_proxy'],
#                         'https': os.environ['https_proxy']
#                     }

#                 # Download the image with authentication
#                 response = requests.get(
#                     media_url,
#                     auth=(account_sid, auth_token),
#                     proxies=proxies
#                 )

#                 # Check if download was successful
#                 if response.status_code == 200:
#                     # Create timestamp for filename
#                     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

#                     # Save image as JPG first
#                     jpg_path = os.path.join(full_path, f"{clean_number}_{timestamp}.jpg")
#                     with open(jpg_path, 'wb') as f:
#                         f.write(response.content)
#                     print(f"Saved JPG to {jpg_path}")
#                     twilio_response = MessagingResponse()
#                     twilio_response.message("Your image has been saved successfully!")
#                     return str(twilio_response)
                    
#                 else:
#                     # Failed to download image
#                     print(f"Failed to download image. Status code: {response.status_code}")
#                     twilio_response = MessagingResponse()
#                     twilio_response.message(f"Could not download image. Status code: {response.status_code}")
#                     return str(twilio_response)

#             except Exception as img_error:
#                 print(f"Image processing error: {img_error}")
#                 twilio_response = MessagingResponse()
#                 twilio_response.message("Sorry, couldn't process your image")
#                 return str(twilio_response)

#         # Handle text messages with existing chat logic
#         incoming_msg = request.values.get('Body', '').strip()
#         session_id = f"whatsapp_{clean_number}"

#         # Initialize session if it doesn't exist
#         if session_id not in finance_chat_sessions:
#             finance_chat_sessions[session_id] = {
#                 'messages': [],
#                 'user_info': {'phone': clean_number}
#             }

#         # Process message with finance bot
#         response = ChatModel(
#             session_id,
#             message,
#             finance_chat_sessions[session_id]['messages']
#         )

#         # Create Twilio response
#         twilio_response = MessagingResponse()
#         twilio_response.message(response['res']['msg'])
#         return str(twilio_response)

#     except Exception as e:
#         print(f"Error in whatsapp_webhook: {e}")
#         twilio_response = MessagingResponse()
#         twilio_response.message("Sorry, I encountered an error processing your request.")
#         return str(twilio_response)
# def extract_financial_suggestions(info):
#     """Extract contextual suggestions for finance based on the conversation"""
#     suggestions = []
    
#     # Add suggestions based on primary financial concern
#     if info.get('primary_concern'):
#         suggestions.append(f"Tell me more about your {info['primary_concern']} situation")
    
#     # Add suggestions based on financial goals
#     financial_goals = info.get('financial_goals', [])
#     if financial_goals and len(financial_goals) > 0:
#         suggestions.append(f"How can I help with your goal to {financial_goals[0]}?")
    
#     # Add suggestions based on recommended strategies
#     strategies = info.get('recommended_strategies', [])
#     if strategies and len(strategies) > 0:
#         suggestions.append(f"Would you like more details about {strategies[0]}?")
    
#     # Add general financial suggestions
#     suggestions.extend([
#         "How can I improve my budget?",
#         "What should I know about investing in mutual funds?",
#         "How can I reduce my personal loan debt?",
#         "What are some tax-saving investment options in India?"
#     ])
    
#     return suggestions[:4]  # Return max 4 suggestions

# def is_financial_emergency(message):
#     """Check if the message indicates a financial emergency"""
#     emergency_keywords = [
#         'bankruptcy', 'foreclosure', 'eviction', 'debt collector',
#         'loan shark', 'garnishment', 'repossession', 'urgent financial',
#         'unable to pay EMI', 'loan default', 'credit card debt'
#     ]
    
#     return any(keyword in message.lower() for keyword in emergency_keywords)

# def get_emergency_financial_resources():
#     """Return emergency financial resources for Indian population"""
#     return {
#         'message': 'For urgent financial situations in India, consider these resources:',
#         'resources': [
#             {
#                 'name': 'National Consumer Helpline',
#                 'contact': '1800-11-4000',
#                 'available': 'Monday to Saturday, 9:30 AM to 5:30 PM'
#             },
#             {
#                 'name': 'RBI Banking Ombudsman',
#                 'contact': 'https://cms.rbi.org.in',
#                 'available': 'Online complaint system'
#             },
#             {
#                 'name': 'SEBI SCORES for investment complaints',
#                 'contact': 'https://scores.gov.in',
#                 'available': '24/7 online portal'
#             },
#             {
#                 'name': 'Debt Recovery Tribunal Information',
#                 'contact': 'https://drt.gov.in',
#                 'available': 'Business hours'
#             }
#         ]
#     }
# with open("config.json") as f:
#     config = json.load(f)
#     CUSTOMER_ID = config["customer_id"]
#     ACCOUNT_ID = config["account_id"]

# BASE_URL = "https://api.mockbank.io"
# CLIENT_CREDENTIALS = ('ramaiah3316','12345678')  # Add your credentials here

# def get_auth_header():
#     token = get_access_token()
#     return {"Authorization": f"Bearer {token}"}

# def get_access_token():
#     auth = requests.auth.HTTPBasicAuth(*CLIENT_CREDENTIALS)
#     data = {
#         "grant_type": "password",
#         "username": "1ms23cy027@msrit.edu",
#         "password": "karteek**05U"
#     }
#     response = requests.post(f"{BASE_URL}/oauth/token", auth=auth, data=data)
#     return response.json()["access_token"]

# @app.route("/transactions", methods=["GET"])
# def get_transactions():
#     try:
#         response = requests.get(
#             f"{BASE_URL}/customers/{CUSTOMER_ID}/transactions",
#             headers=get_auth_header()
#         )
#         return jsonify(response.json()), response.status_code
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route("/transactions", methods=["POST"])
# def create_transaction():
#     try:
#         data = request.json
#         data["accountId"] = ACCOUNT_ID
        
#         response = requests.post(
#             f"{BASE_URL}/customers/{CUSTOMER_ID}/transactions",
#             headers={**get_auth_header(), "Content-Type": "application/json"},
#             json=data
#         )
#         return jsonify(response.json()), response.status_code
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route("/transactions/<transaction_id>", methods=["PUT"])
# def update_transaction(transaction_id):
#     try:
#         response = requests.put(
#             f"{BASE_URL}/transactions/{transaction_id}",  # Verify actual endpoint
#             headers={**get_auth_header(), "Content-Type": "application/json"},
#             json=request.json
#         )
#         return jsonify(response.json()), response.status_code
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @app.route("/transactions/<transaction_id>", methods=["DELETE"])
# def delete_transaction(transaction_id):
#     try:
#         response = requests.delete(
#             f"{BASE_URL}/transactions/{transaction_id}",  # Verify actual endpoint
#             headers=get_auth_header()
#         )
#         return jsonify({"message": "Transaction deleted"}), response.status_code
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)




















from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone # Added timezone
from pymongo import MongoClient # Added MongoClient
from finance_bot import ChatModel # Original import
import uuid
from dotenv import load_dotenv # Added load_dotenv
import os
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client # Original import
from PIL import Image
import io
import requests
import json

# --- Added: Load environment variables ---
# Place a .env file in the same directory with your secrets:
# MONGO_URI=mongodb+srv://...
# MONGODB_DB=finwise
# CLERK_WEBHOOK_SECRET=whsec_... 
load_dotenv() 
# --- End Added ---

app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- Added: MongoDB Setup ---
try:
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("MONGODB_DB")
    if not mongo_uri or not db_name:
        print("Warning: MONGO_URI and MONGODB_DB environment variables not found. Webhook user creation will fail.")
        users_collection = None
    else:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        users_collection = db["users"] # Collection to store user data
        # Optional: Test connection
        client.admin.command('ping') 
        print("Successfully connected to MongoDB.")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    users_collection = None 
# --- End Added MongoDB Setup ---

# Secure key for the app (Original)
app.secret_key = 'your-secure-financial-key-here'  # Replace with a secure secret key

# Store chat sessions (Original)
finance_chat_sessions = {}

# Create transactions folder if it doesn't exist (Original)
if not os.path.exists('transactions'):
    os.makedirs('transactions', mode=0o755)

@app.route('/', methods=['GET'])
def index():
    """Root endpoint to verify API is running""" # Original
    return jsonify({
        'status': 'success',
        'message': 'FinWise API is running. Use /api/finance/start to begin a chat session.'
    })

@app.route('/api/finance/start', methods=['POST'])
def start_finance_chat():
    """Initialize a new finance chat session or resume an existing one""" # Original
    try:
        # Get the session ID from the frontend if provided
        incoming_session_id = request.json.get('session_id')

        # Reuse the session if it exists
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

        # Otherwise, create a new session
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
    """Handle finance chat messages""" # Original
    try:
        data = request.json
        session_id = data.get('session_id')
        message = data.get('message')

        # Debug: Log incoming request
        print(f"Incoming finance request: session_id={session_id}, message={message}")

        # Validate input
        if not session_id or not message:
            print("Error: Missing session_id or message")
            return jsonify({
                'status': 'error',
                'message': 'Missing session_id or message'
            }), 400

        # Check if session exists
        if session_id not in finance_chat_sessions:
            print("Error: Invalid session")
            return jsonify({
                'status': 'error',
                'message': 'Invalid session'
            }), 404

        # Get response from finance bot model
        response = ChatModel(
            session_id, # Original passed argument order might differ from updated ChatModel definition
            message,
            finance_chat_sessions[session_id]['messages']
        )

        # Debug: Log LLM response
        print(f"FinWise Response: {response['res']['msg']}")

        suggestions = extract_financial_suggestions(response['info']) # Uses original helper

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
    """Retrieve chat history for a finance session""" # Original
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
    """End a finance chat session""" # Original
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

# --- Added: Clerk Webhook Handler ---
@app.route('/api/clerk-webhook', methods=['POST'])
def clerk_webhook():
    """Handles incoming webhooks from Clerk, specifically for user creation."""
    
    print("\n\n========= WEBHOOK ENDPOINT CALLED! ==========")
    print(f"Headers: {request.headers}")
    
    # --- IMPORTANT: Webhook Verification ---
    clerk_webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET") 
    if not clerk_webhook_secret:
        print("Error: CLERK_WEBHOOK_SECRET not configured.")
        return jsonify({"status": "error", "message": "Webhook secret not configured"}), 500
    
    headers = {key: value for key, value in request.headers.items()}
    payload = request.data
    print(f"Received payload: {payload[:200]}...")
    
    # Check if this is a direct test from our curl command
    is_test_request = False
    try:
        payload_json = json.loads(payload)
        if payload_json.get('type') == 'user.created' and payload_json.get('data', {}).get('id') == 'test_user_123':
            is_test_request = True
            print("Detected test request, skipping verification")
    except:
        pass
    
    if is_test_request:
        # Skip verification for our test request
        payload_json = json.loads(payload)
    else:
        try:
            # Try to verify with svix
            from svix.webhooks import Webhook, WebhookVerificationError
            wh = Webhook(clerk_webhook_secret)
            
            # Check if we have the required SVX headers
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
    
    # Ensure MongoDB connection is available
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

            new_user_doc = {
                "clerk_user_id": clerk_user_id,
                "email": primary_email,
                "first_name": user_data.get("first_name"), 
                "last_name": user_data.get("last_name"),
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
                update_fields["first_name"] = user_data["first_name"]
            if "last_name" in user_data:
                update_fields["last_name"] = user_data["last_name"]
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
                     # Check if email actually changed before updating
                     # existing_user = users_collection.find_one({"clerk_user_id": clerk_user_id}, {"email": 1})
                     # if not existing_user or existing_user.get("email") != primary_email:
                     #     update_fields["email"] = primary_email
                     update_fields["email"] = primary_email # Update email if found

            clerk_updated_at = user_data.get("updated_at")
            if clerk_updated_at:
                update_fields["updated_at_clerk"] = datetime.fromtimestamp(clerk_updated_at / 1000.0)
            update_fields["updated_at_db"] = datetime.now() # Always update DB timestamp

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
            return jsonify({"status": "error", "message": "Internal server error processing webhook"}), 500

    # Acknowledge other event types if necessary
    print(f"Received unhandled Clerk event type via webhook: {event_type}")
    print("========= END WEBHOOK PROCESSING =========\n\n")
    return jsonify({"status": "success", "message": "Webhook received but not processed"}), 200
# --- End Added Clerk Webhook Handler ---


@app.route('/whatsapp-webhook', methods=['POST'])
def whatsapp_webhook():
    """Handle incoming WhatsApp messages and images""" # Original
    try:
        # Get basic info
        sender_number = request.values.get('From', '').replace('whatsapp:', '')
        num_media = int(request.values.get('NumMedia', 0))

        # Remove +91 prefix from sender number
        clean_number = sender_number.replace('+91', '')

        # Create transactions folder with absolute path
        full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'transactions')
        if not os.path.exists(full_path):
            os.makedirs(full_path, mode=0o755)
            print(f"Created transactions folder at: {full_path}")

        # Check if message contains an image
        if num_media > 0:
            try:
                # Get media URL directly
                media_url = request.values.get('MediaUrl0')
                print(f"Got media URL: {media_url}")

                # Get Twilio credentials (Original hardcoded - consider moving to env)
                account_sid = 'ACe255088910ba6398c9ca24a50d84f797' 
                auth_token = '784a53c0495fdd494cc800b4bd97de1d'

                # Configure proxy for PythonAnywhere (Original)
                proxies = None
                if 'http_proxy' in os.environ:
                    proxies = {
                        'http': os.environ['http_proxy'],
                        'https': os.environ['https_proxy']
                    }

                # Download the image with authentication (Original)
                response = requests.get(
                    media_url,
                    auth=(account_sid, auth_token),
                    proxies=proxies
                )

                # Check if download was successful (Original)
                if response.status_code == 200:
                    # Create timestamp for filename
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

                    # Save image as JPG first
                    jpg_path = os.path.join(full_path, f"{clean_number}_{timestamp}.jpg")
                    with open(jpg_path, 'wb') as f:
                        f.write(response.content)
                    print(f"Saved JPG to {jpg_path}")
                    twilio_response = MessagingResponse()
                    twilio_response.message("Your image has been saved successfully!")
                    return str(twilio_response)
                    
                else:
                    # Failed to download image
                    print(f"Failed to download image. Status code: {response.status_code}")
                    twilio_response = MessagingResponse()
                    twilio_response.message(f"Could not download image. Status code: {response.status_code}")
                    return str(twilio_response)

            except Exception as img_error:
                print(f"Image processing error: {img_error}")
                twilio_response = MessagingResponse()
                twilio_response.message("Sorry, couldn't process your image")
                return str(twilio_response)

        # Handle text messages with existing chat logic (Original)
        incoming_msg = request.values.get('Body', '').strip()
        session_id = f"whatsapp_{clean_number}"

        # Initialize session if it doesn't exist
        if session_id not in finance_chat_sessions:
            finance_chat_sessions[session_id] = {
                'messages': [],
                'user_info': {'phone': clean_number}
            }

        # Process message with finance bot (Original - requires ChatModel)
        response = ChatModel(
            id=session_id, # Check if ChatModel expects 'id' or 'session_id'
            msg=incoming_msg,
            messages=finance_chat_sessions[session_id]['messages']
        )

        # Create Twilio response (Original)
        twilio_response = MessagingResponse()
        twilio_response.message(response['res']['msg'])
        return str(twilio_response)

    except Exception as e:
        print(f"Error in whatsapp_webhook: {e}")
        twilio_response = MessagingResponse()
        twilio_response.message("Sorry, I encountered an error processing your request.")
        return str(twilio_response)
# --- Direct User Creation Endpoint ---
@app.route('/api/users/create', methods=['POST'])
def create_user():
    """Direct endpoint to create a user in the database after Clerk sign-up"""
    try:
        data = request.json
        print(f"Received direct user creation request: {data}")
        
        # Extract user data
        user_id = data.get('id')
        email = data.get('email_address')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        if not user_id or not email:
            return jsonify({
                "status": "error",
                "message": "Missing required user data (id or email)"
            }), 400
        
        # Check if MongoDB connection is available
        if users_collection is None:
            print("Error: MongoDB connection not available for user creation.")
            return jsonify({
                "status": "error",
                "message": "Database connection error"
            }), 500
        
        # Check if user already exists
        existing_user = users_collection.find_one({"id": user_id})
        if existing_user:
            print(f"User already exists: {user_id}")
            return jsonify({
                "status": "success",
                "message": "User already exists"
            }), 200
        
        # Create user document
        user_doc = {
            "id": user_id,
            "email_addresses": [{
                "email_address": email
            }],
            "first_name": first_name,
            "last_name": last_name,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Insert into MongoDB
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

# Original Helper Functions ----
def extract_financial_suggestions(info):
    """Extract contextual suggestions for finance based on the conversation""" # Original
    suggestions = []
    
    # Add suggestions based on primary financial concern
    if info.get('primary_concern'):
        suggestions.append(f"Tell me more about your {info['primary_concern']} situation")
    
    # Add suggestions based on financial goals
    financial_goals = info.get('financial_goals', [])
    if financial_goals and len(financial_goals) > 0:
        suggestions.append(f"How can I help with your goal to {financial_goals[0]}?")
    
    # Add suggestions based on recommended strategies
    strategies = info.get('recommended_strategies', [])
    if strategies and len(strategies) > 0:
        suggestions.append(f"Would you like more details about {strategies[0]}?")
    
    # Add general financial suggestions
    suggestions.extend([
        "How can I improve my budget?",
        "What should I know about investing in mutual funds?",
        "How can I reduce my personal loan debt?",
        "What are some tax-saving investment options in India?"
    ])
    
    return suggestions[:4]  # Return max 4 suggestions

def is_financial_emergency(message):
    """Check if the message indicates a financial emergency""" # Original
    emergency_keywords = [
        'bankruptcy', 'foreclosure', 'eviction', 'debt collector',
        'loan shark', 'garnishment', 'repossession', 'urgent financial',
        'unable to pay EMI', 'loan default', 'credit card debt'
    ]
    
    return any(keyword in message.lower() for keyword in emergency_keywords)

def get_emergency_financial_resources():
    """Return emergency financial resources for Indian population""" # Original
    return {
        'message': 'For urgent financial situations in India, consider these resources:',
        'resources': [
            {
                'name': 'National Consumer Helpline',
                'contact': '1800-11-4000',
                'available': 'Monday to Saturday, 9:30 AM to 5:30 PM'
            },
            {
                'name': 'RBI Banking Ombudsman',
                'contact': 'https://cms.rbi.org.in',
                'available': 'Online complaint system'
            },
            {
                'name': 'SEBI SCORES for investment complaints',
                'contact': 'https://scores.gov.in',
                'available': '24/7 online portal'
            },
            {
                'name': 'Debt Recovery Tribunal Information',
                'contact': 'https://drt.gov.in',
                'available': 'Business hours'
            }
        ]
    }
# ---- End Original Helper Functions ----

# Original MockBank Setup ----
try: # Added try-except around original file read
    with open("config.json") as f:
        config = json.load(f)
        CUSTOMER_ID = config["customer_id"]
        ACCOUNT_ID = config["account_id"]
except FileNotFoundError:
    print("Warning: config.json not found. Original MockBank config failed.")
    CUSTOMER_ID = None
    ACCOUNT_ID = None
except KeyError as e:
    print(f"Warning: Missing key {e} in config.json. Original MockBank config failed.")
    CUSTOMER_ID = None
    ACCOUNT_ID = None
except Exception as e:
     print(f"Error reading config.json: {e}")
     CUSTOMER_ID = None
     ACCOUNT_ID = None


BASE_URL = "https://api.mockbank.io" # Original
CLIENT_CREDENTIALS = ('ramaiah3316','12345678')  # Original - Add your credentials here

# Original MockBank Helper Functions ----
def get_auth_header(): # Original
    token = get_access_token()
    # Added check if token is None
    if token:
        return {"Authorization": f"Bearer {token}"}
    else:
        # Handle case where token couldn't be obtained
        print("Warning: Could not get MockBank access token for auth header.")
        return None 

def get_access_token(): # Original
    auth = requests.auth.HTTPBasicAuth(*CLIENT_CREDENTIALS)
    data = {
        "grant_type": "password",
        "username": "1ms23cy027@msrit.edu", # Original hardcoded
        "password": "karteek**05U" # Original hardcoded
    }
    try: # Added try-except
        response = requests.post(f"{BASE_URL}/oauth/token", auth=auth, data=data)
        response.raise_for_status() # Check for HTTP errors
        return response.json()["access_token"]
    except requests.exceptions.RequestException as e:
        print(f"Error getting MockBank access token: {e}")
        return None
    except KeyError:
        print("Error: 'access_token' key not found in MockBank response.")
        return None
    except Exception as e:
         print(f"Unexpected error in get_access_token: {e}")
         return None
# ---- End Original MockBank Helper Functions ----

# Original MockBank Routes ----
@app.route("/transactions", methods=["GET"])
def get_transactions(): # Original
    # Added check for CUSTOMER_ID from original config load
    if CUSTOMER_ID is None:
        return jsonify({"error": "MockBank CUSTOMER_ID not configured (check config.json)"}), 503
        
    auth_header = get_auth_header() # Uses original get_auth_header
    # Added check if header is None
    if auth_header is None:
         return jsonify({"error": "Failed to authenticate with MockBank"}), 500

    try:
        response = requests.get(
            f"{BASE_URL}/customers/{CUSTOMER_ID}/transactions",
            headers=auth_header # Use potentially None header
        )
        response.raise_for_status() # Added error check
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e: # Added error handling
        print(f"Error fetching MockBank transactions: {e}")
        return jsonify({"error": f"Failed to fetch transactions: {getattr(e.response, 'status_code', 500)}"}), getattr(e.response, 'status_code', 500)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/transactions", methods=["POST"])
def create_transaction(): # Original
    # Added checks for original config vars
    if CUSTOMER_ID is None or ACCOUNT_ID is None:
        return jsonify({"error": "MockBank CUSTOMER_ID or ACCOUNT_ID not configured (check config.json)"}), 503

    auth_header = get_auth_header()
    if auth_header is None:
         return jsonify({"error": "Failed to authenticate with MockBank"}), 500

    try:
        data = request.json
        if not data: # Added check for data
             return jsonify({"error": "Missing JSON body"}), 400
        data["accountId"] = ACCOUNT_ID # Original assignment
        
        response = requests.post(
            f"{BASE_URL}/customers/{CUSTOMER_ID}/transactions",
            headers={**auth_header, "Content-Type": "application/json"}, # Original headers
            json=data
        )
        response.raise_for_status() # Added error check
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e: # Added error handling
         print(f"Error creating MockBank transaction: {e}")
         error_details = getattr(e.response, 'json', lambda: { "error": str(e) })()
         return jsonify(error_details), getattr(e.response, 'status_code', 500)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/transactions/<transaction_id>", methods=["PUT"])
def update_transaction(transaction_id): # Original
    # Added check for original config var
    if CUSTOMER_ID is None:
         return jsonify({"error": "MockBank CUSTOMER_ID not configured (check config.json)"}), 503
         
    auth_header = get_auth_header()
    if auth_header is None:
         return jsonify({"error": "Failed to authenticate with MockBank"}), 500

    try:
        req_data = request.json # Renamed to avoid conflict
        if not req_data: # Added check
             return jsonify({"error": "Missing JSON body"}), 400

        response = requests.put(
            f"{BASE_URL}/transactions/{transaction_id}",  # Verify actual endpoint (Original comment)
            headers={**auth_header, "Content-Type": "application/json"}, # Original headers
            json=req_data
        )
        response.raise_for_status() # Added error check
        return jsonify(response.json()), response.status_code
    except requests.exceptions.RequestException as e: # Added error handling
         print(f"Error updating MockBank transaction {transaction_id}: {e}")
         error_details = getattr(e.response, 'json', lambda: { "error": str(e) })()
         return jsonify(error_details), getattr(e.response, 'status_code', 500)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/transactions/<transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id): # Original
    # Added check for original config var
    if CUSTOMER_ID is None:
         return jsonify({"error": "MockBank CUSTOMER_ID not configured (check config.json)"}), 503
         
    auth_header = get_auth_header()
    if auth_header is None:
         return jsonify({"error": "Failed to authenticate with MockBank"}), 500

    try:
        response = requests.delete(
            f"{BASE_URL}/transactions/{transaction_id}",  # Verify actual endpoint (Original comment)
            headers=auth_header # Original header
        )
        response.raise_for_status() # Added error check
        # Original logic just returned success message
        return jsonify({"message": "Transaction deleted"}), response.status_code 
    except requests.exceptions.RequestException as e: # Added error handling
        print(f"Error deleting MockBank transaction {transaction_id}: {e}")
        # Handle 404 Not Found specifically if possible
        if getattr(e.response, 'status_code', None) == 404:
             return jsonify({"error": "Transaction not found"}), 404
        error_details = getattr(e.response, 'json', lambda: { "error": str(e) })()
        return jsonify(error_details), getattr(e.response, 'status_code', 500)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ---- End Original MockBank Routes ----

@app.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint to verify the server is accessible"""
    return jsonify({
        'status': 'success',
        'message': 'Test endpoint is working!'
    })

if __name__ == '__main__': # Original entry point
    app.run(debug=True, port=5000)