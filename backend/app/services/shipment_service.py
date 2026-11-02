import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.shipment import Shipment
from app.models.supplier import Supplier

logger = logging.getLogger(__name__)

CARRIER_BASE_DELAY_PROB = {
    "DHL Express": 0.08,
    "FedEx Priority": 0.09,
    "UPS Supply Chain": 0.14,
    "Maersk Freight": 0.32,
    "BlueDart Logistics": 0.16,
    "Standard Logistics": 0.22
}

class ShipmentService:

    @classmethod
    def predict_shipment_delay(
        cls,
        carrier: str,
        origin: str,
        destination: str,
        order_date: datetime,
        estimated_delivery: datetime,
        supplier_on_time_rate: float = 0.90
    ) -> Dict[str, Any]:
        """
        Calculates delay probability and predicted delay days using carrier reliability,
        supplier historical punctuality, geographical route complexity, and elapsed timeline.
        """
        base_prob = CARRIER_BASE_DELAY_PROB.get(carrier, 0.18)
        risk_factors = []

        # 1. Supplier punctuality adjustment
        if supplier_on_time_rate < 0.85:
            base_prob += 0.20
            risk_factors.append(f"Supplier has low historical punctuality ({int(supplier_on_time_rate * 100)}% on-time).")
        elif supplier_on_time_rate > 0.95:
            base_prob -= 0.05

        # 2. International / Long-distance route check
        is_international = ("International" in origin or "China" in origin or "Germany" in origin or origin != destination)
        if is_international:
            base_prob += 0.15
            risk_factors.append("Cross-border customs and long-haul transit route.")

        # 3. Elapsed transit time check
        now = datetime.utcnow()
        total_duration = max(1, (estimated_delivery - order_date).total_seconds())
        elapsed_duration = max(0, (now - order_date).total_seconds())
        progress_ratio = elapsed_duration / total_duration

        if now > estimated_delivery:
            base_prob = max(base_prob, 0.85)
            overdue_days = max(1, (now - estimated_delivery).days)
            risk_factors.append(f"Shipment is already {overdue_days} day(s) past promised delivery.")
        elif progress_ratio > 0.85:
            base_prob += 0.25
            risk_factors.append("High transit duration elapsed with intermediate checkpoints remaining.")

        # Clamp probability between 0.02 and 0.98
        prob = max(0.02, min(0.98, base_prob))
        is_delayed = prob >= 0.45

        # Estimate delay days if delayed
        if prob > 0.70:
            pred_days = 4
        elif prob >= 0.45:
            pred_days = 2
        else:
            pred_days = 0

        return {
            "delay_probability": round(prob, 2),
            "is_delayed_risk": is_delayed,
            "predicted_delay_days": pred_days,
            "risk_factors": risk_factors
        }

    @classmethod
    def update_all_shipment_predictions(cls, db: Session):
        """
        Runs prediction across all active shipments and updates status/probability.
        """
        active_shipments = db.query(Shipment).filter(
            Shipment.status.in_(["In Transit", "Pending", "Out for Delivery"])
        ).all()

        for shipment in active_shipments:
            supplier = shipment.supplier
            otd_rate = supplier.on_time_delivery_rate if supplier else 0.90
            
            res = cls.predict_shipment_delay(
                carrier=shipment.carrier,
                origin=shipment.origin,
                destination=shipment.destination,
                order_date=shipment.order_date,
                estimated_delivery=shipment.estimated_delivery,
                supplier_on_time_rate=otd_rate
            )

            shipment.delay_probability = res["delay_probability"]
            shipment.predicted_delay_days = res["predicted_delay_days"]

            # If past estimated delivery and not yet marked delivered
            if datetime.utcnow() > shipment.estimated_delivery:
                shipment.status = "Delayed"
            elif res["delay_probability"] >= 0.75:
                shipment.status = "Delayed"

        db.commit()

