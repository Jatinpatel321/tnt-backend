from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import get_current_user
from app.modules.group_cart.model import (
    Group,
    GroupCartItem,
    GroupMember,
    PaymentSplitType,
)
from app.modules.group_cart.service import GroupCartService
from app.modules.users.model import User

router = APIRouter(prefix="/groups", tags=["Group Cart"])


# Pydantic schemas
class CreateGroupRequest(BaseModel):
    name: str


class InviteMemberRequest(BaseModel):
    phone: str


class AddCartItemRequest(BaseModel):
    menu_item_id: int
    quantity: int


class LockSlotRequest(BaseModel):
    slot_id: int
    duration_minutes: Optional[int] = 30


class SetPaymentSplitRequest(BaseModel):
    split_type: PaymentSplitType
    amount: Optional[float] = None
    percentage: Optional[float] = None


class GroupResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    status: str
    created_at: datetime
    members: List[Any]
    cart_items: List[Any]
    slot_lock: Optional[Any]

    model_config = ConfigDict(from_attributes=True)


class GroupMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: str
    user: dict


class GroupCartItemResponse(BaseModel):
    id: int
    menu_item_id: int
    owner_id: int
    quantity: int
    price_at_time: float
    menu_item: dict
    owner: dict


# Routes
@router.post("/")
def create_group(
    request: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group cart"""
    service = GroupCartService(db)
    group = service.create_group(request.name, current_user["id"])

    # Return with populated relationships
    return service.get_group(group.id, current_user["id"])


@router.get("/my-groups")
def get_my_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all groups where user is a member"""
    groups = db.query(Group).join(GroupMember).filter(
        GroupMember.user_id == current_user["id"]
    ).all()

    return groups


@router.get("/{group_id}")
def get_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group details"""
    service = GroupCartService(db)
    return service.get_group(group_id, current_user["id"])


@router.post("/{group_id}/invite")
def invite_member(
    group_id: int,
    request: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite a member to the group"""
    service = GroupCartService(db)
    member = service.invite_member(group_id, current_user["id"], request.phone)
    return {"message": "Member invited successfully", "member_id": member.id}


@router.post("/{group_id}/cart")
def add_cart_item(
    group_id: int,
    request: AddCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add item to group cart"""
    service = GroupCartService(db)
    cart_item = service.add_cart_item(group_id, current_user["id"], request.menu_item_id, request.quantity)
    return {"message": "Item added to cart", "cart_item_id": cart_item.id}


@router.post("/{group_id}/slot/lock")
def lock_slot(
    group_id: int,
    request: LockSlotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lock a slot for the group"""
    service = GroupCartService(db)
    lock = service.lock_slot(group_id, current_user["id"], request.slot_id, request.duration_minutes)
    return {"message": "Slot locked successfully", "lock_id": lock.id}


@router.post("/{group_id}/order")
def place_group_order(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """Place order for the entire group"""
    service = GroupCartService(db)
    result = service.place_group_order(group_id, current_user["id"])

    # In a real implementation, you might want to process orders asynchronously
    # background_tasks.add_task(process_group_order_async, result)

    return result


@router.get("/{group_id}/payment-splits")
def get_payment_splits(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment split configuration"""
    service = GroupCartService(db)
    splits = service.get_payment_splits(group_id, current_user["id"])
    return splits


@router.post("/{group_id}/payment-split")
def set_payment_split(
    group_id: int,
    request: SetPaymentSplitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set payment split for current user"""
    service = GroupCartService(db)
    split = service.set_payment_split(
        group_id, current_user["id"], request.split_type, request.amount, request.percentage
    )
    return {"message": "Payment split updated", "split_id": split.id}


@router.delete("/{group_id}/cart/{item_id}")
def remove_cart_item(
    group_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove item from group cart (only owner can remove their items)"""
    service = GroupCartService(db)

    # Get the item to verify ownership
    item = db.query(GroupCartItem).filter(
        GroupCartItem.id == item_id,
        GroupCartItem.group_id == group_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if item.owner_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Can only remove your own items")

    db.delete(item)
    db.commit()

    return {"message": "Item removed from cart"}


