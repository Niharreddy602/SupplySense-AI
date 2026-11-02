import io
import logging
from datetime import datetime
from typing import Dict, Any, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from app.models.inventory import Product
from app.models.sales import SalesRecord
from app.models.shipment import Shipment
from app.models.supplier import Supplier

logger = logging.getLogger(__name__)

class ETLService:

    @classmethod
    def process_inventory_csv(cls, file_bytes: bytes, db: Session) -> Dict[str, Any]:
        """
        ETL pipeline for products/inventory CSV.
        Expected columns: sku, name, category, current_stock, reorder_point, safety_stock, lead_time_days, unit_cost, selling_price, supplier_id (optional)
        """
        df = pd.read_csv(io.BytesIO(file_bytes))
        df.columns = [c.strip().lower() for c in df.columns]

        required_cols = ['sku', 'name', 'category']
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns in CSV: {', '.join(missing)}")

        # Data Cleaning with Pandas
        df['sku'] = df['sku'].astype(str).str.strip().str.upper()
        df['name'] = df['name'].astype(str).str.strip()
        df['category'] = df['category'].astype(str).str.strip()
        df['current_stock'] = pd.to_numeric(df.get('current_stock', 0), errors='coerce').fillna(0).astype(int)
        df['reorder_point'] = pd.to_numeric(df.get('reorder_point', 20), errors='coerce').fillna(20).astype(int)
        df['safety_stock'] = pd.to_numeric(df.get('safety_stock', 10), errors='coerce').fillna(10).astype(int)
        df['lead_time_days'] = pd.to_numeric(df.get('lead_time_days', 7), errors='coerce').fillna(7).astype(int)
        df['unit_cost'] = pd.to_numeric(df.get('unit_cost', 0.0), errors='coerce').fillna(0.0).astype(float)
        df['selling_price'] = pd.to_numeric(df.get('selling_price', 0.0), errors='coerce').fillna(0.0).astype(float)

        if 'supplier_id' in df.columns:
            df['supplier_id'] = pd.to_numeric(df['supplier_id'], errors='coerce')

        # Drop duplicates by SKU
        df = df.drop_duplicates(subset=['sku'], keep='last')

        inserted = 0
        updated = 0

        for _, row in df.iterrows():
            prod = db.query(Product).filter(Product.sku == row['sku']).first()
            sup_id = int(row['supplier_id']) if pd.notna(row.get('supplier_id')) else None

            if prod:
                prod.name = row['name']
                prod.category = row['category']
                prod.current_stock = int(row['current_stock'])
                prod.reorder_point = int(row['reorder_point'])
                prod.safety_stock = int(row['safety_stock'])
                prod.lead_time_days = int(row['lead_time_days'])
                prod.unit_cost = float(row['unit_cost'])
                prod.selling_price = float(row['selling_price'])
                if sup_id:
                    prod.supplier_id = sup_id
                prod.update_status()
                updated += 1
            else:
                prod = Product(
                    sku=row['sku'],
                    name=row['name'],
                    category=row['category'],
                    current_stock=int(row['current_stock']),
                    reorder_point=int(row['reorder_point']),
                    safety_stock=int(row['safety_stock']),
                    lead_time_days=int(row['lead_time_days']),
                    unit_cost=float(row['unit_cost']),
                    selling_price=float(row['selling_price']),
                    supplier_id=sup_id
                )
                prod.update_status()
                db.add(prod)
                inserted += 1

        db.commit()
        return {
            "entity": "Inventory / Products",
            "total_rows_parsed": len(df),
            "inserted_count": inserted,
            "updated_count": updated
        }

    @classmethod
    def process_sales_csv(cls, file_bytes: bytes, db: Session) -> Dict[str, Any]:
        """
        ETL pipeline for sales records CSV.
        Expected columns: sku (or product_id), date, quantity_sold, unit_price, channel (optional)
        """
        df = pd.read_csv(io.BytesIO(file_bytes))
        df.columns = [c.strip().lower() for c in df.columns]

        if 'sku' not in df.columns and 'product_id' not in df.columns:
            raise ValueError("CSV must contain either 'sku' or 'product_id' column.")
        if 'quantity_sold' not in df.columns:
            raise ValueError("CSV must contain 'quantity_sold' column.")

        df['quantity_sold'] = pd.to_numeric(df['quantity_sold'], errors='coerce').fillna(0).astype(int)
        df = df[df['quantity_sold'] > 0] # Filter invalid sales

        # Date parsing
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce').fillna(datetime.utcnow())
        else:
            df['date'] = datetime.utcnow()

        df['unit_price'] = pd.to_numeric(df.get('unit_price', 0.0), errors='coerce').fillna(0.0).astype(float)
        df['channel'] = df.get('channel', 'Online Store').astype(str).str.strip().fillna('Online Store')

        # Map SKUs to Product IDs
        sku_map = {p.sku: p for p in db.query(Product).all()}
        id_map = {p.id: p for p in sku_map.values()}

        inserted = 0
        skipped = 0

        for _, row in df.iterrows():
            target_prod = None
            if 'sku' in row and str(row['sku']).strip().upper() in sku_map:
                target_prod = sku_map[str(row['sku']).strip().upper()]
            elif 'product_id' in row and int(row['product_id']) in id_map:
                target_prod = id_map[int(row['product_id'])]

            if not target_prod:
                skipped += 1
                continue

            price = float(row['unit_price']) if float(row['unit_price']) > 0 else target_prod.selling_price
            qty = int(row['quantity_sold'])
            revenue = round(price * qty, 2)

            sale = SalesRecord(
                product_id=target_prod.id,
                date=row['date'],
                quantity_sold=qty,
                unit_price=price,
                total_revenue=revenue,
                channel=str(row['channel']),
                is_promotion=bool(row.get('is_promotion', False)),
                is_holiday=bool(row.get('is_holiday', False))
            )
            db.add(sale)
            inserted += 1

        db.commit()
        return {
            "entity": "Sales Records",
            "total_rows_parsed": len(df),
            "inserted_count": inserted,
            "skipped_count": skipped
        }

    @classmethod
    def process_shipments_csv(cls, file_bytes: bytes, db: Session) -> Dict[str, Any]:
        """
        ETL pipeline for shipments CSV.
        """
        df = pd.read_csv(io.BytesIO(file_bytes))
        df.columns = [c.strip().lower() for c in df.columns]

        required = ['tracking_number', 'supplier_id', 'origin', 'destination', 'estimated_delivery']
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"Missing columns: {', '.join(missing)}")

        df['tracking_number'] = df['tracking_number'].astype(str).str.strip().str.upper()
        df['supplier_id'] = pd.to_numeric(df['supplier_id'], errors='coerce').fillna(1).astype(int)
        df['estimated_delivery'] = pd.to_datetime(df['estimated_delivery'], errors='coerce').fillna(datetime.utcnow())
        df['order_date'] = pd.to_datetime(df.get('order_date', datetime.utcnow()), errors='coerce').fillna(datetime.utcnow())
        df['carrier'] = df.get('carrier', 'Standard Logistics').astype(str).str.strip()
        df['shipping_cost'] = pd.to_numeric(df.get('shipping_cost', 0.0), errors='coerce').fillna(0.0).astype(float)
        df['quantity'] = pd.to_numeric(df.get('quantity', 1), errors='coerce').fillna(1).astype(int)

        inserted = 0
        updated = 0

        for _, row in df.iterrows():
            ship = db.query(Shipment).filter(Shipment.tracking_number == row['tracking_number']).first()
            if ship:
                ship.estimated_delivery = row['estimated_delivery']
                ship.carrier = row['carrier']
                ship.shipping_cost = float(row['shipping_cost'])
                updated += 1
            else:
                ship = Shipment(
                    tracking_number=row['tracking_number'],
                    supplier_id=int(row['supplier_id']),
                    origin=str(row['origin']),
                    destination=str(row['destination']),
                    order_date=row['order_date'],
                    estimated_delivery=row['estimated_delivery'],
                    carrier=str(row['carrier']),
                    shipping_cost=float(row['shipping_cost']),
                    quantity=int(row['quantity']),
                    status="In Transit"
                )
                db.add(ship)
                inserted += 1

        db.commit()
        return {
            "entity": "Shipments",
            "total_rows_parsed": len(df),
            "inserted_count": inserted,
            "updated_count": updated
        }

    @staticmethod
    def generate_sample_csv(entity_type: str) -> str:
        """
        Generates CSV template with headers and example records.
        """
        if entity_type == "inventory":
            return (
                "sku,name,category,current_stock,reorder_point,safety_stock,lead_time_days,unit_cost,selling_price,supplier_id\n"
                "SKU-ELEC-101,Smart IoT Gateway,Electronics,45,25,10,7,42.50,89.99,1\n"
                "SKU-MECH-202,High-Torque Stepper Motor,Industrial,12,30,15,14,18.00,45.00,2\n"
                "SKU-SENS-303,Optical Humidity Sensor,Sensors,5,20,10,5,8.20,24.50,1\n"
            )
        elif entity_type == "sales":
            return (
                "sku,date,quantity_sold,unit_price,channel,is_promotion,is_holiday\n"
                "SKU-ELEC-101,2026-10-25,14,89.99,Online Store,false,false\n"
                "SKU-MECH-202,2026-10-25,8,45.00,Wholesale,false,false\n"
                "SKU-ELEC-101,2026-10-26,22,89.99,Online Store,true,false\n"
            )
        elif entity_type == "shipments":
            return (
                "tracking_number,supplier_id,quantity,order_date,estimated_delivery,origin,destination,carrier,shipping_cost\n"
                "TRK-9821034,1,100,2026-10-28,2026-11-05,Shenzhen Hub,Dallas Distribution,FedEx Priority,145.50\n"
                "TRK-5542190,2,50,2026-10-27,2026-11-03,Munich Terminal,Chicago Warehouse,DHL Express,98.00\n"
            )
        elif entity_type == "suppliers":
            return (
                "name,contact_email,phone,location,lead_time_days,on_time_delivery_rate,quality_rating,tier\n"
                "Apex Electronics Corp,sales@apexelectronics.com,+1-555-0199,Domestic,7,0.95,4.8,Tier 1\n"
                "Global Components Ltd,support@globalparts.com,+49-89-22345,International,14,0.88,4.2,Tier 2\n"
            )
        return ""

