"""Miscellaneous endpoints: feedback, chatbot, blogs, packages."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from dependencies import get_current_user
import models

router = APIRouter(tags=["Misc"])


# ==================== FEEDBACK ====================

class FeedbackCreate(BaseModel):
    category: Optional[str] = None
    message: str
    rating: Optional[int] = None


@router.post("/feedback")
def submit_feedback(
    payload: FeedbackCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit app feedback."""
    feedback = models.Feedback(
        user_id=current_user.user_id,
        category=payload.category,
        message=payload.message,
        rating=payload.rating,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {"id": feedback.id, "status": "submitted"}


# ==================== CHATBOT ====================

CHATBOT_RESPONSES = {
    "hello": "Hi! I'm Camey, your Camartes assistant. How can I help you today?",
    "help": "I can help you with:\n- Finding photographers and videographers\n- Booking services\n- Renting equipment\n- Managing your portfolio\n\nWhat would you like to know?",
    "book": "To book a service, go to the Services tab and select the type of professional you need. Then browse available providers and tap 'Book Now'.",
    "rent": "To rent equipment, go to the Equipment section. You can browse available gear and contact owners directly.",
    "portfolio": "You can manage your portfolio from the Account tab > Portfolio. Add photos of your best work to attract clients!",
    "verify": "To get verified, go to Account > Verification and complete the Aadhaar verification process.",
    "default": "I'm not sure I understand. Try asking about:\n- How to book services\n- How to rent equipment\n- Portfolio management\n- Account verification",
}


class ChatbotMessage(BaseModel):
    message: str


@router.post("/chatbot")
def chatbot_respond(
    payload: ChatbotMessage,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Simple chatbot response."""
    message_lower = payload.message.lower()

    response = CHATBOT_RESPONSES["default"]
    for keyword, resp in CHATBOT_RESPONSES.items():
        if keyword in message_lower:
            response = resp
            break

    return {
        "response": response,
        "suggestions": ["How to book?", "Rent equipment", "My portfolio", "Get verified"],
    }


# ==================== BLOGS ====================

@router.get("/blogs")
def get_blogs(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Get latest blog posts."""
    blogs = db.query(models.Blog).order_by(models.Blog.created_at.desc()).limit(limit).all()

    # If no blogs exist, return sample data
    if not blogs:
        return [
            {
                "id": 1,
                "title": "Welcome to Camartes",
                "content": "Your photography ecosystem platform",
                "image": None,
                "author": "Camartes Team",
                "created_at": None,
            },
            {
                "id": 2,
                "title": "Tips for Better Photography",
                "content": "Learn how to improve your photography skills",
                "image": None,
                "author": "Camartes Team",
                "created_at": None,
            },
        ]

    return [
        {
            "id": b.id,
            "title": b.title,
            "content": b.content[:200] + "..." if len(b.content) > 200 else b.content,
            "image": b.image,
            "author": b.author,
            "created_at": b.created_at,
        }
        for b in blogs
    ]


# ==================== PACKAGES ====================

class PackageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    services: Optional[List[str]] = None
    price: Optional[float] = None


@router.get("/packages")
def get_packages(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's service packages."""
    packages = db.query(models.Package).filter_by(user_id=current_user.user_id).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "services": p.services,
            "price": p.price,
            "created_at": p.created_at,
        }
        for p in packages
    ]


@router.post("/packages")
def create_package(
    payload: PackageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a service package."""
    package = models.Package(
        user_id=current_user.user_id,
        name=payload.name,
        description=payload.description,
        services=payload.services,
        price=payload.price,
    )
    db.add(package)
    db.commit()
    db.refresh(package)

    return {"id": package.id, "status": "created"}


@router.put("/packages/{package_id}")
def update_package(
    package_id: int,
    payload: PackageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a service package."""
    package = db.query(models.Package).filter_by(
        id=package_id, user_id=current_user.user_id
    ).first()

    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    package.name = payload.name
    package.description = payload.description
    package.services = payload.services
    package.price = payload.price

    db.commit()
    return {"status": "updated"}


@router.delete("/packages/{package_id}")
def delete_package(
    package_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a service package."""
    db.query(models.Package).filter_by(
        id=package_id, user_id=current_user.user_id
    ).delete()
    db.commit()

    return {"status": "deleted"}
