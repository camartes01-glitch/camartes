from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from passlib.context import CryptContext

from database import get_db
import models
from schemas.auth import SignupRequest, LoginRequest, AuthResponse
from dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

SESSION_EXPIRY_HOURS = 24
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ------------------------
# Utility helpers
# ------------------------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_session(user_id: str, db: Session):
    """
    Creates a new session token for a user.
    Old sessions are deleted to prevent session sprawl.
    """
    # OPTIONAL: allow only one active session per user
    db.query(models.UserSession).filter_by(user_id=user_id).delete()

    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=SESSION_EXPIRY_HOURS)

    session = models.UserSession(
        user_id=user_id,
        session_token=token,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return token, expires_at


# ------------------------
# Routes
# ------------------------

@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    user = models.User(
        user_id=str(uuid.uuid4()),
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = models.UserProfile(user_id=user.user_id)
    db.add(profile)
    db.commit()

    token, expiry = create_session(user.user_id, db)
    return {"access_token": token, "expires_at": expiry}


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token, expiry = create_session(user.user_id, db)
    return {"access_token": token, "expires_at": expiry}


@router.get("/me")
def me(current_user: models.User = Depends(get_current_user)):
    """Return current user info (requires Bearer token)."""
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "aadhaar_verified": current_user.aadhaar_verified or False,
    }


@router.post("/refresh", response_model=AuthResponse)
def refresh(token: str = Query(..., alias="token"), db: Session = Depends(get_db)):
    session = (
        db.query(models.UserSession)
        .filter_by(session_token=token)
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )

    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )

    user_id = session.user_id

    # rotate session token
    db.delete(session)
    db.commit()

    new_token, expiry = create_session(user_id, db)
    return {"access_token": new_token, "expires_at": expiry}
