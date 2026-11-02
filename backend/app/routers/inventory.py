from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.inventory import Product, RestockRecommendation
from app.schemas.inventory import (
    ProductCreate, ProductUpdate, ProductResponse,
    RestockRecommendationResponse, RestockStatusUpdate
)
from app.services.stockout_service import StockoutService

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("", response_model=List[ProductResponse])
def get_inventory(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Product.name.ilike(s)) | (Product.sku.ilike(s)))
    if category:
        query = query.filter(Product.category == category)
    if status:
        query = query.filter(Product.status == status)
    if low_stock_only:
        query = query.filter(Product.current_stock <= Product.reorder_point)

    products = query.order_by(Product.name).all()
    results = []
    for p in products:
        p.update_status()
        sup_name = p.supplier.name if p.supplier else None
        res = ProductResponse(
            id=p.id,
            sku=p.sku,
            name=p.name,
            category=p.category,
            current_stock=p.current_stock,
            reorder_point=p.reorder_point,
            safety_stock=p.safety_stock,
            lead_time_days=p.lead_time_days,
            unit_cost=p.unit_cost,
            selling_price=p.selling_price,
            supplier_id=p.supplier_id,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            supplier_name=sup_name
        )
        results.append(res)
    return results

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Product.category).distinct().all()
    return [c[0] for c in cats if c[0]]

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.update_status()
    sup_name = p.supplier.name if p.supplier else None
    return ProductResponse(
        id=p.id,
        sku=p.sku,
        name=p.name,
        category=p.category,
        current_stock=p.current_stock,
        reorder_point=p.reorder_point,
        safety_stock=p.safety_stock,
        lead_time_days=p.lead_time_days,
        unit_cost=p.unit_cost,
        selling_price=p.selling_price,
        supplier_id=p.supplier_id,
        status=p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
        supplier_name=sup_name
    )

@router.post("", response_model=ProductResponse)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == payload.sku.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{payload.sku}' already exists.")

    prod = Product(
        sku=payload.sku.strip().upper(),
        name=payload.name.strip(),
        category=payload.category.strip(),
        current_stock=payload.current_stock,
        reorder_point=payload.reorder_point,
        safety_stock=payload.safety_stock,
        lead_time_days=payload.lead_time_days,
        unit_cost=payload.unit_cost,
        selling_price=payload.selling_price,
        supplier_id=payload.supplier_id
    )
    prod.update_status()
    db.add(prod)
    db.commit()
    db.refresh(prod)
    
    # Sync recommendations
    StockoutService.sync_recommendations_to_db(db)

    return ProductResponse(
        id=prod.id,
        sku=prod.sku,
        name=prod.name,
        category=prod.category,
        current_stock=prod.current_stock,
        reorder_point=prod.reorder_point,
        safety_stock=prod.safety_stock,
        lead_time_days=prod.lead_time_days,
        unit_cost=prod.unit_cost,
        selling_price=prod.selling_price,
        supplier_id=prod.supplier_id,
        status=prod.status,
        created_at=prod.created_at,
        updated_at=prod.updated_at,
        supplier_name=prod.supplier.name if prod.supplier else None
    )

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        if field == "sku" and val:
            prod.sku = val.strip().upper()
        else:
            setattr(prod, field, val)

    prod.update_status()
    db.commit()
    db.refresh(prod)

    # Sync recommendations
    StockoutService.sync_recommendations_to_db(db)

    return ProductResponse(
        id=prod.id,
        sku=prod.sku,
        name=prod.name,
        category=prod.category,
        current_stock=prod.current_stock,
        reorder_point=prod.reorder_point,
        safety_stock=prod.safety_stock,
        lead_time_days=prod.lead_time_days,
        unit_cost=prod.unit_cost,
        selling_price=prod.selling_price,
        supplier_id=prod.supplier_id,
        status=prod.status,
        created_at=prod.created_at,
        updated_at=prod.updated_at,
        supplier_name=prod.supplier.name if prod.supplier else None
    )

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return {"message": f"Product '{prod.sku}' deleted successfully."}

@router.get("/recommendations/list", response_model=List[RestockRecommendationResponse])
def get_restock_recommendations(db: Session = Depends(get_db)):
    StockoutService.sync_recommendations_to_db(db)
    recs = db.query(RestockRecommendation).order_by(RestockRecommendation.created_at.desc()).all()
    results = []
    for r in recs:
        p = r.product
        results.append(RestockRecommendationResponse(
            id=r.id,
            product_id=r.product_id,
            product_sku=p.sku if p else "N/A",
            product_name=p.name if p else "Unknown Product",
            current_stock=r.current_stock,
            reorder_point=r.reorder_point,
            recommended_quantity=r.recommended_quantity,
            risk_level=r.risk_level,
            reason=r.reason,
            estimated_cost=r.estimated_cost,
            status=r.status,
            created_at=r.created_at
        ))
    return results

@router.post("/recommendations/{rec_id}/status")
def update_recommendation_status(rec_id: int, payload: RestockStatusUpdate, db: Session = Depends(get_db)):
    rec = db.query(RestockRecommendation).filter(RestockRecommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = payload.status
    db.commit()
    return {"message": f"Recommendation status updated to '{payload.status}'"}

