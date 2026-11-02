from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SupplierBase(BaseModel):
    name: str = Field(..., max_length=100)
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    location: str = "Domestic"
    lead_time_days: int = Field(7, ge=1)
    on_time_delivery_rate: float = Field(0.92, ge=0.0, le=1.0)
    quality_rating: float = Field(4.5, ge=1.0, le=5.0)
    tier: str = "Tier 1"

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    lead_time_days: Optional[int] = None
    on_time_delivery_rate: Optional[float] = None
    quality_rating: Optional[float] = None
    tier: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

