import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.models.shipment import Shipment

logger = logging.getLogger(__name__)

class SupplierService:

    @classmethod
    def evaluate_all_suppliers(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Calculates live performance metrics for all suppliers based on their shipments.
        """
        suppliers = db.query(Supplier).all()
        results = []

        for sup in suppliers:
            shipments = db.query(Shipment).filter(Shipment.supplier_id == sup.id).all()
            total_shipments = len(shipments)
            
            delivered_shipments = [s for s in shipments if s.actual_delivery is not None or s.status == "Delivered"]
            delayed_count = sum(1 for s in shipments if s.status == "Delayed" or (s.actual_delivery and s.actual_delivery > s.estimated_delivery))
            
            if total_shipments > 0:
                on_time_rate = max(0.0, min(1.0, 1.0 - (delayed_count / total_shipments)))
            else:
                on_time_rate = sup.on_time_delivery_rate

            # Assign Tier
            if on_time_rate >= 0.90 and sup.quality_rating >= 4.2:
                tier = "Tier 1 (Preferred)"
            elif on_time_rate >= 0.80 and sup.quality_rating >= 3.5:
                tier = "Tier 2 (Standard)"
            else:
                tier = "Tier 3 (Under Review)"

            # Update supplier record with calculated rate
            sup.on_time_delivery_rate = round(on_time_rate, 2)
            sup.tier = tier

            results.append({
                "id": sup.id,
                "name": sup.name,
                "contact_email": sup.contact_email,
                "location": sup.location,
                "lead_time_days": sup.lead_time_days,
                "on_time_delivery_rate": round(on_time_rate * 100, 1),
                "quality_rating": sup.quality_rating,
                "tier": tier,
                "total_shipments": total_shipments,
                "delayed_shipments": delayed_count,
                "products_supplied": len(sup.products)
            })

        db.commit()
        return results

