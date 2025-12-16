from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, Request, status, Header, File, UploadFile
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# User Models
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class UserProfile(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    contact_number: Optional[str] = None
    city: Optional[str] = None
    is_freelancer: bool = False
    is_business: bool = False
    has_completed_profile: bool = False
    created_at: datetime
    updated_at: datetime

class ProfileSetupRequest(BaseModel):
    full_name: str
    contact_number: str
    city: str
    is_freelancer: bool = False
    is_business: bool = False

# Service Models
class FreelancerService(BaseModel):
    service_type: str
    years_experience: int
    hourly_rate: Optional[float] = None
    description: Optional[str] = None

class BusinessService(BaseModel):
    service_type: str
    years_experience: int
    business_name: Optional[str] = None
    description: Optional[str] = None

# Portfolio Models
class PortfolioItem(BaseModel):
    title: str
    description: Optional[str] = None
    image: str  # base64 encoded image
    category: Optional[str] = None

# Equipment Models
class EquipmentItem(BaseModel):
    name: str
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    daily_rate: Optional[float] = None
    description: Optional[str] = None
    image: Optional[str] = None  # base64
    available: bool = True

# Booking Models
class BookingRequest(BaseModel):
    provider_id: str
    service_type: str
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[str] = None
    budget: Optional[float] = None
    special_requirements: Optional[str] = None

class BookingStatus(BaseModel):
    booking_id: str
    status: str  # pending, confirmed, rejected, completed

# Review Models
class ReviewCreate(BaseModel):
    provider_id: str
    service_type: str
    rating: int  # 1-5
    comment: Optional[str] = None

# Message Models
class MessageCreate(BaseModel):
    recipient_id: str
    message: str

# Feedback Models
class FeedbackCreate(BaseModel):
    category: str
    message: str
    rating: Optional[int] = None

# Blog Models
class BlogCreate(BaseModel):
    title: str
    content: str
    author: str
    image: Optional[str] = None  # base64
    tags: List[str] = []

# Package Models
class PackageCreate(BaseModel):
    name: str
    service_type: str
    description: str
    price: float
    duration: str
    inclusions: List[str]

# Comparison Models
class ComparisonRequest(BaseModel):
    provider_ids: List[str]
    service_type: str

# Chat Models
class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

# ==================== AUTH HELPERS ====================

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Optional[User]:
    """Get current user from session token in cookie or Authorization header"""
    session_token = None
    
    # Try to get from Authorization header first
    if authorization and authorization.startswith("Bearer "):
        session_token = authorization.replace("Bearer ", "")
    
    # Fall back to cookie
    if not session_token:
        session_token = request.cookies.get("session_token")
    
    if not session_token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check expiry (handle timezone-naive dates from MongoDB)
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at <= datetime.now(timezone.utc):
        return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if user_doc:
        return User(**user_doc)
    
    return None

def require_auth(user: Optional[User] = Depends(get_current_user)) -> User:
    """Dependency that requires authentication"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(require_auth)):
    """Get current user info"""
    return current_user

@api_router.get("/auth/callback")
async def auth_callback(session_id: str, response: Response):
    """Handle OAuth callback and exchange session_id for session_token"""
    try:
        # Exchange session_id for user data
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if auth_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid session")
            
            user_data = auth_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one(
            {"email": user_data["email"]},
            {"_id": 0}
        )
        
        if not existing_user:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data["name"],
                "picture": user_data.get("picture"),
                "created_at": datetime.now(timezone.utc)
            })
        else:
            user_id = existing_user["user_id"]
        
        # Create session
        session_token = user_data["session_token"]
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        })
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,
            path="/"
        )
        
        return {"user_id": user_id, "session_token": session_token}
    
    except Exception as e:
        logging.error(f"Auth callback error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: User = Depends(require_auth)):
    """Logout user"""
    # Delete session
    await db.user_sessions.delete_many({"user_id": current_user.user_id})
    
    # Clear cookie
    response.delete_cookie("session_token", path="/")
    
    return {"message": "Logged out successfully"}

# ==================== PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(current_user: User = Depends(require_auth)):
    """Get user profile"""
    profile = await db.user_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not profile:
        return {
            "user_id": current_user.user_id,
            "has_completed_profile": False
        }
    
    return profile

@api_router.post("/profile/setup")
async def setup_profile(
    data: ProfileSetupRequest,
    current_user: User = Depends(require_auth)
):
    """Complete profile setup"""
    profile_data = {
        "user_id": current_user.user_id,
        "full_name": data.full_name,
        "contact_number": data.contact_number,
        "city": data.city,
        "is_freelancer": data.is_freelancer,
        "is_business": data.is_business,
        "has_completed_profile": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Upsert profile
    await db.user_profiles.update_one(
        {"user_id": current_user.user_id},
        {"$set": profile_data},
        upsert=True
    )
    
    return profile_data

@api_router.put("/profile")
async def update_profile(
    data: Dict[str, Any],
    current_user: User = Depends(require_auth)
):
    """Update user profile"""
    data["updated_at"] = datetime.now(timezone.utc)
    
    await db.user_profiles.update_one(
        {"user_id": current_user.user_id},
        {"$set": data}
    )
    
    return {"message": "Profile updated successfully"}

# ==================== SERVICE ENDPOINTS ====================

@api_router.post("/services/freelancer")
async def add_freelancer_service(
    service: FreelancerService,
    current_user: User = Depends(require_auth)
):
    """Add freelancer service"""
    service_data = service.dict()
    service_data["user_id"] = current_user.user_id
    service_data["created_at"] = datetime.now(timezone.utc)
    
    result = await db.freelancer_services.insert_one(service_data)
    return {"message": "Service added", "id": str(result.inserted_id)}

@api_router.post("/services/business")
async def add_business_service(
    service: BusinessService,
    current_user: User = Depends(require_auth)
):
    """Add business service"""
    service_data = service.dict()
    service_data["user_id"] = current_user.user_id
    service_data["created_at"] = datetime.now(timezone.utc)
    
    result = await db.business_services.insert_one(service_data)
    return {"message": "Service added", "id": str(result.inserted_id)}

@api_router.get("/services/my-services")
async def get_my_services(current_user: User = Depends(require_auth)):
    """Get user's services"""
    freelancer_services = await db.freelancer_services.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    business_services = await db.business_services.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "freelancer_services": freelancer_services,
        "business_services": business_services
    }

@api_router.get("/providers/service/{service_type}")
async def get_providers_by_service(
    service_type: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    verified: Optional[bool] = None,
    sort_by: Optional[str] = None
):
    """Get providers offering a specific service"""
    # Search in both freelancer and business services
    pipeline = [
        {"$match": {"service_type": service_type}},
        {
            "$lookup": {
                "from": "user_profiles",
                "localField": "user_id",
                "foreignField": "user_id",
                "as": "profile"
            }
        },
        {"$unwind": "$profile"},
        {
            "$lookup": {
                "from": "reviews",
                "localField": "user_id",
                "foreignField": "provider_id",
                "as": "reviews"
            }
        },
        {
            "$addFields": {
                "avg_rating": {"$avg": "$reviews.rating"},
                "review_count": {"$size": "$reviews"}
            }
        }
    ]
    
    # Get from both collections
    freelancers = await db.freelancer_services.aggregate(pipeline).to_list(100)
    businesses = await db.business_services.aggregate(pipeline).to_list(100)
    
    providers = freelancers + businesses
    
    # Apply filters
    if min_rating:
        providers = [p for p in providers if p.get("avg_rating", 0) >= min_rating]
    
    # Sort
    if sort_by == "rating":
        providers.sort(key=lambda x: x.get("avg_rating", 0), reverse=True)
    elif sort_by == "reviews":
        providers.sort(key=lambda x: x.get("review_count", 0), reverse=True)
    
    return providers

@api_router.get("/providers/{user_id}")
async def get_provider_details(user_id: str):
    """Get provider profile and details"""
    # Get profile
    profile = await db.user_profiles.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Get services
    freelancer_services = await db.freelancer_services.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    business_services = await db.business_services.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get portfolio
    portfolio = await db.portfolio.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get reviews
    reviews = await db.reviews.find(
        {"provider_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate ratings
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    
    return {
        "profile": profile,
        "freelancer_services": freelancer_services,
        "business_services": business_services,
        "portfolio": portfolio,
        "reviews": reviews,
        "avg_rating": avg_rating,
        "review_count": len(reviews)
    }

# ==================== PORTFOLIO ENDPOINTS ====================

@api_router.post("/portfolio")
async def add_portfolio_item(
    item: PortfolioItem,
    current_user: User = Depends(require_auth)
):
    """Add portfolio item"""
    portfolio_data = item.dict()
    portfolio_data["user_id"] = current_user.user_id
    portfolio_data["created_at"] = datetime.now(timezone.utc)
    
    result = await db.portfolio.insert_one(portfolio_data)
    return {"message": "Portfolio item added", "id": str(result.inserted_id)}

@api_router.get("/portfolio")
async def get_my_portfolio(current_user: User = Depends(require_auth)):
    """Get user's portfolio"""
    portfolio = await db.portfolio.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return portfolio

@api_router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(
    item_id: str,
    current_user: User = Depends(require_auth)
):
    """Delete portfolio item"""
    result = await db.portfolio.delete_one({
        "user_id": current_user.user_id,
        "_id": item_id
    })
    
    return {"message": "Portfolio item deleted"}

# ==================== BOOKING ENDPOINTS ====================

@api_router.post("/bookings")
async def create_booking(
    booking: BookingRequest,
    current_user: User = Depends(require_auth)
):
    """Create a booking request"""
    booking_data = booking.dict()
    booking_data["client_id"] = current_user.user_id
    booking_data["status"] = "pending"
    booking_data["created_at"] = datetime.now(timezone.utc)
    booking_data["booking_id"] = f"booking_{uuid.uuid4().hex[:12]}"
    
    await db.bookings.insert_one(booking_data)
    
    # Create notification for provider
    await db.notifications.insert_one({
        "user_id": booking_data["provider_id"],
        "type": "booking_request",
        "title": "New Booking Request",
        "message": f"You have a new booking request for {booking.service_type}",
        "data": {"booking_id": booking_data["booking_id"]},
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Booking created", "booking_id": booking_data["booking_id"]}

@api_router.get("/bookings/my-bookings")
async def get_my_bookings(current_user: User = Depends(require_auth)):
    """Get user's bookings (as client)"""
    bookings = await db.bookings.find(
        {"client_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return bookings

@api_router.get("/bookings/requests")
async def get_booking_requests(current_user: User = Depends(require_auth)):
    """Get booking requests (as provider)"""
    bookings = await db.bookings.find(
        {"provider_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return bookings

# ==================== BOOKING REQUESTS ENDPOINTS (Camera Rental Business) ====================

class BookingRequest(BaseModel):
    provider_profile_id: str
    service_type: str
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    duration_hours: Optional[int] = None
    message: Optional[str] = None
    inventory_items: Optional[List[str]] = None  # For camera rental
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_phone: Optional[str] = None

BUSINESS_SERVICES = ["photography_firm", "camera_rental", "service_centres", "outdoor_studios", "editing_studios", "printing_labs"]

@api_router.post("/booking-requests")
async def create_booking_request(
    request: BookingRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a booking request"""
    is_business_service = request.service_type in BUSINESS_SERVICES
    
    # Business services require authentication
    if is_business_service and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required for business services")
    
    # Get client profile
    client_profile = None
    if current_user:
        client_profile = await db.user_profiles.find_one(
            {"user_id": current_user.user_id},
            {"_id": 0}
        )
    
    # Camera rental specific validations
    if request.service_type == "camera_rental" and client_profile:
        is_freelancer = client_profile.get("is_freelancer", False)
        
        if is_freelancer and request.inventory_items:
            # Get equipment details for validation
            items = []
            for item_id in request.inventory_items:
                item = await db.inventory.find_one({"inventory_id": item_id}, {"_id": 0})
                if item:
                    items.append(item)
            
            # Count cameras and lenses
            cameras = [i for i in items if i.get("equipment_type") == "Camera"]
            lenses = [i for i in items if i.get("equipment_type") == "Lens"]
            
            # Check freelancer restrictions
            if len(cameras) > 1:
                raise HTTPException(status_code=400, detail="Freelancers can only book 1 camera per rental")
            if len(lenses) > 3:
                raise HTTPException(status_code=400, detail="Freelancers can only book up to 3 lenses per rental")
    
    # Create booking request
    request_data = {
        "request_id": f"req_{uuid.uuid4().hex[:12]}",
        "provider_profile_id": request.provider_profile_id,
        "client_profile_id": client_profile.get("user_id") if client_profile else None,
        "client_name": request.client_name or (client_profile.get("full_name") if client_profile else "Guest"),
        "client_email": request.client_email or (current_user.email if current_user else None),
        "client_phone": request.client_phone or (client_profile.get("contact_number") if client_profile else None),
        "service_type": request.service_type,
        "event_date": request.event_date,
        "event_time": request.event_time,
        "duration_hours": request.duration_hours,
        "message": request.message,
        "inventory_items": request.inventory_items,
        "status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await db.booking_requests.insert_one(request_data)
    
    return {"success": True, "request_id": request_data["request_id"]}

@api_router.get("/booking-requests")
async def get_provider_booking_requests(current_user: User = Depends(require_auth)):
    """Get booking requests for the provider"""
    profile = await db.user_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    requests = await db.booking_requests.find(
        {"provider_profile_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return requests

@api_router.get("/booking-requests/my-requests")
async def get_my_booking_requests(current_user: User = Depends(require_auth)):
    """Get booking requests made by the current user"""
    requests = await db.booking_requests.find(
        {"client_profile_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return requests

@api_router.put("/booking-requests/{request_id}")
async def update_booking_request_status(
    request_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(require_auth)
):
    """Update booking request status (accept/reject)"""
    request = await db.booking_requests.find_one(
        {"request_id": request_id, "provider_profile_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Booking request not found")
    
    new_status = data.get("status")
    
    # If accepting camera rental, check freelancer restrictions
    if new_status == "accepted" and request.get("service_type") == "camera_rental":
        client_id = request.get("client_profile_id")
        if client_id:
            client_profile = await db.user_profiles.find_one(
                {"user_id": client_id},
                {"_id": 0}
            )
            
            if client_profile and client_profile.get("is_freelancer"):
                # Check for other active rentals
                active_bookings = await db.booking_requests.find({
                    "client_profile_id": client_id,
                    "service_type": "camera_rental",
                    "status": "accepted",
                    "request_id": {"$ne": request_id}
                }).to_list(100)
                
                if len(active_bookings) > 0:
                    raise HTTPException(
                        status_code=400,
                        detail="This freelancer must return their current rental equipment before taking delivery of new equipment"
                    )
    
    await db.booking_requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # If accepted, create a confirmed booking
    if new_status == "accepted":
        booking_data = {
            "booking_id": f"book_{uuid.uuid4().hex[:12]}",
            "provider_id": current_user.user_id,
            "client_id": request.get("client_profile_id"),
            "client_name": request.get("client_name"),
            "client_contact": request.get("client_phone"),
            "service_type": request.get("service_type"),
            "booking_date": request.get("event_date"),
            "booking_time": request.get("event_time"),
            "duration_hours": request.get("duration_hours"),
            "inventory_items": request.get("inventory_items"),
            "status": "confirmed",
            "notes": request.get("message"),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        
        await db.bookings.insert_one(booking_data)
        
        # Notify client
        if request.get("client_profile_id"):
            await db.notifications.insert_one({
                "user_id": request.get("client_profile_id"),
                "type": "booking_accepted",
                "title": "Booking Request Accepted",
                "message": f"Your booking request for {request.get('service_type')} has been accepted!",
                "data": {"request_id": request_id},
                "read": False,
                "created_at": datetime.now(timezone.utc)
            })
    
    return {"success": True}

@api_router.delete("/booking-requests/{request_id}")
async def delete_booking_request(
    request_id: str,
    current_user: User = Depends(require_auth)
):
    """Delete a booking request"""
    result = await db.booking_requests.delete_one({
        "request_id": request_id,
        "provider_profile_id": current_user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking request not found")
    
    return {"success": True}

@api_router.get("/booking-requests/active-camera-rentals")
async def get_active_camera_rentals(current_user: User = Depends(require_auth)):
    """Check active camera rental bookings for freelancers"""
    profile = await db.user_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    active_bookings = await db.booking_requests.find({
        "client_profile_id": current_user.user_id,
        "service_type": "camera_rental",
        "status": {"$in": ["pending", "accepted"]}
    }).to_list(100)
    
    return {
        "has_active_bookings": len(active_bookings) > 0,
        "active_bookings": active_bookings,
        "is_freelancer": profile.get("is_freelancer", False),
        "is_business": profile.get("is_business", False)
    }

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status_update: BookingStatus,
    current_user: User = Depends(require_auth)
):
    """Update booking status"""
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only provider can update status
    if booking["provider_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": status_update.status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Notify client
    await db.notifications.insert_one({
        "user_id": booking["client_id"],
        "type": "booking_update",
        "title": "Booking Status Updated",
        "message": f"Your booking has been {status_update.status}",
        "data": {"booking_id": booking_id},
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Booking status updated"}

# ==================== REVIEW ENDPOINTS ====================

@api_router.post("/reviews")
async def create_review(
    review: ReviewCreate,
    current_user: User = Depends(require_auth)
):
    """Create a review"""
    review_data = review.dict()
    review_data["reviewer_id"] = current_user.user_id
    review_data["created_at"] = datetime.now(timezone.utc)
    
    await db.reviews.insert_one(review_data)
    
    return {"message": "Review created successfully"}

@api_router.get("/reviews/{provider_id}")
async def get_reviews(provider_id: str):
    """Get reviews for a provider"""
    reviews = await db.reviews.find(
        {"provider_id": provider_id},
        {"_id": 0}
    ).to_list(100)
    
    return reviews

# ==================== MESSAGING ENDPOINTS ====================

@api_router.post("/messages")
async def send_message(
    message: MessageCreate,
    current_user: User = Depends(require_auth)
):
    """Send a message"""
    message_data = {
        "sender_id": current_user.user_id,
        "recipient_id": message.recipient_id,
        "message": message.message,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.messages.insert_one(message_data)
    
    # Create notification
    await db.notifications.insert_one({
        "user_id": message.recipient_id,
        "type": "new_message",
        "title": "New Message",
        "message": f"You have a new message from {current_user.name}",
        "data": {"sender_id": current_user.user_id},
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Message sent"}

@api_router.get("/messages/{user_id}")
async def get_conversation(
    user_id: str,
    current_user: User = Depends(require_auth)
):
    """Get conversation with a user"""
    messages = await db.messages.find(
        {
            "$or": [
                {"sender_id": current_user.user_id, "recipient_id": user_id},
                {"sender_id": user_id, "recipient_id": current_user.user_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": user_id, "recipient_id": current_user.user_id},
        {"$set": {"read": True}}
    )
    
    return messages

@api_router.get("/messages")
async def get_conversations(current_user: User = Depends(require_auth)):
    """Get all conversations"""
    # Get unique user IDs from messages
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"sender_id": current_user.user_id},
                    {"recipient_id": current_user.user_id}
                ]
            }
        },
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$sender_id", current_user.user_id]},
                        "$recipient_id",
                        "$sender_id"
                    ]
                },
                "last_message": {"$last": "$message"},
                "last_message_time": {"$last": "$created_at"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {
                                "$and": [
                                    {"$eq": ["$recipient_id", current_user.user_id]},
                                    {"$eq": ["$read", False]}
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {"$sort": {"last_message_time": -1}}
    ]
    
    conversations = await db.messages.aggregate(pipeline).to_list(100)
    
    # Get user details for each conversation
    for conv in conversations:
        user = await db.users.find_one(
            {"user_id": conv["_id"]},
            {"_id": 0, "name": 1, "picture": 1}
        )
        conv["user"] = user
    
    return conversations

# ==================== EQUIPMENT ENDPOINTS ====================

@api_router.post("/equipment")
async def add_equipment(
    equipment: EquipmentItem,
    current_user: User = Depends(require_auth)
):
    """Add equipment for rental"""
    equipment_data = equipment.dict()
    equipment_data["owner_id"] = current_user.user_id
    equipment_data["equipment_id"] = f"equip_{uuid.uuid4().hex[:12]}"
    equipment_data["created_at"] = datetime.now(timezone.utc)
    
    result = await db.equipment.insert_one(equipment_data)
    return {"message": "Equipment added", "id": str(result.inserted_id), "equipment_id": equipment_data["equipment_id"]}

@api_router.get("/equipment")
async def get_equipment(category: Optional[str] = None):
    """Get available equipment"""
    query = {"available": True}
    if category:
        query["category"] = category
    
    equipment = await db.equipment.find(query, {"_id": 0}).to_list(100)
    return equipment

@api_router.get("/equipment/my-equipment")
async def get_my_equipment(current_user: User = Depends(require_auth)):
    """Get user's equipment"""
    equipment = await db.equipment.find(
        {"owner_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return equipment

@api_router.put("/equipment/{equipment_id}")
async def update_equipment(
    equipment_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(require_auth)
):
    """Update equipment"""
    data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.equipment.update_one(
        {"equipment_id": equipment_id, "owner_id": current_user.user_id},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    return {"message": "Equipment updated"}

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(
    equipment_id: str,
    current_user: User = Depends(require_auth)
):
    """Delete equipment"""
    result = await db.equipment.delete_one({
        "equipment_id": equipment_id,
        "owner_id": current_user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    return {"message": "Equipment deleted"}

# ==================== INVENTORY MANAGEMENT ENDPOINTS ====================
# Full inventory management for camera rental business

class InventoryItem(BaseModel):
    equipment_type: str  # Camera, Lens, Lighting, Gimbal, Tripod, Drone, Audio, Accessories
    brand: str
    model: str
    serial_number: str
    purchase_date: Optional[str] = None
    condition_status: str = "excellent"  # excellent, good, fair, needs_repair
    availability_status: str = "available"  # available, rented, maintenance, unavailable
    rental_price_6h: Optional[float] = None
    rental_price_8h: Optional[float] = None
    rental_price_12h: Optional[float] = None
    rental_price_24h: Optional[float] = None
    maintenance_notes: Optional[str] = None

class RentOutRequest(BaseModel):
    renter_name: str
    renter_contact: str
    start_date: str
    end_date: str

class ReturnRequest(BaseModel):
    availability_status: str = "available"
    condition_status: str = "excellent"
    maintenance_notes: Optional[str] = None

@api_router.post("/inventory")
async def create_inventory_item(
    item: InventoryItem,
    current_user: User = Depends(require_auth)
):
    """Create inventory item for camera rental business"""
    # Check if user has business profile
    profile = await db.user_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not profile or not profile.get("is_business"):
        raise HTTPException(status_code=403, detail="Only business accounts can manage inventory")
    
    item_data = item.dict()
    item_data["owner_id"] = current_user.user_id
    item_data["inventory_id"] = f"inv_{uuid.uuid4().hex[:12]}"
    item_data["created_at"] = datetime.now(timezone.utc)
    item_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.inventory.insert_one(item_data)
    
    return {
        "success": True,
        "inventory_id": item_data["inventory_id"]
    }

@api_router.get("/inventory")
async def get_inventory(current_user: User = Depends(require_auth)):
    """Get all inventory items for current user"""
    inventory = await db.inventory.find(
        {"owner_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    return inventory

@api_router.get("/inventory/available")
async def get_available_inventory(
    city: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get available inventory for booking (public endpoint)"""
    query = {"availability_status": "available"}
    
    inventory = await db.inventory.find(query, {"_id": 0}).to_list(500)
    
    # Enrich with owner details
    for item in inventory:
        owner_profile = await db.user_profiles.find_one(
            {"user_id": item["owner_id"]},
            {"_id": 0, "full_name": 1, "city": 1}
        )
        if owner_profile:
            item["provider_name"] = owner_profile.get("full_name")
            item["city"] = owner_profile.get("city")
    
    # Filter by city if provided
    if city:
        inventory = [i for i in inventory if i.get("city", "").lower() == city.lower()]
    
    return inventory

@api_router.get("/inventory/{inventory_id}")
async def get_inventory_item(
    inventory_id: str,
    current_user: User = Depends(require_auth)
):
    """Get single inventory item"""
    item = await db.inventory.find_one(
        {"inventory_id": inventory_id, "owner_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return item

@api_router.put("/inventory/{inventory_id}")
async def update_inventory_item(
    inventory_id: str,
    item: InventoryItem,
    current_user: User = Depends(require_auth)
):
    """Update inventory item"""
    item_data = item.dict()
    item_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.inventory.update_one(
        {"inventory_id": inventory_id, "owner_id": current_user.user_id},
        {"$set": item_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return {"success": True}

@api_router.delete("/inventory/{inventory_id}")
async def delete_inventory_item(
    inventory_id: str,
    current_user: User = Depends(require_auth)
):
    """Delete inventory item"""
    result = await db.inventory.delete_one({
        "inventory_id": inventory_id,
        "owner_id": current_user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return {"success": True}

@api_router.post("/inventory/{inventory_id}/rent")
async def rent_inventory_item(
    inventory_id: str,
    rent_data: RentOutRequest,
    current_user: User = Depends(require_auth)
):
    """Mark inventory item as rented"""
    update_data = {
        "availability_status": "rented",
        "current_renter_name": rent_data.renter_name,
        "current_renter_contact": rent_data.renter_contact,
        "rental_start_date": rent_data.start_date,
        "rental_end_date": rent_data.end_date,
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.inventory.update_one(
        {"inventory_id": inventory_id, "owner_id": current_user.user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return {"success": True}

@api_router.post("/inventory/{inventory_id}/return")
async def return_inventory_item(
    inventory_id: str,
    return_data: ReturnRequest,
    current_user: User = Depends(require_auth)
):
    """Mark inventory item as returned"""
    update_data = {
        "availability_status": return_data.availability_status,
        "condition_status": return_data.condition_status,
        "maintenance_notes": return_data.maintenance_notes,
        "current_renter_name": None,
        "current_renter_contact": None,
        "rental_start_date": None,
        "rental_end_date": None,
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.inventory.update_one(
        {"inventory_id": inventory_id, "owner_id": current_user.user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    return {"success": True}

# ==================== USER SERVICES ENDPOINTS ====================

class UserServiceSelection(BaseModel):
    services: List[Dict[str, str]]  # List of {service_id, service_category}

@api_router.get("/user-services")
async def get_user_services(current_user: User = Depends(require_auth)):
    """Get user's selected services"""
    services = await db.user_services.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return services

@api_router.post("/user-services")
async def save_user_services(
    selection: UserServiceSelection,
    current_user: User = Depends(require_auth)
):
    """Save user's selected services"""
    # Delete existing services
    await db.user_services.delete_many({"user_id": current_user.user_id})
    
    # Insert new services
    for service in selection.services:
        await db.user_services.insert_one({
            "user_id": current_user.user_id,
            "service_id": service["service_id"],
            "service_category": service["service_category"],
            "created_at": datetime.now(timezone.utc)
        })
    
    return {"success": True}

# ==================== SERVICE DETAILS/PRICING ENDPOINTS ====================

class ServiceDetails(BaseModel):
    service_type: str
    years_experience: Optional[int] = 0
    specialties: Optional[str] = None  # JSON string
    quality_options: Optional[str] = None  # JSON string

class ServicePricing(BaseModel):
    service_type: str
    price_4_hours: Optional[float] = None
    price_6_hours: Optional[float] = None
    price_8_hours: Optional[float] = None
    price_12_hours: Optional[float] = None
    price_24_hours: Optional[float] = None
    price_per_pic: Optional[float] = None
    price_per_page: Optional[float] = None
    price_per_minute: Optional[float] = None
    price_per_hour: Optional[float] = None
    price_per_event: Optional[float] = None
    price_per_album: Optional[float] = None
    price_per_video: Optional[float] = None
    price_per_sheet: Optional[float] = None
    price_per_album_cover: Optional[float] = None
    price_per_poster: Optional[float] = None
    price_per_album_box: Optional[float] = None

@api_router.get("/services/details/{service_type}")
async def get_service_details(
    service_type: str,
    current_user: User = Depends(require_auth)
):
    """Get service details for a specific service type"""
    details = await db.service_details.find_one(
        {"user_id": current_user.user_id, "service_type": service_type},
        {"_id": 0}
    )
    
    return details or {}

@api_router.post("/services/details")
async def save_service_details(
    details: ServiceDetails,
    current_user: User = Depends(require_auth)
):
    """Save service details"""
    details_data = details.dict()
    details_data["user_id"] = current_user.user_id
    details_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.service_details.update_one(
        {"user_id": current_user.user_id, "service_type": details.service_type},
        {"$set": details_data},
        upsert=True
    )
    
    return {"success": True}

@api_router.get("/services/pricing/{service_type}")
async def get_service_pricing(
    service_type: str,
    current_user: User = Depends(require_auth)
):
    """Get pricing for a specific service type"""
    pricing = await db.service_pricing.find_one(
        {"user_id": current_user.user_id, "service_type": service_type},
        {"_id": 0}
    )
    
    return pricing or {}

@api_router.post("/services/pricing")
async def save_service_pricing(
    pricing: ServicePricing,
    current_user: User = Depends(require_auth)
):
    """Save service pricing"""
    pricing_data = pricing.dict()
    pricing_data["user_id"] = current_user.user_id
    pricing_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.service_pricing.update_one(
        {"user_id": current_user.user_id, "service_type": pricing.service_type},
        {"$set": pricing_data},
        upsert=True
    )
    
    return {"success": True}

# ==================== FAVORITES ENDPOINTS ====================

@api_router.post("/favorites/{provider_id}")
async def add_favorite(
    provider_id: str,
    current_user: User = Depends(require_auth)
):
    """Add provider to favorites"""
    await db.favorites.update_one(
        {"user_id": current_user.user_id, "provider_id": provider_id},
        {"$set": {"created_at": datetime.now(timezone.utc)}},
        upsert=True
    )
    
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{provider_id}")
async def remove_favorite(
    provider_id: str,
    current_user: User = Depends(require_auth)
):
    """Remove provider from favorites"""
    await db.favorites.delete_one({
        "user_id": current_user.user_id,
        "provider_id": provider_id
    })
    
    return {"message": "Removed from favorites"}

@api_router.get("/favorites")
async def get_favorites(current_user: User = Depends(require_auth)):
    """Get user's favorite providers"""
    favorites = await db.favorites.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get provider details
    provider_ids = [f["provider_id"] for f in favorites]
    providers = []
    
    for provider_id in provider_ids:
        profile = await db.user_profiles.find_one(
            {"user_id": provider_id},
            {"_id": 0}
        )
        if profile:
            providers.append(profile)
    
    return providers

# ==================== BLOG ENDPOINTS ====================

@api_router.post("/blogs")
async def create_blog(
    blog: BlogCreate,
    current_user: User = Depends(require_auth)
):
    """Create a blog post"""
    blog_data = blog.dict()
    blog_data["author_id"] = current_user.user_id
    blog_data["blog_id"] = f"blog_{uuid.uuid4().hex[:12]}"
    blog_data["created_at"] = datetime.now(timezone.utc)
    
    await db.blogs.insert_one(blog_data)
    return {"message": "Blog created", "blog_id": blog_data["blog_id"]}

@api_router.get("/blogs")
async def get_blogs(limit: int = 10):
    """Get recent blog posts"""
    blogs = await db.blogs.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return blogs

@api_router.get("/blogs/{blog_id}")
async def get_blog(blog_id: str):
    """Get a blog post"""
    blog = await db.blogs.find_one(
        {"blog_id": blog_id},
        {"_id": 0}
    )
    
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    
    return blog

# ==================== FEEDBACK ENDPOINTS ====================

@api_router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: User = Depends(require_auth)
):
    """Submit feedback"""
    feedback_data = feedback.dict()
    feedback_data["user_id"] = current_user.user_id
    feedback_data["created_at"] = datetime.now(timezone.utc)
    
    await db.feedback.insert_one(feedback_data)
    return {"message": "Feedback submitted successfully"}

# ==================== NOTIFICATION ENDPOINTS ====================

@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(require_auth)):
    """Get user notifications"""
    notifications = await db.notifications.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return notifications

@api_router.put("/notifications/read")
async def mark_notifications_read(current_user: User = Depends(require_auth)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user.user_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notifications marked as read"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: User = Depends(require_auth)):
    """Get unread notification count"""
    count = await db.notifications.count_documents({
        "user_id": current_user.user_id,
        "read": False
    })
    
    return {"unread_count": count}

# ==================== ANALYTICS ENDPOINTS ====================

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard(current_user: User = Depends(require_auth)):
    """Get analytics dashboard data"""
    # Get booking stats
    total_bookings = await db.bookings.count_documents({
        "provider_id": current_user.user_id
    })
    
    pending_bookings = await db.bookings.count_documents({
        "provider_id": current_user.user_id,
        "status": "pending"
    })
    
    confirmed_bookings = await db.bookings.count_documents({
        "provider_id": current_user.user_id,
        "status": "confirmed"
    })
    
    # Get review stats
    reviews = await db.reviews.find(
        {"provider_id": current_user.user_id},
        {"_id": 0, "rating": 1}
    ).to_list(1000)
    
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    
    # Get portfolio count
    portfolio_count = await db.portfolio.count_documents({
        "user_id": current_user.user_id
    })
    
    return {
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "total_reviews": len(reviews),
        "average_rating": round(avg_rating, 2),
        "portfolio_items": portfolio_count
    }

# ==================== CHAT BOT ENDPOINTS ====================

@api_router.post("/chatbot")
async def chatbot_message(
    chat_msg: ChatMessage,
    current_user: User = Depends(require_auth)
):
    """Send message to AI chatbot"""
    try:
        session_id = chat_msg.session_id or f"session_{current_user.user_id}_{uuid.uuid4().hex[:8]}"
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message="You are Camartes AI Assistant, helping users with photography and videography services. Be helpful, friendly, and concise."
        ).with_model("openai", "gpt-5.1")
        
        # Send message
        user_message = UserMessage(text=chat_msg.message)
        response = await chat.send_message(user_message)
        
        # Save chat history
        await db.chat_history.insert_one({
            "user_id": current_user.user_id,
            "session_id": session_id,
            "user_message": chat_msg.message,
            "bot_response": response,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {
            "response": response,
            "session_id": session_id
        }
    
    except Exception as e:
        logging.error(f"Chatbot error: {str(e)}")
        return {
            "response": "I'm sorry, I'm having trouble responding right now. Please try again.",
            "error": str(e)
        }

# ==================== COMPARISON ENDPOINTS ====================

@api_router.post("/comparison")
async def compare_providers(comparison: ComparisonRequest):
    """Compare multiple providers"""
    providers_data = []
    
    for provider_id in comparison.provider_ids:
        provider = await get_provider_details(provider_id)
        providers_data.append(provider)
    
    return {"providers": providers_data, "service_type": comparison.service_type}

# ==================== PACKAGE ENDPOINTS ====================

@api_router.post("/packages")
async def create_package(
    package: PackageCreate,
    current_user: User = Depends(require_auth)
):
    """Create a service package"""
    package_data = package.dict()
    package_data["provider_id"] = current_user.user_id
    package_data["created_at"] = datetime.now(timezone.utc)
    
    await db.packages.insert_one(package_data)
    return {"message": "Package created successfully"}

@api_router.get("/packages")
async def get_my_packages(current_user: User = Depends(require_auth)):
    """Get user's packages"""
    packages = await db.packages.find(
        {"provider_id": current_user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    return packages

@api_router.get("/packages/provider/{provider_id}")
async def get_provider_packages(provider_id: str):
    """Get packages from a provider"""
    packages = await db.packages.find(
        {"provider_id": provider_id},
        {"_id": 0}
    ).to_list(100)
    
    return packages

# ==================== VERIFICATION ENDPOINTS ====================

@api_router.post("/verification/request")
async def request_verification(current_user: User = Depends(require_auth)):
    """Request account verification"""
    await db.verification_requests.insert_one({
        "user_id": current_user.user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Verification request submitted"}

@api_router.get("/verification/status")
async def get_verification_status(current_user: User = Depends(require_auth)):
    """Get verification status"""
    verification = await db.verification_requests.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return verification or {"status": "not_requested"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
