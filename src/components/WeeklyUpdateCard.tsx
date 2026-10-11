import React from 'react';
import { WeeklyCardData } from '../types';

interface WeeklyUpdateCardProps {
  data: WeeklyCardData;
}

export const WeeklyUpdateCard: React.FC<WeeklyUpdateCardProps> = ({ data }) => {
  const {
    portfolioValue,
    weeklyChangeAmount,
    weeklyChangePercent,
    protectedReserve,
    protectedReason,
    riskLevel,
    actionRequired,
  } = data;

  return (
    <div className="w-full max-w-[290px] bg-white rounded-[22px] border border-black/10 overflow-hidden shadow-xs my-1 select-none">
      {/* Attached image header graphic */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 pb-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-[13px]">🌱</span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-100">
              This Week
            </span>
          </div>
          <span className="text-[9px] font-medium tracking-tight bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
            Weekly Report
          </span>
        </div>
        <p className="text-[11px] text-blue-100/90 leading-tight">
          Automated routine rebalancing &amp; performance check
        </p>
      </div>

      {/* Upward Line Sparkline Visualization */}
      <div className="px-3.5 pt-3 pb-1 bg-white">
        <div className="flex items-end justify-between mb-1.5">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider block">
              Paper Value
            </span>
            <span className="text-[20px] font-bold text-black tracking-tight tabular-nums font-mono">
              ${portfolioValue.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center text-[#34C759] text-[12px] font-semibold bg-emerald-50 px-2 py-1 rounded-md">
            <svg className="w-3 h-3 stroke-[2.5] stroke-current fill-none mr-0.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="tabular-nums font-mono">
              +${weeklyChangeAmount.toFixed(2)} (+{weeklyChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Small upward portfolio line SVG visualization */}
        <div className="h-14 w-full relative pt-1">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 240 50">
            <defs>
              <linearGradient id="upwardGreenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34C759" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34C759" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Filled area beneath curve */}
            <path
              d="M 0,42 Q 40,38 75,39 T 140,24 T 195,15 L 240,4 L 240,50 L 0,50 Z"
              fill="url(#upwardGreenGradient)"
            />
            {/* Smooth upward line */}
            <path
              d="M 0,42 Q 40,38 75,39 T 140,24 T 195,15 L 240,4"
              fill="none"
              stroke="#34C759"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* End point dot */}
            <circle cx="240" cy="4" r="3.5" fill="#34C759" />
          </svg>
        </div>
      </div>

      {/* Structured metrics breakdown */}
      <div className="p-3.5 pt-2 space-y-2 text-[13px] border-t border-black/5 bg-white">
        <div className="flex justify-between items-center text-zinc-600">
          <span className="tracking-tight">Paper portfolio</span>
          <span className="font-semibold text-black tabular-nums font-mono">
            ${portfolioValue.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center text-zinc-600">
          <span className="tracking-tight">Weekly change</span>
          <span className="font-semibold text-[#34C759] tabular-nums font-mono">
            +${weeklyChangeAmount.toFixed(2)} · +{weeklyChangePercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center text-zinc-600">
          <span className="tracking-tight">{protectedReason || 'Textbook'} reserve</span>
          <span className="font-semibold text-emerald-700 tabular-nums font-mono">
            ${protectedReserve} safe
          </span>
        </div>

        <div className="flex justify-between items-center text-zinc-600">
          <span className="tracking-tight">Risk level</span>
          <span className="font-semibold text-black tracking-tight">{riskLevel}</span>
        </div>

        <div className="flex justify-between items-center text-zinc-600 pt-1.5 border-t border-black/5">
          <span className="tracking-tight font-medium text-black">Action required</span>
          <span className="font-semibold text-emerald-600 tracking-tight flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
            {actionRequired}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-[#f9f9fb] px-3.5 py-1.5 border-t border-black/5 text-center">
        <span className="text-[10px] text-[#8E8E93] tracking-tight">
          Illustrative paper results · Routine rebalancing applied
        </span>
      </div>
    </div>
  );
};
