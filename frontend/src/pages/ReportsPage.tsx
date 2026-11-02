import React, { useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  Calendar,
  Building2,
  AlertTriangle,
  Boxes
} from 'lucide-react';
import { api } from '../api/client';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('suppliers');
  const [format, setFormat] = useState('csv');

  const reportOptions = [
    {
      id: 'suppliers',
      title: 'Supplier Performance Scorecard Audit',
      desc: 'Vendor SLA compliance, on-time delivery percentages, defect ratings, and tier classifications.',
      icon: Building2,
    },
    {
      id: 'stockout_risk',
      title: 'Stockout Risk & Restocking Report',
      desc: 'Critical depletion horizons, EOQ order suggestions, consumption rates, and buffer deficiencies.',
      icon: AlertTriangle,
    },
    {
      id: 'inventory',
      title: 'Master Inventory & Valuation Report',
      desc: 'Complete SKU list with holding costs, current quantities, reorder points, and selling prices.',
      icon: Boxes,
    },
  ];

  const handleDownload = () => {
    const url = api.getReportDownloadUrl(reportType, format);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Executive Supply Chain Audit &amp; Reports</span>
        </h1>
        <p className="text-sm text-slate-400">
          Generate compliance-ready data exports for stakeholder review and ERP synchronization.
        </p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = reportType === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setReportType(opt.id)}
              className={`p-5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-teal-500/10 border-teal-500/40 shadow-lg shadow-teal-500/5'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-teal-400"></span>}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{opt.title}</h3>
                <p className="text-xs text-slate-400">{opt.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-teal-400 font-semibold">
                <span>{isSelected ? 'Selected for Export' : 'Click to Select'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Format & Export Action Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">Export File Format</h4>
          <p className="text-xs text-slate-400">Select desired data structure for download</p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                format === 'csv'
                  ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Comma-Separated Values (.csv)</span>
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition ${
                format === 'json'
                  ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>JSON Object Payload (.json)</span>
            </button>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 transition shrink-0"
        >
          <FileDown className="w-4 h-4" />
          <span>Download Generated Report</span>
        </button>
      </div>
    </div>
  );
};

