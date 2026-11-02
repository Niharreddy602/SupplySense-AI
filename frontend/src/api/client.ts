import axios from 'axios';
import {
  DashboardSummary,
  Product,
  Shipment,
  Supplier,
  DemandForecastResponse,
  RestockRecommendation,
  AnomalyItem
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await client.get('/dashboard/summary');
    return res.data;
  },

  // Inventory
  getInventory: async (params?: { search?: string; category?: string; status?: string; low_stock_only?: boolean }): Promise<Product[]> => {
    const res = await client.get('/inventory', { params });
    return res.data;
  },
  getCategories: async (): Promise<string[]> => {
    const res = await client.get('/inventory/categories');
    return res.data;
  },
  getProduct: async (id: number): Promise<Product> => {
    const res = await client.get(`/inventory/${id}`);
    return res.data;
  },
  createProduct: async (product: Partial<Product>): Promise<Product> => {
    const res = await client.post('/inventory', product);
    return res.data;
  },
  updateProduct: async (id: number, product: Partial<Product>): Promise<Product> => {
    const res = await client.put(`/inventory/${id}`, product);
    return res.data;
  },
  deleteProduct: async (id: number): Promise<{ message: string }> => {
    const res = await client.delete(`/inventory/${id}`);
    return res.data;
  },
  getRestockRecommendations: async (): Promise<RestockRecommendation[]> => {
    const res = await client.get('/inventory/recommendations/list');
    return res.data;
  },
  updateRecommendationStatus: async (recId: number, status: string): Promise<any> => {
    const res = await client.post(`/inventory/recommendations/${recId}/status`, { status });
    return res.data;
  },

  // Forecasting
  getForecastingProducts: async (): Promise<{ id: number; sku: string; name: string; category: string; sales_count: number }[]> => {
    const res = await client.get('/forecast/products');
    return res.data;
  },
  predictDemand: async (productId: number, horizonDays: number = 14, modelType: string = 'random_forest'): Promise<DemandForecastResponse> => {
    const res = await client.post('/forecast/predict', {
      product_id: productId,
      horizon_days: horizonDays,
      model_type: modelType,
    });
    return res.data;
  },

  // Shipments
  getShipments: async (params?: { status?: string; carrier?: string }): Promise<Shipment[]> => {
    const res = await client.get('/shipments', { params });
    return res.data;
  },
  createShipment: async (shipment: Partial<Shipment>): Promise<Shipment> => {
    const res = await client.post('/shipments', shipment);
    return res.data;
  },
  updateShipment: async (id: number, data: Partial<Shipment>): Promise<Shipment> => {
    const res = await client.put(`/shipments/${id}`, data);
    return res.data;
  },
  predictDelay: async (data: { carrier: string; origin: string; destination: string; transit_days: number; supplier_lead_time_variance: number }): Promise<any> => {
    const res = await client.post('/shipments/predict-delay', data);
    return res.data;
  },

  // Suppliers
  getSuppliers: async (): Promise<Supplier[]> => {
    const res = await client.get('/suppliers');
    return res.data;
  },
  createSupplier: async (supplier: Partial<Supplier>): Promise<Supplier> => {
    const res = await client.post('/suppliers', supplier);
    return res.data;
  },

  // Anomalies
  getAnomalies: async (params?: { severity?: string; entity_type?: string }): Promise<AnomalyItem[]> => {
    const res = await client.get('/anomalies', { params });
    return res.data;
  },
  triggerAnomalyScan: async (contamination: number = 0.05): Promise<any> => {
    const res = await client.post(`/anomalies/detect?contamination=${contamination}`);
    return res.data;
  },
  dismissAnomaly: async (id: number): Promise<any> => {
    const res = await client.delete(`/anomalies/${id}`);
    return res.data;
  },

  // ETL
  uploadCsv: async (entityType: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post(`/etl/upload/${entityType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getTemplateUrl: (entityType: string): string => {
    return `${API_BASE}/etl/template/${entityType}`;
  },
  getReportDownloadUrl: (reportType: string, format: string = 'csv'): string => {
    return `${API_BASE}/reports/download?report_type=${reportType}&format=${format}`;
  }
};

