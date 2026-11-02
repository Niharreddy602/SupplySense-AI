from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String(80), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    order_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    estimated_delivery = Column(DateTime, nullable=False)
    actual_delivery = Column(DateTime, nullable=True)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    carrier = Column(String(80), nullable=False, default="Standard Logistics")
    status = Column(String(30), nullable=False, default="In Transit") # In Transit, Delivered, Delayed, Cancelled
    delay_probability = Column(Float, nullable=False, default=0.0) # 0.0 to 1.0
    predicted_delay_days = Column(Integer, nullable=False, default=0)
    shipping_cost = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="shipments")
    product = relationship("Product", back_populates="shipments")

class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True) # Sales, Inventory, Shipment, Supplier
    entity_id = Column(Integer, nullable=True)
    metric_name = Column(String(120), nullable=False)
    anomaly_score = Column(Float, nullable=False) # e.g. -0.32 from Isolation Forest
    detected_value = Column(Float, nullable=False)
    expected_range = Column(String(80), nullable=False)
    severity = Column(String(20), nullable=False, default="Medium") # Low, Medium, High, Critical
    details = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow)

