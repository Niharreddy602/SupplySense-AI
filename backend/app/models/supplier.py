from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    contact_email = Column(String(120), nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(120), nullable=False, default="Domestic")
    lead_time_days = Column(Integer, nullable=False, default=7)
    on_time_delivery_rate = Column(Float, nullable=False, default=0.92) # 0.0 to 1.0
    quality_rating = Column(Float, nullable=False, default=4.5)        # 1.0 to 5.0
    tier = Column(String(20), nullable=False, default="Tier 1")
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="supplier")
    shipments = relationship("Shipment", back_populates="supplier")

