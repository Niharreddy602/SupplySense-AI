from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.shipment import Shipment
from app.models.supplier import Supplier
from app.models.inventory import Product
from app.schemas.shipment import (
    ShipmentCreate, ShipmentUpdate, ShipmentResponse,
    DelayPredictionRequest, DelayPredictionResponse
)
from app.services.shipment_service import ShipmentService

router = APIRouter(prefix="/api/shipments", tags=["Shipments"])

@router.get("", response_model=List[ShipmentResponse])
def get_shipments(
    status: Optional[str] = Query(None),
    carrier: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Run dynamic refresh on predictions
    ShipmentService.update_all_shipment_predictions(db)

    query = db.query(Shipment)
    if status:
        query = query.filter(Shipment.status == status)
    if carrier:
        query = query.filter(Shipment.carrier == carrier)

    shipments = query.order_by(Shipment.order_date.desc()).all()
    results = []
    for s in shipments:
        results.append(ShipmentResponse(
            id=s.id,
            tracking_number=s.tracking_number,
            supplier_id=s.supplier_id,
            product_id=s.product_id,
            quantity=s.quantity,
            order_date=s.order_date,
            estimated_delivery=s.estimated_delivery,
            actual_delivery=s.actual_delivery,
            origin=s.origin,
            destination=s.destination,
            carrier=s.carrier,
            status=s.status,
            shipping_cost=s.shipping_cost,
            delay_probability=s.delay_probability,
            predicted_delay_days=s.predicted_delay_days,
            supplier_name=s.supplier.name if s.supplier else None,
            product_name=s.product.name if s.product else None,
            created_at=s.created_at
        ))
    return results

@router.post("", response_model=ShipmentResponse)
def create_shipment(payload: ShipmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Shipment).filter(Shipment.tracking_number == payload.tracking_number.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Shipment with this tracking number already exists")

    supplier = db.query(Supplier).filter(Supplier.id == payload.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    shipment = Shipment(
        tracking_number=payload.tracking_number.strip().upper(),
        supplier_id=payload.supplier_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        order_date=payload.order_date,
        estimated_delivery=payload.estimated_delivery,
        origin=payload.origin,
        destination=payload.destination,
        carrier=payload.carrier,
        shipping_cost=payload.shipping_cost,
        status=payload.status
    )

    pred = ShipmentService.predict_shipment_delay(
        carrier=payload.carrier,
        origin=payload.origin,
        destination=payload.destination,
        order_date=payload.order_date,
        estimated_delivery=payload.estimated_delivery,
        supplier_on_time_rate=supplier.on_time_delivery_rate
    )
    shipment.delay_probability = pred["delay_probability"]
    shipment.predicted_delay_days = pred["predicted_delay_days"]

    db.add(shipment)
    db.commit()
    db.refresh(shipment)

    return ShipmentResponse(
        id=shipment.id,
        tracking_number=shipment.tracking_number,
        supplier_id=shipment.supplier_id,
        product_id=shipment.product_id,
        quantity=shipment.quantity,
        order_date=shipment.order_date,
        estimated_delivery=shipment.estimated_delivery,
        actual_delivery=shipment.actual_delivery,
        origin=shipment.origin,
        destination=shipment.destination,
        carrier=shipment.carrier,
        status=shipment.status,
        shipping_cost=shipment.shipping_cost,
        delay_probability=shipment.delay_probability,
        predicted_delay_days=shipment.predicted_delay_days,
        supplier_name=supplier.name,
        product_name=shipment.product.name if shipment.product else None,
        created_at=shipment.created_at
    )

@router.put("/{shipment_id}", response_model=ShipmentResponse)
def update_shipment(shipment_id: int, payload: ShipmentUpdate, db: Session = Depends(get_db)):
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(shipment, field, val)

    if shipment.status == "Delivered" and not shipment.actual_delivery:
        shipment.actual_delivery = datetime.utcnow()
        # If delivered, restock product inventory if associated
        if shipment.product:
            shipment.product.current_stock += shipment.quantity
            shipment.product.update_status()

    db.commit()
    db.refresh(shipment)

    return ShipmentResponse(
        id=shipment.id,
        tracking_number=shipment.tracking_number,
        supplier_id=shipment.supplier_id,
        product_id=shipment.product_id,
        quantity=shipment.quantity,
        order_date=shipment.order_date,
        estimated_delivery=shipment.estimated_delivery,
        actual_delivery=shipment.actual_delivery,
        origin=shipment.origin,
        destination=shipment.destination,
        carrier=shipment.carrier,
        status=shipment.status,
        shipping_cost=shipment.shipping_cost,
        delay_probability=shipment.delay_probability,
        predicted_delay_days=shipment.predicted_delay_days,
        supplier_name=shipment.supplier.name if shipment.supplier else None,
        product_name=shipment.product.name if shipment.product else None,
        created_at=shipment.created_at
    )

@router.post("/predict-delay", response_model=DelayPredictionResponse)
def predict_delay_interactive(payload: DelayPredictionRequest):
    now = datetime.utcnow()
    est = now + timedelta(days=payload.transit_days)
    res = ShipmentService.predict_shipment_delay(
        carrier=payload.carrier,
        origin=payload.origin,
        destination=payload.destination,
        order_date=now,
        estimated_delivery=est,
        supplier_on_time_rate=0.90 - payload.supplier_lead_time_variance
    )
    return DelayPredictionResponse(
        delay_probability=res["delay_probability"],
        is_delayed_risk=res["is_delayed_risk"],
        predicted_delay_days=res["predicted_delay_days"],
        risk_factors=res["risk_factors"]
    )
