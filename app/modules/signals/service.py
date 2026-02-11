from datetime import datetime, time
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.modules.orders.model import Order, OrderStatus
from app.modules.slots.model import Slot
from app.modules.menu.model import MenuItem
from app.modules.users.model import User


class SignalType:
    RUSH_HOUR_WARNING = "rush_hour_warning"
    SLOT_SUGGESTION = "slot_suggestion"
    REORDER_PROMPT = "reorder_prompt"


class SignalService:
    """Rule-based signal engine for smart suggestions without ML"""

    @staticmethod
    def get_signals_for_user(user_id: int, db: Session) -> List[Dict[str, Any]]:
        """Get all applicable signals for a user based on deterministic rules"""
        signals = []

        # Rush hour warning
        rush_signals = SignalService._check_rush_hour_signals(user_id, db)
        signals.extend(rush_signals)

        # Slot suggestions
        slot_signals = SignalService._check_slot_suggestion_signals(user_id, db)
        signals.extend(slot_signals)

        # Reorder prompts
        reorder_signals = SignalService._check_reorder_signals(user_id, db)
        signals.extend(reorder_signals)

        return signals

    @staticmethod
    def _check_rush_hour_signals(user_id: int, db: Session) -> List[Dict[str, Any]]:
        """Check if user should be warned about rush hours"""
        signals = []
        now = datetime.now()

        # Define rush hours (8-10 AM, 12-2 PM, 6-8 PM)
        rush_periods = [
            (time(8, 0), time(10, 0)),
            (time(12, 0), time(14, 0)),
            (time(18, 0), time(20, 0))
        ]

        current_time = now.time()
        is_rush_hour = any(start <= current_time <= end for start, end in rush_periods)

        if is_rush_hour:
            # Check if user has orders in next 2 hours
            upcoming_orders = db.query(Order).filter(
                Order.user_id == user_id,
                Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED]),
                Order.slot.has(Slot.start_time >= now),
                Order.slot.has(Slot.start_time <= now.replace(hour=now.hour + 2))
            ).all()

            if upcoming_orders:
                signals.append({
                    "type": SignalType.RUSH_HOUR_WARNING,
                    "title": "Rush Hour Alert",
                    "message": "You're ordering during peak hours. Consider adjusting your pickup time to avoid delays.",
                    "priority": "medium",
                    "action": "suggest_alternative_slots",
                    "data": {"upcoming_orders": len(upcoming_orders)}
                })

        return signals

    @staticmethod
    def _check_slot_suggestion_signals(user_id: int, db: Session) -> List[Dict[str, Any]]:
        """Suggest optimal slots based on user behavior and congestion"""
        signals = []

        # Get user's order history
        user_orders = db.query(Order).filter(
            Order.user_id == user_id,
            Order.status == OrderStatus.COMPLETED
        ).order_by(Order.created_at.desc()).limit(10).all()

        if not user_orders:
            return signals

        # Analyze preferred times
        preferred_hours = {}
        for order in user_orders:
            hour = order.slot.start_time.hour
            preferred_hours[hour] = preferred_hours.get(hour, 0) + 1

        if preferred_hours:
            best_hour = max(preferred_hours, key=preferred_hours.get)

            # Find slots with low congestion at preferred time
            today_slots = db.query(Slot).filter(
                Slot.start_time >= datetime.now(),
                Slot.start_time <= datetime.now().replace(hour=23, minute=59),
                Slot.start_time.hour == best_hour
            ).all()

            low_congestion_slots = [s for s in today_slots if s.congestion_level < 0.7]

            if low_congestion_slots:
                signals.append({
                    "type": SignalType.SLOT_SUGGESTION,
                    "title": "Smart Slot Suggestion",
                    "message": f"Based on your preferences, {low_congestion_slots[0].start_time.strftime('%I:%M %p')} has low congestion.",
                    "priority": "low",
                    "action": "suggest_slot",
                    "data": {"suggested_slot_id": low_congestion_slots[0].id}
                })

        return signals

    @staticmethod
    def _check_reorder_signals(user_id: int, db: Session) -> List[Dict[str, Any]]:
        """Suggest reordering popular items"""
        signals = []

        # Get completed orders from last 30 days
        thirty_days_ago = datetime.now().replace(day=datetime.now().day - 30)
        recent_orders = db.query(Order).filter(
            Order.user_id == user_id,
            Order.status == OrderStatus.COMPLETED,
            Order.created_at >= thirty_days_ago
        ).all()

        if not recent_orders:
            return signals

        # Count item frequencies
        item_counts = {}
        for order in recent_orders:
            for item in order.items:
                item_id = item.menu_item_id
                item_counts[item_id] = item_counts.get(item_id, 0) + item.quantity

        if item_counts:
            # Get most ordered item
            most_ordered_item_id = max(item_counts, key=item_counts.get)
            order_count = item_counts[most_ordered_item_id]

            # Only suggest if ordered 3+ times
            if order_count >= 3:
                menu_item = db.query(MenuItem).filter(MenuItem.id == most_ordered_item_id).first()
                if menu_item:
                    signals.append({
                        "type": SignalType.REORDER_PROMPT,
                        "title": "Reorder Favorite",
                        "message": f"You've ordered {menu_item.name} {order_count} times. Want to order again?",
                        "priority": "low",
                        "action": "suggest_reorder",
                        "data": {"item_id": most_ordered_item_id, "item_name": menu_item.name}
                    })

        return signals
