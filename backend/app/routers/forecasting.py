from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inventory import Product
from app.models.sales import SalesRecord
from app.schemas.ml import DemandForecastResponse
from app.services.forecast_service import ForecastService

router = APIRouter(prefix="/api/forecast", tags=["Demand Forecasting"])

class ForecastRequestPayload(BaseModel):
    product_id: int
    horizon_days: int = Field(14, ge=3, le=60)
    model_type: str = Field("random_forest", pattern="^(random_forest|xgboost|gradient_boosting)$")

@router.get("/products")
def get_forecasting_products(db: Session = Depends(get_db)):
    """Returns products that have sales data suitable for forecasting."""
    products = db.query(Product).order_by(Product.name).all()
    results = []
    for p in products:
        sales_count = db.query(SalesRecord).filter(SalesRecord.product_id == p.id).count()
        results.append({
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "current_stock": p.current_stock,
            "sales_count": sales_count
        })
    return results

@router.post("/predict", response_model=DemandForecastResponse)
def generate_forecast(payload: ForecastRequestPayload, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    sales = db.query(SalesRecord).filter(
        SalesRecord.product_id == payload.product_id
    ).order_by(SalesRecord.date.asc()).all()

    sales_data = [
        {"date": s.date, "quantity_sold": s.quantity_sold}
        for s in sales
    ]

    result = ForecastService.train_and_forecast(
        sales_records=sales_data,
        horizon_days=payload.horizon_days,
        model_type=payload.model_type
    )

    return DemandForecastResponse(
        product_id=product.id,
        product_name=product.name,
        product_sku=product.sku,
        model_used=result["model_used"],
        metrics=result["metrics"],
        historical=result["historical"],
        forecast=result["forecast"]
    )

