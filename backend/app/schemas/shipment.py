from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ShipmentBase(BaseModel):
    tracking_number: str = Field(..., max_length=80)
    supplier_id: int
    product_id: Optional[int] = None
    quantity: int = Field(1, ge=1)
    order_date: datetime
    estimated_delivery: datetime
    actual_delivery: Optional[datetime] = None
    origin: str
    destination: str
    carrier: str = "Standard Logistics"
    status: str = "In Transit"
    shipping_cost: float = Field(0.0, ge=0.0)

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentUpdate(BaseModel):
    status: Optional[str] = None
    actual_delivery: Optional[datetime] = None
    delay_probability: Optional[float] = None
    predicted_delay_days: Optional[int] = None

class ShipmentResponse(ShipmentBase):
    id: int
    supplier_name: Optional[str] = None
    product_name: Optional[str] = None
    delay_probability: float
    predicted_delay_days: int
    created_at: datetime

    class Config:
        from_attributes = True

class DelayPredictionRequest(BaseModel):
    carrier: str
    origin: str
    destination: str
    transit_days: int
    supplier_lead_time_variance: float = 0.0

class DelayPredictionResponse(BaseModel):
    delay_probability: float
    is_delayed_risk: bool
    predicted_delay_days: int
    risk_factors: list[str]

