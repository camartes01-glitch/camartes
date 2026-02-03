"""Profile, profile setup, and analytics endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional

from database import get_db
from dependencies import get_current_user
import models

router = APIRouter(prefix="/profile", tags=["Profile"])


class ProfileSetupRequest(BaseModel):
    full_name: str
    contact_number: str
    city: str
    is_freelancer: bool = False
    is_business: bool = False


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    contact_number: Optional[str] = None
    city: Optional[str] = None
    is_freelancer: Optional[bool] = None
    is_business: Optional[bool] = None


@router.get("")
def get_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's profile."""
    profile = db.query(models.UserProfile).filter_by(user_id=current_user.user_id).first()
    if not profile:
        return {
            "user_id": current_user.user_id,
            "full_name": current_user.name,
            "contact_number": None,
            "city": None,
            "is_freelancer": False,
            "is_business": False,
            "has_completed_profile": False,
        }
    return {
        "user_id": profile.user_id,
        "full_name": profile.full_name or current_user.name,
        "contact_number": profile.contact_number,
        "city": profile.city,
        "is_freelancer": profile.is_freelancer,
        "is_business": profile.is_business,
        "has_completed_profile": profile.has_completed_profile,
    }


@router.post("/setup")
def setup_profile(
    payload: ProfileSetupRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initial profile setup after signup."""
    profile = db.query(models.UserProfile).filter_by(user_id=current_user.user_id).first()
    if not profile:
        profile = models.UserProfile(user_id=current_user.user_id)
        db.add(profile)

    profile.full_name = payload.full_name
    profile.contact_number = payload.contact_number
    profile.city = payload.city
    profile.is_freelancer = payload.is_freelancer
    profile.is_business = payload.is_business
    profile.has_completed_profile = True

    db.commit()
    db.refresh(profile)

    return {"status": "success", "message": "Profile setup complete"}


@router.put("")
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user profile."""
    profile = db.query(models.UserProfile).filter_by(user_id=current_user.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.contact_number is not None:
        profile.contact_number = payload.contact_number
    if payload.city is not None:
        profile.city = payload.city
    if payload.is_freelancer is not None:
        profile.is_freelancer = payload.is_freelancer
    if payload.is_business is not None:
        profile.is_business = payload.is_business

    db.commit()
    db.refresh(profile)

    return {"status": "success", "message": "Profile updated"}


# Analytics router (separate prefix)
analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])


@analytics_router.get("/dashboard")
def get_dashboard_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard analytics for current user."""
    user_id = current_user.user_id

    total_bookings = db.query(models.Booking).filter(
        (models.Booking.provider_id == user_id) | (models.Booking.client_id == user_id)
    ).count()

    total_reviews = db.query(models.Review).filter_by(provider_id=user_id).count()

    avg_rating_result = db.query(func.avg(models.Review.rating)).filter_by(provider_id=user_id).scalar()
    average_rating = float(avg_rating_result) if avg_rating_result else 0.0

    portfolio_items = db.query(models.PortfolioItem).filter_by(user_id=user_id).count()

    pending_requests = db.query(models.BookingRequest).filter_by(
        provider_profile_id=user_id, status="pending"
    ).count()

    return {
        "total_bookings": total_bookings,
        "total_reviews": total_reviews,
        "average_rating": round(average_rating, 1),
        "portfolio_items": portfolio_items,
        "pending_requests": pending_requests,
    }
