import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';

export const ETLUploadPage: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<'inventory' | 'sales' | 'shipments'>('inventory');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a valid CSV file.');
      return;
    }
    try {
      setUploading(true);
      setErrorMsg('');
      const res = await api.uploadCsv(selectedEntity, file);
      setResult(res);
      setFile(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to process CSV file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>CSV Upload &amp; Pandas ETL Ingestion Pipeline</span>
        </h1>
        <p className="text-sm text-slate-400">
          Automated validation, schema coercion, deduplication, and database ingestion.
        </p>
      </div>

      {/* Grid: 3 Target Entity Cards with Downloadable Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            type: 'inventory',
            title: 'Inventory Catalog',
            desc: 'SKUs, initial stock, safety buffers, lead times, and pricing.',
            badge: 'Products Table',
          },
          {
            type: 'sales',
            title: 'Sales & Transactions',
            desc: 'Historical daily units sold, pricing, and promotional tags for ML training.',
            badge: 'Sales Records',
          },
          {
            type: 'shipments',
            title: 'Logistics & Shipments',
            desc: 'Carriers, origins, destinations, promised SLA dates, and tracking.',
            badge: 'Shipments Table',
          },
        ].map((item) => (
          <div
            key={item.type}
            onClick={() => {
              setSelectedEntity(item.type as any);
              setResult(null);
              setErrorMsg('');
            }}
            className={`p-5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
              selectedEntity === item.type
                ? 'bg-teal-500/10 border-teal-500/40 shadow-lg shadow-teal-500/5'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-teal-400">{item.badge}</span>
                {selectedEntity === item.type && (
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                )}
              </div>
              <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400 mb-4">{item.desc}</p>
            </div>

            <a
              href={api.getTemplateUrl(item.type)}
              download
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-teal-400 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {item.title} Template.csv</span>
            </a>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white mb-1">
          Upload Dataset for: <span className="text-teal-400 uppercase font-mono">{selectedEntity}</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Files are validated against Pydantic models, sanitized with Pandas, and atomically persisted to the database.
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-8 text-center bg-slate-950/50 transition">
            <UploadCloud className="w-10 h-10 text-teal-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-white mb-1">
              {file ? file.name : 'Select or drag & drop a CSV file'}
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Supported format: Standard Comma-Separated Values (.csv)
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition border border-slate-700">
              <span>Browse Computer</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-teal-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                  <span>Running Pandas ETL Cleaning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute ETL Pipeline</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Ingestion Results Card */}
        {result && (
          <div className="mt-6 p-5 bg-slate-950 border border-teal-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-teal-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>ETL Ingestion Successful: {result.filename}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Rows Parsed</span>
                <span className="text-lg font-bold text-white">{result.total_rows_parsed}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Records Inserted</span>
                <span className="text-lg font-bold text-emerald-400">+{result.inserted_count}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Records Updated</span>
                <span className="text-lg font-bold text-teal-400">{result.updated_count || 0}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Target Entity</span>
                <span className="text-sm font-semibold text-slate-300">{result.entity}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Database committed atomically. Downstream ML models and stockout risk calculators synchronized automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

