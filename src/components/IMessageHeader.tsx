import React from 'react';
import { RotateCcw } from 'lucide-react';

interface IMessageHeaderProps {
  onResetClick: () => void;
  planStatus?: string;
}

export const IMessageHeader: React.FC<IMessageHeaderProps> = ({ onResetClick }) => {
  return (
    <header className="h-[52px] w-full bg-[#f6f6f6]/90 backdrop-blur-md border-b border-[#00000018] flex items-center justify-between px-3 shrink-0 z-30 select-none">
      {/* Left: Back affordance */}
      <div className="flex items-center min-w-[70px]">
        <button
          type="button"
          aria-label="Back to messages"
          className="flex items-center text-[#007AFF] hover:opacity-75 transition-opacity min-h-[44px] min-w-[44px] -ml-1 pl-1 cursor-default"
          onClick={(e) => e.preventDefault()}
        >
          <svg
            className="w-5 h-5 stroke-[2.5] stroke-current fill-none -mr-0.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[17px] font-normal tracking-tight">Filters</span>
        </button>
      </div>

      {/* Center: Penny avatar & contact identity */}
      <div className="flex flex-col items-center justify-center">
        {/* Sprout avatar badge */}
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shadow-xs border border-emerald-200/80 -mt-0.5">
          <span className="text-[17px] leading-none select-none">🌱</span>
        </div>
        {/* Contact Name */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[12px] font-semibold text-black tracking-tight">
            Penny
          </span>
          <svg className="w-2.5 h-2.5 text-zinc-400 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {/* Right: Discreet reset icon for presenter */}
      <div className="flex items-center justify-end min-w-[70px]">
        <button
          type="button"
          onClick={onResetClick}
          title="Reset demo (R)"
          aria-label="Reset demo conversation"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
