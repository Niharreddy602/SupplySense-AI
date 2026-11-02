from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False, index=True)
    category = Column(String(80), nullable=False, index=True)
    current_stock = Column(Integer, nullable=False, default=0)
    reorder_point = Column(Integer, nullable=False, default=20)
    safety_stock = Column(Integer, nullable=False, default=10)
    lead_time_days = Column(Integer, nullable=False, default=7)
    unit_cost = Column(Float, nullable=False, default=0.0)
    selling_price = Column(Float, nullable=False, default=0.0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    status = Column(String(30), nullable=False, default="In Stock") # In Stock, Low Stock, Out of Stock
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="products")
    sales = relationship("SalesRecord", back_populates="product", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="product")
    restock_recommendations = relationship("RestockRecommendation", back_populates="product", cascade="all, delete-orphan")

    def update_status(self):
        if self.current_stock <= 0:
            self.status = "Out of Stock"
        elif self.current_stock <= self.reorder_point:
            self.status = "Low Stock"
        else:
            self.status = "In Stock"

class RestockRecommendation(Base):
    __tablename__ = "restock_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    recommended_quantity = Column(Integer, nullable=False)
    current_stock = Column(Integer, nullable=False)
    reorder_point = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False, default="Moderate") # Critical, High, Moderate, Low
    reason = Column(Text, nullable=False)
    estimated_cost = Column(Float, nullable=False, default=0.0)
    status = Column(String(20), nullable=False, default="Pending")     # Pending, Approved, Ordered, Dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="restock_recommendations")

