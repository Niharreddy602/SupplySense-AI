import os
import sys
import pytest
from fastapi.testclient import TestClient

# Put backend root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import init_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_dashboard_summary(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_sales_revenue" in data
    assert "total_units_sold" in data
    assert "inventory_health_breakdown" in data
    assert "top_stockout_risks" in data
    assert len(data["recent_sales_trend"]) > 0

def test_inventory_crud(client):
    # Create product
    new_prod = {
        "sku": "TEST-SKU-9999",
        "name": "Test Industrial Sensor",
        "category": "Sensors",
        "current_stock": 50,
        "reorder_point": 25,
        "safety_stock": 10,
        "lead_time_days": 7,
        "unit_cost": 15.0,
        "selling_price": 35.0
    }
    res = client.post("/api/inventory", json=new_prod)
    assert res.status_code == 200
    created = res.json()
    prod_id = created["id"]
    assert created["sku"] == "TEST-SKU-9999"

    # Read product
    res_get = client.get(f"/api/inventory/{prod_id}")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Test Industrial Sensor"

    # Update product
    res_up = client.put(f"/api/inventory/{prod_id}", json={"current_stock": 10})
    assert res_up.status_code == 200
    assert res_up.json()["current_stock"] == 10
    assert res_up.json()["status"] == "Low Stock"

    # Delete product
    res_del = client.delete(f"/api/inventory/{prod_id}")
    assert res_del.status_code == 200

def test_demand_forecasting(client):
    # Fetch products
    prods = client.get("/api/forecast/products").json()
    assert len(prods) > 0
    prod_id = prods[0]["id"]

    # Run forecast
    payload = {
        "product_id": prod_id,
        "horizon_days": 14,
        "model_type": "random_forest"
    }
    res = client.post("/api/forecast/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "forecast" in data
    assert len(data["forecast"]) == 14
    assert "metrics" in data
    assert "mae" in data["metrics"]
    assert "rmse" in data["metrics"]
    assert "baseline_mae" in data["metrics"]

def test_shipment_delay_prediction(client):
    payload = {
        "carrier": "Maersk Freight",
        "origin": "Shenzhen, China",
        "destination": "Long Beach, CA",
        "transit_days": 20,
        "supplier_lead_time_variance": 0.15
    }
    res = client.post("/api/shipments/predict-delay", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "delay_probability" in data
    assert data["delay_probability"] > 0.0

def test_anomaly_detection_scan(client):
    res = client.post("/api/anomalies/detect?contamination=0.05")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"

def test_supplier_performance(client):
    res = client.get("/api/suppliers")
    assert res.status_code == 200
    suppliers = res.json()
    assert len(suppliers) > 0
    assert "on_time_delivery_rate" in suppliers[0]
    assert "tier" in suppliers[0]

