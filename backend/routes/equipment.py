"""Equipment, inventory, and QC photos endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid

from database import get_db
from dependencies import get_current_user
import models

router = APIRouter(tags=["Equipment"])


# ==================== EQUIPMENT BRANDS/MODELS DATABASE ====================

EQUIPMENT_DATABASE = {
    "Camera": {
        "Canon": ["EOS R5", "EOS R6", "EOS 5D Mark IV", "EOS 6D Mark II", "EOS 90D"],
        "Sony": ["A7 IV", "A7R V", "A7S III", "A9 II", "ZV-E10"],
        "Nikon": ["Z9", "Z8", "Z6 III", "D850", "D780"],
        "Fujifilm": ["X-T5", "X-H2", "GFX 100S", "X-S20"],
        "Panasonic": ["Lumix S5 II", "Lumix GH6", "Lumix S1H"],
    },
    "Lens": {
        "Canon": ["RF 24-70mm f/2.8", "RF 70-200mm f/2.8", "RF 50mm f/1.2", "RF 85mm f/1.2"],
        "Sony": ["FE 24-70mm f/2.8 GM", "FE 70-200mm f/2.8 GM", "FE 50mm f/1.2 GM"],
        "Sigma": ["24-70mm f/2.8 Art", "35mm f/1.4 Art", "85mm f/1.4 Art"],
        "Tamron": ["28-75mm f/2.8", "70-180mm f/2.8", "17-28mm f/2.8"],
    },
    "Lighting": {
        "Godox": ["AD600 Pro", "AD400 Pro", "AD200 Pro", "V1", "AD300 Pro"],
        "Profoto": ["B10", "B10 Plus", "A1X", "D2"],
        "Aputure": ["600d Pro", "300d II", "MC Pro", "Amaran 200d"],
    },
    "Gimbal": {
        "DJI": ["RS 3 Pro", "RS 3", "RS 2", "Ronin 4D"],
        "Zhiyun": ["Crane 4", "Crane 3S", "Weebill 3"],
        "Moza": ["Air 2S", "AirCross 3"],
    },
    "Tripod": {
        "Manfrotto": ["MT055CXPRO4", "Befree Advanced", "190XPRO4"],
        "Gitzo": ["GT3543LS", "GT2545T", "Traveler"],
        "Benro": ["TMA48CL", "Mach3 TMA47A"],
    },
    "Drone": {
        "DJI": ["Mavic 3 Pro", "Mavic 3", "Air 3", "Mini 4 Pro", "Inspire 3"],
    },
    "Audio": {
        "Rode": ["Wireless Go II", "VideoMic Pro+", "NTG5"],
        "Sennheiser": ["MKE 600", "EW 112P G4", "AVX-MKE2"],
        "Zoom": ["H6", "H8", "F3"],
    },
    "Accessories": {
        "Generic": ["Memory Card", "Battery", "Filter", "Bag", "Monitor"],
    },
}


@router.get("/equipment/brands")
def get_equipment_brands(
    equipment_type: str = Query(..., description="Equipment type"),
):
    """Get available brands for an equipment type."""
    if equipment_type not in EQUIPMENT_DATABASE:
        return []
    return list(EQUIPMENT_DATABASE[equipment_type].keys())


@router.get("/equipment/models")
def get_equipment_models(
    equipment_type: str = Query(...),
    brand: str = Query(...),
):
    """Get available models for a brand."""
    if equipment_type not in EQUIPMENT_DATABASE:
        return []
    if brand not in EQUIPMENT_DATABASE[equipment_type]:
        return []
    return EQUIPMENT_DATABASE[equipment_type][brand]


# ==================== EQUIPMENT CRUD ====================

class EquipmentCreate(BaseModel):
    name: str
    category: str
    brand: Optional[str] = None
    model: Optional[str] = None
    daily_rate: Optional[float] = None
    description: Optional[str] = None
    image: Optional[str] = None


@router.get("/equipment")
def get_all_equipment(
    db: Session = Depends(get_db),
):
    """Get all available equipment."""
    items = db.query(models.EquipmentItem).filter_by(available=True).all()
    return [
        {
            "equipment_id": item.equipment_id,
            "name": item.name,
            "category": item.category,
            "brand": item.brand,
            "model": item.model,
            "daily_rate": item.daily_rate,
            "image": item.image,
            "available": item.available,
        }
        for item in items
    ]


@router.get("/equipment/my-equipment")
def get_my_equipment(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's equipment."""
    items = db.query(models.EquipmentItem).filter_by(owner_id=current_user.user_id).all()
    return [
        {
            "equipment_id": item.equipment_id,
            "name": item.name,
            "category": item.category,
            "brand": item.brand,
            "model": item.model,
            "daily_rate": item.daily_rate,
            "description": item.description,
            "image": item.image,
            "available": item.available,
        }
        for item in items
    ]


@router.get("/equipment/service/{service_type}")
def get_equipment_by_service(
    service_type: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's equipment filtered by service type (category)."""
    items = db.query(models.EquipmentItem).filter_by(
        owner_id=current_user.user_id, category=service_type
    ).all()
    return [
        {
            "equipment_id": item.equipment_id,
            "name": item.name,
            "brand": item.brand,
            "model": item.model,
        }
        for item in items
    ]


@router.post("/equipment")
def add_equipment(
    payload: EquipmentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add new equipment."""
    item = models.EquipmentItem(
        owner_id=current_user.user_id,
        equipment_id=str(uuid.uuid4()),
        name=payload.name,
        category=payload.category,
        brand=payload.brand,
        model=payload.model,
        daily_rate=payload.daily_rate,
        description=payload.description,
        image=payload.image,
        available=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"equipment_id": item.equipment_id, "status": "created"}


@router.post("/equipment/service")
def add_equipment_to_service(
    payload: EquipmentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add equipment (same as /equipment but semantic alias for service context)."""
    return add_equipment(payload, current_user, db)


@router.put("/equipment/{equipment_id}")
def update_equipment(
    equipment_id: str,
    payload: EquipmentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update equipment."""
    item = db.query(models.EquipmentItem).filter_by(
        equipment_id=equipment_id, owner_id=current_user.user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment not found")

    item.name = payload.name
    item.category = payload.category
    item.brand = payload.brand
    item.model = payload.model
    item.daily_rate = payload.daily_rate
    item.description = payload.description
    if payload.image:
        item.image = payload.image

    db.commit()
    return {"status": "updated"}


@router.delete("/equipment/{equipment_id}")
def delete_equipment(
    equipment_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete equipment."""
    db.query(models.EquipmentItem).filter_by(
        equipment_id=equipment_id, owner_id=current_user.user_id
    ).delete()
    db.commit()
    return {"status": "deleted"}


@router.delete("/equipment/service/{equipment_id}")
def delete_equipment_from_service(
    equipment_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete equipment (alias)."""
    return delete_equipment(equipment_id, current_user, db)


# ==================== INVENTORY ====================

class InventoryCreate(BaseModel):
    equipment_type: str
    brand: str
    model: str
    serial_number: str
    purchase_date: Optional[str] = None
    condition_status: Optional[str] = "excellent"
    rental_price_6h: Optional[float] = None
    rental_price_8h: Optional[float] = None
    rental_price_12h: Optional[float] = None
    rental_price_24h: Optional[float] = None
    maintenance_notes: Optional[str] = None


class RentRequest(BaseModel):
    renter_name: str
    renter_phone: Optional[str] = None
    rental_duration: str
    rental_date: Optional[str] = None


@router.get("/inventory")
def get_inventory(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's inventory."""
    items = db.query(models.InventoryItem).filter_by(owner_id=current_user.user_id).all()
    return [
        {
            "inventory_id": item.inventory_id,
            "equipment_type": item.equipment_type,
            "brand": item.brand,
            "model": item.model,
            "serial_number": item.serial_number,
            "purchase_date": item.purchase_date,
            "condition_status": item.condition_status,
            "availability_status": item.availability_status,
            "rental_price_6h": item.rental_price_6h,
            "rental_price_8h": item.rental_price_8h,
            "rental_price_12h": item.rental_price_12h,
            "rental_price_24h": item.rental_price_24h,
            "maintenance_notes": item.maintenance_notes,
        }
        for item in items
    ]


@router.post("/inventory")
def add_inventory(
    payload: InventoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add new inventory item."""
    item = models.InventoryItem(
        owner_id=current_user.user_id,
        inventory_id=str(uuid.uuid4()),
        equipment_type=payload.equipment_type,
        brand=payload.brand,
        model=payload.model,
        serial_number=payload.serial_number,
        purchase_date=payload.purchase_date,
        condition_status=payload.condition_status or "excellent",
        availability_status="available",
        rental_price_6h=payload.rental_price_6h,
        rental_price_8h=payload.rental_price_8h,
        rental_price_12h=payload.rental_price_12h,
        rental_price_24h=payload.rental_price_24h,
        maintenance_notes=payload.maintenance_notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"inventory_id": item.inventory_id, "status": "created"}


@router.put("/inventory/{inventory_id}")
def update_inventory(
    inventory_id: str,
    payload: InventoryCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update inventory item."""
    item = db.query(models.InventoryItem).filter_by(
        inventory_id=inventory_id, owner_id=current_user.user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item.equipment_type = payload.equipment_type
    item.brand = payload.brand
    item.model = payload.model
    item.serial_number = payload.serial_number
    item.purchase_date = payload.purchase_date
    item.condition_status = payload.condition_status
    item.rental_price_6h = payload.rental_price_6h
    item.rental_price_8h = payload.rental_price_8h
    item.rental_price_12h = payload.rental_price_12h
    item.rental_price_24h = payload.rental_price_24h
    item.maintenance_notes = payload.maintenance_notes

    db.commit()
    return {"status": "updated"}


@router.delete("/inventory/{inventory_id}")
def delete_inventory(
    inventory_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete inventory item."""
    # Also delete QC photos
    db.query(models.QCPhoto).filter_by(inventory_id=inventory_id).delete()
    db.query(models.InventoryItem).filter_by(
        inventory_id=inventory_id, owner_id=current_user.user_id
    ).delete()
    db.commit()
    return {"status": "deleted"}


@router.post("/inventory/{inventory_id}/rent")
def rent_inventory(
    inventory_id: str,
    payload: RentRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark inventory item as rented."""
    item = db.query(models.InventoryItem).filter_by(
        inventory_id=inventory_id, owner_id=current_user.user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item.availability_status = "rented"
    db.commit()

    return {"status": "rented", "renter_name": payload.renter_name}


@router.post("/inventory/{inventory_id}/return")
def return_inventory(
    inventory_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark inventory item as returned."""
    item = db.query(models.InventoryItem).filter_by(
        inventory_id=inventory_id, owner_id=current_user.user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item.availability_status = "available"
    db.commit()

    return {"status": "returned"}


# ==================== QC PHOTOS ====================

class QCPhotoCreate(BaseModel):
    photo_type: str  # delivery, return
    image: str  # base64


@router.get("/inventory/{inventory_id}/qc-photos")
def get_qc_photos(
    inventory_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get QC photos for inventory item."""
    photos = db.query(models.QCPhoto).filter_by(inventory_id=inventory_id).all()
    return [
        {
            "id": photo.id,
            "photo_type": photo.photo_type,
            "image": photo.image,
            "created_at": photo.created_at,
        }
        for photo in photos
    ]


@router.post("/inventory/{inventory_id}/qc-photos")
def add_qc_photo(
    inventory_id: str,
    payload: QCPhotoCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add QC photo for inventory item."""
    # Verify ownership
    item = db.query(models.InventoryItem).filter_by(
        inventory_id=inventory_id, owner_id=current_user.user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Check max photos (7 per type)
    existing_count = db.query(models.QCPhoto).filter_by(
        inventory_id=inventory_id, photo_type=payload.photo_type
    ).count()
    if existing_count >= 7:
        raise HTTPException(status_code=400, detail="Maximum 7 photos per type")

    photo = models.QCPhoto(
        inventory_id=inventory_id,
        photo_type=payload.photo_type,
        image=payload.image,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)

    return {"id": photo.id, "status": "created"}


@router.delete("/inventory/qc-photos/{photo_id}")
def delete_qc_photo(
    photo_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete QC photo."""
    photo = db.query(models.QCPhoto).filter_by(id=photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Verify ownership via inventory
    item = db.query(models.InventoryItem).filter_by(
        inventory_id=photo.inventory_id, owner_id=current_user.user_id
    ).first()
    if not item:
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(photo)
    db.commit()

    return {"status": "deleted"}
