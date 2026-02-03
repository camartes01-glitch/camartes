"""Providers, services, and favorites endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from dependencies import get_current_user
import models

router = APIRouter(tags=["Providers"])


# ==================== PROVIDERS ====================

@router.get("/providers/service/{service_type}")
def get_providers_by_service(
    service_type: str,
    db: Session = Depends(get_db),
):
    """Get providers offering a specific service type."""
    # Get freelancers with this service
    freelancer_services = db.query(models.FreelancerService).filter_by(
        service_type=service_type
    ).all()
    freelancer_ids = [fs.user_id for fs in freelancer_services]

    # Get businesses with this service
    business_services = db.query(models.BusinessService).filter_by(
        service_type=service_type
    ).all()
    business_ids = [bs.user_id for bs in business_services]

    all_provider_ids = list(set(freelancer_ids + business_ids))

    providers = []
    for user_id in all_provider_ids:
        user = db.query(models.User).filter_by(user_id=user_id).first()
        profile = db.query(models.UserProfile).filter_by(user_id=user_id).first()
        
        if user:
            # Get average rating
            avg_rating = db.query(func.avg(models.Review.rating)).filter_by(
                provider_id=user_id
            ).scalar() or 0

            # Get service details
            service_detail = db.query(models.ServiceDetails).filter_by(
                user_id=user_id, service_type=service_type
            ).first()

            providers.append({
                "user_id": user_id,
                "name": user.name,
                "picture": user.picture,
                "city": profile.city if profile else None,
                "is_freelancer": profile.is_freelancer if profile else False,
                "is_business": profile.is_business if profile else False,
                "years_experience": service_detail.years_experience if service_detail else None,
                "average_rating": round(float(avg_rating), 1),
                "aadhaar_verified": user.aadhaar_verified,
            })

    return providers


@router.get("/providers/{provider_id}")
def get_provider(
    provider_id: str,
    db: Session = Depends(get_db),
):
    """Get provider details."""
    user = db.query(models.User).filter_by(user_id=provider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")

    profile = db.query(models.UserProfile).filter_by(user_id=provider_id).first()

    # Get services
    freelancer_services = db.query(models.FreelancerService).filter_by(user_id=provider_id).all()
    business_services = db.query(models.BusinessService).filter_by(user_id=provider_id).all()

    # Get reviews
    reviews = db.query(models.Review).filter_by(provider_id=provider_id).all()
    avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0

    # Get portfolio
    portfolio = db.query(models.PortfolioItem).filter_by(user_id=provider_id).all()

    return {
        "user_id": provider_id,
        "name": user.name,
        "email": user.email,
        "picture": user.picture,
        "city": profile.city if profile else None,
        "is_freelancer": profile.is_freelancer if profile else False,
        "is_business": profile.is_business if profile else False,
        "aadhaar_verified": user.aadhaar_verified,
        "average_rating": round(avg_rating, 1),
        "review_count": len(reviews),
        "freelancer_services": [
            {"service_type": s.service_type, "years_experience": s.years_experience, "hourly_rate": s.hourly_rate}
            for s in freelancer_services
        ],
        "business_services": [
            {"service_type": s.service_type, "business_name": s.business_name}
            for s in business_services
        ],
        "portfolio": [
            {"id": p.id, "title": p.title, "image": p.image, "category": p.category}
            for p in portfolio
        ],
    }


# ==================== FAVORITES ====================

@router.get("/favorites")
def get_favorites(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's favorite providers."""
    favorites = db.query(models.Favorite).filter_by(user_id=current_user.user_id).all()

    result = []
    for fav in favorites:
        provider = db.query(models.User).filter_by(user_id=fav.provider_id).first()
        profile = db.query(models.UserProfile).filter_by(user_id=fav.provider_id).first()
        if provider:
            result.append({
                "provider_id": fav.provider_id,
                "name": provider.name,
                "picture": provider.picture,
                "city": profile.city if profile else None,
            })

    return result


@router.post("/favorites/{provider_id}")
def add_favorite(
    provider_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a provider to favorites."""
    existing = db.query(models.Favorite).filter_by(
        user_id=current_user.user_id, provider_id=provider_id
    ).first()

    if existing:
        return {"status": "already_favorited"}

    favorite = models.Favorite(user_id=current_user.user_id, provider_id=provider_id)
    db.add(favorite)
    db.commit()

    return {"status": "added"}


@router.delete("/favorites/{provider_id}")
def remove_favorite(
    provider_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a provider from favorites."""
    db.query(models.Favorite).filter_by(
        user_id=current_user.user_id, provider_id=provider_id
    ).delete()
    db.commit()

    return {"status": "removed"}


# ==================== USER SERVICES ====================

class UserServiceCreate(BaseModel):
    service_type: str
    category: str  # freelancer or business
    years_experience: Optional[int] = None
    hourly_rate: Optional[float] = None
    business_name: Optional[str] = None
    description: Optional[str] = None


@router.get("/user-services")
def get_user_services(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's services."""
    freelancer = db.query(models.FreelancerService).filter_by(user_id=current_user.user_id).all()
    business = db.query(models.BusinessService).filter_by(user_id=current_user.user_id).all()

    return {
        "freelancer_services": [
            {"id": s.id, "service_type": s.service_type, "years_experience": s.years_experience, "hourly_rate": s.hourly_rate}
            for s in freelancer
        ],
        "business_services": [
            {"id": s.id, "service_type": s.service_type, "business_name": s.business_name, "years_experience": s.years_experience}
            for s in business
        ],
    }


@router.post("/user-services")
def add_user_service(
    payload: UserServiceCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a service for current user."""
    if payload.category == "freelancer":
        service = models.FreelancerService(
            user_id=current_user.user_id,
            service_type=payload.service_type,
            years_experience=payload.years_experience,
            hourly_rate=payload.hourly_rate,
            description=payload.description,
        )
    else:
        service = models.BusinessService(
            user_id=current_user.user_id,
            service_type=payload.service_type,
            years_experience=payload.years_experience,
            business_name=payload.business_name,
            description=payload.description,
        )

    db.add(service)
    db.commit()
    db.refresh(service)

    return {"id": service.id, "status": "created"}


@router.delete("/user-services/{service_id}")
def delete_user_service(
    service_id: int,
    category: str,  # freelancer or business
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a user service."""
    if category == "freelancer":
        db.query(models.FreelancerService).filter_by(
            id=service_id, user_id=current_user.user_id
        ).delete()
    else:
        db.query(models.BusinessService).filter_by(
            id=service_id, user_id=current_user.user_id
        ).delete()

    db.commit()
    return {"status": "deleted"}


# ==================== SERVICE DETAILS & PRICING ====================

class ServiceDetailsCreate(BaseModel):
    service_type: str
    years_experience: Optional[int] = None
    specialties: Optional[List[str]] = None
    quality_options: Optional[List[str]] = None
    description: Optional[str] = None


class ServicePricingCreate(BaseModel):
    service_type: str
    hourly_rate: Optional[float] = None
    half_day_rate: Optional[float] = None
    full_day_rate: Optional[float] = None
    event_rate: Optional[float] = None
    package_rate: Optional[float] = None


@router.get("/services/details/{service_id}")
def get_service_details(
    service_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get service details."""
    details = db.query(models.ServiceDetails).filter_by(
        id=service_id, user_id=current_user.user_id
    ).first()
    if not details:
        return None
    return {
        "id": details.id,
        "service_type": details.service_type,
        "years_experience": details.years_experience,
        "specialties": details.specialties,
        "quality_options": details.quality_options,
        "description": details.description,
    }


@router.post("/services/details")
def upsert_service_details(
    payload: ServiceDetailsCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update service details."""
    existing = db.query(models.ServiceDetails).filter_by(
        user_id=current_user.user_id, service_type=payload.service_type
    ).first()

    if existing:
        existing.years_experience = payload.years_experience
        existing.specialties = payload.specialties
        existing.quality_options = payload.quality_options
        existing.description = payload.description
    else:
        existing = models.ServiceDetails(
            user_id=current_user.user_id,
            service_type=payload.service_type,
            years_experience=payload.years_experience,
            specialties=payload.specialties,
            quality_options=payload.quality_options,
            description=payload.description,
        )
        db.add(existing)

    db.commit()
    db.refresh(existing)

    return {"id": existing.id, "status": "saved"}


@router.get("/services/pricing/{service_id}")
def get_service_pricing(
    service_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get service pricing."""
    pricing = db.query(models.ServicePricing).filter_by(
        id=service_id, user_id=current_user.user_id
    ).first()
    if not pricing:
        return None
    return {
        "id": pricing.id,
        "service_type": pricing.service_type,
        "hourly_rate": pricing.hourly_rate,
        "half_day_rate": pricing.half_day_rate,
        "full_day_rate": pricing.full_day_rate,
        "event_rate": pricing.event_rate,
        "package_rate": pricing.package_rate,
    }


@router.post("/services/pricing")
def upsert_service_pricing(
    payload: ServicePricingCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update service pricing."""
    existing = db.query(models.ServicePricing).filter_by(
        user_id=current_user.user_id, service_type=payload.service_type
    ).first()

    if existing:
        existing.hourly_rate = payload.hourly_rate
        existing.half_day_rate = payload.half_day_rate
        existing.full_day_rate = payload.full_day_rate
        existing.event_rate = payload.event_rate
        existing.package_rate = payload.package_rate
    else:
        existing = models.ServicePricing(
            user_id=current_user.user_id,
            service_type=payload.service_type,
            hourly_rate=payload.hourly_rate,
            half_day_rate=payload.half_day_rate,
            full_day_rate=payload.full_day_rate,
            event_rate=payload.event_rate,
            package_rate=payload.package_rate,
        )
        db.add(existing)

    db.commit()
    db.refresh(existing)

    return {"id": existing.id, "status": "saved"}


# ==================== PORTFOLIO ====================

class PortfolioCreate(BaseModel):
    title: str
    description: Optional[str] = None
    image: str  # base64
    category: Optional[str] = None


@router.get("/portfolio")
def get_portfolio(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's portfolio."""
    items = db.query(models.PortfolioItem).filter_by(user_id=current_user.user_id).all()
    return [
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "image": item.image,
            "category": item.category,
            "created_at": item.created_at,
        }
        for item in items
    ]


@router.post("/portfolio")
def add_portfolio_item(
    payload: PortfolioCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a portfolio item."""
    item = models.PortfolioItem(
        user_id=current_user.user_id,
        title=payload.title,
        description=payload.description,
        image=payload.image,
        category=payload.category,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"id": item.id, "status": "created"}


@router.delete("/portfolio/{item_id}")
def delete_portfolio_item(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a portfolio item."""
    db.query(models.PortfolioItem).filter_by(
        id=item_id, user_id=current_user.user_id
    ).delete()
    db.commit()

    return {"status": "deleted"}
