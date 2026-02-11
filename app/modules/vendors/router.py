from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_db
from app.modules.users.model import User, UserRole, VendorType
from app.database.base import Base

# Import models that will be created
# from app.modules.vendors.model import Vendor

router = APIRouter(prefix="/vendors", tags=["Vendors"])


# Temporary mock data until we create proper models
class MockVendor:
    def __init__(self, id, name, description, vendor_type, is_approved, phone, is_open=True, logo_url=None):
        self.id = id
        self.name = name
        self.description = description
        self.vendor_type = vendor_type
        self.is_approved = is_approved
        self.phone = phone
        self.is_open = is_open
        self.logo_url = logo_url


# Mock vendors data
MOCK_VENDORS = [
    MockVendor(
        id=1,
        name="Campus Cafe",
        description="Fresh coffee and snacks for students",
        vendor_type="food",
        is_approved=True,
        phone="9876543210",
        is_open=True,
        logo_url="https://via.placeholder.com/100x100/FF6B6B/FFFFFF?text=CC"
    ),
    MockVendor(
        id=2,
        name="Food Court",
        description="Variety of cuisines from around the world",
        vendor_type="food",
        is_approved=True,
        phone="9876543211",
        is_open=True,
        logo_url="https://via.placeholder.com/100x100/4ECDC4/FFFFFF?text=FC"
    ),
    MockVendor(
        id=3,
        name="Quick Bites",
        description="Fast food and beverages",
        vendor_type="food",
        is_approved=True,
        phone="9876543212",
        is_open=False,
        logo_url="https://via.placeholder.com/100x100/45B7D1/FFFFFF?text=QB"
    ),
]


@router.get("/")
def get_vendors(type: str = "food", db: Session = Depends(get_db)):
    """
    Get all vendors by type (food or stationery)
    """
    # Filter vendors by type
    filtered_vendors = [v for v in MOCK_VENDORS if v.vendor_type == type and v.is_approved]

    # Convert to dict format
    vendors_data = []
    for vendor in filtered_vendors:
        vendors_data.append({
            "id": vendor.id,
            "name": vendor.name,
            "description": vendor.description,
            "vendor_type": vendor.vendor_type,
            "is_approved": vendor.is_approved,
            "phone": vendor.phone,
            "is_open": vendor.is_open,
            "logo_url": vendor.logo_url
        })

    return vendors_data


@router.get("/{vendor_id}")
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    """
    Get single vendor details
    """
    vendor = next((v for v in MOCK_VENDORS if v.id == vendor_id), None)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return {
        "id": vendor.id,
        "name": vendor.name,
        "description": vendor.description,
        "vendor_type": vendor.vendor_type,
        "is_approved": vendor.is_approved,
        "phone": vendor.phone,
        "is_open": vendor.is_open,
        "logo_url": vendor.logo_url
    }


@router.get("/{vendor_id}/menu")
def get_vendor_menu(vendor_id: int, db: Session = Depends(get_db)):
    """
    Get vendor menu items
    """
    vendor = next((v for v in MOCK_VENDORS if v.id == vendor_id), None)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Mock menu items
    menu_items = [
        {
            "id": f"{vendor_id}-1",
            "vendor_id": vendor_id,
            "name": "Masala Dosa",
            "description": "Crispy dosa with potato filling and chutneys",
            "price": 80,
            "image_url": "https://via.placeholder.com/200x200/FFE66D/000000?text=Dosa",
            "is_available": True,
            "is_veg": True,
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": f"{vendor_id}-2",
            "vendor_id": vendor_id,
            "name": "Chicken Biryani",
            "description": "Aromatic basmati rice with tender chicken",
            "price": 120,
            "image_url": "https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Biryani",
            "is_available": True,
            "is_veg": False,
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": f"{vendor_id}-3",
            "vendor_id": vendor_id,
            "name": "Paneer Butter Masala",
            "description": "Creamy tomato curry with paneer cubes",
            "price": 100,
            "image_url": "https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=Paneer",
            "is_available": True,
            "is_veg": True,
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": f"{vendor_id}-4",
            "vendor_id": vendor_id,
            "name": "Cold Coffee",
            "description": "Chilled coffee with ice cream",
            "price": 60,
            "image_url": "https://via.placeholder.com/200x200/9B59B6/FFFFFF?text=Coffee",
            "is_available": True,
            "is_veg": True,
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": f"{vendor_id}-5",
            "vendor_id": vendor_id,
            "name": "Veg Sandwich",
            "description": "Grilled sandwich with fresh vegetables",
            "price": 50,
            "image_url": "https://via.placeholder.com/200x200/F39C12/FFFFFF?text=Sandwich",
            "is_available": True,
            "is_veg": True,
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]

    return menu_items


@router.get("/{vendor_id}/slots")
def get_vendor_slots(vendor_id: int, db: Session = Depends(get_db)):
    """
    Get vendor pickup slots
    """
    vendor = next((v for v in MOCK_VENDORS if v.id == vendor_id), None)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Mock slots
    slots = [
        {
            "id": f"{vendor_id}-slot-1",
            "vendor_id": vendor_id,
            "start_time": "12:00:00",
            "end_time": "12:30:00",
            "is_available": True,
            "max_orders": 10,
            "current_orders": 3
        },
        {
            "id": f"{vendor_id}-slot-2",
            "vendor_id": vendor_id,
            "start_time": "12:30:00",
            "end_time": "13:00:00",
            "is_available": True,
            "max_orders": 10,
            "current_orders": 7
        },
        {
            "id": f"{vendor_id}-slot-3",
            "vendor_id": vendor_id,
            "start_time": "13:00:00",
            "end_time": "13:30:00",
            "is_available": True,
            "max_orders": 10,
            "current_orders": 2
        },
        {
            "id": f"{vendor_id}-slot-4",
            "vendor_id": vendor_id,
            "start_time": "13:30:00",
            "end_time": "14:00:00",
            "is_available": False,
            "max_orders": 10,
            "current_orders": 10
        }
    ]

    return slots
