import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

# Load .env
env_path = os.path.join("backend_py", ".env")
load_dotenv(dotenv_path=env_path)

mongo_uri = os.getenv("MONGO_URI", "").strip() or "mongodb://localhost:27017/ecotrack"

print(f"DEBUG: Attempting to connect to: {mongo_uri}")

try:
    # 1. Connect
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
    db = client.get_database("ecotrack")
    client.server_info()
    print("SUCCESS: Connected to MongoDB Atlas server!")

    # 2. Test Write/Update (Heartbeat)
    print("DEBUG: Performing write test (Health Check)...")
    health_col = db["health_checks"]
    res = health_col.update_one(
        {"app_name": "EcoTrack_AI"},
        {"$set": {"last_check": str(datetime.now()), "status": "active"}},
        upsert=True
    )
    print(f"SUCCESS: Write/Update operation completed! (Matched: {res.matched_count}, Upserted: {res.upserted_id})")

    # 3. Test Read
    check = health_col.find_one({"app_name": "EcoTrack_AI"})
    if check:
        print(f"SUCCESS: Read operation verified! Last report: {check['last_check']}")
    else:
        print("FAILURE: Read operation returned nothing.")

except Exception as e:
    print(f"FAILURE: Database operation failed. Error: {e}")
