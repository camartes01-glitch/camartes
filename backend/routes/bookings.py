"""Bookings and booking requests endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid

from database import get_db
from dependencies import get_current_user
import models

router = APIRouter(prefix="/bookings", tags=["Bookings"])


class BookingCreate(BaseModel):
    provider_id: str
    service_type: str
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    duration: Optional[str] = None
    budget: Optional[float] = None
    special_requirements: Optional[str] = None


class BookingRequestCreate(BaseModel):
    provider_id: str
    service_type: str
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    duration_hours: Optional[int] = None
    message: Optional[str] = None
    inventory_items: Optional[List[dict]] = None


@router.get("")
def get_bookings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all bookings for current user (as client or provider)."""
    bookings = db.query(models.Booking).filter(
        (models.Booking.client_id == current_user.user_id) |
        (models.Booking.provider_id == current_user.user_id)
    ).order_by(models.Booking.created_at.desc()).all()

    return [
        {
            "booking_id": b.booking_id,
            "provider_id": b.provider_id,
            "client_id": b.client_id,
            "service_type": b.service_type,
            "event_date": b.event_date,
            "event_time": b.event_time,
            "duration": b.duration,
            "budget": b.budget,
            "status": b.status,
            "created_at": b.created_at,
        }
        for b in bookings
    ]


@router.get("/my-bookings")
def get_my_bookings(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get bookings where current user is the client."""
    bookings = db.query(models.Booking).filter_by(
        client_id=current_user.user_id
    ).order_by(models.Booking.created_at.desc()).all()

    return [
        {
            "booking_id": b.booking_id,
            "provider_id": b.provider_id,
            "service_type": b.service_type,
            "event_date": b.event_date,
            "event_time": b.event_time,
            "status": b.status,
            "created_at": b.created_at,
        }
        for b in bookings
    ]


@router.get("/requests")
def get_booking_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get booking requests for current user (as provider)."""
    requests = db.query(models.BookingRequest).filter_by(
        provider_profile_id=current_user.user_id
    ).order_by(models.BookingRequest.created_at.desc()).all()

    return [
        {
            "request_id": r.request_id,
            "client_name": r.client_name,
            "client_email": r.client_email,
            "client_phone": r.client_phone,
            "service_type": r.service_type,
            "event_date": r.event_date,
            "event_time": r.event_time,
            "duration_hours": r.duration_hours,
            "message": r.message,
            "inventory_items": r.inventory_items,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in requests
    ]


@router.post("")
def create_booking(
    payload: BookingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new booking."""
    booking = models.Booking(
        booking_id=str(uuid.uuid4()),
        provider_id=payload.provider_id,
        client_id=current_user.user_id,
        service_type=payload.service_type,
        event_date=payload.event_date,
        event_time=payload.event_time,
        duration=payload.duration,
        budget=payload.budget,
        special_requirements=payload.special_requirements,
        status="pending",
    )
    db.add(booking)

    # Create notification for provider
    notification = models.Notification(
        user_id=payload.provider_id,
        type="booking",
        title="New Booking",
        message=f"You have a new booking request for {payload.service_type}",
        data={"booking_id": booking.booking_id},
    )
    db.add(notification)

    db.commit()
    db.refresh(booking)

    return {"booking_id": booking.booking_id, "status": "created"}


@router.post("/requests")
def create_booking_request(
    payload: BookingRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a booking request."""
    request = models.BookingRequest(
        request_id=str(uuid.uuid4()),
        provider_profile_id=payload.provider_id,
        client_profile_id=current_user.user_id,
        client_name=payload.client_name or current_user.name,
        client_email=payload.client_email or current_user.email,
        client_phone=payload.client_phone,
        service_type=payload.service_type,
        event_date=payload.event_date,
        event_time=payload.event_time,
        duration_hours=payload.duration_hours,
        message=payload.message,
        inventory_items=payload.inventory_items,
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    return {"request_id": request.request_id, "status": "created"}


@router.put("/requests/{request_id}/accept")
def accept_booking_request(
    request_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a booking request."""
    request = db.query(models.BookingRequest).filter_by(request_id=request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.provider_profile_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    request.status = "accepted"
    db.commit()

    return {"status": "accepted"}


@router.put("/requests/{request_id}/reject")
def reject_booking_request(
    request_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject a booking request."""
    request = db.query(models.BookingRequest).filter_by(request_id=request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.provider_profile_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    request.status = "rejected"
    db.commit()

    return {"status": "rejected"}
