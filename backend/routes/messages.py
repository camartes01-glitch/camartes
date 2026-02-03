"""Messages/chat endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from typing import Optional

from database import get_db
from dependencies import get_current_user
import models

router = APIRouter(prefix="/messages", tags=["Messages"])


class MessageCreate(BaseModel):
    recipient_id: str
    message: str


@router.get("")
def get_conversations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get list of conversations (unique users the current user has messaged)."""
    # Get all messages involving current user
    messages = db.query(models.Message).filter(
        or_(
            models.Message.sender_id == current_user.user_id,
            models.Message.recipient_id == current_user.user_id
        )
    ).order_by(models.Message.created_at.desc()).all()

    # Group by conversation partner
    conversations = {}
    for msg in messages:
        partner_id = msg.recipient_id if msg.sender_id == current_user.user_id else msg.sender_id
        if partner_id not in conversations:
            partner = db.query(models.User).filter_by(user_id=partner_id).first()
            conversations[partner_id] = {
                "user_id": partner_id,
                "name": partner.name if partner else "Unknown",
                "picture": partner.picture if partner else None,
                "last_message": msg.message,
                "last_message_at": msg.created_at,
                "unread": not msg.read and msg.recipient_id == current_user.user_id,
            }

    return list(conversations.values())


@router.get("/{user_id}")
def get_messages_with_user(
    user_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get messages between current user and another user."""
    messages = db.query(models.Message).filter(
        or_(
            and_(
                models.Message.sender_id == current_user.user_id,
                models.Message.recipient_id == user_id
            ),
            and_(
                models.Message.sender_id == user_id,
                models.Message.recipient_id == current_user.user_id
            )
        )
    ).order_by(models.Message.created_at.asc()).all()

    # Mark messages as read
    db.query(models.Message).filter(
        models.Message.sender_id == user_id,
        models.Message.recipient_id == current_user.user_id,
        models.Message.read == False
    ).update({"read": True})
    db.commit()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "message": m.message,
            "read": m.read,
            "created_at": m.created_at,
            "is_mine": m.sender_id == current_user.user_id,
        }
        for m in messages
    ]


@router.post("")
def send_message(
    payload: MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to another user."""
    message = models.Message(
        sender_id=current_user.user_id,
        recipient_id=payload.recipient_id,
        message=payload.message,
        read=False,
    )
    db.add(message)

    # Create notification for recipient
    notification = models.Notification(
        user_id=payload.recipient_id,
        type="message",
        title="New Message",
        message=f"You have a new message from {current_user.name}",
        data={"sender_id": current_user.user_id},
    )
    db.add(notification)

    db.commit()
    db.refresh(message)

    return {
        "id": message.id,
        "status": "sent",
        "created_at": message.created_at,
    }
