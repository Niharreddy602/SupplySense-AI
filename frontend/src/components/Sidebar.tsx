import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Truck,
  ShieldAlert,
  Building2,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/inventory', label: 'Inventory & Stock', icon: Boxes },
    { to: '/forecasting', label: 'Demand Forecasting', icon: TrendingUp },
    { to: '/restock', label: 'Stockout & Restock', icon: AlertTriangle },
    { to: '/shipments', label: 'Shipments & Delays', icon: Truck },
    { to: '/anomalies', label: 'Anomaly Detection', icon: ShieldAlert },
    { to: '/suppliers', label: 'Suppliers Scorecard', icon: Building2 },
    { to: '/etl', label: 'CSV Data Pipeline', icon: FileSpreadsheet },
    { to: '/reports', label: 'Audit Reports', icon: FileDown },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black">
          SS
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block">SupplySense AI</span>
          <span className="text-[10px] text-teal-400 font-medium uppercase tracking-wider block">Supply Chain Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">ML Engine</span>
            <span className="text-teal-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Random Forest &amp; Isolation Forest
          </div>
        </div>
      </div>
    </aside>
  );
};

