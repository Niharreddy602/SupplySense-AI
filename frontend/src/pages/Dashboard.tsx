import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  ShieldAlert,
  Star,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardSummary } from '../types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

const PIE_COLORS = {
  'In Stock': '#10b981',
  'Low Stock': '#f59e0b',
  'Out of Stock': '#f43f5e',
};

const BAR_COLORS = {
  'In Transit': '#0ea5e9',
  'Delayed': '#f43f5e',
  'Delivered': '#10b981',
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Loading supply chain telemetry...</span>
        </div>
      </div>
    );
  }

  // Format pie chart data
  const inventoryPieData = Object.entries(data.inventory_health_breakdown).map(([name, value]) => ({
    name,
    value,
  }));

  // Format bar chart data
  const shipmentBarData = Object.entries(data.shipment_status_breakdown).map(([status, count]) => ({
    status,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Supply Chain Dashboard</h1>
          <p className="text-sm text-slate-400">
            Real-time telemetry, inventory risk quantification, and ML demand projections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/forecasting"
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-teal-500/20 transition"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Demand Forecast Studio</span>
          </Link>
        </div>
      </div>

      {/* Critical Anomaly Alert Banner if high anomalies exist */}
      {data.critical_anomalies_count > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-200">
                {data.critical_anomalies_count} Critical Anomaly Detected by Isolation Forest
              </h4>
              <p className="text-xs text-rose-300/80">
                Unusual demand surges or severe logistics transit delays require review.
              </p>
            </div>
          </div>
          <Link
            to="/anomalies"
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white px-3 py-1.5 bg-rose-500/20 rounded-lg transition"
          >
            <span>Review Anomalies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${data.total_sales_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="All recorded sales"
          icon={DollarSign}
          accentColor="teal"
        />
        <MetricCard
          title="Units Sold"
          value={data.total_units_sold.toLocaleString()}
          subtitle="90-day volume"
          icon={Package}
          accentColor="emerald"
        />
        <MetricCard
          title="Low Stock Items"
          value={data.low_stock_count}
          subtitle={`+${data.out_of_stock_count} out of stock`}
          icon={AlertTriangle}
          accentColor="amber"
          trend={`${data.low_stock_count + data.out_of_stock_count} at risk`}
          trendPositive={false}
        />
        <MetricCard
          title="Active Shipments"
          value={data.active_shipments_count}
          subtitle="In transit"
          icon={Truck}
          accentColor="sky"
        />
        <MetricCard
          title="Delayed Shipments"
          value={data.delayed_shipments_count}
          subtitle="SLA exceeded"
          icon={AlertTriangle}
          accentColor="rose"
        />
        <MetricCard
          title="Supplier Rating"
          value={`${data.supplier_average_rating} / 5.0`}
          subtitle="Network average"
          icon={Star}
          accentColor="emerald"
        />
      </div>

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Daily Revenue &amp; Sales Velocity</h3>
              <p className="text-xs text-slate-400">Aggregated daily revenue from all channels</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
              Last 30 Days
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.recent_sales_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Health Breakdown Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Inventory Health Distribution</h3>
            <p className="text-xs text-slate-400">Stock distribution across SKU catalog</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {inventoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
            {inventoryPieData.map((item) => (
              <div key={item.name} className="px-1 py-1 rounded bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">{item.name}</span>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Shipments Bar Chart & Top Stockout Risks Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logistics Status Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Logistics &amp; Shipments Status</h3>
              <p className="text-xs text-slate-400">Active vs Delayed delivery tracking</p>
            </div>
            <Link to="/shipments" className="text-xs text-teal-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shipmentBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="status" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {shipmentBarData.map((entry, idx) => (
                    <Cell key={`bar-${idx}`} fill={BAR_COLORS[entry.status as keyof typeof BAR_COLORS] || '#38bdf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Stockout Risks Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Stockout Vulnerability Matrix</h3>
              <p className="text-xs text-slate-400">Top SKUs prioritized by consumption rate and lead time</p>
            </div>
            <Link to="/restock" className="text-xs text-teal-400 hover:underline flex items-center gap-1">
              <span>Restock Manager</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">SKU &amp; Product</th>
                  <th className="px-3 py-2.5">Stock</th>
                  <th className="px-3 py-2.5">Daily Demand</th>
                  <th className="px-3 py-2.5">Days Left</th>
                  <th className="px-3 py-2.5">Risk Level</th>
                  <th className="px-3 py-2.5">Suggested Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.top_stockout_risks.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-850/50 transition">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-white">{item.current_stock}</td>
                    <td className="px-3 py-3">{item.avg_daily_demand} / day</td>
                    <td className="px-3 py-3">
                      <span className={item.days_until_stockout <= item.lead_time_days ? 'text-rose-400 font-bold' : ''}>
                        {item.days_until_stockout} days
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={item.stockout_risk_level} />
                    </td>
                    <td className="px-3 py-3 font-medium text-teal-400">
                      +{item.recommended_order_quantity} units
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

