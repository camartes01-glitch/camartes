from fastapi import Request, HTTPException
from datetime import datetime
from database import SessionLocal
import models

async def session_middleware(request: Request, call_next):
    auth = request.headers.get("Authorization")

    if auth and auth.startswith("Bearer "):
        token = auth.replace("Bearer ", "")
        db = SessionLocal()
        session = db.query(models.UserSession).filter_by(session_token=token).first()

        if not session or session.expires_at < datetime.utcnow():
            db.close()
            raise HTTPException(status_code=401, detail="Session expired")

        user = db.query(models.User).filter_by(user_id=session.user_id).first()
        request.state.user = user
        db.close()

    return await call_next(request)
