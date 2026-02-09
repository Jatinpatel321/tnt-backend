from pydantic import BaseModel
from enum import Enum
from typing import Optional


class UserRole(str, Enum):
    student = "student"
    faculty = "faculty"
    vendor = "vendor"
    admin = "admin"


class UserCreate(BaseModel):
    phone: str
    name: str
    role: UserRole
    university_id: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    phone: str
    name: str
    role: UserRole
    university_id: Optional[str] = None

    class Config:
        from_attributes = True
