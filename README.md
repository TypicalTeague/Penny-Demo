# Penny: iMessage-First Robo-Investing Companion

An interactive presentation prototype for **Penny**, an automated robo-investing companion designed for iMessage via Photon’s Spectrum SDK.

---

## Penny Prototype: Implementation Summary

### What is genuinely implemented

- **Structured Natural Language Processing**: Gemini interprets natural-language messages through a secure server-side API (`server.ts`) and returns structured intents, amounts, dates, and life events using a validated JSON schema.
- **Deterministic Safety Engine**: Enforces strict financial-capacity mathematical rules (`src/services/safetyEngine.ts`):
  $$\text{investableCash} = \max(0, \text{availableCash} - \text{protectedCash})$$
  Protected near-term expenses (such as the $60 textbook reserve) cannot be allocated into paper investments.
- **Deterministic Portfolio Engine**: Builds Low-, Medium-, and High-risk diversified paper portfolios and reproduces weekly performance and routine rebalancing metrics (`src/services/portfolioSimulation.ts`).
- **Interactive iMessage Presentation**: Authentic iOS Messages experience (`src/components/`) featuring blue outgoing bubbles, neutral gray incoming bubbles with tails, native interactive polls ($\ge 44\text{px}$ touch targets), typing indicators, tapback reactions, and image-attachment summary cards with allocation segments and SVG sparklines.
- **Local Persistence**: Demo state and conversation history persist across browser reloads via `localStorage` (`src/services/persistence.ts`).
- **Presenter Pitch Controls**:
  - Discreet header reset button with confirmation modal.
  - Keyboard shortcuts: `W` to trigger the proactive weekly update, `R` to open the reset confirmation dialog.
  - Contextual prompt helpers for live pitch speed and dependability.

### What is simulated

- All portfolio balances, transactions, market changes, and rebalancing events.
- The passage of one week.
- Identity verification (abstracted behind `src/services/verificationAdapter.ts`).
- The iMessage interface itself (rendered inside a realistic mobile iPhone shell).
- Photon delivery, unless the separate Spectrum implementation is connected and demonstrated.

*Note: No real money, brokerage account, or investment transaction is involved. All values are labeled as paper portfolio / simulated / illustrative.*

### Production Architecture

In production, Photon Spectrum replaces the browser’s simulated Messages presentation layer:

1. **Photon receives a real iMessage** via Apple Messages for Business.
2. **Gemini translates the message** into structured financial information via server-side intent parsing.
3. **The persistent mandate store** loads the user’s goals, expenses, and approved risk level.
4. **Deterministic safety and portfolio engines** calculate the appropriate action and rebalancing orders.
5. **Photon replies with native messages**, polls, and portfolio-image attachments directly inside iMessage.
6. **Auth0 or biometric Passkeys** authorize consequential changes.
7. A licensed RIA/broker-dealer and custodian would execute real investment transactions.

### What Penny Demonstrates

Penny is an automated robo-investing companion for beginners who do not want to construct, diversify, monitor, and rebalance a portfolio themselves.

Users tell Penny about their situation, choose a comfortable risk level, and approve a mandate. Penny manages a diversified paper portfolio and adapts it as life changes (such as unexpected car repairs).

Education is available when the user asks Penny to explain a decision, rather than behaving as a generic educational chatbot.
