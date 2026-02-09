from sqlalchemy import Column, Integer, ForeignKey, String, Enum, DateTime
from app.database.base import Base
from datetime import datetime
import enum


class JobStatus(enum.Enum):
    SUBMITTED = "submitted"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    COLLECTED = "collected"


class StationeryJob(Base):
    __tablename__ = "stationery_jobs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("stationery_services.id"), nullable=False)

    quantity = Column(Integer, nullable=False)
    file_url = Column(String, nullable=True)

    status = Column(Enum(JobStatus), default=JobStatus.SUBMITTED)
    created_at = Column(DateTime, default=datetime.utcnow)
