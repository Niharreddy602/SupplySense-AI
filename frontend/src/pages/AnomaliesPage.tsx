import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Clock,
  Trash2,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../api/client';
import { AnomalyItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const AnomaliesPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [contamination, setContamination] = useState(0.05);
  const [scanning, setScanning] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const res = await api.getAnomalies({
        severity: selectedSeverity || undefined,
      });
      setAnomalies(res);
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, [selectedSeverity]);

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await api.triggerAnomalyScan(contamination);
      setStatusMsg(res.message);
      loadAnomalies();
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      alert('Anomaly scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.dismissAnomaly(id);
      setAnomalies(anomalies.filter((a) => a.id !== id));
    } catch (err) {
      alert('Failed to dismiss anomaly');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Isolation Forest Anomaly Detection</span>
          </h1>
          <p className="text-sm text-slate-400">
            Unsupervised machine learning identifying outliers in demand spikes, rapid inventory depletion, and delayed shipments.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Control Panel: Contamination Slider & Trigger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-1/2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-teal-400" />
              Isolation Forest Contamination Rate: {(contamination * 100).toFixed(0)}%
            </span>
            <span className="text-slate-500 font-mono text-[11px]">{contamination}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.15"
            step="0.01"
            value={contamination}
            onChange={(e) => setContamination(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1% (Strict Outliers Only)</span>
            <span>15% (Broader Sensitivity)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
          </select>

          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-teal-500/20 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Running ML Scan...' : 'Run Isolation Forest Scan'}</span>
          </button>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
            Scanning multi-dimensional feature space...
          </div>
        ) : anomalies.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-emerald-400 text-xs">
            No active anomalies detected across sales, inventory, or shipment telemetry.
          </div>
        ) : (
          anomalies.map((a) => (
            <div
              key={a.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  a.severity === 'Critical' || a.severity === 'High'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{a.metric_name}</span>
                    <StatusBadge status={a.severity} />
                    <span className="text-[10px] font-mono text-slate-500 uppercase px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                      {a.entity_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{a.details}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2">
                    <span>Detected Value: <strong className="text-slate-300">{a.detected_value}</strong></span>
                    <span>Expected Range: <strong className="text-slate-300">{a.expected_range}</strong></span>
                    <span>Outlier Score: <strong className="text-teal-400 font-mono">{a.anomaly_score}</strong></span>
                    <span>Detected: <strong className="text-slate-400">{new Date(a.detected_at).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDismiss(a.id)}
                className="self-end sm:self-center p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition"
                title="Dismiss Anomaly"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

