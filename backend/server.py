from fastapi import (
    FastAPI, APIRouter, Depends, HTTPException,
    Request, status, Header
)
from middleware.session import session_middleware
from routes.auth import router as auth_router
from routes.profile import router as profile_router, analytics_router
from routes.bookings import router as bookings_router
from routes.providers import router as providers_router
from routes.equipment import router as equipment_router
from routes.notifications import router as notifications_router
from routes.messages import router as messages_router
from routes.misc import router as misc_router
from scheduler import start_scheduler
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from routes import aadhaar
import models
from database import SessionLocal, engine, get_db
from dependencies import get_current_user
from routers import kyc
# This command creates the database tables based on your models
# if they don't already exist. It's safe to run on every startup.
models.Base.metadata.create_all(bind=engine)

# --- FastAPI App Initialization ---
app = FastAPI()

# This router will prefix all your API endpoints with /api
api_router = APIRouter(prefix="/api")

# This middleware allows your frontend (on a different URL) to make requests
# to your backend. This is crucial for a web application.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Health Check Endpoint ---
# AWS Elastic Beanstalk uses this endpoint to check if your application is running.
@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return {"status": "ok"}


# --- API Endpoints ---

# All your Pydantic models (like ReviewCreate) and endpoints go here.
# For example, the Review endpoints:

from pydantic import BaseModel

class ReviewCreate(BaseModel):
    provider_id: str
    service_type: str
    rating: int
    comment: Optional[str] = None

@api_router.post("/reviews")
def create_review(
    review: ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review_data = models.Review(
        **review.dict(),
        reviewer_id=current_user.user_id
    )
    db.add(review_data)
    db.commit()
    db.refresh(review_data)
    return review_data

@api_router.get("/reviews/{provider_id}")
def get_reviews(provider_id: str, db: Session = Depends(get_db)):
    return db.query(models.Review).filter(models.Review.provider_id == provider_id).all()
@app.on_event("startup")
def startup():
    start_scheduler()

# --- Register the API Router ---
# This adds all the routes we defined on `api_router` (e.g., /api/reviews)
# to our main application.
app.include_router(api_router)

# Auth routes under /api/auth
api_router.include_router(auth_router)

# Profile routes under /api/profile and /api/analytics
api_router.include_router(profile_router)
api_router.include_router(analytics_router)

# Bookings routes under /api/bookings
api_router.include_router(bookings_router)

# Providers, services, favorites, portfolio under /api
api_router.include_router(providers_router)

# Equipment and inventory routes under /api
api_router.include_router(equipment_router)

# Notifications under /api/notifications
api_router.include_router(notifications_router)

# Messages/chat under /api/messages
api_router.include_router(messages_router)

# Misc (feedback, chatbot, blogs, packages) under /api
api_router.include_router(misc_router)

# Aadhaar routes (not under /api prefix)
app.include_router(aadhaar.router)

# Session middleware for Bearer token validation
app.middleware("http")(session_middleware)

# KYC routes
app.include_router(kyc.router)