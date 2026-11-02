from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.inventory import Product, RestockRecommendation
from app.models.sales import SalesRecord
from app.models.shipment import Shipment, AnomalyLog
from app.models.supplier import Supplier
from app.services.stockout_service import StockoutService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # 1. Total Sales and Units Sold
    sales_agg = db.query(
        func.sum(SalesRecord.total_revenue).label("total_revenue"),
        func.sum(SalesRecord.quantity_sold).label("total_units")
    ).first()

    total_revenue = float(sales_agg.total_revenue or 0.0)
    total_units_sold = int(sales_agg.total_units or 0)

    # 2. Product & Inventory Counts
    total_products = db.query(Product).count()
    low_stock_count = db.query(Product).filter(
        Product.current_stock > 0,
        Product.current_stock <= Product.reorder_point
    ).count()
    out_of_stock_count = db.query(Product).filter(Product.current_stock <= 0).count()
    in_stock_count = max(0, total_products - low_stock_count - out_of_stock_count)

    # 3. Shipments
    active_shipments = db.query(Shipment).filter(
        Shipment.status.in_(["In Transit", "Pending", "Out for Delivery", "Delayed"])
    ).count()
    delayed_shipments = db.query(Shipment).filter(Shipment.status == "Delayed").count()
    delivered_shipments = db.query(Shipment).filter(Shipment.status == "Delivered").count()

    # 4. Suppliers
    avg_supplier_rating = db.query(func.avg(Supplier.quality_rating)).scalar() or 4.5

    # 5. Anomalies
    critical_anomalies_count = db.query(AnomalyLog).filter(
        AnomalyLog.severity.in_(["High", "Critical"])
    ).count()

    # 6. Recent Sales Trend (Last 30 Days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sales_daily = db.query(
        func.date(SalesRecord.date).label("sale_date"),
        func.sum(SalesRecord.total_revenue).label("daily_revenue"),
        func.sum(SalesRecord.quantity_sold).label("daily_units")
    ).filter(SalesRecord.date >= thirty_days_ago)\
     .group_by(func.date(SalesRecord.date))\
     .order_by("sale_date").all()

    trend = []
    for row in sales_daily:
        trend.append({
            "date": str(row.sale_date),
            "revenue": round(float(row.daily_revenue or 0.0), 2),
            "units": int(row.daily_units or 0)
        })

    # 7. Top Selling Products
    top_products_q = db.query(
        Product.sku,
        Product.name,
        func.sum(SalesRecord.quantity_sold).label("total_sold"),
        func.sum(SalesRecord.total_revenue).label("revenue")
    ).join(SalesRecord, Product.id == SalesRecord.product_id)\
     .group_by(Product.id, Product.sku, Product.name)\
     .order_by(func.sum(SalesRecord.quantity_sold).desc())\
     .limit(5).all()

    top_selling = [
        {
            "sku": row.sku,
            "name": row.name,
            "units_sold": int(row.total_sold),
            "revenue": round(float(row.revenue), 2)
        }
        for row in top_products_q
    ]

    # 8. Top Stockout Risks
    risks = StockoutService.calculate_stockout_risks(db)[:5]

    # 9. Recent Anomalies
    recent_anomalies = db.query(AnomalyLog).order_by(AnomalyLog.detected_at.desc()).limit(5).all()
    anomalies_list = [
        {
            "id": a.id,
            "entity_type": a.entity_type,
            "metric_name": a.metric_name,
            "severity": a.severity,
            "anomaly_score": a.anomaly_score,
            "detected_value": a.detected_value,
            "expected_range": a.expected_range,
            "details": a.details,
            "detected_at": a.detected_at.isoformat()
        }
        for a in recent_anomalies
    ]

    return {
        "total_sales_revenue": round(total_revenue, 2),
        "total_units_sold": total_units_sold,
        "total_products_count": total_products,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count,
        "active_shipments_count": active_shipments,
        "delayed_shipments_count": delayed_shipments,
        "supplier_average_rating": round(float(avg_supplier_rating), 1),
        "critical_anomalies_count": critical_anomalies_count,
        "recent_sales_trend": trend,
        "inventory_health_breakdown": {
            "In Stock": in_stock_count,
            "Low Stock": low_stock_count,
            "Out of Stock": out_of_stock_count
        },
        "shipment_status_breakdown": {
            "In Transit": active_shipments - delayed_shipments,
            "Delayed": delayed_shipments,
            "Delivered": delivered_shipments
        },
        "top_selling_products": top_selling,
        "top_stockout_risks": risks,
        "recent_anomalies": anomalies_list
    }

