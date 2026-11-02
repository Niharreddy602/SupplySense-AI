import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  DollarSign,
  Clock,
  ShieldCheck,
  RefreshCw,
  Calculator
} from 'lucide-react';
import { api } from '../api/client';
import { RestockRecommendation, StockoutRiskItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const RestockPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RestockRecommendation[]>([]);
  const [risks, setRisks] = useState<StockoutRiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, dash] = await Promise.all([
        api.getRestockRecommendations(),
        api.getDashboardSummary(),
      ]);
      setRecommendations(recs);
      setRisks(dash.top_stockout_risks);
    } catch (err) {
      console.error('Failed to load restock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (recId: number, status: string) => {
    try {
      await api.updateRecommendationStatus(recId, status);
      setActionMsg(`Recommendation #${recId} marked as '${status}'.`);
      loadData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      alert('Failed to update recommendation status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Stockout Risk Analysis &amp; Restocking Engine</span>
          </h1>
          <p className="text-sm text-slate-400">
            Algorithmic stockout risk mitigation, Economic Order Quantity (EOQ), and purchase order generation.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Restock Priorities</span>
        </button>
      </div>

      {actionMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Formula Transparency Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Algorithmic Reorder Point (ROP) Formula</h3>
            <p className="text-xs text-slate-400">
              <span className="font-mono text-teal-400 font-semibold">ROP = (Daily Demand Rate × Supplier Lead Time) + Safety Buffer</span>
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400 bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800">
          <div>EOQ Formula: <span className="font-mono text-emerald-400">√((2 × D × S) / H)</span></div>
          <div className="text-[11px] text-slate-500">Minimizes inventory holding &amp; ordering setup costs</div>
        </div>
      </div>

      {/* Actionable Restock Purchase Recommendations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Active Restock Recommendations</h3>
            <p className="text-xs text-slate-400">Review pending orders and approve automated replenishments</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-slate-800 text-teal-400 font-semibold rounded-md border border-slate-700">
            {recommendations.length} Orders Pending Action
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">SKU &amp; Product</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Reorder Point</th>
                <th className="px-4 py-3">Recommended Order</th>
                <th className="px-4 py-3">Estimated Cost</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Audit Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Computing restocking requirements...
                  </td>
                </tr>
              ) : recommendations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-emerald-400">
                    All inventory levels healthy. No urgent restocking required.
                  </td>
                </tr>
              ) : (
                recommendations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{r.product_name}</div>
                      <div className="font-mono text-[11px] text-teal-400">{r.product_sku}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{r.current_stock} units</td>
                    <td className="px-4 py-3 text-slate-400">{r.reorder_point} units</td>
                    <td className="px-4 py-3 font-bold text-teal-400">
                      +{r.recommended_quantity} units
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      ${r.estimated_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.risk_level} />
                    </td>
                    <td className="px-4 py-3 max-w-xs text-slate-400 truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(r.id, 'Approved')}
                            className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(r.id, 'Ordered')}
                            className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded transition"
                          >
                            Order
                          </button>
                          <button
                            onClick={() => handleAction(r.id, 'Dismissed')}
                            className="px-2 py-1 text-slate-400 hover:text-rose-400 rounded transition"
                            title="Dismiss"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">{r.status}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stockout Risk Vulnerability Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-2">Live Stockout Risk Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">
          Quantified probability score based on real daily demand velocity versus supplier fulfillment lead times.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {risks.map((item) => (
            <div
              key={item.sku}
              className={`p-4 rounded-xl border transition ${
                item.stockout_risk_level === 'Critical'
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : item.stockout_risk_level === 'High'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-teal-400 font-semibold">{item.sku}</span>
                <StatusBadge status={item.stockout_risk_level} />
              </div>
              <h4 className="text-sm font-bold text-white truncate mb-2">{item.name}</h4>
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <span className="font-semibold text-white">{item.current_stock}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Consumption:</span>
                  <span className="text-slate-300">{item.avg_daily_demand} / day</span>
                </div>
                <div className="flex justify-between">
                  <span>Days Until Stockout:</span>
                  <span className={`font-bold ${item.days_until_stockout <= item.lead_time_days ? 'text-rose-400' : 'text-slate-200'}`}>
                    {item.days_until_stockout} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier Lead Time:</span>
                  <span className="text-slate-300">{item.lead_time_days} days</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Risk Score</span>
                <span className="text-sm font-bold text-teal-400">{item.risk_score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

