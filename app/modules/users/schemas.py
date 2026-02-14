from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserRole(str, Enum):
    student = "student"
    faculty = "faculty"
    vendor = "vendor"
    admin = "admin"
    super_admin = "super_admin"


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

    model_config = ConfigDict(from_attributes=True)
