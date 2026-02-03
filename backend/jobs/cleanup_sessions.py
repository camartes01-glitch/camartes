from datetime import datetime
from database import SessionLocal
import models

def cleanup_expired_sessions():
    db = SessionLocal()
    db.query(models.UserSession).filter(
        models.UserSession.expires_at < datetime.utcnow()
    ).delete()
    db.commit()
    db.close()
