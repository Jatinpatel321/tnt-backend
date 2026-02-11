from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from fastapi import HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from app.database.session import get_db
from app.modules.group_cart.model import (
    Group, GroupMember, GroupCartItem, GroupSlotLock, GroupPaymentSplit,
    GroupStatus, GroupMemberRole, PaymentSplitType
)
from app.modules.users.model import User
from app.modules.menu.model import MenuItem
from app.modules.slots.model import Slot
from app.core.security import get_current_user


class GroupCartService:
    def __init__(self, db: Session):
        self.db = db

    def create_group(self, name: str, owner_id: int) -> Group:
        """Create a new group cart"""
        group = Group(
            name=name,
            owner_id=owner_id
        )
        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)

        # Add owner as first member
        owner_member = GroupMember(
            group_id=group.id,
            user_id=owner_id,
            role=GroupMemberRole.OWNER
        )
        self.db.add(owner_member)
        self.db.commit()

        return group

    def get_group(self, group_id: int, user_id: int) -> Group:
        """Get group with access check"""
        group = self.db.query(Group).options(
            joinedload(Group.members).joinedload(GroupMember.user),
            joinedload(Group.cart_items).joinedload(GroupCartItem.menu_item),
            joinedload(Group.cart_items).joinedload(GroupCartItem.owner),
            joinedload(Group.slot_lock).joinedload(GroupSlotLock.slot)
        ).filter(Group.id == group_id).first()

        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Check if user is member
        member = self.db.query(GroupMember).filter(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
        ).first()

        if not member:
            raise HTTPException(status_code=403, detail="Not a member of this group")

        return group

    def invite_member(self, group_id: int, inviter_id: int, invitee_phone: str) -> GroupMember:
        """Invite a user to join the group"""
        # Check if inviter is owner or member
        inviter_member = self.db.query(GroupMember).filter(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == inviter_id)
        ).first()

        if not inviter_member:
            raise HTTPException(status_code=403, detail="Not authorized to invite members")

        # Find user by phone
        invitee = self.db.query(User).filter(User.phone == invitee_phone).first()
        if not invitee:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if already a member
        existing_member = self.db.query(GroupMember).filter(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == invitee.id)
        ).first()

        if existing_member:
            raise HTTPException(status_code=400, detail="User is already a member")

        # Add as member
        member = GroupMember(
            group_id=group_id,
            user_id=invitee.id,
            role=GroupMemberRole.MEMBER
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)

        return member

    def add_cart_item(self, group_id: int, user_id: int, menu_item_id: int, quantity: int) -> GroupCartItem:
        """Add item to group cart"""
        # Verify user is member
        member = self.db.query(GroupMember).filter(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
        ).first()

        if not member:
            raise HTTPException(status_code=403, detail="Not a member of this group")

        # Get menu item and current price
        menu_item = self.db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail="Menu item not found")

        # Check if item already exists in cart
        existing_item = self.db.query(GroupCartItem).filter(
            and_(
                GroupCartItem.group_id == group_id,
                GroupCartItem.menu_item_id == menu_item_id,
                GroupCartItem.owner_id == user_id
            )
        ).first()

        if existing_item:
            # Update quantity
            existing_item.quantity += quantity
            self.db.commit()
            self.db.refresh(existing_item)
            return existing_item
        else:
            # Add new item
            cart_item = GroupCartItem(
                group_id=group_id,
                menu_item_id=menu_item_id,
                owner_id=user_id,
                quantity=quantity,
                price_at_time=menu_item.price
            )
            self.db.add(cart_item)
            self.db.commit()
            self.db.refresh(cart_item)
            return cart_item

    def lock_slot(self, group_id: int, user_id: int, slot_id: int, duration_minutes: int = 30) -> GroupSlotLock:
        """Lock a slot for the group"""
        # Verify user is member
        member = self.db.query(GroupMember).filter(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
        ).first()

        if not member:
            raise HTTPException(status_code=403, detail="Not a member of this group")

        # Check if slot is available
        slot = self.db.query(Slot).filter(Slot.id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Slot not found")

        # Check for existing locks
        existing_lock = self.db.query(GroupSlotLock).filter(
            and_(
                GroupSlotLock.slot_id == slot_id,
                GroupSlotLock.expires_at > datetime.utcnow()
            )
        ).first()

        if existing_lock and existing_lock.group_id != group_id:
            raise HTTPException(status_code=409, detail="Slot is locked by another group")

        # Create or update lock
        lock = self.db.query(GroupSlotLock).filter(GroupSlotLock.group_id == group_id).first()

        if lock:
            # Update existing lock
            lock.slot_id = slot_id
            lock.locked_by_id = user_id
            lock.locked_at = datetime.utcnow()
            lock.expires_at = datetime.utcnow() + timedelta(minutes=duration_minutes)
        else:
            # Create new lock
            lock = GroupSlotLock(
                group_id=group_id,
                slot_id=slot_id,
                locked_by_id=user_id,
                expires_at=datetime.utcnow() + timedelta(minutes=duration_minutes)
            )
            self.db.add(lock)

        self.db.commit()
        self.db.refresh(lock)
        return lock

    def place_group_order(self, group_id: int, user_id: int) -> dict:
        """Place order for the entire group"""
        # Verify user is owner
        group = self.get_group(group_id, user_id)
        if group.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Only group owner can place order")

        if not group.cart_items:
            raise HTTPException(status_code=400, detail="Group cart is empty")

        if not group.slot_lock:
            raise HTTPException(status_code=400, detail="No slot locked for the group")

        # Create individual orders for each member
        orders = []
        total_amount = 0

        for member in group.members:
            member_items = [item for item in group.cart_items if item.owner_id == member.user_id]
            if not member_items:
                continue

            # Calculate member's total
            member_total = sum(item.quantity * item.price_at_time for item in member_items)

            # Create order (simplified - would need full order creation logic)
            # This is a placeholder - actual implementation would use existing order service
            order_data = {
                "user_id": member.user_id,
                "vendor_id": member_items[0].menu_item.vendor_id,  # Assuming all items from same vendor
                "slot_id": group.slot_lock.slot_id,
                "items": [
                    {
                        "menu_item_id": item.menu_item_id,
                        "quantity": item.quantity,
                        "price": item.price_at_time
                    } for item in member_items
                ],
                "amount": member_total
            }

            # Here you would call the actual order creation service
            # For now, just simulate
            orders.append({
                "member_id": member.user_id,
                "order_data": order_data,
                "amount": member_total
            })
            total_amount += member_total

        # Update group status
        group.status = GroupStatus.ORDERED
        self.db.commit()

        return {
            "group_id": group_id,
            "orders": orders,
            "total_amount": total_amount,
            "slot_time": group.slot_lock.slot.time_range
        }

    def get_payment_splits(self, group_id: int, user_id: int) -> List[GroupPaymentSplit]:
        """Get payment split configuration for the group"""
        # Verify user is member
        self.get_group(group_id, user_id)  # Access check

        splits = self.db.query(GroupPaymentSplit).filter(
            GroupPaymentSplit.group_id == group_id
        ).all()

        return splits

    def set_payment_split(self, group_id: int, user_id: int, split_type: PaymentSplitType,
                         amount: Optional[float] = None, percentage: Optional[float] = None) -> GroupPaymentSplit:
        """Set payment split for a user"""
        # Verify user is member
        self.get_group(group_id, user_id)  # Access check

        # Remove existing split
        self.db.query(GroupPaymentSplit).filter(
            and_(GroupPaymentSplit.group_id == group_id, GroupPaymentSplit.user_id == user_id)
        ).delete()

        # Create new split
        split = GroupPaymentSplit(
            group_id=group_id,
            user_id=user_id,
            split_type=split_type,
            amount=amount,
            percentage=percentage
        )

        self.db.add(split)
        self.db.commit()
        self.db.refresh(split)

        return split
