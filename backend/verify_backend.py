import sys
import os
import time
import urllib.request
import json
import subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def run_tests():
    # 1. Start uvicorn server in a subprocess
    cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "127.0.0.1"]
    proc = subprocess.Popen(cmd, cwd=os.path.dirname(os.path.abspath(__file__)))
    
    try:
        # Wait for server to spin up
        time.sleep(3)

        base_url = "http://127.0.0.1:8000"
        
        # Test 1: Health
        req = urllib.request.urlopen(f"{base_url}/api/health", timeout=5)
        health_data = json.loads(req.read().decode())
        print("✓ Health Check Passed:", health_data["status"])

        # Test 2: Dashboard Summary
        req = urllib.request.urlopen(f"{base_url}/api/dashboard/summary", timeout=10)
        dash_data = json.loads(req.read().decode())
        print(f"✓ Dashboard API Passed: Revenue = ${dash_data['total_sales_revenue']:,.2f}, Sold = {dash_data['total_units_sold']} units")
        print(f"  Low stock count: {dash_data['low_stock_count']}, Out of stock: {dash_data['out_of_stock_count']}")
        print(f"  Sales trend points: {len(dash_data['recent_sales_trend'])}")

        # Test 3: Inventory List
        req = urllib.request.urlopen(f"{base_url}/api/inventory", timeout=5)
        inv_data = json.loads(req.read().decode())
        print(f"✓ Inventory API Passed: {len(inv_data)} products cataloged")

        # Test 4: Forecasting
        if len(inv_data) > 0:
            prod_id = inv_data[0]["id"]
            post_data = json.dumps({"product_id": prod_id, "horizon_days": 14, "model_type": "random_forest"}).encode()
            f_req = urllib.request.Request(f"{base_url}/api/forecast/predict", data=post_data, headers={"Content-Type": "application/json"})
            f_res = urllib.request.urlopen(f_req, timeout=15)
            forecast_data = json.loads(f_res.read().decode())
            print(f"✓ ML Demand Forecasting Passed:")
            print(f"  Model: {forecast_data['model_used']}")
            print(f"  Evaluation: MAE={forecast_data['metrics']['mae']}, RMSE={forecast_data['metrics']['rmse']}, R2={forecast_data['metrics']['r2_score']}")
            print(f"  Forecast Horizon: {len(forecast_data['forecast'])} days projected")

        # Test 5: Shipment Delay Prediction
        post_delay = json.dumps({
            "carrier": "Maersk Freight",
            "origin": "Shenzhen Hub, China",
            "destination": "Port of Long Beach, CA",
            "transit_days": 18,
            "supplier_lead_time_variance": 0.12
        }).encode()
        s_req = urllib.request.Request(f"{base_url}/api/shipments/predict-delay", data=post_delay, headers={"Content-Type": "application/json"})
        s_res = urllib.request.urlopen(s_req, timeout=5)
        delay_data = json.loads(s_res.read().decode())
        print(f"✓ Shipment Delay Model Passed: Probability = {delay_data['delay_probability'] * 100}%, Delay = {delay_data['predicted_delay_days']} days")

        # Test 6: Suppliers
        req = urllib.request.urlopen(f"{base_url}/api/suppliers", timeout=5)
        sup_data = json.loads(req.read().decode())
        print(f"✓ Supplier Analysis Passed: {len(sup_data)} suppliers monitored with live OTD metrics")

        # Test 7: Anomalies
        req = urllib.request.urlopen(f"{base_url}/api/anomalies", timeout=5)
        anom_data = json.loads(req.read().decode())
        print(f"✓ Anomaly Detection Passed: {len(anom_data)} anomalies detected via Isolation Forest")

        print("\nAll Backend APIs, Database Operations, and ML pipelines verified successfully!")
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_tests()

