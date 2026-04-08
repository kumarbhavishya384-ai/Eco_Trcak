import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load .env
env_path = os.path.join("backend_py", ".env")
load_dotenv(dotenv_path=env_path)

def send_test_email(to_email):
    sender_name  = os.getenv("COMPANY_NAME", "EcoTrack AI").strip()
    sender_email = os.getenv("COMPANY_EMAIL", "kumarbhavishya384@gmail.com").strip()
    smtp_server  = os.getenv("SMTP_SERVER", "smtp.gmail.com").strip()
    smtp_user    = os.getenv("SMTP_USER", sender_email).strip()
    smtp_pass_raw = os.getenv("SMTP_PASS", "")
    smtp_pass    = smtp_pass_raw.replace(" ", "").strip()
    
    print(f"DEBUG: Attempting to send test email to {to_email}")
    print(f"DEBUG: Using SMTP Server: {smtp_server}")
    print(f"DEBUG: Using SMTP User: {smtp_user}")
    
    subject = "EcoTrack AI - Backend Email Test"
    body = """
    Hello! 
    
    This is a successful test from your EcoTrack AI backend. 
    If you are reading this, your SMTP configuration (Gmail App Password) is working perfectly!
    
    Database connection is also verified.
    
    Happy Coding!
    """
    
    msg = MIMEMultipart()
    msg['From'] = f"{sender_name} <{sender_email}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        # Use SSL on port 465
        print("DEBUG: Connecting to server...")
        with smtplib.SMTP_SSL(smtp_server, 465, timeout=20) as server:
            print("DEBUG: Logging in...")
            server.login(smtp_user, smtp_pass)
            print("DEBUG: Sending message...")
            server.send_message(msg)
        print("SUCCESS: Test email sent!")
        return True
    except Exception as e:
        print(f"FAILURE: Could not send email. Error: {e}")
        return False

if __name__ == "__main__":
    test_email = "kumarbhavishya384@gmail.com"
    send_test_email(test_email)
