from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    sku: str = Field(..., max_length=50)
    name: str = Field(..., max_length=150)
    category: str = Field(..., max_length=80)
    current_stock: int = Field(0, ge=0)
    reorder_point: int = Field(20, ge=0)
    safety_stock: int = Field(10, ge=0)
    lead_time_days: int = Field(7, ge=1)
    unit_cost: float = Field(0.0, ge=0.0)
    selling_price: float = Field(0.0, ge=0.0)
    supplier_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    current_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    safety_stock: Optional[int] = None
    lead_time_days: Optional[int] = None
    unit_cost: Optional[float] = None
    selling_price: Optional[float] = None
    supplier_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True

class RestockRecommendationResponse(BaseModel):
    id: int
    product_id: int
    product_sku: str
    product_name: str
    current_stock: int
    reorder_point: int
    recommended_quantity: int
    risk_level: str
    reason: str
    estimated_cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RestockStatusUpdate(BaseModel):
    status: str # Approved, Ordered, Dismissed

