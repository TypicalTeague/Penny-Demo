import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Camera, Sparkles } from 'lucide-react';

interface IMessageComposerProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  suggestedPrompt?: string | null;
}

export const IMessageComposer: React.FC<IMessageComposerProps> = ({
  onSendMessage,
  disabled = false,
  suggestedPrompt,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applySuggestedPrompt = (promptText: string) => {
    setText(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
      const scrollH = textareaRef.current.scrollHeight;
      if (scrollH > 36) {
        textareaRef.current.style.height = `${Math.min(scrollH, 100)}px`;
      }
    }
  }, [text]);

  const hasText = text.trim().length > 0;

  return (
    <div className="w-full bg-[#f6f6f6]/95 backdrop-blur-md border-t border-[#00000015] p-2 shrink-0 select-none">
      {/* Quick presenter prompt helper pill if available for seamless pitching */}
      {suggestedPrompt && !disabled && (
        <div className="mb-2 px-1 flex items-center justify-between animate-fade-in">
          <button
            type="button"
            onClick={() => applySuggestedPrompt(suggestedPrompt)}
            className="text-[12px] bg-white border border-black/10 text-[#007AFF] px-3 py-1.5 rounded-full shadow-2xs hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-1.5 text-left truncate max-w-full"
          >
            <Sparkles className="w-3 h-3 text-[#007AFF] shrink-0" />
            <span className="truncate">{suggestedPrompt}</span>
          </button>
        </div>
      )}

      {/* Input container */}
      <div className="flex items-end space-x-1.5">
        {/* Left media actions */}
        <div className="flex items-center space-x-1 shrink-0 pb-1 text-[#8E8E93]">
          <button
            type="button"
            disabled={disabled}
            aria-label="Camera attachment"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:text-black transition-colors"
          >
            <Camera className="w-5 h-5 stroke-[1.75]" />
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-label="iMessage App Store Spectrum apps"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:text-black transition-colors"
          >
            {/* App Store / Spectrum extension icon */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm0-8h2V7h-2v2z" />
            </svg>
          </button>
        </div>

        {/* Textarea Pill */}
        <div className="flex-1 bg-white border border-[#C6C6C8] rounded-[20px] px-3.5 py-1.5 flex items-center shadow-2xs transition-all focus-within:border-[#007AFF]">
          <textarea
            ref={textareaRef}
            rows={1}
            disabled={disabled}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Penny is typing…' : 'iMessage'}
            className="w-full resize-none text-[15px] leading-5 text-black placeholder:text-[#8E8E93] bg-transparent outline-none max-h-[100px] overflow-y-auto"
          />
        </div>

        {/* Send Button or Mic */}
        <div className="shrink-0 pb-1">
          {hasText ? (
            <button
              type="button"
              disabled={disabled}
              onClick={handleSend}
              aria-label="Send message"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                disabled
                  ? 'bg-zinc-300 text-white cursor-not-allowed'
                  : 'bg-[#007AFF] text-white hover:bg-blue-600 active:scale-90 shadow-xs'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              aria-label="Voice memo"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-black transition-colors"
            >
              {/* Mic Icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
