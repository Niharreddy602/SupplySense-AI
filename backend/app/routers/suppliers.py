from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.services.supplier_service import SupplierService

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("")
def get_suppliers(db: Session = Depends(get_db)):
    """Returns suppliers with dynamically computed real-time performance metrics."""
    return SupplierService.evaluate_all_suppliers(db)

@router.post("", response_model=SupplierResponse)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    existing = db.query(Supplier).filter(Supplier.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier with this name already exists")

    supplier = Supplier(
        name=payload.name.strip(),
        contact_email=payload.contact_email,
        phone=payload.phone,
        location=payload.location,
        lead_time_days=payload.lead_time_days,
        on_time_delivery_rate=payload.on_time_delivery_rate,
        quality_rating=payload.quality_rating,
        tier=payload.tier
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(supplier, k, v)

    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    return {"message": f"Supplier '{supplier.name}' removed successfully."}

