# Penny: Hackathon Judge Demo Walkthrough

An interactive demonstration of **Penny**, the iMessage-first automated robo-investing companion powered by Auth0 identity verification, Alpaca Broker API sandbox onboarding, and Photon conversational updates.

---

## The Core Concept
Penny is **not** a conventional financial dashboard, marketing site, or educational chatbot. It lives inside Apple Messages via Photon’s Spectrum SDK. It protects the user’s essential cash, invests only pre-approved money, and continually monitors and rebalances diversified paper portfolios through iMessage.

---

## 3-Minute Judge Demo Sequence

| Timestamp | Screen / Interface | What Happens |
|---|---|---|
| **0:00 - 0:30** | **iMessage (iPhone)** | **Scene 1: Verification Prompt**<br>Penny opens: *"Before I can create your simulated investment account, I need to verify that it’s really you. Your identity and financial information will never be collected through this chat."*<br>Tap the blue action button: **[ Verify & connect securely 🔒 ]**. |
| **0:30 - 1:15** | **Secure System Sheet**<br>*(Apple Pay / Safari Sheet)* | **Scene 2: Auth0 & Alpaca Sandbox Onboarding**<br>1. Tap **Continue with Auth0** $\to$ Auth0 Authorization Code Flow with PKCE executes $\to$ *"Identity verified with Auth0 ✓"*.<br>2. Alpaca Sandbox KYC form appears with fictional test data (`Jordan Demo`, `100 Sandbox Way`, `000-12-3456`) $\to$ Tap **Create Sandbox Relationship** $\to$ Account created via Alpaca Broker API sandbox (`/v1/accounts`).<br>3. Tap **Connect Demo Bank** $\to$ Sandbox test ACH relationship created $\to$ virtual incoming transfer of $100 funded $\to$ *"Demo bank connected ✓ $100 in virtual funds is ready for paper investing."*<br>4. Sheet automatically dismisses. |
| **1:15 - 1:50** | **iMessage (iPhone)** | **Scene 3: Mandate Agreement & Cash Protection**<br>Penny returns to chat: *"You’re verified, and your Alpaca paper-trading account is connected 💚 Your $100 is virtual and no real money will move during this demo. Tell me what you need to protect before we invest anything."*<br>User replies: *"I need $60 for textbooks."*<br>Safety Engine computes: $100 total − $60 protected = **$40 investable cash**.<br>Penny sends native risk poll: Select **🌿 Medium risk**. |
| **1:50 - 2:20** | **iMessage (iPhone)** | **Scene 4: Fractional Sandbox Order Execution**<br>Penny displays image-attachment plan card ($40 portfolio, 60% equities, 30% bonds, 10% cash).<br>User selects **Approve plan ✨** in the decision poll.<br>Backend recalculates capacity, confirms invariants, and places fractional sandbox orders: **$24 in VTI** and **$12 in BND** with Alpaca Broker API sandbox (`/v1/orders`).<br>Penny confirms execution and celebratory confetti triggers! |
| **2:20 - 2:45** | **iMessage (iPhone)** | **Scene 5: Proactive Weekly Update**<br>After 2.8 seconds, a *"One week later"* divider appears automatically.<br>Penny proactively sends the weekly report card ($41.18 paper value, +$1.18 · +2.95%, upward SVG sparkline, $60 textbook reserve safe).<br>Penny: *"I rebalanced within your Medium-risk plan on Alpaca, so you don't need to do anything this week 💚"*. |
| **2:45 - 3:00** | **iMessage (iPhone)** | **Scene 6: Life-Event Adaptation & Judge Evidence**<br>User types: *"My car just broke down and repairs might cost $300."*<br>Penny adapts: recommends pausing future contributions.<br>Press **`J`** or **`P`** (or tap the top-right shield icon) to open the **Judge Audit Timeline** showing server-recorded Auth0 and Alpaca sandbox events. |

---

## Architecture Breakdown

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

1. **Auth0 Identity**: Establishes the real human identity using Authorization Code Flow with PKCE. Tokens are validated server-side (issuer, audience, signature, expiration). The Auth0 `sub` acts as the stable identity key.
2. **Alpaca Broker API Sandbox**: Penny backend acts as the partner broker. It creates sandbox accounts, links virtual test ACH accounts, funds $100 in virtual paper capital, and submits fractional ETF orders (`VTI` & `BND`).
3. **Photon / Spectrum**: The conversational iMessage interface.
4. **Account-Linking Engine**: Issues cryptographically secure, 10-minute single-use link tokens to bridge Photon sender identities with verified Auth0 subjects without ever transmitting credentials or PII in chat.

---

## Genuine Integrations vs. Simulated Elements

### Genuinely Implemented
- **Auth0 PKCE & Token Validation**: Server-side verification of RS256 JWTs via JWKS endpoint, extracting `sub`.
- **Alpaca Broker API Sandbox Client**: Authentic API endpoints (`POST /v1/accounts`, `POST /v1/accounts/{id}/ach_relationships`, `POST /v1/accounts/{id}/transfers`, `POST /v1/accounts/{id}/orders`).
- **Hard Safety Guard**: Absolute server block rejecting production URLs (`api.alpaca.markets`) to ensure zero real-money movement.
- **Deterministic Capacity Invariants**: Code guarantees protected cash can never be invested ($\text{investableCash} = \max(0, \text{availableCash} - \text{protectedCash})$).
- **One-Time Link Security**: Single-use cryptographic tokens with 10-minute expiration.
- **Judge Audit Timeline**: Server-side audit event log accessible in real time via `J`/`P`.

### Simulated for Hackathon Demo
- **Paper Capital**: The $100 is virtual sandbox funding. No real money or bank accounts are touched.
- **Time Elapsed**: The "One week later" report triggers automatically for pacing.
- **iMessage Viewport**: Rendered within an authentic responsive iPhone shell in the browser.

---

## Production Regulatory Requirements
A production deployment of Penny would require:
1. Registered Investment Adviser (RIA) or broker-dealer registration under SEC/FINRA.
2. Formal CIP / KYC / AML compliance checks with live ID verification.
3. Qualified custodian holding client funds (e.g., Apex Clearing, DriveWealth, or Alpaca Securities LLC).
4. Brokerage Form CRS and customer advisory agreements.
