import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  Calendar,
  Layers,
  Award,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../api/client';
import { DemandForecastResponse } from '../types';

export const ForecastingPage: React.FC = () => {
  const [products, setProducts] = useState<{ id: number; sku: string; name: string; sales_count: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [horizonDays, setHorizonDays] = useState<number>(14);
  const [modelType, setModelType] = useState<string>('random_forest');
  const [forecastData, setForecastData] = useState<DemandForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.getForecastingProducts();
        setProducts(res);
        if (res.length > 0) {
          setSelectedProductId(res[0].id);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const runForecast = async () => {
    if (!selectedProductId) return;
    try {
      setLoading(true);
      const res = await api.predictDemand(selectedProductId, horizonDays, modelType);
      setForecastData(res);
    } catch (err) {
      console.error('Forecast error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      runForecast();
    }
  }, [selectedProductId, horizonDays, modelType]);

  // Combine historical and forecast data for the composed chart
  const combinedChartData = React.useMemo(() => {
    if (!forecastData) return [];

    const hist = forecastData.historical.map((h) => ({
      date: h.date,
      historical: h.quantity_sold,
      forecast: null,
      baseline: null,
      lower_bound: null,
      upper_bound: null,
    }));

    // Connect the last historical point with the first forecast point
    const lastHist = hist[hist.length - 1];

    const fc = forecastData.forecast.map((f, idx) => ({
      date: f.date,
      historical: idx === 0 && lastHist ? lastHist.historical : null,
      forecast: f.predicted_demand,
      baseline: f.baseline_ma,
      lower_bound: f.lower_bound,
      upper_bound: f.upper_bound,
    }));

    return [...hist, ...fc];
  }, [forecastData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Demand Prediction &amp; ML Studio</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 font-mono">
              Scikit-Learn / XGBoost
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            Multi-horizon recursive autoregression with lag features, moving-average baseline, and confidence intervals.
          </p>
        </div>
      </div>

      {/* Control Panel: Product Selector, Horizon, Model Choice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Product (SKU)
          </label>
          <select
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name} ({p.sales_count} sales)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Forecast Horizon
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                className={`py-2 text-xs font-semibold rounded-lg border transition ${
                  horizonDays === days
                    ? 'bg-teal-500/15 text-teal-400 border-teal-500/30 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Machine Learning Algorithm
          </label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 transition"
          >
            <option value="random_forest">Random Forest Regressor (Ensemble)</option>
            <option value="gradient_boosting">Gradient Boosting Regressor</option>
            <option value="xgboost">XGBoost Regressor (Extreme Gradient)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh] bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400">Training ML model and extracting lag features...</span>
          </div>
        </div>
      ) : forecastData ? (
        <>
          {/* ML Performance & Evaluation Scorecard */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-white">
                  Model Evaluation: {forecastData.model_used} vs. 7-Day Moving-Average Baseline
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Evaluation: 80/20 Time-Series Sequential Split
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">ML Model MAE</span>
                <span className="text-lg font-bold text-teal-400">{forecastData.metrics.mae}</span>
                <span className="text-[10px] text-slate-500 block">Mean Absolute Error</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Baseline MAE</span>
                <span className="text-lg font-bold text-amber-400">{forecastData.metrics.baseline_mae}</span>
                <span className="text-[10px] text-slate-500 block">7-day Moving Avg</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">ML Model RMSE</span>
                <span className="text-lg font-bold text-teal-400">{forecastData.metrics.rmse}</span>
                <span className="text-[10px] text-slate-500 block">Root Mean Sq Err</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Baseline RMSE</span>
                <span className="text-lg font-bold text-amber-400">{forecastData.metrics.baseline_rmse}</span>
                <span className="text-[10px] text-slate-500 block">Rolling Window</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Model MAPE</span>
                <span className="text-lg font-bold text-white">{forecastData.metrics.mape}%</span>
                <span className="text-[10px] text-slate-500 block">Percentage Error</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">R² Score</span>
                <span className="text-lg font-bold text-emerald-400">{forecastData.metrics.r2_score}</span>
                <span className="text-[10px] text-slate-500 block">Variance Explained</span>
              </div>
            </div>
          </div>

          {/* Interactive Composed Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Demand Projection Trajectory: {forecastData.product_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Historical telemetry compared against ML projected demand with 95% confidence bounds.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-0.5 bg-slate-400"></span> Historical
                </span>
                <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                  <span className="w-3 h-0.5 bg-teal-400"></span> ML Forecast
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-0.5 border-t border-dashed border-amber-400"></span> Baseline MA
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                  />
                  {/* Confidence Interval Band */}
                  <Area
                    type="monotone"
                    dataKey="upper_bound"
                    stroke="none"
                    fill="url(#ciGrad)"
                    name="Upper Bound (95% CI)"
                  />
                  {/* Historical Sales Line */}
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                    name="Actual Sales"
                  />
                  {/* Baseline Moving Average */}
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="7-day MA Baseline"
                  />
                  {/* Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#14b8a6"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#14b8a6' }}
                    name="ML Demand Forecast"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast Points Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">
              Predicted Daily Demand Breakdown ({horizonDays} Days Ahead)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Forecast Date</th>
                    <th className="px-4 py-2.5">Predicted Demand</th>
                    <th className="px-4 py-2.5">95% Confidence Range</th>
                    <th className="px-4 py-2.5">7-Day MA Baseline</th>
                    <th className="px-4 py-2.5">Expected Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {forecastData.forecast.map((pt) => (
                    <tr key={pt.date} className="hover:bg-slate-850/50 transition">
                      <td className="px-4 py-2.5 font-mono text-slate-300">{pt.date}</td>
                      <td className="px-4 py-2.5 font-bold text-teal-400">{pt.predicted_demand} units</td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {pt.lower_bound} — {pt.upper_bound} units
                      </td>
                      <td className="px-4 py-2.5 text-amber-400/90">{pt.baseline_ma} units</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active Demand
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

