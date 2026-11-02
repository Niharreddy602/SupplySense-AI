import math
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.inventory import Product, RestockRecommendation
from app.models.sales import SalesRecord
from app.models.supplier import Supplier

logger = logging.getLogger(__name__)

class StockoutService:

    @staticmethod
    def calculate_stockout_risks(db: Session) -> List[Dict[str, Any]]:
        """
        Analyzes all products, calculates daily consumption rate, days until stockout,
        and generates actionable restocking suggestions.
        """
        products = db.query(Product).all()
        risk_list = []

        cutoff_date = datetime.utcnow() - timedelta(days=45)

        for product in products:
            # Query recent sales
            recent_sales = db.query(SalesRecord).filter(
                SalesRecord.product_id == product.id,
                SalesRecord.date >= cutoff_date
            ).all()

            if recent_sales:
                total_units = sum(s.quantity_sold for s in recent_sales)
                days_span = max(1, (datetime.utcnow() - min(s.date for s in recent_sales)).days)
                avg_daily_demand = max(0.5, total_units / days_span)
            else:
                avg_daily_demand = 2.0  # Conservative baseline estimate

            lead_time = product.lead_time_days if product.lead_time_days > 0 else 7
            safety_stock = product.safety_stock if product.safety_stock > 0 else 10
            
            # Days of inventory remaining
            days_until_stockout = product.current_stock / avg_daily_demand if avg_daily_demand > 0 else 999.0
            
            # Reorder point calculation: (Daily Demand * Lead Time) + Safety Stock
            calculated_rop = int(math.ceil((avg_daily_demand * lead_time) + safety_stock))
            
            # Economic Order Quantity (EOQ) formula: sqrt( (2 * D * S) / H )
            # D = Annual Demand, S = Fixed Order Cost (~$50), H = Holding Cost (~20% of Unit Cost)
            annual_demand = avg_daily_demand * 365
            order_cost = 50.0
            holding_cost = max(1.0, product.unit_cost * 0.20)
            eoq = int(math.ceil(math.sqrt((2 * annual_demand * order_cost) / holding_cost)))
            
            # Recommended quantity to order:
            recommended_qty = max(eoq, calculated_rop * 2 - product.current_stock)
            if recommended_qty < 10:
                recommended_qty = 25

            # Stockout Risk Scoring (0 to 100)
            if days_until_stockout <= 0 or product.current_stock == 0:
                risk_level = "Critical"
                risk_score = 98.0
            elif days_until_stockout <= lead_time:
                risk_level = "Critical"
                risk_score = min(95.0, 80.0 + ((lead_time - days_until_stockout) / lead_time) * 15.0)
            elif days_until_stockout <= lead_time * 1.5:
                risk_level = "High"
                risk_score = 65.0 + ((lead_time * 1.5 - days_until_stockout) / (lead_time * 0.5)) * 15.0
            elif days_until_stockout <= lead_time * 2.5:
                risk_level = "Moderate"
                risk_score = 35.0 + ((lead_time * 2.5 - days_until_stockout) / lead_time) * 25.0
            else:
                risk_level = "Low"
                risk_score = max(5.0, 30.0 - (days_until_stockout / 10.0))

            supplier_name = product.supplier.name if product.supplier else "Standard Supplier"

            risk_list.append({
                "product_id": product.id,
                "sku": product.sku,
                "name": product.name,
                "current_stock": product.current_stock,
                "avg_daily_demand": round(avg_daily_demand, 2),
                "lead_time_days": lead_time,
                "days_until_stockout": round(days_until_stockout, 1),
                "stockout_risk_level": risk_level,
                "risk_score": round(risk_score, 1),
                "reorder_point": calculated_rop,
                "recommended_order_quantity": recommended_qty,
                "supplier_name": supplier_name,
                "unit_cost": product.unit_cost
            })

        # Sort by risk score descending
        risk_list.sort(key=lambda x: x["risk_score"], reverse=True)
        return risk_list

    @classmethod
    def sync_recommendations_to_db(cls, db: Session):
        """
        Refreshes the restock_recommendations table with the latest high/critical items.
        """
        risks = cls.calculate_stockout_risks(db)
        
        for item in risks:
            if item["stockout_risk_level"] in ["Critical", "High", "Moderate"]:
                # Check if pending recommendation exists
                existing = db.query(RestockRecommendation).filter(
                    RestockRecommendation.product_id == item["product_id"],
                    RestockRecommendation.status == "Pending"
                ).first()

                reason = (
                    f"Stock ({item['current_stock']} units) will deplete in {item['days_until_stockout']} days. "
                    f"Lead time is {item['lead_time_days']} days with daily demand of {item['avg_daily_demand']} units."
                )
                estimated_cost = round(item["recommended_order_quantity"] * item["unit_cost"], 2)

                if existing:
                    existing.recommended_quantity = item["recommended_order_quantity"]
                    existing.current_stock = item["current_stock"]
                    existing.reorder_point = item["reorder_point"]
                    existing.risk_level = item["stockout_risk_level"]
                    existing.reason = reason
                    existing.estimated_cost = estimated_cost
                else:
                    new_rec = RestockRecommendation(
                        product_id=item["product_id"],
                        recommended_quantity=item["recommended_order_quantity"],
                        current_stock=item["current_stock"],
                        reorder_point=item["reorder_point"],
                        risk_level=item["stockout_risk_level"],
                        reason=reason,
                        estimated_cost=estimated_cost,
                        status="Pending"
                    )
                    db.add(new_rec)

        db.commit()

