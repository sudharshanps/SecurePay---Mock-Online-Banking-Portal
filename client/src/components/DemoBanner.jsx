import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DemoBanner = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs md:text-sm text-amber-800 font-medium flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-600 text-white uppercase tracking-wider">
          Demo Banking
        </span>
        <span className="hidden sm:inline text-amber-900 font-semibold">
          SIMULATION ENVIRONMENT — NO REAL MONEY
        </span>
        <span className="sm:hidden text-amber-900 font-semibold">
          Simulation Only
        </span>
      </div>
      <div className="flex items-center space-x-1.5 text-slate-600 text-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        <span className="hidden md:inline">TrustBank Digital Security Sandbox</span>
      </div>
    </div>
  );
};

export default DemoBanner;
