import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Message,
  DemoState,
  RiskLevel,
  PollData,
} from './types';
import {
  loadSavedState,
  saveState,
  loadSavedMessages,
  saveMessages,
  clearDemoPersistence,
  INITIAL_DEMO_STATE,
} from './services/persistence';
import { interpretUserMessage } from './services/geminiClient';
import { FinancialSafetyEngine } from './services/safetyEngine';
import { PortfolioSimulationService } from './services/portfolioSimulation';
import { defaultVerificationAdapter } from './services/verificationAdapter';
import { IPhoneShell } from './components/IPhoneShell';
import { IMessageHeader } from './components/IMessageHeader';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { IMessageComposer } from './components/IMessageComposer';
import { ResetConfirmDialog } from './components/ResetConfirmDialog';
import { triggerCelebration } from './components/CelebrationEffect';

export default function App() {
  const [messages, setMessages] = useState<Message[]>(loadSavedMessages);
  const [state, setState] = useState<DemoState>(loadSavedState);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationContainerRef = useRef<HTMLDivElement>(null);

  // Sync state & messages with localStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Smooth auto-scroll to bottom of conversation
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, scrollToBottom]);

  // Determine smart suggested prompt for presenter based on conversation stage
  useEffect(() => {
    if (messages.length === 0) {
      setSuggestedPrompt('I have $100 and I want you to handle investing it for me.');
      return;
    }

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      lastMessage.sender === 'penny' &&
      lastMessage.text?.includes('need any of this money soon')
    ) {
      setSuggestedPrompt("I'll need around $60 for textbooks in January.");
      return;
    }

    if (
      state.planStatus === 'active' &&
      !messages.some((m) => m.text?.includes('car just broke down'))
    ) {
      setSuggestedPrompt('My car just broke down and repairs might cost $300.');
      return;
    }

    setSuggestedPrompt(null);
  }, [messages, state.planStatus]);

  // Keyboard presenter shortcuts: W (weekly update), R (reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in a textarea or input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsResetDialogOpen(true);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        triggerWeeklyUpdate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages, state]);

  // Helper to add Penny message with typing indicator
  const addPennyResponse = async (
    msg: Partial<Message>,
    delayMs = 700
  ): Promise<void> => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    setIsTyping(false);

    const fullMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'penny',
      timestamp: 'Just now',
      type: msg.type || 'text',
      ...msg,
    };

    setMessages((prev) => [...prev, fullMessage]);
  };

  // Trigger Scene 4: Proactive Weekly Update
  const triggerWeeklyUpdate = async () => {
    if (isTyping) return;

    // Check if weekly card already exists to avoid redundant duplicate additions
    const hasWeeklyAlready = messages.some((m) => m.type === 'weekly-card');
    if (hasWeeklyAlready) return;

    const risk = state.riskLevel || 'Medium';
    const paperVal = state.portfolioValue > 0 ? state.portfolioValue : 40;
    const weeklyPerf = PortfolioSimulationService.simulateOneWeekPerformance(paperVal, risk);

    // 1. Divider
    const dividerMsg: Message = {
      id: `div-${Date.now()}`,
      sender: 'system',
      timestamp: '',
      type: 'system-divider',
      text: 'One week later',
    };
    setMessages((prev) => [...prev, dividerMsg]);

    await new Promise((resolve) => setTimeout(resolve, 500));

    // 2. Proactive Penny greeting
    await addPennyResponse(
      {
        text: 'Good morning! Your weekly Penny update is ready 🌱',
      },
      700
    );

    await new Promise((resolve) => setTimeout(resolve, 350));

    // 3. Weekly update image-attachment card
    await addPennyResponse(
      {
        type: 'weekly-card',
        weeklyData: {
          portfolioValue: weeklyPerf.currentValue,
          weeklyChangeAmount: weeklyPerf.changeAmount,
          weeklyChangePercent: weeklyPerf.changePercentage,
          protectedReserve: state.protectedCash || 60,
          protectedReason: 'Textbook',
          riskLevel: risk,
          actionRequired: 'None',
        },
      },
      600
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

    // 4. Rebalancing explanation with heart tapback
    await addPennyResponse(
      {
        text: `I rebalanced within your ${risk}-risk plan, so you don’t need to do anything this week. Your textbook money is still separate 💚`,
        tapback: 'thumbs_up',
      },
      750
    );

    setState((prev) => ({
      ...prev,
      portfolioValue: weeklyPerf.currentValue,
      weeklyChange: {
        amount: weeklyPerf.changeAmount,
        percentage: weeklyPerf.changePercentage,
      },
    }));
  };

  // Handle plan approval flow
  const handleApprovePlan = async (risk: RiskLevel) => {
    // Stage 1: Verification moment inside conversation
    const verifyMsgId = `verify-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: verifyMsgId,
        sender: 'penny',
        timestamp: 'Just now',
        type: 'verification',
        verificationData: {
          stage: 'in_progress',
          message: 'Verifying that it’s really you…',
        },
      },
    ]);

    // Use verification adapter
    await defaultVerificationAdapter.verifyUserIdentity((stage, label) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === verifyMsgId
            ? { ...m, verificationData: { stage, message: label } }
            : m
        )
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 400));

    // Stage 2: Penny confirmation message
    await addPennyResponse(
      {
        text: `Your ${risk}-risk paper portfolio is active. I’ll handle the monitoring and routine rebalancing, and I’ll message you when something actually needs your attention.`,
      },
      700
    );

    // Tasteful celebration confetti
    triggerCelebration();

    setState((prev) => ({
      ...prev,
      planStatus: 'active',
      portfolioValue: prev.investableCash > 0 ? prev.investableCash : 40,
    }));

    // Scene 4: Trigger weekly update automatically after 2.8 seconds
    setTimeout(() => {
      triggerWeeklyUpdate();
    }, 2800);
  };

  // Handle Poll Option Click
  const handleSelectPollOption = async (pollId: string, optionId: string) => {
    if (isTyping) return;

    // Visually mark the selected option
    setMessages((prev) =>
      prev.map((m) => {
        if (m.type === 'poll' && m.poll?.id === pollId) {
          return {
            ...m,
            poll: {
              ...m.poll,
              selectedOptionId: optionId,
              isAnswered: true,
            },
          };
        }
        return m;
      })
    );

    // 1. Scene 2: Risk Selection Poll
    if (pollId === 'poll-risk-selection') {
      const riskMapping: Record<string, RiskLevel> = {
        'risk-low': 'Low',
        'risk-med': 'Medium',
        'risk-high': 'High',
      };
      const chosenRisk = riskMapping[optionId] || 'Medium';
      const allocation = PortfolioSimulationService.getModelAllocation(chosenRisk);
      const investable = state.investableCash > 0 ? state.investableCash : 40;

      setState((prev) => ({
        ...prev,
        riskLevel: chosenRisk,
        portfolioAllocation: allocation,
        portfolioValue: investable,
      }));

      // Penny responds automatically
      await addPennyResponse(
        {
          text: `I built a diversified ${chosenRisk}-risk paper portfolio for your available $${investable}. Your textbook money stays separate.`,
        },
        800
      );

      // Render image-attachment-style portfolio summary inside the conversation
      await addPennyResponse(
        {
          type: 'plan-card',
          planData: {
            startingMoney: state.startingCash || 100,
            protectedMoney: state.protectedCash || 60,
            protectedReason: 'textbooks',
            portfolioMoney: investable,
            riskLevel: chosenRisk,
            allocation,
          },
        },
        500
      );

      // Render decision poll
      await addPennyResponse(
        {
          type: 'poll',
          poll: {
            id: 'poll-plan-decision',
            title: 'What would you like to do?',
            isAnswered: false,
            options: [
              { id: 'plan-approve', label: 'Approve plan ✨' },
              { id: 'plan-adjust', label: 'Adjust it' },
              { id: 'plan-not-yet', label: 'Not yet' },
            ],
          },
        },
        600
      );
      return;
    }

    // 2. Scene 3: Plan Decision Poll
    if (pollId === 'poll-plan-decision') {
      if (optionId === 'plan-approve') {
        const risk = state.riskLevel || 'Medium';
        await handleApprovePlan(risk);
      } else if (optionId === 'plan-adjust') {
        await addPennyResponse({
          text: 'No problem! Would you prefer more conservative bonds or a different risk level?',
        });
      } else {
        await addPennyResponse({
          text: 'Understood. We can hold off on the paper plan whenever you are ready 🌱',
        });
      }
      return;
    }

    // 3. Scene 5: Life Event Adaptation Poll
    if (pollId === 'poll-life-event') {
      if (optionId === 'pause_contributions') {
        setState((prev) => ({
          ...prev,
          contributionStatus: 'paused',
        }));

        await addPennyResponse(
          {
            text: 'Done! I paused future contributions so you can focus on the car repairs. Your current $41.18 paper portfolio stays invested and monitored 🌱',
            tapback: 'thumbs_up',
          },
          750
        );
      } else if (optionId === 'explore_withdrawal') {
        await addPennyResponse(
          {
            text: 'How much would you like to explore withdrawing from your $41.18 paper portfolio? Tell me the amount and I will prepare the change for your review.',
          },
          750
        );
      } else if (optionId === 'keep_current_plan') {
        await addPennyResponse(
          {
            text: 'Understood! I kept your current Medium-risk paper plan active with ongoing routine rebalancing.',
            tapback: 'heart',
          },
          700
        );
      }
    }
  };

  // Handle incoming user messages from composer
  const handleSendMessage = async (text: string) => {
    if (isTyping) return;

    // Append outgoing user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      type: 'text',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Fast-path interpretation using server-side Gemini endpoint with deterministic fallback
    const interpretation = await interpretUserMessage(text, {
      planStatus: state.planStatus,
      riskLevel: state.riskLevel,
      startingCash: state.startingCash,
      protectedCash: state.protectedCash,
    });

    // Scene 1 - Step 1: Starting the conversation
    if (interpretation.intent === 'start_investing' || text.includes('I have $100')) {
      const startingAmount = interpretation.amount || 100;
      setState((prev) => ({
        ...prev,
        startingCash: startingAmount,
      }));

      await addPennyResponse(
        {
          text: 'I can help with that in a paper portfolio 🌱 Before I build your plan, will you need any of this money soon?',
        },
        750
      );
      return;
    }

    // Scene 1 - Step 2: Textbook expense
    if (
      interpretation.intent === 'report_expense' ||
      text.toLowerCase().includes('textbook') ||
      text.toLowerCase().includes('60')
    ) {
      const textbookAmount = interpretation.amount || 60;
      const capacity = FinancialSafetyEngine.evaluateCapacity(
        state.startingCash || 100,
        0,
        {
          label: 'textbooks',
          amount: textbookAmount,
          date: 'January',
          isEssential: true,
        }
      );

      setState((prev) => ({
        ...prev,
        protectedCash: capacity.protectedCash,
        investableCash: capacity.investableCash,
        expenses: capacity.expenses,
      }));

      await addPennyResponse(
        {
          text: `Got it. I'll protect the $${capacity.protectedCash} you need for textbooks, which leaves $${capacity.investableCash} available for your paper portfolio.`,
        },
        800
      );

      // Scene 2: Penny sends native iMessage-style poll
      const riskPoll: PollData = {
        id: 'poll-risk-selection',
        title: 'Choose your investing style',
        isAnswered: false,
        options: [
          { id: 'risk-low', emoji: '🛟', label: 'Low risk' },
          { id: 'risk-med', emoji: '🌿', label: 'Medium risk' },
          { id: 'risk-high', emoji: '🚀', label: 'High risk' },
        ],
      };

      await addPennyResponse(
        {
          type: 'poll',
          poll: riskPoll,
        },
        500
      );
      return;
    }

    // Scene 5: Life-event adaptation (car repairs)
    if (
      interpretation.intent === 'report_emergency' ||
      text.toLowerCase().includes('car') ||
      text.toLowerCase().includes('repair') ||
      text.toLowerCase().includes('300')
    ) {
      // Add tapback or brief ack
      setIsTyping(true);
      await new Promise((resolve) => setTimeout(resolve, 400));

      await addPennyResponse(
        {
          text: 'Ugh, I’m sorry 😭 I updated your situation. Your repair matters more than adding new money to investments right now.',
          tapback: 'sprout',
        },
        800
      );

      await addPennyResponse(
        {
          text: 'I recommend pausing future contributions. I won’t change your plan until you choose.',
        },
        700
      );

      // Interactive iMessage-style poll
      const lifePoll: PollData = {
        id: 'poll-life-event',
        title: 'Update your plan?',
        isAnswered: false,
        options: [
          { id: 'pause_contributions', label: 'Pause contributions' },
          { id: 'explore_withdrawal', label: 'Explore withdrawing money' },
          { id: 'keep_current_plan', label: 'Keep my current plan' },
        ],
      };

      await addPennyResponse(
        {
          type: 'poll',
          poll: lifePoll,
        },
        600
      );
      return;
    }

    // Scene 3 approval via natural language
    if (interpretation.intent === 'approve') {
      const risk = state.riskLevel || 'Medium';
      await handleApprovePlan(risk);
      return;
    }

    // Fallback response for questions or freeform discussion
    await addPennyResponse(
      {
        text: 'I’m monitoring your paper investments! You can choose your risk, tell me about upcoming expenses, or ask me to adjust your portfolio anytime 🌱',
      },
      700
    );
  };

  // Reset confirmation handler
  const handleConfirmReset = () => {
    clearDemoPersistence();
    setMessages([]);
    setState({ ...INITIAL_DEMO_STATE });
    setIsResetDialogOpen(false);
  };

  return (
    <IPhoneShell>
      {/* Top Header */}
      <IMessageHeader
        onResetClick={() => setIsResetDialogOpen(true)}
        planStatus={state.planStatus}
      />

      {/* Conversation Thread */}
      <div
        ref={conversationContainerRef}
        className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 scroll-smooth bg-white"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Starting timestamp header */}
        <div className="w-full flex items-center justify-center my-2 select-none">
          <span className="text-[11px] font-medium text-[#8E8E93] tracking-tight">
            Today 9:41 AM
          </span>
        </div>

        {/* Empty state hint if user hasn't typed anything yet */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center select-none text-zinc-400">
            <span className="text-3xl mb-2">🌱</span>
            <span className="text-[13px] font-medium text-zinc-600">
              New iMessage with Penny
            </span>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-[220px]">
              Automated robo-investing companion. Send your first message below.
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSelectPollOption={handleSelectPollOption}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Bottom scroll target */}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Composer Input Bar */}
      <IMessageComposer
        onSendMessage={handleSendMessage}
        disabled={isTyping}
        suggestedPrompt={suggestedPrompt}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmDialog
        isOpen={isResetDialogOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </IPhoneShell>
  );
}
