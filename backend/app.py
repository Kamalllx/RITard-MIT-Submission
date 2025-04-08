from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from pymongo import MongoClient
from finance_bot import ChatModel
import uuid
from dotenv import load_dotenv
import os
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from PIL import Image
import io
import requests
import json
from trans_bot import BankingDataAssistant
from flask_cors import cross_origin
from flask_socketio import SocketIO
import os
from receipt_scanner import process_receipt
from twilio.twiml.messaging_response import MessagingResponse
import traceback
import logging

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Secure key for the app
app.secret_key = 'your-secure-financial-key-here'  # Replace with a secure secret key


# Store chat sessions
finance_chat_sessions = {}

# Create transactions folder if it doesn't exist
if not os.path.exists('transactions'):
    os.makedirs('transactions', mode=0o755)

@app.route('/', methods=['GET'])
def index():
    """Root endpoint to verify API is running"""
    return jsonify({
        'status': 'success',
        'message': 'FinWise API is running. Use /api/finance/start to begin a chat session.'
    })

@app.route('/api/finance/start', methods=['POST'])
def start_finance_chat():
    """Initialize a new finance chat session or resume an existing one"""
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
    """Handle finance chat messages"""
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
            session_id,
            message,
            finance_chat_sessions[session_id]['messages']
        )

        # Debug: Log LLM response
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
    """Retrieve chat history for a finance session"""
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
    """End a finance chat session"""
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

@app.route('/whatsapp-webhook', methods=['POST'])
def whatsapp_webhook():
    try:
        sender_number = request.values.get('From', '').replace('whatsapp:', '')
        num_media = int(request.values.get('NumMedia', 0))
        clean_number = sender_number.replace('+91', '')

        if num_media > 0:
            try:
                media_url = request.values.get('MediaUrl0')
                content_type = request.values.get('MediaContentType0', 'image/jpeg')
                
                logger.info(f"Processing media from {clean_number}")
                logger.info(f"Media URL: {media_url}")
                logger.info(f"Content type: {content_type}")

                account_sid = os.getenv('TWILIO_ACCOUNT_SID')
                auth_token = os.getenv('TWILIO_AUTH_TOKEN')

                if not account_sid or not auth_token:
                    raise ValueError("Twilio credentials not configured")

                response = requests.get(
                    media_url,
                    auth=(account_sid, auth_token),
                    timeout=30
                )

                if response.status_code == 200:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    unique_id = str(uuid.uuid4().hex[:8])
                    filename = f"{clean_number}_{timestamp}_{unique_id}"

                    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
                    os.makedirs(upload_dir, exist_ok=True)

                    extension = 'jpg'
                    if content_type:
                        ext = content_type.split('/')[-1].lower()
                        if ext in ['jpeg', 'jpg', 'png']:
                            extension = ext

                    file_path = os.path.join(upload_dir, f"{filename}.{extension}")
                    
                    with open(file_path, 'wb') as f:
                        f.write(response.content)
                    
                    logger.info(f"Image saved successfully to {file_path}")

                    # Process receipt with enhanced error handling
                    try:
                        logger.info("Starting receipt processing...")
                        result = process_receipt(file_path)
                        logger.info(f"Receipt processing result: {result}")

                        if result['success']:
                            data = result['extracted_data']
                            message = "✅ Receipt processed successfully!\n\n"
                            message += "📝 Receipt Details:\n"
                            if data.get('merchant'):
                                message += f"🏪 Merchant: {data['merchant']}\n"
                            if data.get('amount'):
                                message += f"💰 Amount: ₹{data['amount']}\n"
                            if data.get('date'):
                                message += f"📅 Date: {data['date']}\n"
                        else:
                            logger.error(f"Receipt processing failed: {result.get('error', 'Unknown error')}")
                            message = "❌ Sorry, I couldn't process the receipt. Please ensure:\n"
                            message += "• The image is clear and well-lit\n"
                            message += "• All text is readable\n"
                            message += "• The receipt is properly aligned"
                    except Exception as proc_error:
                        logger.error(f"Receipt processing error: {str(proc_error)}")
                        logger.error(traceback.format_exc())
                        message = "❌ Error processing receipt. Please try again with a clearer image."
                else:
                    logger.error(f"Failed to download image. Status code: {response.status_code}")
                    message = "❌ Failed to download the image. Please try sending it again."

                twilio_response = MessagingResponse()
                twilio_response.message(message)
                return str(twilio_response)

            except Exception as img_error:
                logger.error(f"Image handling error: {str(img_error)}")
                logger.error(traceback.format_exc())
                twilio_response = MessagingResponse()
                twilio_response.message("Sorry, I encountered an error processing your image. Please try again.")
                return str(twilio_response)

        incoming_msg = request.values.get('Body', '').strip()
        session_id = f"whatsapp_{clean_number}"

        if session_id not in finance_chat_sessions:
            finance_chat_sessions[session_id] = {
                'messages': [],
                'user_info': {'phone': clean_number}
            }

        response = ChatModel(
            id=session_id,
            msg=incoming_msg,
            messages=finance_chat_sessions[session_id]['messages']
        )

        twilio_response = MessagingResponse()
        twilio_response.message(response['res']['msg'])
        return str(twilio_response)

    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        logger.error(traceback.format_exc())
        twilio_response = MessagingResponse()
        twilio_response.message("Sorry, something went wrong. Please try again later.")
        return str(twilio_response)

def extract_financial_suggestions(info):
    """Extract contextual suggestions for finance based on the conversation"""
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
    """Check if the message indicates a financial emergency"""
    emergency_keywords = [
        'bankruptcy', 'foreclosure', 'eviction', 'debt collector',
        'loan shark', 'garnishment', 'repossession', 'urgent financial',
        'unable to pay EMI', 'loan default', 'credit card debt'
    ]
    
    return any(keyword in message.lower() for keyword in emergency_keywords)

def get_emergency_financial_resources():
    """Return emergency financial resources for Indian population"""
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
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")) as f:
    config = json.load(f)
    CUSTOMER_ID = config["customer_id"]
    ACCOUNT_ID = config["account_id"]

BASE_URL = "https://api.mockbank.io"
CLIENT_CREDENTIALS = ('ramaiah3316','12345678')  # Add your credentials here

def get_auth_header():
    token = get_access_token()
    return {"Authorization": f"Bearer {token}"}

def get_access_token():
    auth = requests.auth.HTTPBasicAuth(*CLIENT_CREDENTIALS)
    data = {
        "grant_type": "password",
        "username": "1ms23cy027@msrit.edu",
        "password": "karteek**05U"
    }
    response = requests.post(f"{BASE_URL}/oauth/token", auth=auth, data=data)
    return response.json()["access_token"]

@app.route("/transactions", methods=["GET"])
def get_transactions():
    try:
        response = requests.get(
            f"{BASE_URL}/customers/{CUSTOMER_ID}/transactions",
            headers=get_auth_header()
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/transactions", methods=["POST"])
def create_transaction():
    try:
        data = request.json
        data["accountId"] = ACCOUNT_ID
        
        response = requests.post(
            f"{BASE_URL}/customers/{CUSTOMER_ID}/transactions",
            headers={**get_auth_header(), "Content-Type": "application/json"},
            json=data
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/transactions/<transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    try:
        response = requests.put(
            f"{BASE_URL}/transactions/{transaction_id}",  # Verify actual endpoint
            headers={**get_auth_header(), "Content-Type": "application/json"},
            json=request.json
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/transactions/<transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    try:
        response = requests.delete(
            f"{BASE_URL}/transactions/{transaction_id}",  # Verify actual endpoint
            headers=get_auth_header()
        )
        return jsonify({"message": "Transaction deleted"}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions/chat', methods=['POST'])
def transaction_chat():
    session_id = request.json.get('session_id')
    message = request.json.get('message')
    
    if not session_id or not message:
        return jsonify({"status": "error", "message": "Missing session_id or message"}), 400

    try:
        # Get or create assistant session
        if session_id not in finance_chat_sessions:
            finance_chat_sessions[session_id] = {
                'assistant': BankingDataAssistant(debug=True),
                'history': []
            }
            
        assistant = finance_chat_sessions[session_id]['assistant']
        response = assistant.chat(message)
        
        # Store interaction history
        finance_chat_sessions[session_id]['history'].append({
            'query': message,
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            "status": "success",
            "message": response,
            "session_id": session_id
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Chat error: {str(e)}"
        }), 500

@app.route('/api/transactions/data', methods=['POST'])
@cross_origin()
def get_transaction_data():
    session_id = request.json.get('session_id')
    
    if not session_id:
        return jsonify({"status": "error", "message": "Missing session_id"}), 400

    try:
        # Initialize session if not exists
        if session_id not in finance_chat_sessions:
            print(f"Creating new transaction session: {session_id}")
            finance_chat_sessions[session_id] = {
                'assistant': BankingDataAssistant(),
                'history': []
            }
            
        assistant = finance_chat_sessions[session_id]['assistant']
        
        # Ensure data is fetched
        if not assistant.transaction_data or not assistant.account_data:
            print(f"Fetching data for session: {session_id}")
            assistant.fetch_all_data()
        
        # Create fallback data if fetch failed
        if not assistant.transaction_data:
            assistant.transaction_data = []
        if not assistant.account_data:
            assistant.account_data = {"data": [{"mainBalance": 0, "currency": "INR"}]}
            
        analysis = assistant.analyze_transactions()
        
        return jsonify({
            "status": "success",
            "data": {
                "transactions": assistant.transaction_data,
                "account": assistant.account_data,
                "analysis": analysis
            }
        })
        
    except Exception as e:
        print(f"Data retrieval error: {str(e)}")
        # Return minimal data structure to prevent frontend errors
        return jsonify({
            "status": "success",
            "data": {
                "transactions": [],
                "account": {"data": [{"mainBalance": 0, "currency": "INR"}]},
                "analysis": {
                    "total_transactions": 0,
                    "total_credits": 0,
                    "total_debits": 0,
                    "average_transaction": 0
                }
            }
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
    