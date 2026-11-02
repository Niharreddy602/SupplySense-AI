# SupplySense AI – Supply Chain Monitoring and Demand Prediction

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)

**SupplySense AI** is a production-grade full-stack supply chain telemetry and predictive intelligence platform. Built as an advanced final-year engineering capstone project, SupplySense AI couples modern time-series machine learning (Random Forest, Gradient Boosting, XGBoost) and unsupervised outlier detection (Isolation Forest) with real-time inventory monitoring, automated Pandas ETL pipelines, supplier risk scoring, and logistical milestone tracking.

---

## 🏛️ System Architecture

```
                          ┌─────────────────────────────────────────┐
                          │    React 18 + TypeScript + Tailwind     │
                          │   (Recharts UI & Executive Dashboard)   │
                          └───────────────────┬─────────────────────┘
                                              │ HTTP / JSON REST
                                              ▼
                          ┌─────────────────────────────────────────┐
                          │         FastAPI Backend Engine          │
                          │    (Asynchronous Python Microservice)   │
                          └───────┬─────────────────────────┬───────┘
                                  │                         │
            ┌─────────────────────┴───────────┐ ┌───────────┴─────────────────────┐
            │   ETL & Data Cleaning Pipeline  │ │  Machine Learning & Analytics   │
            │   - Pandas Schema Validation    │ │  - Autoregressive Demand (RF)   │
            │   - Deduplication & Type Cast   │ │  - 7-Day Moving-Average Base   │
            │   - CSV Import & Export         │ │  - Isolation Forest Anomalies   │
            └─────────────────────┬───────────┘ │  - Delay Probability Classifier │
                                  │             └─────────────────────┬───────────┘
                                  ▼                                   ▼
                          ┌────────────────────────────────────────────────────────┐
                          │       SQLAlchemy ORM Data Persistence Layer            │
                          │   PostgreSQL 16 (Production) / SQLite3 (Zero-Setup)    │
                          └────────────────────────────────────────────────────────┘
```

---

## ✨ Implemented Core Modules

### 1. Executive Telemetry Dashboard
- **Live KPI Telemetry**: Total sales revenue, units sold, low stock alerts, stockout count, active shipments, delayed shipments, and network supplier quality rating.
- **Sales Velocity Trend**: Interactive Recharts area chart plotting 30-day daily aggregated revenue.
- **Inventory Health Breakdown**: Donut distribution of `In Stock`, `Low Stock`, and `Out of Stock` catalog items.
- **Shipments Status Gauge**: Bar chart tracking active, delivered, and SLA-breached transit items.
- **Stockout Vulnerability Matrix**: Prioritized table computing real-time depletion dates and purchase suggestions.

### 2. Inventory CRUD & Real-Time Stock Tracking
- **Complete SKU Catalog**: Manage SKU, name, category, current inventory, reorder point (ROP), safety stock, lead time days, unit cost, and selling price.
- **Dynamic Status Automation**: Automatically transitions products between `In Stock`, `Low Stock` ($\le \text{ROP}$), and `Out of Stock` ($= 0$).
- **Visual Stock Gauges**: Progress indicators highlighting buffer deficiency.
- **Full CRUD Capabilities**: Search, category filters, low-stock toggles, modal dialogs for item addition, modification, and deletion.

### 3. CSV Upload & Automated Pandas ETL Pipeline
- **Multi-Entity Ingestion**: Dedicated upload endpoints for `Inventory`, `Sales Transactions`, and `Shipment Milestones`.
- **Automated Data Sanitization**:
  - Validates required schema headers and cleans whitespace.
  - Coerces dates (`pd.to_datetime`) and casts monetary and count values safely.
  - Drops corrupted rows, filters invalid non-positive quantities, and handles duplicate SKUs.
  - Commits updates atomically to the database.
- **Downloadable CSV Templates**: Built-in 1-click downloads for starter CSV templates.

### 4. Demand Forecasting Engine (ML)
- **Feature Engineering Pipeline**:
  - Multi-lag historical demand features: `lag_1`, `lag_2`, `lag_3`, `lag_7`, `lag_14`.
  - Rolling window statistical features: `rolling_mean_7`, `rolling_std_7`, `rolling_mean_14`.
  - Calendar variables: Day of week, day of month, month, weekend indicators.
- **Model Training**:
  - Trains ensemble models (**Random Forest Regressor**, **Gradient Boosting**, or **XGBoost**).
  - Evaluated on a sequential time-series test split (80% train / 20% test).
- **Comprehensive Evaluation vs. Baseline**:
  - Compares model against a **7-Day Moving-Average Baseline**.
  - Calculates **MAE** (Mean Absolute Error), **RMSE** (Root Mean Squared Error), **MAPE** (Mean Absolute Percentage Error), and **$R^2$ Score**.
- **Recursive Multi-Step Projection**: Projects 7, 14, or 30 days ahead with 95% confidence intervals ($\pm 1.96 \times \sigma$).

### 5. Stockout Risk Prediction & Restocking Engine
- **Consumption Velocity Calculation**: Calculates true daily demand rate based on historical transactions.
- **Depletion Horizon**: Quantifies exact days until zero inventory ($\text{Stock} / \text{Daily Demand}$).
- **Reorder Point (ROP) Algorithm**:
  $$\text{ROP} = (\text{Average Daily Demand} \times \text{Lead Time}) + \text{Safety Stock}$$
- **Economic Order Quantity (EOQ)**:
  $$\text{EOQ} = \sqrt{\frac{2 \times D \times S}{H}}$$
  *(Where $D$ = Annual Demand, $S$ = Fixed Ordering Cost, $H$ = Unit Holding Cost).*
- **Purchase Order Workflow**: Action buttons to mark recommendations as `Approved`, `Ordered`, or `Dismissed`.

### 6. Shipment Tracking & Delay Prediction
- **Transit Telemetry**: Real-time tracking of tracking numbers, carriers (FedEx, DHL, UPS, Maersk, BlueDart), routes, quantities, and delivery SLAs.
- **Predictive Delay Modeling**: Computes delay probability based on historical carrier performance, route complexity (cross-border customs), and elapsed transit ratios.
- **Interactive Route Simulator**: Experiment with different carriers, origins, destinations, and supplier lead-time variances to preview delay probabilities before dispatching.

### 7. Unsupervised Anomaly Detection
- **Isolation Forest Model**: Scikit-Learn `IsolationForest` continuously scanning multi-dimensional telemetry:
  - Demand surges or abrupt plummets.
  - Critical stock depletions while customer demand persists.
  - Severe shipping delays exceeding SLA thresholds.
- **Severity Scoring**: Categorizes anomalies into `Critical`, `High`, `Medium`, and `Low` with explainable audit notes.
- **Configurable Sensitivity**: Interactive slider adjusting contamination rate from 1% to 15%.

### 8. Supplier Performance Analysis & Downloadable Reports
- **Vendor Scorecards**: On-Time Delivery (OTD %) compliance, quality rating (1.0 to 5.0), and average lead time.
- **Tier Classification**: Dynamically assigns `Tier 1 (Preferred)`, `Tier 2 (Standard)`, or `Tier 3 (Under Review)`.
- **Downloadable Reports**: Export comprehensive audit reports in **CSV** and **JSON** format for executive reviews.

---

## 🚀 Quickstart Guide

### Option 1: Local Development (Fastest)

#### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend (uses SQLite out-of-the-box, or set DATABASE_URL in .env)
python run.py
```
*Backend API will be live at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend will be live at `http://localhost:5173`.*

---

### Option 2: Docker Compose (Full Stack with PostgreSQL)

To launch the full stack including PostgreSQL 16 database with a single command:

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **PostgreSQL Database**: `localhost:5432` (`user: postgres`, `password: postgrespassword`, `database: supplysense_db`)

---

## 🧪 Automated Verification & Testing

The backend includes direct test runners that execute the full suite without network dependency:

```bash
# Run direct verification suite
python backend/test_direct.py
```

Output:
```
1. Initializing database and tables...
2. Testing Dashboard Summary Router...
✓ Dashboard Verified: Total Revenue = $334,791.73, Sold = 12631 units
3. Testing Inventory CRUD & Stock Tracking...
✓ Inventory Listed: 8 products found
✓ Inventory Create, Update, and Delete Verified
4. Testing Demand Forecasting Engine (ML)...
✓ ML Demand Forecasting Verified: Model = Random Forest Regressor (MAE=3.5, RMSE=4.33, Baseline MAE=8.51)
5. Testing Shipment Delay Prediction...
✓ Delay Prediction Verified: Probability = 67.0%, Delay = 2 days
6. Testing Anomaly Detection (Isolation Forest)...
✓ Anomaly Detection Verified: Isolation Forest scan active
7. Testing Supplier Performance Analysis...
✓ Suppliers Verified: 5 suppliers monitored
8. Testing ETL CSV Template Generation...
✓ ETL CSV Template Verified
=======================================================
ALL BACKEND MODULES AND ML PIPELINES PASSED 100% SUITE!
=======================================================
```

---

## 📂 Project Directory Structure

```
capstone/
├── backend/
│   ├── app/
│   │   ├── config.py              # Pydantic environment settings
│   │   ├── database.py            # SQLAlchemy PostgreSQL & SQLite engine
│   │   ├── main.py                # FastAPI initialization & routing
│   │   ├── seed_data.py           # Synthetic 90-day time-series demo seeder
│   │   ├── models/                # SQLAlchemy ORM database models
│   │   │   ├── inventory.py       # Product & RestockRecommendation
│   │   │   ├── sales.py           # SalesRecord
│   │   │   ├── shipment.py        # Shipment & AnomalyLog
│   │   │   └── supplier.py        # Supplier scorecard
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   │   ├── inventory.py
│   │   │   ├── sales.py
│   │   │   ├── shipment.py
│   │   │   ├── supplier.py
│   │   │   └── ml.py
│   │   ├── services/              # ML algorithms & business logic
│   │   │   ├── forecast_service.py # Time-series lag feature extraction & regression
│   │   │   ├── stockout_service.py # Depletion days, ROP, EOQ calculations
│   │   │   ├── shipment_service.py # Transit delay probability scoring
│   │   │   ├── anomaly_service.py  # Isolation Forest unsupervised outlier detection
│   │   │   ├── supplier_service.py # Live OTD % & tier classifications
│   │   │   └── etl_service.py      # Pandas CSV sanitization & ingestion
│   │   └── routers/               # FastAPI REST endpoints
│   ├── tests/                     # Test cases
│   ├── requirements.txt           # Python backend dependencies
│   ├── .env.example               # Environment variables template
│   ├── run.py                     # Backend entry point
│   ├── test_direct.py             # 100% test verification script
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Typed Axios REST client
│   │   ├── types/index.ts         # TypeScript interfaces
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── Modal.tsx
│   │   ├── pages/                 # Full-featured module pages
│   │   │   ├── Dashboard.tsx      # Executive telemetry & charts
│   │   │   ├── InventoryPage.tsx  # Product catalog CRUD & gauges
│   │   │   ├── ForecastingPage.tsx# ML forecast studio & evaluation
│   │   │   ├── RestockPage.tsx    # Stockout risk matrix & PO manager
│   │   │   ├── ShipmentsPage.tsx  # Shipment tracker & delay simulator
│   │   │   ├── AnomaliesPage.tsx  # Isolation Forest alert inspector
│   │   │   ├── SuppliersPage.tsx  # Vendor performance scorecards
│   │   │   ├── ETLUploadPage.tsx  # CSV dropzone & Pandas validation
│   │   │   └── ReportsPage.tsx    # Downloadable executive audits
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── Dockerfile
├── sample_data/                   # Ready-to-upload CSV files for testing
│   ├── inventory_sample.csv
│   ├── sales_sample.csv
│   ├── shipments_sample.csv
│   └── suppliers_sample.csv
├── docker-compose.yml             # Full-stack orchestrator
└── README.md
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and database connectivity status |
| `GET` | `/api/dashboard/summary` | Aggregated executive KPIs, trends, and risk tables |
| `GET` | `/api/inventory` | Search, filter, and paginate inventory catalog |
| `POST` | `/api/inventory` | Add new product SKU with reorder parameters |
| `PUT` | `/api/inventory/{id}` | Update existing product stock or lead time |
| `DELETE` | `/api/inventory/{id}` | Remove product from catalog |
| `GET` | `/api/inventory/recommendations/list` | List active algorithmic restock recommendations |
| `POST` | `/api/inventory/recommendations/{id}/status` | Update recommendation status (`Approved`/`Ordered`/`Dismissed`) |
| `GET` | `/api/forecast/products` | Retrieve products eligible for demand forecasting |
| `POST` | `/api/forecast/predict` | Train ML model and generate multi-day demand predictions with metrics |
| `GET` | `/api/shipments` | List all tracked shipments with delay probabilities |
| `POST` | `/api/shipments` | Dispatch new shipment |
| `POST` | `/api/shipments/predict-delay` | Interactive route and carrier delay risk prediction |
| `GET` | `/api/anomalies` | Retrieve Isolation Forest detected anomalies |
| `POST` | `/api/anomalies/detect` | Trigger on-demand anomaly scan with contamination rate |
| `GET` | `/api/suppliers` | Retrieve suppliers with live OTD % and tier classifications |
| `POST` | `/api/etl/upload/{type}` | Upload CSV dataset with automated Pandas sanitization |
| `GET` | `/api/etl/template/{type}` | Download sample CSV template |
| `GET` | `/api/reports/download` | Export comprehensive audit report (CSV / JSON) |

---

## 🎓 Capstone Presentation Highlights

1. **True Machine Learning vs Hardcoded Mockups**: Incorporates active Scikit-Learn algorithms (Random Forest, Gradient Boosting, Isolation Forest) evaluated against standard time-series baselines (MAE, RMSE, $R^2$).
2. **Robust Industrial Formulas**: Uses actual inventory control mathematics (Safety Stock, Reorder Point, and Economic Order Quantity).
3. **Database Portability**: Runs seamlessly with zero setup on SQLite for instant local demonstration, and transitions seamlessly to PostgreSQL via a single `.env` setting or Docker Compose.
4. **Data Integrity Pipeline**: Full Pandas ETL layer that cleanses and deduplicates user-provided datasets before database insertion.

