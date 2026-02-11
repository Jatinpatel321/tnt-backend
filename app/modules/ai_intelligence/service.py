from sqlalchemy.orm import Session
from typing import List, Dict, Any
from .planners.demand_planner import DemandPlanner
from .planners.slot_planner import SlotPlanner
from .planners.vendor_ranker import VendorRanker
from .planners.eta_engine import ETAEngine
from .planners.reorder_engine import ReorderEngine
from .learning.preference_engine import PreferenceEngine
from .utils.scoring import SlotScoring, VendorScoring
from .schemas import *


class AIIntelligenceService:
    """Main AI Intelligence Service coordinating all AI features"""

    def __init__(self, db: Session):
        self.db = db
        self.demand_planner = DemandPlanner(db)
        self.slot_planner = SlotPlanner(db)
        self.vendor_ranker = VendorRanker(db)
        self.eta_engine = ETAEngine(db)
        self.reorder_engine = ReorderEngine(db)
        self.preference_engine = PreferenceEngine(db)

    def get_demand_planning(self, vendor_id: int) -> DemandPlanningResponse:
        """Get demand planning insights for vendor"""
        return self.demand_planner.get_demand_planning(vendor_id)

    def get_capacity_recommendation(self, vendor_id: int) -> CapacityRecommendationResponse:
        """Get AI capacity recommendation for vendor"""
        result = self.slot_planner.get_capacity_recommendation(vendor_id)
        return CapacityRecommendationResponse(**result)

    def get_slot_recommendations(self, user_id: int = None) -> SlotRecommendationsResponse:
        """Get AI-powered slot recommendations"""
        # Get all available slots
        from app.modules.slots.model import Slot
        slots = self.db.query(Slot).filter(Slot.status != "full").all()

        recommendations = []
        best_score = 0
        best_slot_id = None

        for slot in slots:
            # Calculate vendor speed score
            vendor_speed_score = VendorScoring.calculate_vendor_speed_score(slot.vendor_id, self.db)

            # Calculate historical completion rate
            completion_rate = VendorScoring.calculate_historical_completion_rate(slot.vendor_id, self.db)

            # Calculate slot score
            score = SlotScoring.calculate_slot_score(slot, vendor_speed_score, completion_rate)

            reasoning = self._generate_slot_reasoning(slot, score, vendor_speed_score, completion_rate)

            recommendations.append({
                "slot_id": slot.id,
                "score": score,
                "reasoning": reasoning,
                "estimated_eta_minutes": self.eta_engine.predict_eta(slot.id, slot.vendor_id)["predicted_eta_minutes"]
            })

            if score > best_score:
                best_score = score
                best_slot_id = slot.id

        # Sort by score descending
        recommendations.sort(key=lambda x: x["score"], reverse=True)

        return SlotRecommendationsResponse(
            recommendations=recommendations,
            best_slot_id=best_slot_id
        )

    def get_predictive_eta(self, slot_id: int, vendor_id: int) -> PredictiveETAResponse:
        """Get predictive ETA for slot"""
        result = self.eta_engine.predict_eta(slot_id, vendor_id)
        return PredictiveETAResponse(**result)

    def get_vendor_ranking(self) -> VendorRankingResponse:
        """Get AI-powered vendor rankings"""
        rankings = self.vendor_ranker.get_vendor_rankings()
        return VendorRankingResponse(rankings=rankings)

    def get_personalization(self, user_id: int) -> PersonalizationResponse:
        """Get personalized recommendations"""
        result = self.preference_engine.get_personalization(user_id)
        return PersonalizationResponse(**result)

    def get_reorder_suggestions(self, user_id: int) -> ReorderSuggestionsResponse:
        """Get smart reorder suggestions"""
        result = self.reorder_engine.generate_reorder_suggestions(user_id)
        return ReorderSuggestionsResponse(**result)

    def get_proactive_alerts(self, user_id: int = None) -> ProactiveAlertsResponse:
        """Generate proactive AI alerts"""
        alerts = []

        # Rush hour alerts
        rush_alerts = self._generate_rush_hour_alerts()
        alerts.extend(rush_alerts)

        # Delay risk alerts
        if user_id:
            delay_alerts = self._generate_delay_risk_alerts(user_id)
            alerts.extend(delay_alerts)

        # Vendor overload alerts
        overload_alerts = self._generate_vendor_overload_alerts()
        alerts.extend(overload_alerts)

        return ProactiveAlertsResponse(alerts=alerts)

    def get_group_coordination(self, user_ids: List[int]) -> GroupCoordinationResponse:
        """Get group coordination intelligence"""
        # This is a placeholder for future group cart integration
        return GroupCoordinationResponse(
            overlapping_windows=[],
            suggested_unified_slot=None,
            coordination_score=0.0
        )

    def _generate_slot_reasoning(self, slot: Slot, score: float, speed_score: float, completion_rate: float) -> str:
        """Generate human-readable reasoning for slot score"""

        reasons = []

        if score >= 80:
            reasons.append("Excellent choice")
        elif score >= 60:
            reasons.append("Good option")
        else:
            reasons.append("Consider alternative")

        if speed_score > 70:
            reasons.append("fast vendor")
        elif speed_score < 40:
            reasons.append("slower vendor")

        if completion_rate > 0.9:
            reasons.append("highly reliable")
        elif completion_rate < 0.7:
            reasons.append("variable reliability")

        capacity_remaining = max(0, slot.max_orders - slot.current_orders)
        if capacity_remaining < 3:
            reasons.append("limited spots")

        return ", ".join(reasons)

    def _generate_rush_hour_alerts(self) -> List[AIAlert]:
        """Generate rush hour alerts"""
        alerts = []

        current_hour = datetime.utcnow().hour

        # Peak lunch hours
        if 12 <= current_hour <= 14:
            alerts.append(AIAlert(
                type="rush_hour",
                severity="medium",
                explanation="High demand expected during lunch hours",
                suggested_action="Consider ordering earlier or choosing a different time slot"
            ))

        # Peak dinner hours
        elif 19 <= current_hour <= 21:
            alerts.append(AIAlert(
                type="rush_hour",
                severity="medium",
                explanation="High demand expected during dinner hours",
                suggested_action="Consider ordering earlier or choosing a different time slot"
            ))

        return alerts

    def _generate_delay_risk_alerts(self, user_id: int) -> List[AIAlert]:
        """Generate delay risk alerts for user"""
        alerts = []

        # Check user's upcoming orders
        from app.modules.orders.model import Order
        from datetime import datetime, timedelta

        upcoming_orders = self.db.query(Order).filter(
            Order.user_id == user_id,
            Order.status.in_(["confirmed", "preparing"]),
            Order.created_at >= datetime.utcnow() - timedelta(hours=2)
        ).all()

        for order in upcoming_orders:
            eta_prediction = self.get_predictive_eta(order.slot_id, order.vendor_id)

            if eta_prediction.delay_risk_level == "HIGH":
                alerts.append(AIAlert(
                    type="delay_risk",
                    severity="high",
                    explanation=f"High delay risk detected for order #{order.id}",
                    suggested_action="Consider contacting vendor or reordering"
                ))

        return alerts

    def _generate_vendor_overload_alerts(self) -> List[AIAlert]:
        """Generate vendor overload alerts"""
        alerts = []

        # Check for overloaded vendors
        from app.modules.slots.model import Slot

        overloaded_slots = self.db.query(Slot).filter(
            Slot.current_orders >= Slot.max_orders * 0.9,
            Slot.max_orders > 0
        ).all()

        for slot in overloaded_slots:
            alerts.append(AIAlert(
                type="vendor_overload",
                severity="medium",
                explanation=f"Vendor {slot.vendor_id} is experiencing high load",
                suggested_action="Consider alternative vendors or later time slots"
            ))

        return alerts
