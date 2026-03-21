import os
from dotenv import load_dotenv

load_dotenv()

# Only build the email config if all required vars are present.
# If not configured, conf will be None and email features will be skipped gracefully.
_MAIL_USERNAME = os.getenv("MAIL_USERNAME")
_MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
_MAIL_FROM     = os.getenv("MAIL_FROM")
_MAIL_PORT     = os.getenv("MAIL_PORT")
_MAIL_SERVER   = os.getenv("MAIL_SERVER")

EMAIL_CONFIGURED = all([_MAIL_USERNAME, _MAIL_PASSWORD, _MAIL_FROM, _MAIL_PORT, _MAIL_SERVER])

conf = None

if EMAIL_CONFIGURED:
    try:
        from fastapi_mail import ConnectionConfig
        conf = ConnectionConfig(
            MAIL_USERNAME  = _MAIL_USERNAME,
            MAIL_PASSWORD  = _MAIL_PASSWORD,
            MAIL_FROM      = _MAIL_FROM,
            MAIL_PORT      = int(_MAIL_PORT),
            MAIL_SERVER    = _MAIL_SERVER,
            MAIL_STARTTLS  = True,
            MAIL_SSL_TLS   = False,
            USE_CREDENTIALS= True,
        )
    except Exception as e:
        print(f"[email_config] Warning: could not initialize email config: {e}")
        conf = None
        EMAIL_CONFIGURED = False
