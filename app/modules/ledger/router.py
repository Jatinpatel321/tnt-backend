from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.modules.ledger.model import Ledger

router = APIRouter(prefix="/ledger", tags=["Ledger"])


@router.get("/")
def get_ledger(db: Session = Depends(get_db)):
    return (
        db.query(Ledger)
        .order_by(Ledger.created_at.desc())
        .all()
    )
