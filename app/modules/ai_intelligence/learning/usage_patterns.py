from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Dict, List, Any
from app.modules.orders.model import Order


class UsagePatterns:
    """AI-powered usage pattern analysis"""

    def __init__(self, db: Session):
        self.db = db

    def analyze_user_patterns(self, user_id: int) -> Dict[str, Any]:
        """Analyze comprehensive usage patterns for a user"""

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        patterns = {
            "ordering_frequency": self._calculate_ordering_frequency(user_id, thirty_days_ago),
            "preferred_times": self._analyze_preferred_times(user_id, thirty_days_ago),
            "spending_patterns": self._analyze_spending_patterns(user_id, thirty_days_ago),
            "category_preferences": self._analyze_category_preferences(user_id, thirty_days_ago),
            "loyalty_patterns": self._analyze_loyalty_patterns(user_id, thirty_days_ago)
        }

        return patterns

    def analyze_system_patterns(self) -> Dict[str, Any]:
        """Analyze system-wide usage patterns"""

        seven_days_ago = datetime.utcnow() - timedelta(days=7)

        patterns = {
            "peak_hours": self._analyze_system_peak_hours(seven_days_ago),
            "popular_categories": self._analyze_popular_categories(seven_days_ago),
            "vendor_performance_trends": self._analyze_vendor_performance_trends(seven_days_ago),
            "demand_forecasting": self._generate_demand_forecast(seven_days_ago)
        }

        return patterns

    def _calculate_ordering_frequency(self, user_id: int, since: datetime) -> Dict[str, Any]:
        """Calculate user's ordering frequency"""

        total_orders = self.db.query(Order).filter(
            Order.user_id == user_id,
            Order.created_at >= since
        ).count()

        days_since = (datetime.utcnow() - since).days
        orders_per_day = total_orders / max(days_since, 1)

        # Classify frequency
        if orders_per_day >= 1.0:
            frequency_level = "high"
            description = "Daily ordering"
        elif orders_per_day >= 0.5:
            frequency_level = "medium"
            description = "2-3 times per week"
        elif orders_per_day >= 0.1:
            frequency_level = "low"
            description = "Weekly ordering"
        else:
            frequency_level = "rare"
            description = "Occasional ordering"

        return {
            "total_orders": total_orders,
            "orders_per_day": round(orders_per_day, 2),
            "frequency_level": frequency_level,
            "description": description
        }

    def _analyze_preferred_times(self, user_id: int, since: datetime) -> Dict[str, Any]:
        """Analyze user's preferred ordering times"""

        time_distribution = self.db.query(
            extract('hour', Order.created_at).label('hour'),
            func.count(Order.id).label('count')
        ).filter(
            Order.user_id == user_id,
            Order.created_at >= since
        ).group_by(extract('hour', Order.created_at))\
         .order_by(func.count(Order.id).desc())\
         .all()

        if not time_distribution:
            return {"preferred_hour": None, "time_pattern": "unknown"}

        preferred_hour = int(time_distribution[0].hour)

        # Classify time preference
        if 6 <= preferred_hour <= 10:
            time_pattern = "morning"
        elif 11 <= preferred_hour <= 14:
            time_pattern = "lunch"
        elif 15 <= preferred_hour <= 17:
            time_pattern = "afternoon"
        elif 18 <= preferred_hour <= 21:
            time_pattern = "dinner"
        else:
            time_pattern = "other"

        return {
            "preferred_hour": preferred_hour,
            "time_pattern": time_pattern,
            "distribution": [{"hour": int(row.hour), "count": row.count} for row in time_distribution]
        }

    def _analyze_spending_patterns(self, user_id: int, since: datetime) -> Dict[str, Any]:
        """Analyze user's spending patterns"""

        # This would require amount fields in orders
        # For now, return mock analysis
        return {
            "avg_order_value": 150.0,
            "total_spent": 2250.0,
            "spending_category": "medium",
            "budget_conscious": False
        }

    def _analyze_category_preferences(self, user_id: int, since: datetime) -> Dict[str, Any]:
        """Analyze user's category preferences"""

        # This would analyze food vs stationery preferences
        # For now, return mock analysis
        return {
            "preferred_category": "food",
            "category_distribution": {
                "food": 0.7,
                "stationery": 0.3
            },
            "diversity_score": 0.6
        }

    def _analyze_loyalty_patterns(self, user_id: int, since: datetime) -> Dict[str, Any]:
        """Analyze user's loyalty to vendors"""

        vendor_loyalty = self.db.query(
            Order.vendor_id,
            func.count(Order.id).label('order_count')
        ).filter(
            Order.user_id == user_id,
            Order.created_at >= since
        ).group_by(Order.vendor_id)\
         .order_by(func.count(Order.id).desc())\
         .all()

        if not vendor_loyalty:
            return {"loyalty_score": 0, "preferred_vendor": None}

        total_orders = sum(row.order_count for row in vendor_loyalty)
        top_vendor_orders = vendor_loyalty[0].order_count

        loyalty_score = top_vendor_orders / total_orders

        return {
            "loyalty_score": round(loyalty_score, 2),
            "preferred_vendor_id": vendor_loyalty[0].vendor_id,
            "vendor_distribution": [{"vendor_id": row.vendor_id, "count": row.order_count} for row in vendor_loyalty]
        }

    def _analyze_system_peak_hours(self, since: datetime) -> List[Dict[str, Any]]:
        """Analyze system-wide peak hours"""

        peak_hours = self.db.query(
            extract('hour', Order.created_at).label('hour'),
            func.count(Order.id).label('order_count')
        ).filter(Order.created_at >= since)\
         .group_by(extract('hour', Order.created_at))\
         .order_by(func.count(Order.id).desc())\
         .limit(5).all()

        return [{"hour": int(row.hour), "order_count": row.order_count} for row in peak_hours]

    def _analyze_popular_categories(self, since: datetime) -> Dict[str, Any]:
        """Analyze popular categories system-wide"""

        # Mock analysis - would need category classification
        return {
            "food_orders": 850,
            "stationery_orders": 150,
            "food_percentage": 85.0,
            "trending_category": "food"
        }

    def _analyze_vendor_performance_trends(self, since: datetime) -> List[Dict[str, Any]]:
        """Analyze vendor performance trends"""

        # Mock trends - would analyze completion rates, ratings, etc.
        return [
            {"vendor_id": 1, "trend": "improving", "completion_rate_change": 5.2},
            {"vendor_id": 2, "trend": "stable", "completion_rate_change": 0.1},
            {"vendor_id": 3, "trend": "declining", "completion_rate_change": -3.8}
        ]

    def _generate_demand_forecast(self, since: datetime) -> Dict[str, Any]:
        """Generate basic demand forecast"""

        # Simple forecasting based on recent trends
        recent_orders = self.db.query(func.count(Order.id)).filter(
            Order.created_at >= since
        ).scalar()

        days = (datetime.utcnow() - since).days
        daily_avg = recent_orders / max(days, 1)

        # Project next 7 days
        forecast = {
            "current_daily_avg": round(daily_avg, 1),
            "next_week_forecast": round(daily_avg * 7, 0),
            "growth_trend": "stable",  # Would analyze trend
            "confidence_level": "medium"
        }

        return forecast
