import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from app.models.shipment import AnomalyLog, Shipment
from app.models.sales import SalesRecord
from app.models.inventory import Product

logger = logging.getLogger(__name__)

class AnomalyService:

    @classmethod
    def run_full_anomaly_detection(cls, db: Session, contamination: float = 0.05) -> List[AnomalyLog]:
        """
        Runs Isolation Forest on historical sales, inventory levels, and shipments.
        Stores and returns detected anomalies.
        """
        detected_anomalies: List[AnomalyLog] = []

        # 1. SALES DEMAND ANOMALY DETECTION
        sales_records = db.query(SalesRecord).order_by(SalesRecord.date.desc()).limit(1000).all()
        if len(sales_records) >= 15:
            sales_data = []
            for s in sales_records:
                sales_data.append({
                    "id": s.id,
                    "product_id": s.product_id,
                    "quantity": s.quantity_sold,
                    "revenue": s.total_revenue,
                    "date": s.date
                })
            
            df_sales = pd.DataFrame(sales_data)
            X_sales = df_sales[["quantity", "revenue"]].values

            iso_sales = IsolationForest(contamination=contamination, random_state=42)
            preds = iso_sales.fit_predict(X_sales)
            scores = iso_sales.decision_function(X_sales)

            mean_qty = float(df_sales["quantity"].mean())
            std_qty = float(df_sales["quantity"].std())
            lower_expected = max(0, int(mean_qty - 2 * std_qty))
            upper_expected = int(mean_qty + 2 * std_qty)

            for idx, pred in enumerate(preds):
                if pred == -1: # Anomaly detected
                    row = df_sales.iloc[idx]
                    score = float(scores[idx])
                    val = float(row["quantity"])
                    
                    if val > upper_expected:
                        metric_name = "Unusual Demand Surge / Spike"
                        severity = "High" if val > upper_expected * 1.5 else "Medium"
                        details = f"Sales quantity of {int(val)} units is substantially higher than standard expectation ({lower_expected}-{upper_expected})."
                    else:
                        metric_name = "Unusual Demand Plummet"
                        severity = "Medium"
                        details = f"Abnormally low sales quantity of {int(val)} units recorded."

                    # Check if already logged recently
                    existing = db.query(AnomalyLog).filter(
                        AnomalyLog.entity_type == "Sales",
                        AnomalyLog.entity_id == int(row["id"])
                    ).first()

                    if not existing:
                        anomaly = AnomalyLog(
                            entity_type="Sales",
                            entity_id=int(row["id"]),
                            metric_name=metric_name,
                            anomaly_score=round(score, 3),
                            detected_value=val,
                            expected_range=f"{lower_expected} - {upper_expected} units",
                            severity=severity,
                            details=details,
                            detected_at=row["date"]
                        )
                        db.add(anomaly)
                        detected_anomalies.append(anomaly)

        # 2. INVENTORY HEALTH ANOMALY DETECTION
        products = db.query(Product).all()
        for p in products:
            if p.current_stock == 0:
                existing = db.query(AnomalyLog).filter(
                    AnomalyLog.entity_type == "Inventory",
                    AnomalyLog.entity_id == p.id,
                    AnomalyLog.metric_name == "Critical Stockout Depletion"
                ).first()
                if not existing:
                    anomaly = AnomalyLog(
                        entity_type="Inventory",
                        entity_id=p.id,
                        metric_name="Critical Stockout Depletion",
                        anomaly_score=-0.75,
                        detected_value=0.0,
                        expected_range=f"> {p.reorder_point} units",
                        severity="Critical",
                        details=f"Product {p.sku} ({p.name}) is fully depleted while customer demand persists.",
                        detected_at=datetime.utcnow()
                    )
                    db.add(anomaly)
                    detected_anomalies.append(anomaly)

        # 3. SHIPMENT SEVERE DELAYS
        overdue_shipments = db.query(Shipment).filter(
            Shipment.status.in_(["Delayed", "In Transit"]),
            Shipment.estimated_delivery < datetime.utcnow() - timedelta(days=2)
        ).all()

        for ship in overdue_shipments:
            overdue_days = (datetime.utcnow() - ship.estimated_delivery).days
            existing = db.query(AnomalyLog).filter(
                AnomalyLog.entity_type == "Shipment",
                AnomalyLog.entity_id == ship.id
            ).first()
            if not existing:
                anomaly = AnomalyLog(
                    entity_type="Shipment",
                    entity_id=ship.id,
                    metric_name="Severe Transit Delay Anomaly",
                    anomaly_score=-0.65,
                    detected_value=float(overdue_days),
                    expected_range="<= 0 days delay",
                    severity="High" if overdue_days >= 4 else "Medium",
                    details=f"Shipment {ship.tracking_number} is {overdue_days} days overdue beyond promised SLA.",
                    detected_at=datetime.utcnow()
                )
                db.add(anomaly)
                detected_anomalies.append(anomaly)

        db.commit()
        return detected_anomalies

