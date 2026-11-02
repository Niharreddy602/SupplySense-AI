from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SalesRecordBase(BaseModel):
    product_id: int
    date: datetime
    quantity_sold: int = Field(..., ge=1)
    unit_price: float = Field(..., ge=0.0)
    total_revenue: float = Field(..., ge=0.0)
    channel: str = "Online Store"
    is_promotion: bool = False
    is_holiday: bool = False

class SalesRecordCreate(SalesRecordBase):
    pass

class SalesRecordResponse(SalesRecordBase):
    id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DailySalesSummary(BaseModel):
    date: str
    total_revenue: float
    total_quantity: int

