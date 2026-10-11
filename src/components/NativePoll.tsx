import React from 'react';
import { PollData, PollOption } from '../types';
import { Check } from 'lucide-react';

interface NativePollProps {
  poll: PollData;
  onSelectOption: (pollId: string, optionId: string) => void;
}

export const NativePoll: React.FC<NativePollProps> = ({ poll, onSelectOption }) => {
  const isSelected = !!poll.selectedOptionId;

  return (
    <div className="w-full max-w-[290px] bg-[#F2F2F7] border border-black/10 rounded-[20px] p-3 shadow-xs my-1 select-none">
      {/* Poll Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[14px] font-semibold text-black tracking-tight">
          {poll.title}
        </span>
        <span className="text-[10px] uppercase font-semibold text-[#8E8E93] tracking-wider">
          Poll
        </span>
      </div>

      {/* Options List */}
      <div className="flex flex-col space-y-1.5">
        {poll.options.map((option: PollOption) => {
          const isChosen = poll.selectedOptionId === option.id;
          const isDisabled = poll.disabled || isSelected;

          return (
            <button
              key={option.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectOption(poll.id, option.id)}
              aria-label={`Select ${option.label}`}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-[14px] flex items-center justify-between text-left transition-all ${
                isChosen
                  ? 'bg-white border-2 border-[#007AFF] shadow-xs text-black font-medium'
                  : isSelected
                  ? 'bg-white/60 text-zinc-400 border border-black/5'
                  : 'bg-white hover:bg-zinc-50 active:scale-[0.98] border border-black/8 text-black cursor-pointer shadow-2xs'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {option.emoji && (
                  <span className="text-[17px] leading-none select-none">
                    {option.emoji}
                  </span>
                )}
                <span className="text-[14px] tracking-tight leading-snug">
                  {option.label}
                </span>
              </div>

              {/* Selection Checkmark / Indicator */}
              <div className="shrink-0 ml-2">
                {isChosen ? (
                  <div className="w-5 h-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-black/20" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Subtext info */}
      <div className="mt-2 text-center">
        <span className="text-[10px] text-[#8E8E93] tracking-tight">
          {isSelected ? 'Response recorded · Updating mandate' : 'Tap an option to respond'}
        </span>
      </div>
    </div>
  );
};
