"""Notifications endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from dependencies import get_current_user
import models

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all notifications for current user."""
    notifications = db.query(models.Notification).filter_by(
        user_id=current_user.user_id
    ).order_by(models.Notification.created_at.desc()).all()

    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "data": n.data,
            "read": n.read,
            "created_at": n.created_at,
        }
        for n in notifications
    ]


@router.get("/unread-count")
def get_unread_count(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get unread notification count."""
    count = db.query(models.Notification).filter_by(
        user_id=current_user.user_id, read=False
    ).count()

    return {"unread_count": count}


@router.put("/read")
def mark_all_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    db.query(models.Notification).filter_by(
        user_id=current_user.user_id, read=False
    ).update({"read": True})
    db.commit()

    return {"status": "success"}


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    notification = db.query(models.Notification).filter_by(
        id=notification_id, user_id=current_user.user_id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.read = True
    db.commit()

    return {"status": "success"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a notification."""
    db.query(models.Notification).filter_by(
        id=notification_id, user_id=current_user.user_id
    ).delete()
    db.commit()

    return {"status": "deleted"}
