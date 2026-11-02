export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  safety_stock: number;
  lead_time_days: number;
  unit_cost: number;
  selling_price: number;
  supplier_id?: number | null;
  supplier_name?: string | null;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | string;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_email?: string;
  phone?: string;
  location: string;
  lead_time_days: number;
  on_time_delivery_rate: number;
  quality_rating: number;
  tier: string;
  total_shipments: number;
  delayed_shipments: number;
  products_supplied: number;
}

export interface Shipment {
  id: number;
  tracking_number: string;
  supplier_id: number;
  product_id?: number | null;
  supplier_name?: string;
  product_name?: string;
  quantity: number;
  order_date: string;
  estimated_delivery: string;
  actual_delivery?: string | null;
  origin: string;
  destination: string;
  carrier: string;
  status: 'In Transit' | 'Delivered' | 'Delayed' | 'Cancelled' | string;
  shipping_cost: number;
  delay_probability: number;
  predicted_delay_days: number;
  created_at: string;
}

export interface ForecastPoint {
  date: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  baseline_ma: number;
}

export interface EvaluationMetrics {
  mae: number;
  rmse: number;
  mape: number;
  r2_score: number;
  baseline_mae: number;
  baseline_rmse: number;
}

export interface DemandForecastResponse {
  product_id: number;
  product_name: string;
  product_sku: string;
  model_used: string;
  metrics: EvaluationMetrics;
  historical: { date: string; quantity_sold: number }[];
  forecast: ForecastPoint[];
}

export interface StockoutRiskItem {
  product_id: number;
  sku: string;
  name: string;
  current_stock: number;
  avg_daily_demand: number;
  lead_time_days: number;
  days_until_stockout: number;
  stockout_risk_level: 'Critical' | 'High' | 'Moderate' | 'Low' | string;
  risk_score: number;
  reorder_point: number;
  recommended_order_quantity: number;
  supplier_name?: string;
}

export interface RestockRecommendation {
  id: number;
  product_id: number;
  product_sku: string;
  product_name: string;
  current_stock: number;
  reorder_point: number;
  recommended_quantity: number;
  risk_level: 'Critical' | 'High' | 'Moderate' | 'Low' | string;
  reason: string;
  estimated_cost: number;
  status: 'Pending' | 'Approved' | 'Ordered' | 'Dismissed' | string;
  created_at: string;
}

export interface AnomalyItem {
  id: number;
  entity_type: string;
  entity_id?: number;
  metric_name: string;
  anomaly_score: number;
  detected_value: number;
  expected_range: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  details: string;
  detected_at: string;
}

export interface DashboardSummary {
  total_sales_revenue: number;
  total_units_sold: number;
  total_products_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  active_shipments_count: number;
  delayed_shipments_count: number;
  supplier_average_rating: number;
  critical_anomalies_count: number;
  recent_sales_trend: { date: string; revenue: number; units: number }[];
  inventory_health_breakdown: Record<string, number>;
  shipment_status_breakdown: Record<string, number>;
  top_selling_products: { sku: string; name: string; units_sold: number; revenue: number }[];
  top_stockout_risks: StockoutRiskItem[];
  recent_anomalies: AnomalyItem[];
}

