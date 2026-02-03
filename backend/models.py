from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

Base = declarative_base()

# ==================== USER & AUTH MODELS ====================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    picture = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)

    # ✅ Aadhaar / DigiLocker verification metadata
    aadhaar_verified = Column(Boolean, default=False)
    aadhaar_verified_at = Column(DateTime(timezone=True), nullable=True)
    aadhaar_issuer = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    sessions = relationship("UserSession", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), unique=True, nullable=False)

    full_name = Column(String, nullable=True)
    contact_number = Column(String, nullable=True)
    city = Column(String, nullable=True)

    is_freelancer = Column(Boolean, default=False)
    is_business = Column(Boolean, default=False)
    has_completed_profile = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    session_token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")

# ==================== SERVICE & BOOKING MODELS ====================

class FreelancerService(Base):
    __tablename__ = "freelancer_services"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    service_type = Column(String, nullable=False)
    years_experience = Column(Integer)
    hourly_rate = Column(Float, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BusinessService(Base):
    __tablename__ = "business_services"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    service_type = Column(String, nullable=False)
    years_experience = Column(Integer)
    business_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(String, unique=True, index=True, nullable=False)

    provider_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    client_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    service_type = Column(String, nullable=False)
    event_date = Column(String, nullable=True)
    event_time = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    budget = Column(Float, nullable=True)
    special_requirements = Column(Text, nullable=True)

    status = Column(String, default="pending")  # pending, confirmed, rejected, completed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BookingRequest(Base):
    __tablename__ = "booking_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True, nullable=False)

    provider_profile_id = Column(String, ForeignKey("user_profiles.user_id"), nullable=False)
    client_profile_id = Column(String, ForeignKey("user_profiles.user_id"), nullable=True)

    client_name = Column(String)
    client_email = Column(String)
    client_phone = Column(String)

    service_type = Column(String, nullable=False)
    event_date = Column(String, nullable=True)
    event_time = Column(String, nullable=True)
    duration_hours = Column(Integer, nullable=True)

    message = Column(Text, nullable=True)
    inventory_items = Column(JSON, nullable=True)

    status = Column(String, default="pending")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# ==================== OTHER MODELS ====================

class PortfolioItem(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image = Column(Text, nullable=False)  # base64
    category = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    service_type = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    type = Column(String)
    title = Column(String)
    message = Column(String)
    data = Column(JSON, nullable=True)

    read = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EquipmentItem(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    equipment_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)

    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    daily_rate = Column(Float, nullable=True)
    description = Column(Text, nullable=True)

    image = Column(Text, nullable=True)  # base64
    available = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    inventory_id = Column(String, unique=True, index=True, nullable=False)
    equipment_type = Column(String, nullable=False)

    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    serial_number = Column(String, nullable=False)

    purchase_date = Column(String, nullable=True)
    condition_status = Column(String, default="excellent")
    availability_status = Column(String, default="available")

    rental_price_6h = Column(Float, nullable=True)
    rental_price_8h = Column(Float, nullable=True)
    rental_price_12h = Column(Float, nullable=True)
    rental_price_24h = Column(Float, nullable=True)

    maintenance_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    provider_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QCPhoto(Base):
    __tablename__ = "qc_photos"

    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(String, ForeignKey("inventory.inventory_id"), nullable=False)
    photo_type = Column(String, nullable=False)  # delivery, return
    image = Column(Text, nullable=False)  # base64

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ServiceDetails(Base):
    __tablename__ = "service_details"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    service_type = Column(String, nullable=False)

    years_experience = Column(Integer, nullable=True)
    specialties = Column(JSON, nullable=True)
    quality_options = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ServicePricing(Base):
    __tablename__ = "service_pricing"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    service_type = Column(String, nullable=False)

    hourly_rate = Column(Float, nullable=True)
    half_day_rate = Column(Float, nullable=True)
    full_day_rate = Column(Float, nullable=True)
    event_rate = Column(Float, nullable=True)
    package_rate = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    category = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    image = Column(Text, nullable=True)
    author = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)

    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    services = Column(JSON, nullable=True)
    price = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())