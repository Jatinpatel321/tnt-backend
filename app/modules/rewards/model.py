from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Enum, Float
from app.database.base import Base
from datetime import datetime
import enum


class RewardType(enum.Enum):
    ORDER_COMPLETION = "order_completion"
    REFERRAL = "referral"
    FIRST_ORDER = "first_order"
    LOYALTY_MILESTONE = "loyalty_milestone"


class RedemptionType(enum.Enum):
    DISCOUNT_PERCENTAGE = "discount_percentage"
    DISCOUNT_FIXED = "discount_fixed"
    FREE_ITEM = "free_item"


class RewardPoints(Base):
    __tablename__ = "reward_points"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Float, nullable=False, default=0.0)  # Allow decimal points
    total_earned = Column(Float, nullable=False, default=0.0)
    total_redeemed = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_type = Column(Enum(RewardType), nullable=False)
    points = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    redemption_type = Column(Enum(RedemptionType), nullable=False)
    points_used = Column(Float, nullable=False)
    value = Column(Float, nullable=False)  # discount amount or item value
    description = Column(String, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RewardRule(Base):
    __tablename__ = "reward_rules"

    id = Column(Integer, primary_key=True, index=True)
    reward_type = Column(Enum(RewardType), nullable=False, unique=True)
    points_per_rupee = Column(Float, nullable=False, default=1.0)  # Points earned per rupee spent
    fixed_points = Column(Float, nullable=True)  # Fixed points for certain actions
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class RedemptionRule(Base):
    __tablename__ = "redemption_rules"

    id = Column(Integer, primary_key=True, index=True)
    redemption_type = Column(Enum(RedemptionType), nullable=False, unique=True)
    min_points = Column(Float, nullable=False)
    max_discount_percentage = Column(Float, nullable=True)  # For percentage discounts
    max_discount_amount = Column(Float, nullable=True)  # For fixed discounts
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
