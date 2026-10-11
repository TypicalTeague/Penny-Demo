import React from 'react';
import { PlanCardData } from '../types';

interface PortfolioPlanCardProps {
  data: PlanCardData;
}

export const PortfolioPlanCard: React.FC<PortfolioPlanCardProps> = ({ data }) => {
  const {
    startingMoney,
    protectedMoney,
    protectedReason,
    portfolioMoney,
    riskLevel,
    allocation,
  } = data;

  return (
    <div className="w-full max-w-[290px] bg-white rounded-[22px] border border-black/10 overflow-hidden shadow-xs my-1 select-none">
      {/* Top Banner styled like an attached preview graphic */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-3.5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-[14px]">🌱</span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-100">
              Penny Paper Plan
            </span>
          </div>
          <span className="text-[9px] font-medium tracking-tight bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
            Illustrative
          </span>
        </div>
        <p className="text-[11px] text-emerald-100/90 leading-tight">
          Automated allocation based on your life situation &amp; risk choice
        </p>
      </div>

      {/* Structured metrics breakdown */}
      <div className="p-3.5 space-y-2 text-[13px] bg-white">
        <div className="flex justify-between items-center text-zinc-600">
          <span className="tracking-tight">Starting money</span>
          <span className="font-semibold text-black tabular-nums font-mono">${startingMoney}</span>
        </div>

        <div className="flex justify-between items-center text-zinc-600">
          <span className="tracking-tight">Protected for {protectedReason || 'textbooks'}</span>
          <span className="font-semibold text-emerald-700 tabular-nums font-mono">
            ${protectedMoney} safe
          </span>
        </div>

        <div className="flex justify-between items-center text-zinc-600 pt-1 border-t border-black/5">
          <span className="font-medium text-black tracking-tight">Paper portfolio</span>
          <span className="font-bold text-[#007AFF] text-[15px] tabular-nums font-mono">
            ${portfolioMoney}
          </span>
        </div>

        <div className="flex justify-between items-center text-zinc-600">
          <span className="tracking-tight">Risk level</span>
          <span className="font-semibold text-black tracking-tight">{riskLevel}</span>
        </div>

        {/* Allocation Header */}
        <div className="pt-2.5 border-t border-black/5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 block mb-1.5">
            Diversified Allocation
          </span>

          {/* Simple horizontal allocation visualization with three clearly labeled sections */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-zinc-100 border border-black/5 mb-2.5">
            <div
              style={{ width: `${allocation.equities}%` }}
              className="bg-[#007AFF] h-full transition-all duration-500"
              title={`${allocation.equities}% diversified equities`}
            />
            <div
              style={{ width: `${allocation.bonds}%` }}
              className="bg-[#34C759] h-full transition-all duration-500"
              title={`${allocation.bonds}% diversified bonds`}
            />
            <div
              style={{ width: `${allocation.cash}%` }}
              className="bg-[#FF9500] h-full transition-all duration-500"
              title={`${allocation.cash}% cash-equivalent simulation`}
            />
          </div>

          {/* Three clearly labeled legend items */}
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#007AFF] shrink-0" />
                <span className="text-zinc-700">Diversified equities</span>
              </div>
              <span className="font-medium text-zinc-900 tabular-nums font-mono">
                {allocation.equities}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#34C759] shrink-0" />
                <span className="text-zinc-700">Diversified bonds</span>
              </div>
              <span className="font-medium text-zinc-900 tabular-nums font-mono">
                {allocation.bonds}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF9500] shrink-0" />
                <span className="text-zinc-700">Cash-equivalent simulation</span>
              </div>
              <span className="font-medium text-zinc-900 tabular-nums font-mono">
                {allocation.cash}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer note */}
      <div className="bg-[#f9f9fb] px-3.5 py-1.5 border-t border-black/5 text-center">
        <span className="text-[10px] text-[#8E8E93] tracking-tight">
          Alpaca Sandbox Paper Orders · Zero real money moved
        </span>
      </div>
    </div>
  );
};
