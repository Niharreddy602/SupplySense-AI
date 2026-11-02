from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ForecastPoint(BaseModel):
    date: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    baseline_ma: float

class EvaluationMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float
    r2_score: float
    baseline_mae: float
    baseline_rmse: float

class DemandForecastResponse(BaseModel):
    product_id: int
    product_name: str
    product_sku: str
    model_used: str
    metrics: EvaluationMetrics
    historical: List[Dict[str, Any]]
    forecast: List[ForecastPoint]

class StockoutRiskItem(BaseModel):
    product_id: int
    sku: str
    name: str
    current_stock: int
    avg_daily_demand: float
    lead_time_days: int
    days_until_stockout: float
    stockout_risk_level: str # Critical, High, Moderate, Low
    risk_score: float # 0 to 100
    reorder_point: int
    recommended_order_quantity: int
    supplier_name: Optional[str] = None

class AnomalyItem(BaseModel):
    id: Optional[int] = None
    entity_type: str
    entity_id: Optional[int] = None
    metric_name: str
    anomaly_score: float
    detected_value: float
    expected_range: str
    severity: str
    details: str
    detected_at: datetime

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    total_sales_revenue: float
    total_units_sold: int
    total_products_count: int
    low_stock_count: int
    out_of_stock_count: int
    active_shipments_count: int
    delayed_shipments_count: int
    supplier_average_rating: float
    critical_anomalies_count: int
    recent_sales_trend: List[Dict[str, Any]]
    inventory_health_breakdown: Dict[str, int]
    shipment_status_breakdown: Dict[str, int]
    top_selling_products: List[Dict[str, Any]]
    top_stockout_risks: List[StockoutRiskItem]
    recent_anomalies: List[AnomalyItem]

