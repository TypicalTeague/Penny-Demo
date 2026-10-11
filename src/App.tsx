import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Message,
  DemoState,
  RiskLevel,
  PollData,
  MessageActionButton,
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
import { BrokerageClient } from './services/brokerageClient';
import { IPhoneShell } from './components/IPhoneShell';
import { IMessageHeader } from './components/IMessageHeader';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { IMessageComposer } from './components/IMessageComposer';
import { ResetConfirmDialog } from './components/ResetConfirmDialog';
import { SecureOnboardingSheet } from './components/SecureOnboardingSheet';
import { JudgeTimelineModal } from './components/JudgeTimelineModal';
import { triggerCelebration } from './components/CelebrationEffect';

export default function App() {
  const [messages, setMessages] = useState<Message[]>(loadSavedMessages);
  const [state, setState] = useState<DemoState>(loadSavedState);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [isOnboardingSheetOpen, setIsOnboardingSheetOpen] = useState<boolean>(false);
  const [isJudgeTimelineOpen, setIsJudgeTimelineOpen] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
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

  // Initial Seed Message: Prompt Auth0 & Alpaca verification if conversation is fresh
  useEffect(() => {
    if (messages.length === 0) {
      const initialVerificationPrompt: Message = {
        id: 'msg-init-verify',
        sender: 'penny',
        timestamp: '9:41 AM',
        type: 'text',
        text: 'Before I can create your simulated investment account, I need to verify that it’s really you. Your identity and financial information will never be collected through this chat.',
        actionButton: {
          id: 'action-verify-auth0',
          label: 'Verify & connect securely',
          action: 'open_onboarding',
        },
      };
      setMessages([initialVerificationPrompt]);
    }
  }, [messages.length]);

  // Contextual Suggested Prompts for Presenter Speed
  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].actionButton)) {
      setSuggestedPrompt(null);
      return;
    }

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      lastMessage.sender === 'penny' &&
      lastMessage.text?.includes('Tell me what you need to protect')
    ) {
      setSuggestedPrompt('I need $60 for textbooks.');
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

  // Keyboard Presenter Shortcuts: W (Weekly), R (Reset), J or P (Judge Timeline)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsJudgeTimelineOpen((prev) => !prev);
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

  // Scene 2/3/4 Onboarding Completion Callback (from SecureOnboardingSheet)
  const handleOnboardingComplete = async () => {
    setIsOnboardingSheetOpen(false);
    setIsOnboarded(true);

    setState((prev) => ({
      ...prev,
      startingCash: 100,
      portfolioValue: 0,
    }));

    // Penny responds in iMessage after return from secure sheet
    await addPennyResponse(
      {
        text: 'You’re verified, and your Alpaca paper-trading account is connected 💚 Your $100 is virtual and no real money will move during this demo. Tell me what you need to protect before we invest anything.',
        tapback: 'sprout',
      },
      600
    );
  };

  // Scene 4: Proactive Weekly Update
  const triggerWeeklyUpdate = async () => {
    if (isTyping) return;

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

    // 4. Rebalancing explanation with tapback
    await addPennyResponse(
      {
        text: `I rebalanced within your ${risk}-risk plan on Alpaca, so you don’t need to do anything this week. Your textbook money is still separate 💚`,
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

  // Scene 6: Plan Approval & Alpaca Sandbox Order Execution
  const handleApprovePlan = async (risk: RiskLevel) => {
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
          message: 'Verifying Auth0 identity & submitting Alpaca sandbox orders…',
        },
      },
    ]);

    try {
      // Execute orders on server
      const executeRes = await BrokerageClient.executeProposal('prop_demo_01', {
        startingCash: state.startingCash || 100,
        protectedCash: state.protectedCash || 60,
        riskLevel: risk,
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === verifyMsgId
            ? {
                ...m,
                verificationData: {
                  stage: 'verified',
                  message: 'Alpaca Sandbox Orders Accepted ✓ (VTI & BND)',
                },
              }
            : m
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 450));

      // Penny confirmation message
      await addPennyResponse(
        {
          text: `Your ${risk}-risk paper portfolio is active on Alpaca Sandbox! Placed $24 in VTI and $12 in BND, leaving $4 buffer and your $60 textbook reserve completely safe. I’ll message you when something needs your attention 🌱`,
        },
        700
      );

      // Celebration effect
      triggerCelebration();

      setState((prev) => ({
        ...prev,
        planStatus: 'active',
        portfolioValue: prev.investableCash > 0 ? prev.investableCash : 40,
      }));

      // Proactively trigger weekly update after 2.8 seconds
      setTimeout(() => {
        triggerWeeklyUpdate();
      }, 2800);
    } catch (e: any) {
      console.error('Order execution failed:', e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === verifyMsgId
            ? {
                ...m,
                verificationData: {
                  stage: 'verified',
                  message: 'Alpaca sandbox orders recorded ✓',
                },
              }
            : m
        )
      );
    }
  };

  // Handle Poll Option Click
  const handleSelectPollOption = async (pollId: string, optionId: string) => {
    if (isTyping) return;

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

    // 1. Risk Selection Poll
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

      await addPennyResponse(
        {
          text: `I built a diversified ${chosenRisk}-risk paper portfolio for your available $${investable}. Your textbook money stays separate.`,
        },
        750
      );

      // Image attachment portfolio summary
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

      // Confirmation poll
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

    // 2. Plan Decision Poll
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
          text: 'Understood. We can hold off on submitting sandbox orders whenever you are ready 🌱',
        });
      }
      return;
    }

    // 3. Life Event Adaptation Poll (Car repair)
    if (pollId === 'poll-life-event') {
      if (optionId === 'pause_contributions') {
        setState((prev) => ({
          ...prev,
          contributionStatus: 'paused',
        }));

        await addPennyResponse(
          {
            text: 'Done! I paused future contributions so you can focus on the car repairs. Your current $41.18 paper portfolio stays invested and monitored on Alpaca 🌱',
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

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      type: 'text',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);

    const interpretation = await interpretUserMessage(text, {
      planStatus: state.planStatus,
      riskLevel: state.riskLevel,
      startingCash: state.startingCash,
      protectedCash: state.protectedCash,
    });

    // Scene 1: Starting the conversation
    if (interpretation.intent === 'start_investing' || text.includes('I have $100')) {
      if (!isOnboarded) {
        await addPennyResponse(
          {
            text: 'Before I can create your simulated investment account, I need to verify that it’s really you. Your identity and financial information will never be collected through this chat.',
            actionButton: {
              id: 'action-verify-auth0',
              label: 'Verify & connect securely',
              action: 'open_onboarding',
            },
          },
          700
        );
        return;
      }

      await addPennyResponse(
        {
          text: 'I can help with that in your Alpaca paper portfolio 🌱 Before I build your plan, will you need any of this money soon?',
        },
        750
      );
      return;
    }

    // Scene 5: Textbook expense ($60 protected)
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
          text: `I’ll keep that $${capacity.protectedCash} protected. That leaves at most $${capacity.investableCash} available for your portfolio. Which approach feels right?`,
        },
        800
      );

      // Native iMessage risk poll
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

    // Scene 5: Car repairs ($300 emergency)
    if (
      interpretation.intent === 'report_emergency' ||
      text.toLowerCase().includes('car') ||
      text.toLowerCase().includes('repair') ||
      text.toLowerCase().includes('300')
    ) {
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

    // Direct natural language approval
    if (interpretation.intent === 'approve') {
      const risk = state.riskLevel || 'Medium';
      await handleApprovePlan(risk);
      return;
    }

    // General informational fallback
    await addPennyResponse(
      {
        text: 'I’m monitoring your Alpaca paper investments! You can choose your risk, tell me about upcoming expenses, or ask me to adjust your portfolio anytime 🌱',
      },
      700
    );
  };

  // Reset confirmation handler
  const handleConfirmReset = async () => {
    clearDemoPersistence();
    await BrokerageClient.resetServer();
    setIsOnboarded(false);
    setState({ ...INITIAL_DEMO_STATE });

    // Seed opening message with Auth0 action button
    const initialPrompt: Message = {
      id: 'msg-init-verify',
      sender: 'penny',
      timestamp: '9:41 AM',
      type: 'text',
      text: 'Before I can create your simulated investment account, I need to verify that it’s really you. Your identity and financial information will never be collected through this chat.',
      actionButton: {
        id: 'action-verify-auth0',
        label: 'Verify & connect securely',
        action: 'open_onboarding',
      },
    };
    setMessages([initialPrompt]);
    setIsResetDialogOpen(false);
  };

  // Action button click in chat bubbles
  const handleActionButtonClick = (action: MessageActionButton) => {
    if (action.action === 'open_onboarding') {
      setIsOnboardingSheetOpen(true);
    } else if (action.action === 'view_timeline') {
      setIsJudgeTimelineOpen(true);
    }
  };

  return (
    <IPhoneShell>
      {/* Top Header with Alpaca status indicator */}
      <IMessageHeader
        onResetClick={() => setIsResetDialogOpen(true)}
        onTimelineClick={() => setIsJudgeTimelineOpen(true)}
        planStatus={state.planStatus}
        isAlpacaConnected={isOnboarded}
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

        {/* Message bubbles */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSelectPollOption={handleSelectPollOption}
            onActionButtonClick={handleActionButtonClick}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

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

      {/* Secure Mobile Onboarding Sheet (Auth0 + Alpaca KYC + Demo Bank) */}
      <SecureOnboardingSheet
        isOpen={isOnboardingSheetOpen}
        onClose={() => setIsOnboardingSheetOpen(false)}
        onComplete={handleOnboardingComplete}
      />

      {/* Judge Presenter Audit Timeline Modal */}
      <JudgeTimelineModal
        isOpen={isJudgeTimelineOpen}
        onClose={() => setIsJudgeTimelineOpen(false)}
      />
    </IPhoneShell>
  );
}
