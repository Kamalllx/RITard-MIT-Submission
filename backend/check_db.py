from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection string
mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("MONGODB_DB", "finwise")

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
    
    # Get sample users
    users = list(users_collection.find().limit(3))
    if users:
        print("\nSample users:")
        for user in users:
            print(f"- ID: {user.get('_id')}")
            print(f"  clerk_user_id: {user.get('clerk_user_id')}")
            print(f"  id: {user.get('id')}")
            print(f"  email: {user.get('email', 'N/A')}")
            print(f"  first_name: {user.get('first_name', 'N/A')}")
            print(f"  last_name: {user.get('last_name', 'N/A')}")
            print("---")
    else:
        print("No users found in the database")
        
except Exception as e:
    print(f"Error: {e}")
