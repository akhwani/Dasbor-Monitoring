import React from 'react';
import { ShieldCheck, Settings, Factory } from 'lucide-react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export const BSKJILogo: React.FC<LogoProps> = ({ collapsed, className }) => {
  if (collapsed) {
    return (
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden ${className}`}>
        <div className="relative flex items-center justify-center">
          <Settings className="text-emerald-600 absolute animate-spin-slow" size={24} strokeWidth={1.5} />
          <ShieldCheck className="text-slate-900 relative z-10" size={16} strokeWidth={2.5} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-white shadow-xl border border-slate-100 w-full max-w-[240px] ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-12 h-12 bg-emerald-50 rounded-xl">
          <Settings className="text-emerald-600 absolute animate-spin-slow opacity-20" size={32} />
          <Factory className="text-emerald-700 relative z-10" size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">BSKJI</span>
          <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Kementerian Perindustrian</span>
        </div>
      </div>
      <div className="w-full h-px bg-slate-100 my-1" />
      <p className="text-[7px] font-medium text-slate-400 text-center leading-tight uppercase tracking-tight">
        Badan Standardisasi dan Kebijakan Jasa Industri
      </p>
    </div>
  );
};

export default BSKJILogo;
