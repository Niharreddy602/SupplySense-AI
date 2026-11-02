import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.supplier_service import SupplierService
from app.services.stockout_service import StockoutService

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/download")
def download_supply_chain_report(
    report_type: str = Query("suppliers", pattern="^(suppliers|stockout_risk|inventory)$"),
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db)
):
    """Generates and downloads full supply chain analytical reports."""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    
    if report_type == "suppliers":
        data = SupplierService.evaluate_all_suppliers(db)
        filename = f"supplier_performance_report_{timestamp}.csv"
        fieldnames = ["id", "name", "location", "lead_time_days", "on_time_delivery_rate", "quality_rating", "tier", "total_shipments", "delayed_shipments"]
    elif report_type == "stockout_risk":
        data = StockoutService.calculate_stockout_risks(db)
        filename = f"stockout_risk_report_{timestamp}.csv"
        fieldnames = ["sku", "name", "current_stock", "avg_daily_demand", "lead_time_days", "days_until_stockout", "stockout_risk_level", "risk_score", "reorder_point", "recommended_order_quantity", "supplier_name"]
    else:
        # Default inventory
        data = StockoutService.calculate_stockout_risks(db)
        filename = f"inventory_health_report_{timestamp}.csv"
        fieldnames = ["sku", "name", "current_stock", "reorder_point", "stockout_risk_level"]

    if format == "json":
        return {"report_type": report_type, "generated_at": timestamp, "data": data}

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    for row in data:
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

