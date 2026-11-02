import random
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.models.inventory import Product, RestockRecommendation
from app.models.sales import SalesRecord
from app.models.shipment import Shipment, AnomalyLog
from app.services.stockout_service import StockoutService
from app.services.shipment_service import ShipmentService
from app.services.anomaly_service import AnomalyService

logger = logging.getLogger(__name__)

def seed_initial_demo_data(db: Session, force: bool = False):
    """
    Seeds initial realistic supply chain dataset if the database is currently empty.
    All data is clearly marked as synthetic demo data.
    """
    if not force and db.query(Product).count() > 0:
        logger.info("Database already contains data. Skipping initial seeding.")
        return

    logger.info("Seeding initial synthetic demo dataset for SupplySense AI...")

    # 1. SEED SUPPLIERS
    suppliers_data = [
        {"name": "Apex Semiconductor Tech", "email": "orders@apexsemi.com", "phone": "+1-415-555-0142", "location": "Austin, TX (Domestic)", "lead_time": 5, "otd": 0.96, "rating": 4.8, "tier": "Tier 1 (Preferred)"},
        {"name": "Pacific Precision Components", "email": "contact@pacificprecision.jp", "phone": "+81-3-5555-0199", "location": "Tokyo, Japan (International)", "lead_time": 14, "otd": 0.88, "rating": 4.3, "tier": "Tier 2 (Standard)"},
        {"name": "EuroLogix Industrial", "email": "fulfillment@eurologix.de", "phone": "+49-89-5555-0177", "location": "Frankfurt, Germany (International)", "lead_time": 10, "otd": 0.92, "rating": 4.6, "tier": "Tier 1 (Preferred)"},
        {"name": "Shenzhen Micro Assembly", "email": "supply@shenzhenmicro.cn", "phone": "+86-755-5555-0188", "location": "Shenzhen, China (International)", "lead_time": 18, "otd": 0.79, "rating": 3.7, "tier": "Tier 3 (Under Review)"},
        {"name": "Midwest Raw Materials Co.", "email": "sales@midwestraw.com", "phone": "+1-312-555-0163", "location": "Chicago, IL (Domestic)", "lead_time": 4, "otd": 0.97, "rating": 4.9, "tier": "Tier 1 (Preferred)"}
    ]

    created_suppliers = []
    for s in suppliers_data:
        sup = Supplier(
            name=s["name"],
            contact_email=s["email"],
            phone=s["phone"],
            location=s["location"],
            lead_time_days=s["lead_time"],
            on_time_delivery_rate=s["otd"],
            quality_rating=s["rating"],
            tier=s["tier"]
        )
        db.add(sup)
        created_suppliers.append(sup)
    
    db.commit()

    # 2. SEED PRODUCTS
    products_data = [
        {"sku": "SKU-MCU-8801", "name": "ARM Cortex-M4 Microcontroller", "category": "Semiconductors", "stock": 140, "rop": 80, "safety": 30, "lead": 7, "cost": 4.50, "price": 12.00, "sup": 0},
        {"sku": "SKU-SNS-4420", "name": "Precision IMU 6-Axis Sensor", "category": "Sensors", "stock": 25, "rop": 45, "safety": 20, "lead": 10, "cost": 6.80, "price": 18.50, "sup": 1},
        {"sku": "SKU-PWR-1205", "name": "Ultra-Low Noise LDO Regulator", "category": "Power Management", "stock": 8, "rop": 50, "safety": 25, "lead": 6, "cost": 1.20, "price": 3.99, "sup": 0},
        {"sku": "SKU-MTR-9002", "name": "NEMA 17 High-Torque Stepper", "category": "Motors & Actuators", "stock": 0, "rop": 30, "safety": 15, "lead": 14, "cost": 14.50, "price": 35.00, "sup": 2},
        {"sku": "SKU-WFL-3309", "name": "Dual-Band Wi-Fi 6 + BT Module", "category": "Wireless Modules", "stock": 65, "rop": 60, "safety": 20, "lead": 18, "cost": 9.20, "price": 24.00, "sup": 3},
        {"sku": "SKU-BAT-5000", "name": "LiPo Rechargeable Cell 5000mAh", "category": "Batteries", "stock": 220, "rop": 70, "safety": 30, "lead": 5, "cost": 7.50, "price": 19.99, "sup": 4},
        {"sku": "SKU-DIS-1080", "name": "4.3-inch Capacitive Touch Display", "category": "Displays", "stock": 18, "rop": 40, "safety": 15, "lead": 12, "cost": 16.00, "price": 42.00, "sup": 1},
        {"sku": "SKU-CNC-6061", "name": "Anodized Aluminum Enclosure", "category": "Mechanical", "stock": 95, "rop": 35, "safety": 15, "lead": 8, "cost": 11.00, "price": 29.50, "sup": 4}
    ]

    created_products = []
    for p in products_data:
        prod = Product(
            sku=p["sku"],
            name=p["name"],
            category=p["category"],
            current_stock=p["stock"],
            reorder_point=p["rop"],
            safety_stock=p["safety"],
            lead_time_days=p["lead"],
            unit_cost=p["cost"],
            selling_price=p["price"],
            supplier_id=created_suppliers[p["sup"]].id
        )
        prod.update_status()
        db.add(prod)
        created_products.append(prod)

    db.commit()

    # 3. SEED 90 DAYS OF SALES HISTORY (With Realistic Weekly Seasonality)
    random.seed(42)
    start_date = datetime.utcnow() - timedelta(days=90)
    channels = ["Online Store", "Retail Store", "Wholesale", "Direct"]

    for prod in created_products:
        base_demand = random.randint(8, 25)
        for d in range(90):
            current_day = start_date + timedelta(days=d)
            is_weekend = current_day.weekday() >= 5
            
            # Weekend bump or weekday demand
            day_multiplier = 1.35 if is_weekend else 1.0
            
            # Random variation
            noise = random.uniform(0.75, 1.25)
            qty = max(1, int(base_demand * day_multiplier * noise))
            
            # Rare promotional spike
            is_promo = (d in [25, 55, 82])
            if is_promo:
                qty = int(qty * 2.5)

            sale = SalesRecord(
                product_id=prod.id,
                date=current_day,
                quantity_sold=qty,
                unit_price=prod.selling_price,
                total_revenue=round(qty * prod.selling_price, 2),
                channel=random.choice(channels),
                is_promotion=is_promo,
                is_holiday=(d in [15, 60])
            )
            db.add(sale)

    db.commit()

    # 4. SEED SHIPMENTS
    carriers = ["FedEx Priority", "DHL Express", "UPS Supply Chain", "Maersk Freight", "BlueDart Logistics"]
    shipments_data = [
        {"trk": "TRK-EXP-90812", "sup_idx": 0, "prod_idx": 0, "qty": 200, "days_ago": 3, "est_days": 2, "orig": "Austin Hub, TX", "dest": "Central Warehouse, Chicago", "carrier": "FedEx Priority", "status": "In Transit", "cost": 120.0},
        {"trk": "TRK-EXP-87114", "sup_idx": 1, "prod_idx": 1, "qty": 100, "days_ago": 12, "est_days": 2, "orig": "Narita Cargo, Tokyo", "dest": "West Coast Depot, LA", "carrier": "DHL Express", "status": "In Transit", "cost": 310.0},
        {"trk": "TRK-EXP-65330", "sup_idx": 3, "prod_idx": 4, "qty": 150, "days_ago": 22, "est_days": -4, "orig": "Shenzhen Port, CN", "dest": "Port of Long Beach, CA", "carrier": "Maersk Freight", "status": "Delayed", "cost": 540.0},
        {"trk": "TRK-EXP-41209", "sup_idx": 2, "prod_idx": 3, "qty": 80, "days_ago": 15, "est_days": -1, "orig": "Frankfurt Logistics, DE", "dest": "East Coast Facility, NJ", "carrier": "UPS Supply Chain", "status": "Delayed", "cost": 290.0},
        {"trk": "TRK-EXP-11985", "sup_idx": 4, "prod_idx": 5, "qty": 300, "days_ago": 8, "est_days": -3, "orig": "Chicago Hub, IL", "dest": "Dallas Distribution, TX", "carrier": "FedEx Priority", "status": "Delivered", "cost": 95.0}
    ]

    for sh in shipments_data:
        order_d = datetime.utcnow() - timedelta(days=sh["days_ago"])
        est_d = datetime.utcnow() + timedelta(days=sh["est_days"])
        actual_d = (datetime.utcnow() - timedelta(days=1)) if sh["status"] == "Delivered" else None

        shipment = Shipment(
            tracking_number=sh["trk"],
            supplier_id=created_suppliers[sh["sup_idx"]].id,
            product_id=created_products[sh["prod_idx"]].id,
            quantity=sh["qty"],
            order_date=order_d,
            estimated_delivery=est_d,
            actual_delivery=actual_d,
            origin=sh["orig"],
            destination=sh["dest"],
            carrier=sh["carrier"],
            status=sh["status"],
            shipping_cost=sh["cost"],
            delay_probability=0.75 if sh["status"] == "Delayed" else 0.12,
            predicted_delay_days=4 if sh["status"] == "Delayed" else 0
        )
        db.add(shipment)

    db.commit()

    # 5. INITIALIZE RESTOCK & ANOMALIES
    StockoutService.sync_recommendations_to_db(db)
    ShipmentService.update_all_shipment_predictions(db)
    AnomalyService.run_full_anomaly_detection(db)

    logger.info("Synthetic demo dataset initialized successfully.")

