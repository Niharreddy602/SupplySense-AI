import React from 'react';
import { RefreshCw, Database, Sparkles } from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing = false }) => {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs font-medium text-slate-300">
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span>Storage: PostgreSQL / SQLite</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-xs font-medium text-teal-400">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>ETL &amp; ML Auto-Pipeline</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

