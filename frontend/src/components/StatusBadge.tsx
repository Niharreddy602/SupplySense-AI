import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = status.toLowerCase();
  
  let colorStyles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s.includes('in stock') || s.includes('delivered') || s.includes('preferred') || s.includes('low') || s.includes('healthy')) {
    colorStyles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (s.includes('low stock') || s.includes('pending') || s.includes('standard') || s.includes('moderate') || s.includes('medium')) {
    colorStyles = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (s.includes('out of stock') || s.includes('delayed') || s.includes('critical') || s.includes('high') || s.includes('review')) {
    colorStyles = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (s.includes('in transit') || s.includes('approved') || s.includes('ordered')) {
    colorStyles = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  }

  const sizeStyles = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeStyles} ${colorStyles}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};

