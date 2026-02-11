from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.core.security import get_current_user_id
from app.modules.signals.service import SignalService

router = APIRouter(prefix="/signals", tags=["Signals"])


@router.get("/")
def get_user_signals(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Get personalized signals for the current user"""
    try:
        signals = SignalService.get_signals_for_user(user_id, db)
        return {"signals": signals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get signals: {str(e)}")


@router.get("/rush-hour")
def check_rush_hour_signals(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Check if user should be warned about rush hour"""
    try:
        signals = SignalService._check_rush_hour_signals(user_id, db)
        return {"signals": signals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check rush hour: {str(e)}")


@router.get("/slot-suggestions")
def get_slot_suggestions(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Get smart slot suggestions based on user behavior"""
    try:
        signals = SignalService._check_slot_suggestion_signals(user_id, db)
        return {"signals": signals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get slot suggestions: {str(e)}")


@router.get("/reorder-prompts")
def get_reorder_prompts(db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    """Get reorder suggestions for frequently ordered items"""
    try:
        signals = SignalService._check_reorder_signals(user_id, db)
        return {"signals": signals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reorder prompts: {str(e)}")
