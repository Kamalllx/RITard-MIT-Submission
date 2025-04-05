from pymongo import MongoClient
import os
from dotenv import load_dotenv
import base64
from cryptography.fernet import Fernet

# Load environment variables
load_dotenv()

# MongoDB connection string
mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("MONGODB_DB", "finwise")

# Get encryption key
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    print("Error: ENCRYPTION_KEY not found in .env file")
    exit(1)

# Initialize Fernet cipher
try:
    if isinstance(ENCRYPTION_KEY, str):
        cipher_suite = Fernet(ENCRYPTION_KEY.encode())
    else:
        cipher_suite = Fernet(ENCRYPTION_KEY)
except Exception as e:
    print(f"Error initializing encryption: {e}")
    exit(1)

# Functions for encrypting and decrypting user data
def encrypt_data(data):
    """
    Encrypt sensitive user data using Fernet symmetric encryption.
    Returns None if data is None.
    """
    if data is None:
        return "NULL_VALUE_PLACEHOLDER"
    
    try:
        # Convert data to string if it's not already
        if not isinstance(data, str):
            data = str(data)
        
        # Encrypt the data
        encrypted_data = cipher_suite.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    except Exception as e:
        print(f"Encryption error: {e}")
        # Return a hash instead as fallback
        return None

print(f"Connecting to MongoDB: {mongo_uri}")
print(f"Database: {db_name}")

try:
    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    db = client[db_name]
    users_collection = db["users"]
    
    # Count users
    user_count = users_collection.count_documents({})
    print(f"Found {user_count} users in the database")
    
    # Get all users
    users = list(users_collection.find())
    updated_count = 0
    
    for user in users:
        update_fields = {}
        
        # Check and encrypt first_name
        if 'first_name' in user and user['first_name'] is not None:
            update_fields['first_name'] = encrypt_data(user['first_name'])
            
        # Check and encrypt last_name
        if 'last_name' in user and user['last_name'] is not None:
            update_fields['last_name'] = encrypt_data(user['last_name'])
            
        # Check and encrypt email
        if 'email' in user and user['email'] is not None:
            update_fields['email'] = encrypt_data(user['email'])
            
        # Check and encrypt email_addresses
        if 'email_addresses' in user and isinstance(user['email_addresses'], list):
            for i, email_obj in enumerate(user['email_addresses']):
                if isinstance(email_obj, dict) and 'email_address' in email_obj:
                    email_address = email_obj['email_address']
                    if email_address:
                        encrypted_email = encrypt_data(email_address)
                        # Update the email_addresses array using MongoDB's positional operator
                        users_collection.update_one(
                            {"_id": user["_id"], "email_addresses.email_address": email_address},
                            {"$set": {"email_addresses.$.email_address": encrypted_email}}
                        )
        
        # Update user document if there are fields to update
        if update_fields:
            result = users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": update_fields}
            )
            
            if result.modified_count > 0:
                updated_count += 1
                print(f"Updated user: {user.get('id', user.get('clerk_user_id', str(user['_id'])))} - Fields: {', '.join(update_fields.keys())}")
    
    print(f"\nEncryption complete! Updated {updated_count} out of {user_count} users.")
    
except Exception as e:
    print(f"Error: {e}")
