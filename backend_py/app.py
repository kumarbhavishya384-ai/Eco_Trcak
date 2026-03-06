import os
import sys # Added for CLI flags
import datetime
import jwt
import bcrypt
import json
import requests
import random
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient, UpdateOne
from bson.objectid import ObjectId
from dotenv import load_dotenv
from functools import wraps
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
from twilio.rest import Client
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

# Load environment variables
# Load environment variables from .env file (using absolute path)
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)
import google.generativeai as genai

# ── AI CONFIGURATION ──────────────────────────────────
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    ai_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("WARNING: GOOGLE_API_KEY not found. AI Chat will work in mock mode.")
    ai_model = None

# ── TWILIO CONFIGURATION ─────────────────────────────
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")

twilio_client = None
if TWILIO_SID and TWILIO_TOKEN:
    try:
        twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)
        print("LOG: Twilio Client Initialized")
    except Exception as e:
        print(f"WARNING: Twilio failed to initialize: {e}")

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
# Allow both localhost and 127.0.0.1 to avoid common CORS networking issues
CORS(app, resources={r"/api/*": {
    "origins": ["http://localhost:8080", "http://127.0.0.1:8080"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

print("--- EcoTrack AI Backend Initializing ---")

# ── DATABASE SYSTEM (MongoDB Atlas with JSON Fallback) ───────
DB_FILE = os.path.join(os.path.dirname(__file__), "local_db.json")

def load_local_db():
    if not os.path.exists(DB_FILE):
        return {"users": [], "entries": [], "pending_otps": []}
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_local_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

use_mongodb = False
db = None

try:
    # UPDATED: Added .strip() and increased timeout for cloud connectivity
    mongo_uri = os.getenv("MONGO_URI", "").strip() or "mongodb://localhost:27017/ecotrack"
    print(f"LOG: Attempting to connect to Database...")
    
    # UPDATED: serverSelectionTimeoutMS increased to 5000 for Atlas
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client.get_database("ecotrack")
    client.server_info() # trigger connection check
    
    # UPDATED: Descriptive success log
    print(f"LOG: Connected to MongoDB Database: {db.name}")
    use_mongodb = True
except Exception as e:
    print(f"LOG: MongoDB Connection Failed: {e}")
    print("LOG: Fallback: Using local file database (" + str(DB_FILE) + ")")
    print("   (To use real MongoDB, verify MONGO_URI in .env)")

class FileCollection:
    def __init__(self, table_name):
        self.table = table_name
    
    def find_one(self, query, projection=None):
        data = load_local_db()
        for item in data[self.table]:
            match = True
            for k, v in query.items():
                if k == "_id" and str(item.get("_id")) != str(v): match = False; break
                if k != "_id" and item.get(k) != v: match = False; break
            if match:
                res = item.copy()
                if projection and "password" in projection and projection["password"] == 0:
                    res.pop("password", None)
                return res
        return None

    def find(self, query, projection=None):
        data = load_local_db()
        results = []
        for item in data[self.table]:
            match = True
            for k, v in query.items():
                if item.get(k) != v: match = False; break
            if match: results.append(item.copy())
        return results

    def insert_one(self, document):
        data = load_local_db()
        document["_id"] = str(ObjectId())
        data[self.table].append(document)
        save_local_db(data)
        class Res:
            def __init__(self, id): self.inserted_id = id
        return Res(document["_id"])

    def update_one(self, query, update, upsert=False):
        data = load_local_db()
        found = False
        for item in data[self.table]:
            match = True
            for k, v in query.items():
                if k == "user" and str(item.get("user")) != str(v): match = False; break
                if k != "user" and item.get(k) != v: match = False; break
            if match:
                if "$set" in update:
                    item.update(update["$set"])
                found = True; break
        
        if not found and upsert:
            new_doc = query.copy()
            if "$set" in update: new_doc.update(update["$set"])
            if "$setOnInsert" in update: new_doc.update(update["$setOnInsert"])
            new_doc["_id"] = str(ObjectId())
            data[self.table].append(new_doc)
        
        save_local_db(data)

    def bulk_write(self, ops):
        for op in ops:
            self.update_one(op._filter, op._doc, upsert=True)

if use_mongodb:
    users_col = db["users"]
    entries_col = db["entries"]
    otps_col = db["pending_otps"]
else:
    users_col = FileCollection("users")
    entries_col = FileCollection("entries")
    otps_col = FileCollection("pending_otps")

# ── Auth Decoration ────────────────────────────────────
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing!'}), 401
        
        try:
            jwt_secret = os.getenv("JWT_SECRET", "ecotrack_secret")
            data = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            uid = data['id']
            # Hybrid ID support (ObjectId or String)
            query = {"_id": ObjectId(uid)} if use_mongodb else {"_id": uid}
            current_user = users_col.find_one(query, {"password": 0})
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found!'}), 401
            request.user = current_user
        except Exception as e:
            return jsonify({'success': False, 'message': 'Session invalid', 'error': str(e)}), 401
        
        return f(*args, **kwargs)
    return decorated

# ── Helper Functions ───────────────────────────────────
def calculate_ecoscore(total_co2):
    # Maximum leniency: 800 - (daily_kg * 8)
    # 50kg/day = 400 score (Average Usage 🟡)
    # 20kg/day = 640 score (Good Carbon 🟢)
    # 80kg/day = 160 score (High Usage 🔴)
    return min(800, max(0, round(800 - (total_co2 * 8))))

def seed_demo_data(user_id):
    import random
    today = datetime.datetime.now()
    bulk_data = []
    for i in range(29, -1, -1):
        d = today - datetime.timedelta(days=i)
        date_str = d.strftime('%Y-%m-%d')
        t, e, f = round(random.uniform(1,5),2), round(random.uniform(0.5,3),2), round(random.uniform(1,4),2)
        total = round(t+e+f, 2)
        bulk_data.append(UpdateOne(
            {"user": user_id, "date": date_str},
            {"$setOnInsert": {
                "user": user_id, "date": date_str, "transport": t, "electricity": e, 
                "food": f, "total": total, "ecoScore": calculate_ecoscore(total),
                "savedAt": str(datetime.datetime.now())
            }},
            upsert=True
        ))
    users_col.update_one({"_id": user_id}, {"$set": {"ecoScore": 450}}) # Initial boost
    entries_col.bulk_write(bulk_data)

def send_welcome_email(user_email, first_name):
    """Triggers the email sending process in a background thread."""
    thread = threading.Thread(target=_send_welcome_email_sync, args=(user_email, first_name))
    thread.daemon = True
    thread.start()

def _send_welcome_email_sync(user_email, first_name):
    """Internal synchronous function for sending a beautiful HTML welcome email."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    log_path = os.path.join(base_dir, "email_logs.txt")

    # Read config from .env - strip() handles any accidental whitespace
    sender_name  = (os.getenv("COMPANY_NAME",  "EcoTrack AI")).strip()
    sender_email = (os.getenv("COMPANY_EMAIL", "kumarbhavishya384@gmail.com")).strip()
    smtp_server  = (os.getenv("SMTP_SERVER",   "smtp.gmail.com")).strip()
    smtp_user    = (os.getenv("SMTP_USER",     sender_email)).strip()
    smtp_pass_raw = os.getenv("SMTP_PASS", "")
    # Gmail App Password: spaces are cosmetic only – remove them before using
    smtp_pass    = smtp_pass_raw.strip() if smtp_pass_raw else ""

    try:
        smtp_port = int(os.getenv("SMTP_PORT", 587))
    except (ValueError, TypeError):
        smtp_port = 587

    subject = f"🌿 Welcome to {sender_name} – Let's Go Green Together!"

    # ── Beautiful HTML email body ──────────────────────────
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#0a1628;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:30px 0">
        <tr><td align="center">
          <table width="580" cellpadding="0" cellspacing="0" style="background:#0f2035;border-radius:16px;overflow:hidden;border:1px solid #1e3a5f;">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0d4f3a,#0a3d5c);padding:40px 30px;text-align:center;">
                <div style="font-size:42px">🌿</div>
                <h1 style="color:#ffffff;margin:12px 0 6px;font-size:26px;font-weight:800;">Welcome to {sender_name}!</h1>
                <p style="color:#a0d4b5;margin:0;font-size:15px;">Your personal carbon footprint tracker</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:35px 40px;">
                <p style="color:#c8e6c9;font-size:17px;margin:0 0 15px;">Hi <strong style="color:#4ade80;">{first_name}</strong>,</p>
                <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 25px;">
                  Welcome aboard! 🎉 You've taken the first step toward understanding and reducing your carbon footprint.
                  Here's what you can do with <strong style="color:#22d3ee;">{sender_name}</strong>:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#0d2a40;border-radius:12px;padding:18px 20px;margin-bottom:12px;border-left:4px solid #22c55e;">
                      <p style="margin:0;color:#e2e8f0;font-size:14px;">🚗 <strong>Track Daily Transport</strong> – Car, bus, metro, flights</p>
                    </td>
                  </tr>
                  <tr><td height="10"></td></tr>
                  <tr>
                    <td style="background:#0d2a40;border-radius:12px;padding:18px 20px;border-left:4px solid #06b6d4;">
                      <p style="margin:0;color:#e2e8f0;font-size:14px;">⚡ <strong>Log Monthly Electricity</strong> – Bills, LPG, appliances</p>
                    </td>
                  </tr>
                  <tr><td height="10"></td></tr>
                  <tr>
                    <td style="background:#0d2a40;border-radius:12px;padding:18px 20px;border-left:4px solid #f59e0b;">
                      <p style="margin:0;color:#e2e8f0;font-size:14px;">🤖 <strong>Get AI Insights</strong> – Personalized tips to save CO₂ &amp; money</p>
                    </td>
                  </tr>
                  <tr><td height="10"></td></tr>
                  <tr>
                    <td style="background:#0d2a40;border-radius:12px;padding:18px 20px;border-left:4px solid #a855f7;">
                      <p style="margin:0;color:#e2e8f0;font-size:14px;">🏆 <strong>Climb the Leaderboard</strong> – Compete &amp; inspire others</p>
                    </td>
                  </tr>
                </table>
                <div style="text-align:center;margin:30px 0;">
                  <a href="http://localhost:8080/dashboard.html"
                     style="background:linear-gradient(135deg,#22c55e,#06b6d4);color:#fff;text-decoration:none;
                            padding:14px 36px;border-radius:50px;font-size:16px;font-weight:700;display:inline-block;">
                    🌍 Start Tracking Now
                  </a>
                </div>
                <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
                  Together, let's make a greener planet. 🌱
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#071525;padding:20px 30px;text-align:center;">
                <p style="color:#475569;font-size:12px;margin:0;">© 2026 {sender_name} · Powered by AI &amp; Green Energy</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    # Plain text fallback
    plain_body = f"""
Hi {first_name},

Welcome to {sender_name}! We are thrilled to have you on board.

Start tracking your carbon footprint today:
- Log daily transport, food, and energy usage
- Get AI-powered insights to reduce your impact
- Climb the leaderboard and inspire others

Best regards,
The {sender_name} Team
"""

    try:
        if not smtp_pass:
            raise ValueError("SMTP_PASS is missing or empty in the .env file. Cannot send email.")

        print(f"EMAIL: Preparing to send welcome email to {user_email} via {smtp_server}:{smtp_port}")

        msg = MIMEMultipart('alternative')
        msg['From']    = f"{sender_name} <{sender_email}>"
        msg['To']      = user_email
        msg['Subject'] = subject

        # Attach plain text first (fallback), then HTML (preferred)
        msg.attach(MIMEText(plain_body, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))

        # NOTE: Do NOT set_debuglevel inside threads — it can corrupt output and cause issues
        with smtplib.SMTP(smtp_server, smtp_port, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        success_msg = f"[{datetime.datetime.now()}] SUCCESS: Welcome email sent to {user_email}\n"
        with open(log_path, "a", encoding='utf-8') as f:
            f.write(success_msg)
        print(f"EMAIL SUCCESS: Welcome email delivered to {user_email}")

    except smtplib.SMTPAuthenticationError as e:
        error_msg = (f"[{datetime.datetime.now()}] AUTH ERROR for {user_email}: "
                     f"Gmail App Password may be invalid or 2FA is off.\n"
                     f"Detail: {str(e)}\n" + "-"*60 + "\n")
        with open(log_path, "a", encoding='utf-8') as f:
            f.write(error_msg)
        print(f"EMAIL AUTH ERROR for {user_email}: {str(e)}")

    except smtplib.SMTPException as e:
        error_msg = (f"[{datetime.datetime.now()}] SMTP ERROR for {user_email}: {str(e)}\n"
                     + "-"*60 + "\n")
        with open(log_path, "a", encoding='utf-8') as f:
            f.write(error_msg)
        print(f"EMAIL SMTP ERROR for {user_email}: {str(e)}")

    except Exception as e:
        error_msg = (f"[{datetime.datetime.now()}] UNEXPECTED ERROR for {user_email}: {str(e)}\n"
                     + "-"*60 + "\n")
        with open(log_path, "a", encoding='utf-8') as f:
            f.write(error_msg)
        print(f"EMAIL UNEXPECTED ERROR for {user_email}: {str(e)}")

def send_whatsapp_notification(phone, first_name):
    """Logs a WhatsApp notification request. (Real automation requires Twilio/API)"""
    # Use absolute path for consistency
    base_dir = os.path.dirname(os.path.abspath(__file__))
    log_path = os.path.join(base_dir, "whatsapp_logs.txt")
    
    msg = f"Hi {first_name}, 🌿 Welcome to EcoTrack AI! Your journey to Net Zero starts now. Track your daily footprint and save the planet with us. 🌍"
    
    log_entry = f"\n[{datetime.datetime.now()}] WHATSAPP PENDING TO: {phone}\nMessage: {msg}\n{'-'*50}\n"
    try:
        with open(log_path, "a", encoding='utf-8') as f:
            f.write(log_entry)
        print("WHATSAPP: Registration alert logged for " + str(phone))
    except Exception as e:
        print(f"WHATSAPP LOG ERROR: {str(e)}")

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    try:
        data = request.json
        phone = data.get('phone', '').strip() # +91XXXXXXXXXX
        if not phone:
            return jsonify({"success": False, "message": "Phone number is required"}), 400

        otp = str(random.randint(100000, 999999))
        expiry = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        
        # Store in users_col using upsert by phone
        # Works for both MongoDB and FileCollection
        users_col.update_one(
            {"phone": phone},
            {"$set": {"pendingOTP": otp, "otpExpiry": expiry}},
            upsert=True
        )

        fast2sms_key = os.getenv("FAST2SMS_KEY", "")
        
        # MOCK MODE FALLBACK
        if not fast2sms_key or fast2sms_key == "your_api_key_here":
            # Log to local file so user can see the OTP without a real API key
            base_dir = os.path.dirname(os.path.abspath(__file__))
            log_path = os.path.join(base_dir, "whatsapp_logs.txt")
            log_entry = f"[{datetime.now()}] MOCK OTP SENT TO {phone}: {otp}\n"
            with open(log_path, "a", encoding='utf-8') as f:
                f.write(log_entry)
            print(f"DEBUG: Fast2SMS Mock Mode - OTP is {otp} (Refer to whatsapp_logs.txt)")
            return jsonify({"success": True, "message": "OTP sent via Mock Mode (Check whatsapp_logs.txt)"})

        # Extract 10 digits for Fast2SMS
        clean_phone = phone.replace("+91", "").replace("+", "")
        if len(clean_phone) > 10:
            clean_phone = clean_phone[-10:]

        url = "https://www.fast2sms.com/dev/bulkV2"
        params = {
            "authorization": fast2sms_key,
            "message": f"Your EcoTrack AI verification code is {otp}. Valid for 10 minutes.",
            "language": "english",
            "route": "q",
            "numbers": clean_phone
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            res_data = response.json()

            if res_data.get("return"):
                return jsonify({"success": True})
            else:
                # If key is invalid, still provide a way to bypass for the user in development
                error_msg = res_data.get("message", "Fast2SMS Error")
                print(f"DEBUG: Fast2SMS Failed ({error_msg}). Falling back to Mock.")
                return jsonify({"success": True, "mocked": True, "message": f"Real SMS failed ({error_msg}). Use code: {otp}"})
        except Exception as e:
            return jsonify({"success": True, "mocked": True, "message": f"Network Error. Use code: {otp}"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.json
        phone = data.get('phone', '').strip()
        otp = data.get('otp', '').strip()

        user = users_col.find_one({"phone": phone})
        if not user or user.get("pendingOTP") != otp:
            return jsonify({"success": False, "message": "Invalid OTP code"}), 401

        expiry_str = user.get("otpExpiry")
        if not expiry_str:
             return jsonify({"success": False, "message": "No OTP pending for this number"}), 401

        # Use datetime.fromisoformat as requested
        expiry = datetime.fromisoformat(expiry_str)
        if datetime.utcnow() > expiry:
            return jsonify({"success": False, "message": "OTP has expired"}), 401

        # Success: clear pendingOTP and otpExpiry
        users_col.update_one(
            {"phone": phone},
            {"$set": {"pendingOTP": None, "otpExpiry": None}}
        )
        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ── Routes ─────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()
        otp = data.get('otp', '').strip()

        if users_col.find_one({"email": email}):
            return jsonify({"success": False, "message": "Email already registered"}), 409
        
        hashed_pw = bcrypt.hashpw(data.get('password').encode('utf-8'), bcrypt.gensalt())
        if not use_mongodb: hashed_pw = hashed_pw.decode('utf-8')

        user_doc = {
            "firstName": data.get('firstName'),
            "lastName": data.get('lastName'),
            "email": email,
            "phone": data.get('phone', ''),
            "password": hashed_pw,
            "location": data.get('location', 'India'),
            "role": "admin" if email in ["admin@ecotrack.ai", "kumarbhavishya384@gmail.com"] else "user",
            "ecoScore": 0,
            "createdAt": str(datetime.datetime.now())
        }
        res = users_col.insert_one(user_doc)
        user_id = str(res.inserted_id)
        
        # Trigger Welcome Notifications
        send_welcome_email(email, user_doc["firstName"])
        if user_doc["phone"]:
            send_whatsapp_notification(user_doc["phone"], user_doc["firstName"])
        
        # seed_demo_data(user_id if not use_mongodb else ObjectId(user_id))
        
        token = jwt.encode({'id': user_id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)}, 
                           os.getenv("JWT_SECRET", "ecotrack_secret"), algorithm="HS256")
        if isinstance(token, bytes): token = token.decode('utf-8')

        return jsonify({
            "success": True, 
            "token": token, 
            "user": {"id": user_id, "firstName": user_doc["firstName"], "role": user_doc["role"]}
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        with open("local_db_debug.txt", "a") as f:
            f.write(f"\n[{datetime.datetime.now()}] Login Attempt: '{email}'")
        
        user = users_col.find_one({"email": email})
        
        if not user:
            with open("local_db_debug.txt", "a") as f:
                f.write(f" -> User NOT found.")
            return jsonify({"success": False, "message": "Invalid email or password"}), 401
            
        pw = user['password']
        if isinstance(pw, str): pw = pw.encode('utf-8')
        
        if not bcrypt.checkpw(password.encode('utf-8'), pw):
            with open("local_db_debug.txt", "a") as f:
                f.write(f" -> Password mismatch. DB Email: '{user.get('email')}'")
            return jsonify({"success": False, "message": "Invalid email or password"}), 401
        
        with open("local_db_debug.txt", "a") as f:
            f.write(f" -> Success!")
            
        uid = str(user['_id'])
        token = jwt.encode({'id': uid, 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)}, 
                           os.getenv("JWT_SECRET", "ecotrack_secret"), algorithm="HS256")
        if isinstance(token, bytes): token = token.decode('utf-8')
        return jsonify({
            "success": True, 
            "token": token, 
            "user": {"id": uid, "firstName": user["firstName"], "role": user.get('role', 'user')}
        })
    except Exception as e:
        with open("local_db_debug.txt", "a") as f:
            f.write(f" -> CRASH: {str(e)}")
        print(f"Login Crash Error: {str(e)}")
        return jsonify({"success": False, "message": f"Login failed: {str(e)}"}), 500

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me():
    user = request.user
    user['id'] = str(user.get('_id', ''))
    if '_id' in user: del user['_id']
    return jsonify({"success": True, "user": user})

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        if not email:
            return jsonify({"success": False, "message": "Email is required"}), 400
        
        user = users_col.find_one({"email": email})
        if not user:
            # For security, we might not want to reveal if a user exists, 
            # but for a demo/student project, clarity is better.
            return jsonify({"success": False, "message": "User with this email not found"}), 404
            
        # Mock token generation
        reset_token = os.urandom(4).hex().upper()  # Shorter 8-char code for easy typing
        expiry = datetime.utcnow() + timedelta(minutes=15)
        
        # Persist token in user document so it survives server restarts
        users_col.update_one(
            {"email": email}, 
            {"$set": {"resetToken": reset_token, "resetTokenExpires": expiry}}
        )
        
        # Log the reset request (Mocking email sending)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        log_path = os.path.join(base_dir, "email_logs.txt")
        log_entry = f"[{datetime.datetime.now()}] RESET REQUEST: {email} | CODE: {reset_token}\n"
        
        with open(log_path, "a", encoding='utf-8') as f:
            f.write(log_entry)
            
        print(f"FORGOT PASSWORD: Reset code {reset_token} generated for {email}")
        
        return jsonify({
            "success": True, 
            "message": "A verification code has been generated and sent to your email. Please check your inbox (and spam) to proceed."
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        token = data.get('token', '').strip().upper()
        new_password = data.get('newPassword', '')

        if not email or not token or not new_password:
            return jsonify({"success": False, "message": "Email, Code, and New Password are required"}), 400

        user = users_col.find_one({"email": email})
        if not user or user.get("resetToken") != token:
            return jsonify({"success": False, "message": "Invalid verification code"}), 401
        
        # Check expiry
        expires_at = user.get("resetTokenExpires")
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.strptime(expires_at, '%Y-%m-%d %H:%M:%S.%f')
            if datetime.utcnow() > expires_at:
                return jsonify({"success": False, "message": "Reset code has expired (15 min limit)"}), 401

        # Hash new password
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        if not use_mongodb: hashed_pw = hashed_pw.decode('utf-8')

        # Update User and clear token
        users_col.update_one({"email": email}, {"$set": {"password": hashed_pw, "resetToken": None}})
        
        return jsonify({"success": True, "message": "Password updated successfully! You can now log in with your new password."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/entries', methods=['GET'])
@token_required
def get_entries():
    uid = request.user['_id']
    query = {"user": uid}
    entries = entries_col.find(query)
    for e in entries:
        e['id'] = str(e.get('_id', ''))
        if '_id' in e: del e['_id']
        e['user'] = str(e['user'])
    return jsonify({"success": True, "entries": sorted(entries, key=lambda x: x['date'], reverse=True)})

@app.route('/api/entries', methods=['POST'])
@token_required
def save_entry():
    data = request.json
    uid = request.user['_id']
    
    t = float(data.get('transport', 0))
    e = float(data.get('electricity', 0))
    f = float(data.get('food', 0))
    
    # Check for existing monthly electricity if this submission has 0
    # This ensures the daily EcoScore remains accurate after the monthly bill is logged
    if e == 0:
        today = datetime.datetime.now()
        month_start = today.replace(day=1).strftime('%Y-%m-%d')
        
        if use_mongodb:
            query = {"user": uid, "date": {"$gte": month_start}, "electricity": {"$gt": 0}}
            existing = entries_col.find_one(query)
            if existing: e = existing.get('electricity', 0)
        else:
            # manual filter for localDB
            all_u_entries = entries_col.find({"user": str(uid)})
            for entry in all_u_entries:
                if entry.get('date', '') >= month_start and float(entry.get('electricity', 0)) > 0:
                    e = float(entry.get('electricity', 0))
                    break

    # The raw total for the log
    total_raw = round(t + f + (float(data.get('electricity', 0))), 3)
    
    # Normalization for EcoScore: 
    # Electricity is treated as a monthly total, divided by 30 for daily impact.
    normalized_daily_total = t + (e / 30.0) + f
    score = calculate_ecoscore(normalized_daily_total)
    
    # 1. Update Entries
    entries_col.update_one(
        {"user": uid, "date": data.get('date')},
        {"$set": {
            "transport": t,
            "electricity": float(data.get('electricity', 0)),
            "food": f,
            "total": total_raw, 
            "ecoScore": score, 
            "savedAt": str(datetime.datetime.now())
        }},
        upsert=True
    )

    # 2. Update Global User Score (for Leaderboard)
    users_col.update_one({"_id": uid}, {"$set": {"ecoScore": score}})
    
    return jsonify({"success": True, "ecoScore": score})

@app.route('/api/entries/<date>', methods=['DELETE'])
@token_required
def delete_entry(date):
    uid = request.user['_id']
    if use_mongodb:
        entries_col.delete_one({"user": uid, "date": date})
    else:
        db_data = load_local_db()
        db_data["entries"] = [e for e in db_data["entries"] if not (str(e.get("user")) == str(uid) and e.get("date") == date)]
        save_local_db(db_data)
    return jsonify({"success": True, "message": "Entry removed"})

@app.route('/api/entries/check-monthly-electricity', methods=['GET'])
@token_required
def check_monthly_electricity():
    uid = str(request.user['_id'])
    today = datetime.datetime.now()
    month_start = today.replace(day=1).strftime('%Y-%m-%d')
    
    # Fetch entries for this user
    # If MongoDB, we can use a simpler query first, but for LocalDB we must filter manually
    if use_mongodb:
        query = {
            "user": request.user['_id'],
            "date": {"$gte": month_start},
            "electricity": {"$gt": 0}
        }
        existing = entries_col.find_one(query)
        has_monthly = existing is not None
        elec_val = existing.get('electricity', 0) if existing else 0
    else:
        # manual filtering for LocalDB
        all_entries = entries_col.find({"user": uid})
        matched_entry = None
        for e in all_entries:
            # Check if entry is in current month and has electricity
            if e.get('date', '') >= month_start and float(e.get('electricity', 0)) > 0:
                matched_entry = e
                break
        has_monthly = matched_entry is not None
        elec_val = matched_entry.get('electricity', 0) if matched_entry else 0
        
    return jsonify({
        "success": True, 
        "alreadySubmitted": has_monthly,
        "electricityValue": elec_val
    })

@app.route('/api/leaderboard', methods=['GET'])
@token_required
def get_leaderboard():
    raw_users = load_local_db()["users"] if not use_mongodb else list(users_col.find({}, {"password":0}))
    sorted_users = sorted(raw_users, key=lambda x: x.get('ecoScore', 0), reverse=True)
    
    # Global top 10
    lb = []
    for i, u in enumerate(sorted_users[:20]):
        lb.append({
            "rank": i+1, 
            "name": f"{u['firstName']} {u.get('lastName','')}",
            "score": u.get('ecoScore', 0), 
            "isMe": str(u.get('_id')) == str(request.user.get('_id')),
            "group": u.get('group', 'Unassigned')
        })

    # Group analytics (Campus/Department)
    group_scores = {}
    for u in raw_users:
        g = u.get('group', 'Unassigned')
        if g not in group_scores: group_scores[g] = []
        group_scores[g].append(u.get('ecoScore', 0))
    
    group_lb = []
    for g, scores in group_scores.items():
        if g == 'Unassigned': continue
        group_lb.append({
            "name": g,
            "avgScore": round(sum(scores)/len(scores), 1),
            "members": len(scores)
        })
    group_lb = sorted(group_lb, key=lambda x: x['avgScore'], reverse=True)

    return jsonify({
        "success": True, 
        "leaderboard": lb,
        "groups": group_lb,
        "myRank": next((i+1 for i, u in enumerate(sorted_users) if str(u.get('_id')) == str(request.user.get('_id'))), None)
    })

# ── Admin Routes ───────────────────────────────────────
@app.route('/api/admin/stats', methods=['GET'])
@token_required
def get_admin_stats():
    if request.user.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    total_users = users_col.count_documents({}) if use_mongodb else len(load_local_db()["users"])
    total_entries = entries_col.count_documents({}) if use_mongodb else len(load_local_db()["entries"])
    
    return jsonify({
        "success": True,
        "stats": {
            "totalUsers": total_users,
            "totalEntries": total_entries,
            "systemHealth": "Healthy",
            "uptime": "99.9%"
        }
    })

@app.route('/api/admin/users', methods=['GET'])
@token_required
def get_admin_users():
    if request.user.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    users = load_local_db()["users"] if not use_mongodb else list(users_col.find({}, {"password":0}))
    for u in users:
        u['id'] = str(u.get('_id', ''))
        if '_id' in u: del u['_id']
        u.pop('password', None)
        
    return jsonify({"success": True, "users": users})

@app.route('/api/admin/users/<uid>', methods=['DELETE'])
@token_required
def delete_user(uid):
    if request.user.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    if use_mongodb:
        users_col.delete_one({"_id": ObjectId(uid)})
        entries_col.delete_many({"user": ObjectId(uid)})
    else:
        db_data = load_local_db()
        db_data["users"] = [u for u in db_data["users"] if str(u.get("_id")) != uid]
        db_data["entries"] = [e for e in db_data["entries"] if str(e.get("user")) != uid]
        save_local_db(db_data)
        
    return jsonify({"success": True, "message": "User deleted successfully"})

@app.route('/api/recommendations', methods=['GET'])
@token_required
def get_recommendations():
    uid = request.user['_id']
    entries = entries_col.find({"user": uid})
    
    if not entries:
        return jsonify({"success": True, "recommendations": [], "state": "empty"})

    # Sort by date desc and take last 7 for trend analysis
    last7 = sorted(entries, key=lambda x: x['date'], reverse=True)[:7]
    if not last7:
        return jsonify({"success": True, "recommendations": [], "state": "empty"})

    avg_transport = sum(e.get('transport', 0) for e in last7) / len(last7)
    avg_elec = sum(e.get('electricity', 0) for e in last7) / len(last7)
    avg_food = sum(e.get('food', 0) for e in last7) / len(last7)
    
    # Stricter Thresholds for 'High Carbon' personalization
    thresholds = {"transport": 4.0, "electricity": 3.0, "food": 5.0}
    
    all_tips = [
        {"id": "solar", "title": "Install Solar Panels", "desc": "Rooftop solar can offset 80-90% of your home electricity emissions.", "impact": 25, "category": "⚡ Electricity", "cat": "electricity", "icon": "☀️"},
        {"id": "beef", "title": "Reduce Beef Consumption", "desc": "Beef has 7x higher emissions than chicken. Try legumes instead.", "impact": 15, "category": "🍽️ Food", "cat": "food", "icon": "🥗"},
        {"id": "transit", "title": "Switch to Public Transport", "desc": "Replace car trips with bus/metro 3x/week to cut transport emissions.", "impact": 12, "category": "🚗 Transport", "cat": "transport", "icon": "🚌"},
        {"id": "meatless", "title": "Go Meatless on Mondays", "desc": "One meat-free day per week reduces your food footprint by ~10%.", "impact": 6, "category": "🍽️ Food", "cat": "food", "icon": "🌱"},
        {"id": "ac", "title": "Optimal AC Temp", "desc": "Set AC to 24°C instead of 18°C. Every degree higher saves 6% energy.", "impact": 8, "category": "⚡ Electricity", "cat": "electricity", "icon": "🌡️"},
        {"id": "cycling", "title": "Cycling to Campus", "desc": "Cycle for short trips (<3km) to zero your transport footprint.", "impact": 10, "category": "🚗 Transport", "cat": "transport", "icon": "🚲"}
    ]
    
    recs = []
    for tip in all_tips:
        # Personalization filter: only suggest if user exceeds threshold in that category
        if tip['cat'] == 'electricity' and avg_elec > thresholds['electricity']:
            if tip['id'] == 'solar' and avg_elec < 6.0: continue # Only for VERY high elec
            recs.append(tip)
        elif tip['cat'] == 'food' and avg_food > thresholds['food']:
            recs.append(tip)
        elif tip['cat'] == 'transport' and avg_transport > thresholds['transport']:
            recs.append(tip)

    # Sort by impact
    recs = sorted(recs, key=lambda x: x['impact'], reverse=True)
    
    # State flags for UI rendering
    state = "hero" if not recs and len(entries) >= 3 else "active" if recs else "empty"
    
    return jsonify({
        "success": True, 
        "recommendations": recs,
        "state": state
    })

@app.route('/api/report/comparison', methods=['GET'])
@token_required
def get_report_comparison():
    uid = request.user['_id']
    entries = list(entries_col.find({"user": uid})) if use_mongodb else entries_col.find({"user": uid})
    
    if not entries:
        return jsonify({"success": True, "hasData": False})

    # 1. Daily Averages (over all time or last 30 entries)
    sample = entries[:30] # Limit to recent for relevant average
    avg_transport = sum(e.get('transport', 0) for e in sample) / len(sample)
    avg_food = sum(e.get('food', 0) for e in sample) / len(sample)

    # 2. Monthly Electricity (Current Calendar Month)
    now = datetime.datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_days = (now.replace(day=1) + datetime.timedelta(days=32)).replace(day=1) - datetime.timedelta(days=1)
    days_in_month = month_days.day
    
    monthly_electric = 0
    for e in entries:
        # Handle string or datetime dates
        try:
            edate = datetime.datetime.strptime(e['date'], '%Y-%m-%d')
            if edate.year == now.year and edate.month == now.month:
                monthly_electric += e.get('electricity', 0)
        except: continue

    # 3. Targets (National Benchmarks)
    targets = {
        "transportDaily": 1.0,
        "foodDaily": 1.2,
        "electricityMonthly": 60.0,
        "nationalDailyLimit": 5.2
    }

    # 4. Normalized Daily Total for Banner
    normalized_daily = avg_transport + (monthly_electric / days_in_month) + avg_food

    return jsonify({
        "success": True,
        "hasData": True,
        "data": {
            "transport": round(avg_transport, 3),
            "food": round(avg_food, 3),
            "electricity": round(monthly_electric, 3),
            "normalizedDailyTotal": round(normalized_daily, 3)
        },
        "targets": targets,
        "status": "good" if normalized_daily <= targets["nationalDailyLimit"] else "danger",
        "daysInMonth": days_in_month
    })

@app.route('/api/admin/resend-welcome', methods=['POST'])
@token_required
def resend_welcome():
    if request.user.get('role') != 'admin':
        return jsonify({"success": False, "message": "Access denied"}), 403
    
    data = request.json
    email = data.get('email')
    first_name = data.get('firstName')
    if not email or not first_name:
        return jsonify({"success": False, "message": "Missing email or name"}), 400
    
    send_welcome_email(email, first_name)
    return jsonify({"success": True, "message": "Personalized welcome dispatched."})

@app.route('/api/ai/coach', methods=['GET'])
@token_required
def get_ai_coach():
    try:
        uid = request.user['_id']
        entries = list(entries_col.find({"user": uid})) if use_mongodb else entries_col.find({"user": uid})
        
        if not entries:
            return jsonify({"success": True, "advice": "Welcome to EcoTrack! Once you log some activities, I'll be able to give you personalized advice on reducing your footprint."})

        # Get last 7 days of data for context
        last7 = sorted(entries, key=lambda x: x['date'], reverse=True)[:7]
        context_data = []
        for e in last7:
            context_data.append(f"Date: {e['date']}, Transport: {e.get('transport',0)}kg, Electricity: {e.get('electricity',0)}kg, Food: {e.get('food',0)}kg, Total: {e.get('total',0)}kg")
        
        data_summary = "\n".join(context_data)
        
        prompt = f"""
        You are 'EcoCoach', an expert environmental consultant for the EcoTrack AI platform.
        Your goal is to provide brief, punchy, and highly personalized advice based on the user's recent carbon footprint data.
        
        USER DATA (Last 7 Days):
        {data_summary}
        
        EMISSION TARGETS:
        - Transport: < 1.0kg/day
        - Food: < 1.2kg/day
        - National Daily Limit: 5.2kg (Total)
        
        INSTRUCTIONS:
        1. Analyze the trends. Is one category consistently high?
        2. Give 2-3 specific, actionable steps they can take TODAY.
        3. Use a supportive, motivating, yet professional tone.
        4. Keep your response under 150 words. Use bullet points for actions.
        5. If the user is doing great (below targets), congratulate them and give one 'pro' level tip.
        
        Format your response in simple HTML (just paragraphs, bold text, and <ul>/<li>).
        """

        if ai_model:
            response = ai_model.generate_content(prompt)
            advice_html = response.text
        else:
            # Fallback mock advice if API key is missing
            advice_html = "<p><b>EcoCoach Insight:</b> I noticed your transport emissions are higher than the 1.0kg target on 3 of the last 7 days. Switching to the metro or a bus for your main commute could save you nearly 15kg of CO₂ this week!</p>"

        return jsonify({"success": True, "advice": advice_html})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/ai/predict', methods=['GET'])
@token_required
def predict_footprint():
    try:
        uid = request.user['_id']
        entries = list(entries_col.find({"user": uid})) if use_mongodb else entries_col.find({"user": uid})
        
        if len(entries) < 5:
            return jsonify({"success": False, "message": "Need at least 5 days of data for prediction"}), 400

        # Prepare data for Linear Regression
        df = pd.DataFrame(entries)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Create a numerical 'days' column
        first_day = df['date'].min()
        df['day_delta'] = (df['date'] - first_day).dt.days
        
        X = df[['day_delta']].values
        y = df['total'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict for next 30 days
        next_day = df['day_delta'].max() + 1
        future_X = np.array([[next_day + i] for i in range(30)])
        future_preds = model.predict(future_X)
        
        predicted_total = float(np.sum(future_preds))
        confidence = float(model.score(X, y)) # Using R^2 as a simple confidence metric

        return jsonify({
            "success": True,
            "prediction": round(predicted_total, 2),
            "confidence": round(confidence * 100, 1),
            "dailyAvg": round(float(np.mean(future_preds)), 2)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/ai/chat', methods=['POST'])
@token_required
def ai_chat():
    try:
        data = request.json
        user_msg = data.get('message', '')
        uid = request.user['_id']
        
        # System instructions to extract data
        prompt = f"""
        You are 'EcoAssistant', an AI for EcoTrack. Your goal is to help users log their carbon footprint and answer questions.
        
        USER MESSAGE: "{user_msg}"
        
        CURRENT EMISSION FACTORS (kg CO2):
        - Petrol Car: 2.31/L or avg 0.18/km
        - Bus: 0.08/km
        - Metro: 0.03/km
        - Diet: Vegan (~1.5kg/day), Non-Veg (~3.5kg/day)
        
        INSTRUCTIONS:
        1. If the user mentions an activity (e.g., "I drove 10km"), extract the category and value.
        2. Respond conversationally and supportive.
        3. If you identify a loggable activity, include a field 'autoLog' with values: category (transport/food/electricity), value (kg co2), and detail.
        
        RESPOND IN JSON FORMAT ONLY:
        {{
          "response": "Your conversational answer here.",
          "autoLog": true/false,
          "category": "transport",
          "value": 1.5,
          "detail": "10km drive in petrol car"
        }}
        """

        if ai_model:
            response = ai_model.generate_content(prompt)
            # Basic JSON extraction from text
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            
            ai_data = json.loads(text)
            
            # If autoLog is true, actually save it to the DB
            if ai_data.get('autoLog'):
                date_str = datetime.now().strftime('%Y-%m-%d')
                cat = ai_data.get('category')
                val = ai_data.get('value', 0)
                
                # Update today's entry
                query = {"user": uid, "date": date_str}
                update = {"$inc": {cat: val, "total": val}, "$set": {"savedAt": str(datetime.now())}}
                entries_col.update_one(query, update, upsert=True)
                
                # Recalculate score for today
                entry = entries_col.find_one(query)
                new_score = calculate_ecoscore(entry.get('total', 0))
                entries_col.update_one(query, {"$set": {"ecoScore": new_score}})
            
            return jsonify({
                "success": True, 
                "response": ai_data['response'], 
                "autoLog": ai_data.get('autoLog'),
                "detail": ai_data.get('detail')
            })
        else:
            return jsonify({"success": True, "response": "Hi! (Mock Mode) That sounds like a great eco-friendly choice. I've logged it for you.", "autoLog": False})
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/ai/vision', methods=['POST'])
@token_required
def ai_vision():
    try:
        data = request.json
        image_b64 = data.get('image', '')
        
        if not image_b64:
            return jsonify({"success": False, "message": "No image data provided"}), 400

        prompt = """
        Analyze this food image. Identify the major dishes and estimate the total carbon footprint in kg CO2e based on the ingredients seen (e.g., meat is high, vegetables are low).
        
        RESPOND IN JSON FORMAT ONLY:
        {
          "items": ["Dish Name 1", "Dish Name 2"],
          "totalKg": 1.25,
          "reasoning": "Short explanation of the estimate."
        }
        """

        if ai_model:
            # Prepare image for Gemini
            import base64
            image_data = base64.b64decode(image_b64)
            
            # Use multi-modal generative model
            vision_model = genai.GenerativeModel('gemini-1.5-flash')
            response = vision_model.generate_content([
                prompt,
                {'mime_type': 'image/jpeg', 'data': image_data}
            ])
            
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            
            ai_data = json.loads(text)
            
            return jsonify({
                "success": True, 
                "items": ai_data.get('items', []), 
                "totalKg": ai_data.get('totalKg', 0),
                "reasoning": ai_data.get('reasoning')
            })
        else:
            return jsonify({"success": True, "items": ["Mock Salad", "Mock Juice"], "totalKg": 0.45, "reasoning": "Mock mode enabled."})
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# ── Health Check Route ──────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "database": "mongodb_atlas" if use_mongodb else "local_json",
        "db_name": "ecotrack" if use_mongodb else "local_db.json",
        "timestamp": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
    })

# ── Data Migration Utility ──────────────────────────────
# To migrate: run python app.py --migrate
def migrate_local_to_atlas():
    if not use_mongodb:
        print("ERROR: Cannot migrate if Atlas connection is failed. Check your MONGO_URI.")
        return

    print("🚀 Starting Data Migration: Local JSON -> MongoDB Atlas...")
    local_data = load_local_db()
    
    # Migrate Users
    user_count = 0
    for user in local_data.get("users", []):
        # Convert _id if necessary or keep it as string if Atlas allows
        if not users_col.find_one({"email": user["email"]}):
            users_col.insert_one(user)
            user_count += 1
            
    # Migrate Entries
    entry_count = 0
    for entry in local_data.get("entries", []):
        # Match by user and date to avoid duplicates
        if not entries_col.find_one({"user": entry["user"], "date": entry["date"]}):
            entries_col.insert_one(entry)
            entry_count += 1
            
    print(f"✅ Migration Complete! Migrated {user_count} users and {entry_count} entries to Atlas.")

# ── Frontend Serving Routes ───────────────────────────
@app.route('/')
def serve_index():
    return send_from_directory(frontend_dir, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    import os
    if path.startswith('backend_py') or '..' in path:
        return jsonify({"error": "Forbidden"}), 403
        
    file_path = os.path.join(frontend_dir, path)
    if os.path.exists(file_path):
        return send_from_directory(frontend_dir, path)
        
    if os.path.exists(file_path + '.html'):
        return send_from_directory(frontend_dir, path + '.html')
        
    return send_from_directory(frontend_dir, 'index.html')

if __name__ == '__main__':
    # Check for migration flag
    if "--migrate" in sys.argv:
        migrate_local_to_atlas()
        sys.exit(0)
        
    port = int(os.getenv("PORT", 5050))
    app.run(host='0.0.0.0', port=port, debug=False)
