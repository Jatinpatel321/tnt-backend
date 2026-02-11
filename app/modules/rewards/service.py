from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.modules.rewards.model import (
    RewardPoints, RewardTransaction, RewardRedemption, RewardRule, RedemptionRule,
    RewardType, RedemptionType
)
from app.modules.users.model import User
from app.modules.orders.model import Order, OrderStatus
from app.modules.ledger.service import add_ledger_entry
from app.modules.ledger.model import LedgerType, LedgerSource
from datetime import datetime


def get_or_create_reward_points(user_id: int, db: Session) -> RewardPoints:
    """Get or create reward points record for user"""
    reward_points = db.query(RewardPoints).filter(RewardPoints.user_id == user_id).first()
    if not reward_points:
        reward_points = RewardPoints(user_id=user_id)
        db.add(reward_points)
        db.commit()
        db.refresh(reward_points)
    return reward_points


def award_points(user_id: int, reward_type: RewardType, points: float, description: str, order_id: int = None, db: Session = None):
    """Award points to user"""
    if db is None:
        from app.database.session import get_db
        db = next(get_db())

    # Create transaction record
    transaction = RewardTransaction(
        user_id=user_id,
        reward_type=reward_type,
        points=points,
        description=description,
        order_id=order_id
    )
    db.add(transaction)

    # Update points balance
    reward_points = get_or_create_reward_points(user_id, db)
    reward_points.points += points
    reward_points.total_earned += points

    db.commit()


def redeem_points(user_id: int, redemption_type: RedemptionType, points_used: float, value: float, order_id: int = None, db: Session = None):
    """Redeem points for discount/benefit"""
    if db is None:
        from app.database.session import get_db
        db = next(get_db())

    # Check if user has enough points
    reward_points = get_or_create_reward_points(user_id, db)
    if reward_points.points < points_used:
        raise ValueError("Insufficient points")

    # Validate redemption rules
    rule = db.query(RedemptionRule).filter(
        and_(RedemptionRule.redemption_type == redemption_type, RedemptionRule.is_active == 1)
    ).first()

    if not rule:
        raise ValueError("Redemption type not available")

    if points_used < rule.min_points:
        raise ValueError(f"Minimum {rule.min_points} points required")

    # For percentage discounts, validate max percentage
    if redemption_type == RedemptionType.DISCOUNT_PERCENTAGE and rule.max_discount_percentage:
        if value > rule.max_discount_percentage:
            raise ValueError(f"Maximum discount percentage is {rule.max_discount_percentage}%")

    # For fixed discounts, validate max amount
    if redemption_type == RedemptionType.DISCOUNT_FIXED and rule.max_discount_amount:
        if value > rule.max_discount_amount:
            raise ValueError(f"Maximum discount amount is ₹{rule.max_discount_amount}")

    # Create redemption record
    redemption = RewardRedemption(
        user_id=user_id,
        redemption_type=redemption_type,
        points_used=points_used,
        value=value,
        description=f"Redeemed {points_used} points for {redemption_type.value}",
        order_id=order_id
    )
    db.add(redemption)

    # Update points balance
    reward_points.points -= points_used
    reward_points.total_redeemed += points_used

    db.commit()
    db.refresh(redemption)
    return redemption


def get_user_points(user_id: int, db: Session):
    """Get user's points and recent transactions"""
    reward_points = get_or_create_reward_points(user_id, db)

    # Get recent transactions (last 10)
    transactions = db.query(RewardTransaction).filter(
        RewardTransaction.user_id == user_id
    ).order_by(RewardTransaction.created_at.desc()).limit(10).all()

    # Get recent redemptions (last 10)
    redemptions = db.query(RewardRedemption).filter(
        RewardRedemption.user_id == user_id
    ).order_by(RewardRedemption.created_at.desc()).limit(10).all()

    return {
        "current_points": reward_points.points,
        "total_earned": reward_points.total_earned,
        "total_redeemed": reward_points.total_redeemed,
        "recent_transactions": [
            {
                "id": t.id,
                "reward_type": t.reward_type.value,
                "points": t.points,
                "description": t.description,
                "created_at": t.created_at.isoformat()
            } for t in transactions
        ],
        "recent_redemptions": [
            {
                "id": r.id,
                "redemption_type": r.redemption_type.value,
                "points_used": r.points_used,
                "value": r.value,
                "description": r.description,
                "created_at": r.created_at.isoformat()
            } for r in redemptions
        ]
    }


def get_available_redemptions(user_points: float, db: Session):
    """Get available redemption options for user's points"""
    rules = db.query(RedemptionRule).filter(RedemptionRule.is_active == 1).all()

    available = []
    for rule in rules:
        if user_points >= rule.min_points:
            available.append({
                "id": rule.id,
                "redemption_type": rule.redemption_type.value,
                "min_points": rule.min_points,
                "max_discount_percentage": rule.max_discount_percentage,
                "max_discount_amount": rule.max_discount_amount
            })

    return available


def process_order_completion_rewards(order_id: int, db: Session):
    """Process rewards for completed order"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.status != OrderStatus.CONFIRMED:
        return

    # Get reward rules
    rule = db.query(RewardRule).filter(
        and_(RewardRule.reward_type == RewardType.ORDER_COMPLETION, RewardRule.is_active == 1)
    ).first()

    if not rule:
        return

    # Calculate points (amount in rupees / 100 since amount is in paise)
    order_amount_rupees = order.total_amount / 100
    points_earned = order_amount_rupees * rule.points_per_rupee

    award_points(
        order.user_id,
        RewardType.ORDER_COMPLETION,
        points_earned,
        f"Earned {points_earned} points for order completion",
        order_id,
        db
    )


def initialize_default_rules(db: Session):
    """Initialize default reward and redemption rules"""

    # Reward rules
    reward_rules = [
        RewardRule(reward_type=RewardType.ORDER_COMPLETION, points_per_rupee=1.0),
        RewardRule(reward_type=RewardType.FIRST_ORDER, fixed_points=50.0),
        RewardRule(reward_type=RewardType.REFERRAL, fixed_points=25.0),
        RewardRule(reward_type=RewardType.LOYALTY_MILESTONE, fixed_points=100.0),
    ]

    for rule in reward_rules:
        existing = db.query(RewardRule).filter(RewardRule.reward_type == rule.reward_type).first()
        if not existing:
            db.add(rule)

    # Redemption rules
    redemption_rules = [
        RedemptionRule(
            redemption_type=RedemptionType.DISCOUNT_PERCENTAGE,
            min_points=50.0,
            max_discount_percentage=20.0
        ),
        RedemptionRule(
            redemption_type=RedemptionType.DISCOUNT_FIXED,
            min_points=100.0,
            max_discount_amount=50.0
        ),
        RedemptionRule(
            redemption_type=RedemptionType.FREE_ITEM,
            min_points=200.0
        ),
    ]

    for rule in redemption_rules:
        existing = db.query(RedemptionRule).filter(RedemptionRule.redemption_type == rule.redemption_type).first()
        if not existing:
            db.add(rule)

    db.commit()
