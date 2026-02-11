from sqlalchemy import Column, Integer, String, Enum, Boolean, JSON
from app.database.base import Base
import enum

class UserRole(enum.Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    VENDOR = "vendor"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    university_id = Column(String, nullable=True)

    # inside User model
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)  # 🔥 for vendors
    preferences = Column(JSON, default=dict)  # 🔥 for user preferences
