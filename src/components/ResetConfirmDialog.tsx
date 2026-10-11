import React from 'react';

interface ResetConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmDialog: React.FC<ResetConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 animate-fade-in"
    >
      <div className="w-full max-w-[320px] bg-white/95 backdrop-blur-xl rounded-[20px] overflow-hidden shadow-2xl border border-black/10 animate-scale-up">
        {/* Header content */}
        <div className="p-4 text-center border-b border-black/10">
          <h3
            id="reset-dialog-title"
            className="text-[16px] font-semibold text-black tracking-tight mb-1"
          >
            Reset Presentation Demo?
          </h3>
          <p className="text-[13px] text-zinc-500 leading-snug">
            This will restore the opening demo state, clearing all simulated messages and paper portfolio mandates.
          </p>
        </div>

        {/* Buttons (iOS Action sheet style) */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 text-[15px] font-semibold text-[#FF3B30] hover:bg-zinc-100 active:bg-zinc-200 transition-colors border-b border-black/10"
          >
            Reset Demo State
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 text-[15px] font-medium text-[#007AFF] hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
