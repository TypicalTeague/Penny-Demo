import { GeminiInterpretation, RiskLevel } from '../types';

/**
 * Deterministic fallback parser ensures the prototype is 100% dependable
 * during live hackathon / pitch demonstrations even if the backend or API is unreachable.
 */
export function deterministicFallbackParse(message: string): GeminiInterpretation {
  const lower = message.toLowerCase().trim();

  // 1. Scene 1 exact / variant match: starting cash
  if (
    lower.includes('investing it for me') ||
    lower.includes('handle investing') ||
    (lower.includes('have $') && (lower.includes('invest') || lower.includes('handle'))) ||
    lower.includes('start investing')
  ) {
    const amountMatch = message.match(/\$?(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;
    return {
      intent: 'start_investing',
      amount,
      label: 'initial paper capital',
      effectiveDate: null,
      riskLevel: null,
      confidence: 0.98,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // 2. Scene 1 exact / variant match: textbook expense
  if (
    lower.includes('textbook') ||
    (lower.includes('need') && lower.includes('january')) ||
    (lower.includes('need') && lower.includes('60'))
  ) {
    const amountMatch = message.match(/\$?(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 60;
    const dateMatch = lower.includes('january') ? 'January' : null;
    return {
      intent: 'report_expense',
      amount,
      label: 'textbooks',
      effectiveDate: dateMatch,
      riskLevel: null,
      confidence: 0.95,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // 3. Scene 5 exact / variant match: car repair emergency
  if (
    lower.includes('car') ||
    lower.includes('broke down') ||
    lower.includes('repair') ||
    lower.includes('emergency')
  ) {
    const amountMatch = message.match(/\$?(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 300;
    return {
      intent: 'report_emergency',
      amount,
      label: 'car repairs',
      effectiveDate: null,
      riskLevel: null,
      confidence: 0.95,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // 4. General risk preference statements
  if (lower.includes('low risk') || lower.includes('conservative')) {
    return {
      intent: 'change_risk',
      amount: 0,
      label: '',
      effectiveDate: null,
      riskLevel: 'Low',
      confidence: 0.95,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }
  if (lower.includes('medium risk') || lower.includes('moderate')) {
    return {
      intent: 'change_risk',
      amount: 0,
      label: '',
      effectiveDate: null,
      riskLevel: 'Medium',
      confidence: 0.95,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }
  if (lower.includes('high risk') || lower.includes('aggressive')) {
    return {
      intent: 'change_risk',
      amount: 0,
      label: '',
      effectiveDate: null,
      riskLevel: 'High',
      confidence: 0.95,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // 5. Plan approval statements
  if (
    lower.includes('approve') ||
    lower.includes('sounds good') ||
    lower.includes('looks great') ||
    lower.includes('yes please') ||
    lower.includes('confirm')
  ) {
    return {
      intent: 'approve',
      amount: 0,
      label: '',
      effectiveDate: null,
      riskLevel: null,
      confidence: 0.9,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // 6. Pause statements
  if (lower.includes('pause') || lower.includes('hold on') || lower.includes('stop')) {
    return {
      intent: 'pause',
      amount: 0,
      label: '',
      effectiveDate: null,
      riskLevel: null,
      confidence: 0.9,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // 7. Withdraw statements
  if (lower.includes('withdraw') || lower.includes('take out money') || lower.includes('cash out')) {
    const amountMatch = message.match(/\$?(\d+(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    return {
      intent: 'withdraw',
      amount,
      label: 'withdrawal',
      effectiveDate: null,
      riskLevel: null,
      confidence: 0.85,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // 8. General expense pattern
  const generalAmountMatch = message.match(/\$?(\d+(?:\.\d{1,2})?)/);
  if (generalAmountMatch && (lower.includes('need') || lower.includes('cost') || lower.includes('pay'))) {
    return {
      intent: 'report_expense',
      amount: parseFloat(generalAmountMatch[1]),
      label: 'expense',
      effectiveDate: null,
      riskLevel: null,
      confidence: 0.8,
      missingFields: [],
      clarifyingQuestion: null,
    };
  }

  // Fallback for educational questions or unparsed text
  return {
    intent: 'ask_question',
    amount: 0,
    label: '',
    effectiveDate: null,
    riskLevel: null,
    confidence: 0.6,
    missingFields: [],
    clarifyingQuestion: null,
  };
}

/**
 * Interpret user message using server-side Gemini endpoint,
 * falling back seamlessly to deterministic parser if necessary.
 */
export async function interpretUserMessage(
  message: string,
  context?: Record<string, unknown>
): Promise<GeminiInterpretation> {
  try {
    const response = await fetch('/api/penny/interpret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        currentContext: context,
      }),
    });

    if (!response.ok) {
      console.warn('Backend interpretation returned non-200. Using deterministic fallback.');
      return deterministicFallbackParse(message);
    }

    const data = await response.json();

    if (data.fallbackRequired || !data.intent) {
      return deterministicFallbackParse(message);
    }

    // Validate fields
    return {
      intent: data.intent,
      amount: typeof data.amount === 'number' ? data.amount : 0,
      label: typeof data.label === 'string' ? data.label : '',
      effectiveDate: data.effectiveDate || null,
      riskLevel: (['Low', 'Medium', 'High'].includes(data.riskLevel) ? data.riskLevel : null) as RiskLevel | null,
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
      missingFields: Array.isArray(data.missingFields) ? data.missingFields : [],
      clarifyingQuestion: data.clarifyingQuestion || null,
    };
  } catch (error) {
    console.warn('Network or server error during Gemini call. Using deterministic fallback:', error);
    return deterministicFallbackParse(message);
  }
}
