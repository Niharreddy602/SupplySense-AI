from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.shipment import AnomalyLog
from app.schemas.ml import AnomalyItem
from app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])

@router.get("", response_model=List[AnomalyItem])
def get_anomalies(
    severity: str = Query(None),
    entity_type: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AnomalyLog)
    if severity:
        query = query.filter(AnomalyLog.severity == severity)
    if entity_type:
        query = query.filter(AnomalyLog.entity_type == entity_type)

    anomalies = query.order_by(AnomalyLog.detected_at.desc()).limit(limit).all()
    return anomalies

@router.post("/detect")
def run_anomaly_detection(
    contamination: float = Query(0.05, ge=0.01, le=0.20),
    db: Session = Depends(get_db)
):
    """Triggers ML Isolation Forest detection on sales, inventory, and shipment delays."""
    detected = AnomalyService.run_full_anomaly_detection(db, contamination=contamination)
    return {
        "status": "success",
        "message": f"Isolation Forest anomaly scan completed. Detected {len(detected)} new anomalies.",
        "new_anomalies_count": len(detected)
    }

@router.delete("/{anomaly_id}")
def dismiss_anomaly(anomaly_id: int, db: Session = Depends(get_db)):
    record = db.query(AnomalyLog).filter(AnomalyLog.id == anomaly_id).first()
    if record:
        db.delete(record)
        db.commit()
    return {"message": "Anomaly dismissed."}

