import React from 'react';
import { Message, TapbackType } from '../types';
import { NativePoll } from './NativePoll';
import { PortfolioPlanCard } from './PortfolioPlanCard';
import { WeeklyUpdateCard } from './WeeklyUpdateCard';
import { ShieldCheck, Loader2, Lock, ChevronRight } from 'lucide-react';
import { MessageActionButton } from '../types';

interface MessageBubbleProps {
  message: Message;
  onSelectPollOption?: (pollId: string, optionId: string) => void;
  onActionButtonClick?: (action: MessageActionButton) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSelectPollOption,
  onActionButtonClick,
}) => {
  // System divider (e.g. "One week later")
  if (message.type === 'system-divider') {
    return (
      <div className="w-full flex items-center justify-center my-4 select-none animate-fade-in">
        <div className="px-3.5 py-1 rounded-full bg-black/5 text-[#8E8E93] text-[12px] font-medium tracking-tight">
          {message.text}
        </div>
      </div>
    );
  }

  // Verification moment inside conversation
  if (message.type === 'verification' && message.verificationData) {
    const isVerified = message.verificationData.stage === 'verified';
    return (
      <div className="w-full flex justify-start my-2 pl-2 select-none">
        <div
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-[18px] text-[13px] font-medium shadow-2xs transition-all ${
            isVerified
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
              : 'bg-zinc-100 text-zinc-700 border border-black/5'
          }`}
        >
          {isVerified ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin shrink-0" />
          )}
          <span>{message.verificationData.message}</span>
        </div>
      </div>
    );
  }

  const isUser = message.sender === 'user';

  const renderTapback = (tapback: TapbackType) => {
    const iconMap: Record<TapbackType, string> = {
      heart: '❤️',
      thumbs_up: '👍',
      sprout: '🌱',
      laugh: '😂',
    };

    return (
      <div
        className={`absolute -top-3 ${
          isUser ? '-left-2' : '-right-2'
        } bg-white rounded-full px-1.5 py-0.5 shadow-md border border-black/10 text-[13px] flex items-center justify-center z-10 animate-bounce-short select-none`}
        title={`Tapback: ${tapback}`}
      >
        <span>{iconMap[tapback]}</span>
      </div>
    );
  };

  return (
    <div
      className={`w-full flex flex-col my-1 ${
        isUser ? 'items-end pr-2' : 'items-start pl-2'
      } relative animate-fade-in`}
    >
      {/* Threaded reply indicator if attached */}
      {message.inReplyTo && (
        <div className="text-[10px] text-[#8E8E93] mb-0.5 px-2 select-none">
          In reply to previous mandate
        </div>
      )}

      {/* Main Bubble / Component */}
      <div className="relative max-w-[82%]">
        {/* Tapback badge */}
        {message.tapback && renderTapback(message.tapback)}

        {/* Text bubble */}
        {message.type === 'text' && (
          <div
            className={`px-4 py-2.5 rounded-[20px] text-[15px] leading-[1.35] tracking-tight break-words shadow-2xs select-text ${
              isUser
                ? 'bg-[#007AFF] text-white rounded-br-[4px]'
                : 'bg-[#E9E9EB] text-black rounded-bl-[4px]'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Action Button (e.g. Verify & connect securely) */}
        {message.actionButton && (
          <div className="mt-2 w-full max-w-[270px]">
            <button
              type="button"
              onClick={() => onActionButtonClick?.(message.actionButton!)}
              className="min-h-[44px] w-full px-4 py-2.5 rounded-[16px] bg-[#007AFF] text-white font-medium text-[13.5px] flex items-center justify-between shadow-xs active:scale-98 transition-all hover:bg-blue-600 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="font-semibold">{message.actionButton.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-200" />
            </button>
          </div>
        )}

        {/* Interactive Poll */}
        {message.type === 'poll' && message.poll && (
          <NativePoll
            poll={message.poll}
            onSelectOption={onSelectPollOption || (() => {})}
          />
        )}

        {/* Image Attachment Style Portfolio Plan Card */}
        {message.type === 'plan-card' && message.planData && (
          <PortfolioPlanCard data={message.planData} />
        )}

        {/* Image Attachment Style Weekly Update Card */}
        {message.type === 'weekly-card' && message.weeklyData && (
          <WeeklyUpdateCard data={message.weeklyData} />
        )}
      </div>

      {/* Optional Timestamp */}
      {message.timestamp && (
        <span className="text-[10px] text-[#8E8E93] mt-0.5 px-1 select-none">
          {message.timestamp}
        </span>
      )}
    </div>
  );
};
