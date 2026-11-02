from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.etl_service import ETLService
from app.services.stockout_service import StockoutService
from app.services.shipment_service import ShipmentService
from app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/api/etl", tags=["ETL & Data Pipeline"])

@router.post("/upload/{entity_type}")
async def upload_csv_dataset(
    entity_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    valid_types = ["inventory", "sales", "shipments"]
    if entity_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid entity type '{entity_type}'. Must be one of: {', '.join(valid_types)}"
        )

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    try:
        content = await file.read()
        if entity_type == "inventory":
            result = ETLService.process_inventory_csv(content, db)
            # Sync restock logic
            StockoutService.sync_recommendations_to_db(db)
        elif entity_type == "sales":
            result = ETLService.process_sales_csv(content, db)
        elif entity_type == "shipments":
            result = ETLService.process_shipments_csv(content, db)
            ShipmentService.update_all_shipment_predictions(db)

        # Trigger anomaly evaluation on updated data
        AnomalyService.run_full_anomaly_detection(db)

        return {
            "status": "success",
            "filename": file.filename,
            **result
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"ETL Processing Error: {str(e)}")

@router.get("/template/{entity_type}", response_class=PlainTextResponse)
def get_sample_csv_template(entity_type: str):
    template = ETLService.generate_sample_csv(entity_type)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found for specified entity type.")
    return PlainTextResponse(
        content=template,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=template_{entity_type}.csv"}
    )

