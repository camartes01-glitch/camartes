from datetime import datetime, date
from database import SessionLocal
import models


def _parse_event_date(event_date_str: str | None) -> date | None:
    """Parse event_date string (YYYY-MM-DD or DD-MM-YYYY) to date, or None if invalid."""
    if not event_date_str or not event_date_str.strip():
        return None
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(event_date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None


def complete_bookings():
    """Mark confirmed bookings as completed if event_date has passed."""
    db = SessionLocal()
    today = date.today()

    bookings = db.query(models.Booking).filter(
        models.Booking.status == "confirmed"
    ).all()

    for booking in bookings:
        event_dt = _parse_event_date(booking.event_date)
        if event_dt is not None and event_dt <= today:
            booking.status = "completed"
            notification = models.Notification(
                user_id=booking.provider_id,
                title="Booking Completed",
                message=f"Booking {booking.booking_id} completed.",
            )
            db.add(notification)

    db.commit()
    db.close()
