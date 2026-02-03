"""
Unit tests for background jobs: cleanup_sessions, process_bookings.
"""
import pytest
from datetime import datetime, timedelta, date

from database import SessionLocal
import models
from jobs.cleanup_sessions import cleanup_expired_sessions
from jobs.process_bookings import complete_bookings


def test_cleanup_expired_sessions():
    """Expired sessions should be deleted."""
    db = SessionLocal()

    # Create an expired session
    expired = models.UserSession(
        user_id="test-user-1",
        session_token="expired-token-123",
        expires_at=datetime.utcnow() - timedelta(hours=1),
    )
    db.add(expired)
    db.commit()

    initial_count = db.query(models.UserSession).count()

    cleanup_expired_sessions()

    db2 = SessionLocal()
    final_count = db2.query(models.UserSession).count()
    db2.close()
    db.close()

    assert final_count == initial_count - 1


def test_process_bookings_completes_past_event_date():
    """Confirmed bookings with event_date in the past should be marked completed."""
    db = SessionLocal()

    user = models.User(
        user_id="provider-1",
        email="p@test.com",
        name="Provider",
        password_hash="hash",
    )
    db.add(user)
    db.commit()

    past_date = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
    booking = models.Booking(
        booking_id="b-past-1",
        provider_id="provider-1",
        client_id="provider-1",
        service_type="photographer",
        event_date=past_date,
        status="confirmed",
    )
    db.add(booking)
    db.commit()

    complete_bookings()

    db2 = SessionLocal()
    updated = db2.query(models.Booking).filter_by(booking_id="b-past-1").first()
    db2.close()
    db.close()

    assert updated is not None
    assert updated.status == "completed"


def test_process_bookings_ignores_future_event_date():
    """Confirmed bookings with future event_date should remain confirmed."""
    db = SessionLocal()

    user = models.User(
        user_id="provider-2",
        email="p2@test.com",
        name="Provider2",
        password_hash="hash",
    )
    db.add(user)
    db.commit()

    future_date = (date.today() + timedelta(days=7)).strftime("%Y-%m-%d")
    booking = models.Booking(
        booking_id="b-future-1",
        provider_id="provider-2",
        client_id="provider-2",
        service_type="videographer",
        event_date=future_date,
        status="confirmed",
    )
    db.add(booking)
    db.commit()

    complete_bookings()

    db2 = SessionLocal()
    updated = db2.query(models.Booking).filter_by(booking_id="b-future-1").first()
    db2.close()
    db.close()

    assert updated is not None
    assert updated.status == "confirmed"
