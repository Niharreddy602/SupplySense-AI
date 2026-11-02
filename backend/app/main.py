import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.seed_data import seed_initial_demo_data
from app.routers import (
    dashboard,
    inventory,
    sales,
    forecasting,
    shipments,
    suppliers,
    anomalies,
    etl,
    reports
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("supplysense")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    logger.info("Initializing database...")
    init_db()
    
    # Seed initial synthetic demo data if DB is empty
    db = SessionLocal()
    try:
        seed_initial_demo_data(db)
    finally:
        db.close()
        
    yield
    logger.info("SupplySense AI backend shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent supply chain monitoring, inventory tracking, demand forecasting with ML, and shipment delay prediction API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(forecasting.router)
app.include_router(shipments.router)
app.include_router(suppliers.router)
app.include_router(anomalies.router)
app.include_router(etl.router)
app.include_router(reports.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": settings.DATABASE_URL.split(":")[0],
        "ml_model_default": settings.ML_MODEL_TYPE
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to SupplySense AI API",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

