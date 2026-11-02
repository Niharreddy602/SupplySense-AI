from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.sales import SalesRecord
from app.models.inventory import Product
from app.schemas.sales import SalesRecordCreate, SalesRecordResponse, DailySalesSummary

router = APIRouter(prefix="/api/sales", tags=["Sales"])

@router.get("", response_model=List[SalesRecordResponse])
def get_sales_records(
    product_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(SalesRecord)
    if product_id:
        query = query.filter(SalesRecord.product_id == product_id)
    
    records = query.order_by(SalesRecord.date.desc()).limit(limit).all()
    results = []
    for r in records:
        results.append(SalesRecordResponse(
            id=r.id,
            product_id=r.product_id,
            date=r.date,
            quantity_sold=r.quantity_sold,
            unit_price=r.unit_price,
            total_revenue=r.total_revenue,
            channel=r.channel,
            is_promotion=r.is_promotion,
            is_holiday=r.is_holiday,
            product_name=r.product.name if r.product else None,
            product_sku=r.product.sku if r.product else None,
            created_at=r.created_at
        ))
    return results

@router.post("", response_model=SalesRecordResponse)
def create_sales_record(payload: SalesRecordCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    revenue = round(payload.unit_price * payload.quantity_sold, 2)
    sale = SalesRecord(
        product_id=payload.product_id,
        date=payload.date,
        quantity_sold=payload.quantity_sold,
        unit_price=payload.unit_price,
        total_revenue=revenue,
        channel=payload.channel,
        is_promotion=payload.is_promotion,
        is_holiday=payload.is_holiday
    )

    # Decrement inventory
    product.current_stock = max(0, product.current_stock - payload.quantity_sold)
    product.update_status()

    db.add(sale)
    db.commit()
    db.refresh(sale)

    return SalesRecordResponse(
        id=sale.id,
        product_id=sale.product_id,
        date=sale.date,
        quantity_sold=sale.quantity_sold,
        unit_price=sale.unit_price,
        total_revenue=sale.total_revenue,
        channel=sale.channel,
        is_promotion=sale.is_promotion,
        is_holiday=sale.is_holiday,
        product_name=product.name,
        product_sku=product.sku,
        created_at=sale.created_at
    )

@router.get("/daily-trend", response_model=List[DailySalesSummary])
def get_daily_trend(days: int = Query(30, ge=7, le=180), db: Session = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=days)
    results = db.query(
        func.date(SalesRecord.date).label("d"),
        func.sum(SalesRecord.total_revenue).label("rev"),
        func.sum(SalesRecord.quantity_sold).label("qty")
    ).filter(SalesRecord.date >= cutoff)\
     .group_by(func.date(SalesRecord.date))\
     .order_by("d").all()

    return [
        DailySalesSummary(
            date=str(r.d),
            total_revenue=round(float(r.rev or 0.0), 2),
            total_quantity=int(r.qty or 0)
        )
        for r in results
    ]

