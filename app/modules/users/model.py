from sqlalchemy import Column, Integer, String, Enum
from app.database.base import Base
import enum
from sqlalchemy import Column, Boolean
from sqlalchemy import Enum
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from app.database.base import Base

# inside User model
is_active = Column(Boolean, default=True)
is_approved = Column(Boolean, default=False)  # 🔥 for vendors

class UserRole(enum.Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    VENDOR = "vendor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    university_id = Column(String, nullable=True)

class VendorType(enum.Enum):
    FOOD = "food"
    STATIONERY = "stationery"

class StationeryService(Base):
    __tablename__ = "stationery_services"

    id = Column(Integer, primary_key=True)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=False)  # Printing, Binding
    price_per_unit = Column(Integer, nullable=False)  # paise
    unit = Column(String, nullable=False)  # page, copy, job

    is_available = Column(Boolean, default=True)