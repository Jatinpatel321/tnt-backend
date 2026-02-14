from datetime import datetime, timedelta
from typing import Any, Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.time_utils import utcnow_naive
from app.modules.menu.model import MenuItem
from app.modules.orders.model import Order, OrderItem


class PreferenceEngine:
    """AI-powered user preference learning engine"""

    def __init__(self, db: Session):
        self.db = db

    def get_personalization(self, user_id: int) -> Dict[str, Any]:
        """Get personalized recommendations for user"""

        thirty_days_ago = utcnow_naive() - timedelta(days=30)

        # Analyze user preferences
        frequent_items = self._get_frequent_items(user_id, thirty_days_ago)
        preferred_vendors = self._get_preferred_vendors(user_id, thirty_days_ago)
        preferred_times = self._get_preferred_times(user_id, thirty_days_ago)

        # Generate recommendations
        recommended_items = self._generate_item_recommendations(user_id, frequent_items)
        smart_suggestions = self._generate_smart_suggestions(user_id, preferred_vendors, preferred_times)

        return {
            "recommended_for_you": recommended_items,
            "smart_suggestions": smart_suggestions
        }

    def _get_frequent_items(self, user_id: int, since: datetime) -> List[Dict[str, Any]]:
        """Get user's most frequently ordered items"""

        frequent_items_query = self.db.query(
            OrderItem.menu_item_id,
            func.count(OrderItem.id).label('order_count'),
            func.avg(OrderItem.quantity).label('avg_quantity')
        ).join(Order).filter(
            Order.user_id == user_id,
            Order.created_at >= since
        ).group_by(OrderItem.menu_item_id)\
         .order_by(func.count(OrderItem.id).desc())\
         .limit(10).all()

        frequent_items = []
        for row in frequent_items_query:
            menu_item = self.db.query(MenuItem).filter(MenuItem.id == row.menu_item_id).first()
            if menu_item:
                frequent_items.append({
                    "menu_item_id": row.menu_item_id,
                    "name": menu_item.name,
                    "order_count": row.order_count,
                    "avg_quantity": float(row.avg_quantity)
                })

        return frequent_items

    def _get_preferred_vendors(self, user_id: int, since: datetime) -> List[Dict[str, Any]]:
        """Get user's preferred vendors"""

        preferred_vendors_query = self.db.query(
            Order.vendor_id,
            func.count(Order.id).label('order_count')
        ).filter(
            Order.user_id == user_id,
            Order.created_at >= since
        ).group_by(Order.vendor_id)\
         .order_by(func.count(Order.id).desc())\
         .limit(5).all()

        preferred_vendors = []
        for row in preferred_vendors_query:
            preferred_vendors.append({
                "vendor_id": row.vendor_id,
                "order_count": row.order_count
            })

        return preferred_vendors

    def _get_preferred_times(self, user_id: int, since: datetime) -> Dict[str, Any]:
        """Get user's preferred ordering times"""

        preferred_time_query = self.db.query(
            func.extract('hour', Order.created_at).label('hour'),
            func.count(Order.id).label('count')
        ).filter(
            Order.user_id == user_id,
            Order.created_at >= since
        ).group_by(func.extract('hour', Order.created_at))\
         .order_by(func.count(Order.id).desc())\
         .first()

        if preferred_time_query:
            return {
                "preferred_hour": int(preferred_time_query.hour),
                "order_count": preferred_time_query.count
            }

        return {"preferred_hour": 12, "order_count": 0}  # Default to noon

    def _generate_item_recommendations(self, user_id: int, frequent_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate item recommendations based on user history"""

        recommendations = []

        # Recommend variations of frequently ordered items
        for item in frequent_items[:3]:  # Top 3 items
            # Find similar items from same vendor
            menu_item = self.db.query(MenuItem).filter(MenuItem.id == item["menu_item_id"]).first()
            if menu_item:
                similar_items = self.db.query(MenuItem).filter(
                    MenuItem.vendor_id == menu_item.vendor_id,
                    MenuItem.id != item["menu_item_id"],
                    MenuItem.is_available == True
                ).limit(2).all()

                for similar_item in similar_items:
                    recommendations.append({
                        "item_id": similar_item.id,
                        "name": similar_item.name,
                        "reason": f"Similar to your favorite {menu_item.name}",
                        "confidence": 0.8
                    })

        # If no similar items, recommend popular items
        if not recommendations:
            popular_items = self.db.query(
                MenuItem.id,
                MenuItem.name,
                func.count(OrderItem.id).label('popularity')
            ).join(OrderItem).group_by(MenuItem.id, MenuItem.name)\
             .order_by(func.count(OrderItem.id).desc())\
             .limit(3).all()

            for item in popular_items:
                recommendations.append({
                    "item_id": item.id,
                    "name": item.name,
                    "reason": "Popular choice among users",
                    "confidence": 0.6
                })

        return recommendations[:5]  # Limit to 5 recommendations

    def _generate_smart_suggestions(self, user_id: int, preferred_vendors: List[Dict[str, Any]], preferred_times: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate smart suggestions based on user patterns"""

        suggestions = []

        # Time-based suggestion
        current_hour = utcnow_naive().hour
        preferred_hour = preferred_times.get("preferred_hour", 12)

        if abs(current_hour - preferred_hour) <= 2:
            suggestions.append({
                "type": "timing",
                "title": "Perfect Timing!",
                "message": f"This is usually when you place orders. Consider ordering now.",
                "priority": "high"
            })

        # Vendor loyalty suggestion
        if preferred_vendors:
            top_vendor = preferred_vendors[0]
            suggestions.append({
                "type": "loyalty",
                "title": "Your Favorite Vendor",
                "message": f"You've ordered {top_vendor['order_count']} times from vendor {top_vendor['vendor_id']}",
                "priority": "medium"
            })

        # Reorder reminder (if no recent orders)
        seven_days_ago = utcnow_naive() - timedelta(days=7)
        recent_orders = self.db.query(Order).filter(
            Order.user_id == user_id,
            Order.created_at >= seven_days_ago
        ).count()

        if recent_orders == 0:
            suggestions.append({
                "type": "reorder",
                "title": "Time for a Treat?",
                "message": "It's been a while since your last order. Check out our recommendations!",
                "priority": "low"
            })

        return suggestions
