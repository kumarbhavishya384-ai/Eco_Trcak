import os
import smtplib
from dotenv import load_dotenv

def test_smtp():
    load_dotenv('backend_py/.env')
    user = os.getenv('SMTP_USER', 'kumarbhavishya384@gmail.com')
    pass_raw = os.getenv('SMTP_PASS', '')
    pw = pass_raw.replace(' ', '').strip()
    
    print(f"DEBUG: Using User: {user}")
    print(f"DEBUG: Password length: {len(pw)}")
    
    try:
        print("Connecting to smtp.gmail.com:465 (SSL)...")
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=15)
        print("Connected. Attempting login...")
        server.login(user, pw)
        print("✅ SUCCESS: SMTP Login worked!")
        server.quit()
        return True
    except smtplib.SMTPAuthenticationError:
        print("❌ FAILURE: Authentication failed. Check your App Password.")
    except Exception as e:
        print(f"❌ FAILURE: An error occurred: {e}")
    return False

if __name__ == "__main__":
    test_smtp()
