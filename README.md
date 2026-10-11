# Penny: iMessage-First Robo-Investing Companion

An interactive presentation prototype for **Penny**, an automated robo-investing companion designed for iMessage via Photon’s Spectrum SDK, featuring **Auth0 identity verification** and **Alpaca Broker API sandbox onboarding**.

---

## Architecture

```text
User in iMessage (iPhone)
        ↓ (SMS / iMessage chat)
Photon / Spectrum Gateway
        ↓ (One-time link: POST /api/auth/link/start)
Penny Backend (Express + TypeScript)
        ↓
Auth0 Universal Login (PKCE + redirect)
        ↓ (Verified JWT sub)
Penny Mandate & Safety Engine (Deterministic rules)
        ↓ (Partner API: Broker Sandbox)
Alpaca Broker API Sandbox (Account creation + $100 Virtual ACH)
        ↓ (Fractional paper orders: VTI / BND)
Photon Conversational Updates (iMessage notifications)
```

---

## Implementation Summary

### What is Genuinely Implemented

- **Auth0 Identity Verification**: Authorization Code Flow with PKCE in the client; server-side verification of RS256 JWTs using JWKS (`server/auth0Service.ts`). The Auth0 `sub` serves as the user's stable identity key.
- **Alpaca Broker API Sandbox Integration**: Penny’s backend acts as the partner broker. It creates sandbox accounts (`POST /v1/accounts`), links virtual test ACH bank accounts (`POST /v1/accounts/{id}/ach_relationships`), funds $100 virtual cash (`POST /v1/accounts/{id}/transfers`), and submits fractional ETF orders (`POST /v1/accounts/{id}/orders` for VTI & BND).
- **Hard Safety Guard**: A hardcoded server validation guard immediately terminates execution if a production Alpaca URL (`api.alpaca.markets`) is configured without `sandbox`.
- **Account-Linking Token Security**: Single-use, cryptographically secure random tokens (`server/linkTokenService.ts`) with a strict 10-minute expiration window to link Photon sender IDs to Auth0 subjects without passing PII in chat.
- **Deterministic Financial Safety Engine**: Guarantees protected cash ($60 textbooks) cannot be invested:
  $$\text{investableCash} = \max(0, \text{availableCash} - \text{protectedCash})$$
- **Fractional Sandbox Order Placement**: Medium-risk mandate allocates 60% ($24) into `VTI`, 30% ($12) into `BND`, leaving $4 buffer and $60 safe.
- **Judge Audit Timeline**: Server-recorded event log accessible via keyboard shortcut (`J` or `P`) or the top-right shield button to inspect API milestones.
- **Automated Test Suite**: 13 unit and integration tests (`npm test` via Vitest) covering link token expiration, production URL blocking, capacity calculations, and duplicate order prevention.

### What is Simulated for the Demo

- **Virtual Paper Funds**: All capital ($100 virtual funding, $40 paper portfolio, $41.18 weekly report) is sandbox paper trading. No real bank accounts or money are moved.
- **Presentation Simulation Fallback**: When live Auth0 or Alpaca credentials are not populated in `.env`, the system runs a visibly labeled "Presentation Simulation" mode so pitch demonstrations remain 100% dependable.
- **Time Dilation**: The "One week later" performance report arrives automatically or via presenter trigger.

---

## Presenter Controls & Shortcuts

- **`W`**: Trigger the proactive "One week later" weekly report card.
- **`R`**: Open the confirmation dialog to reset the demo state.
- **`J` or `P`**: Toggle the **Judge Audit Timeline** evidence panel.
- **Header Shield Icon**: Tap to inspect the server audit log anytime.
- **Header Reset Icon**: Tap to reset the demo state back to the opening verification step.

---

## Testing

Run the test suite with:

```bash
npm test
```

13 tests covering token security, Alpaca URL guard, KYC requirements, deterministic invariants, and duplicate order prevention.

---

## Regulatory Notice for Production Launch

A live production launch of Penny would require:
1. Registration as an Investment Adviser (RIA) or Broker-Dealer under FINRA and SEC oversight.
2. Formal Customer Identification Program (CIP), KYC, and AML compliance with verified ID document scans.
3. Custody arrangements with an authorized clearing custodian (e.g. Alpaca Securities LLC, DriveWealth, or Apex Clearing).
4. Brokerage disclosures, Form CRS, and Customer Account Agreements.
