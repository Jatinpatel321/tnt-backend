from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.deps import get_db
from app.core.security import get_current_user
from app.modules.rewards.service import (
    get_user_points, get_available_redemptions, redeem_points,
    initialize_default_rules
)
from app.modules.rewards.model import RedemptionType

router = APIRouter(prefix="/rewards", tags=["Rewards"])


class RedeemPointsRequest(BaseModel):
    redemption_type: RedemptionType
    points_used: float
    value: float
    order_id: Optional[int] = None


class RewardTransactionResponse(BaseModel):
    id: int
    reward_type: str
    points: float
    description: str
    created_at: str


class RewardRedemptionResponse(BaseModel):
    id: int
    redemption_type: str
    points_used: float
    value: float
    description: str
    created_at: str


class UserPointsResponse(BaseModel):
    current_points: float
    total_earned: float
    total_redeemed: float
    recent_transactions: List[RewardTransactionResponse]
    recent_redemptions: List[RewardRedemptionResponse]


class RedemptionRuleResponse(BaseModel):
    id: int
    redemption_type: str
    min_points: float
    max_discount_percentage: Optional[float]
    max_discount_amount: Optional[float]


@router.get("/points", response_model=UserPointsResponse)
def get_points(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Get user's current points and history"""
    return get_user_points(user["id"], db)


@router.get("/redemptions", response_model=List[RedemptionRuleResponse])
def get_redemptions(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Get available redemption options"""
    user_points = get_user_points(user["id"], db)["current_points"]
    return get_available_redemptions(user_points, db)


@router.post("/redeem")
def redeem_user_points(
    request: RedeemPointsRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    """Redeem points for discount or benefit"""
    try:
        redemption = redeem_points(
            user["id"],
            request.redemption_type,
            request.points_used,
            request.value,
            request.order_id,
            db
        )
        return {
            "message": "Points redeemed successfully",
            "redemption_id": redemption.id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/initialize-rules")
def init_rules(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Initialize default reward rules (admin only)"""
    # TODO: Add admin role check
    initialize_default_rules(db)
    return {"message": "Reward rules initialized"}
