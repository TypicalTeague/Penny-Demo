import React, { useEffect, useState } from 'react';
import { BrokerageClient } from '../services/brokerageClient';
import { X, CheckCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

interface JudgeTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  details?: Record<string, unknown>;
  isPresentationSimulation: boolean;
}

export const JudgeTimelineModal: React.FC<JudgeTimelineModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await BrokerageClient.getTimeline();
      if (Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (e) {
      console.error('Failed to load audit timeline', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTimeline();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-fade-in"
    >
      <div className="w-full max-w-[340px] bg-white rounded-[24px] overflow-hidden shadow-2xl border border-black/10 flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[13px] font-bold tracking-tight">Judge Audit Timeline (Evidence)</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={fetchTimeline}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
              title="Refresh timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtitle */}
        <div className="px-4 py-2 bg-zinc-50 border-b border-black/5 text-[11px] text-zinc-500">
          Server-authoritative sequence of Auth0 &amp; Alpaca Broker sandbox events. Press <kbd className="font-mono bg-white px-1 border rounded">J</kbd> or <kbd className="font-mono bg-white px-1 border rounded">P</kbd> to toggle.
        </div>

        {/* Timeline list */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-[12px]">
          {events.length === 0 ? (
            <div className="text-center py-6 text-zinc-400">
              <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
              <p>No audit events recorded yet.</p>
              <p className="text-[10px] mt-0.5">Start the onboarding flow to generate evidence.</p>
            </div>
          ) : (
            events.map((evt, idx) => (
              <div key={evt.id || idx} className="flex items-start space-x-2.5">
                <div className="mt-0.5 shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-black tracking-tight text-[12px]">
                      {evt.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                      {evt.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">
                    {evt.description}
                  </p>
                  {evt.isPresentationSimulation && (
                    <span className="inline-block mt-1 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                      Presentation Simulation
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-black/5 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>Target: broker-api.sandbox.alpaca.markets</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#007AFF] font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
