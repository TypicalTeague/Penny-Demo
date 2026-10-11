# Specification: Auth0 Identity & Alpaca Broker API Sandbox Integration for Penny

## 1. Overview & Vision
Penny is an iMessage-first automated robo-investing companion that communicates via Photon's Spectrum SDK. It is not a finance dashboard, website, or educational chatbot. It protects a user's essential cash, invests only pre-approved amounts into diversified paper portfolios, and continually manages the portfolio through chat.

To elevate Penny into a judge-ready, enterprise-grade fintech prototype, this specification introduces:
1. **Real Auth0 Universal Login Integration** (Authorization Code Flow with PKCE, server-side token validation, stable `sub` identity key).
2. **Real Alpaca Broker API Sandbox Onboarding & Virtual Funding** (`https://broker-api.sandbox.alpaca.markets`, hardcoded safety guard blocking production URLs, partner-managed onboarding, ACH test relationship, $100 virtual funding).
3. **Secure One-Time Account Linking** (Cryptographic tokens, 10-minute expiry, single-use, linking Photon sender IDs to Auth0 identities securely).
4. **Fractional Sandbox Order Execution** (Deterministic portfolio allocation converted into fractional/notional Alpaca paper orders upon user confirmation).
5. **Presentation Fallback Mode** (Visually labeled "Presentation Simulation" mode when live Auth0/Alpaca sandbox credentials are absent, ensuring pitch reliability without false claims).

---

## 2. Core Experience & Architecture

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

### Visual & Experience Principles
- The main product canvas remains strictly an iMessage conversation inside an iPhone shell.
- Sensitive identity collection (SSN, legal disclosures, bank details) must never happen in chat. Instead, a temporary, compact native-feeling **Secure System Sheet** (like Apple Pay or Safari View Controller sheet) slides up from the conversation, completes verification/onboarding, and immediately returns to Messages.
- An optional presenter event timeline (`P` or `J` keyboard shortcut) is available exclusively for hackathon judges to verify API calls and state transitions.

---

## 3. Detailed Demo Sequence

### Scene 1: Begin in Messages
1. Penny introduces account creation:
   > "Before I can create your simulated investment account, I need to verify that it’s really you. Your identity and financial information will never be collected through this chat."
2. Penny displays a native action card:
   > **[ Verify & connect securely 🔒 ]**

### Scene 2: Auth0 Verification
1. User taps "Verify & connect securely".
2. Penny requests a one-time link token (`POST /api/auth/link/start`).
3. The secure sheet opens Auth0 Universal Login (or Presentation Simulation if credentials are not configured).
4. Auth0 completes Authorization Code Flow with PKCE.
5. Backend validates the Auth0 access token (verifying issuer, audience, signature, expiration) via `POST /api/auth/link/complete`.
6. Sheet displays:
   > "Identity verified with Auth0 ✓"
7. Advances automatically to Alpaca brokerage onboarding.

### Scene 3: Alpaca Sandbox Relationship Creation
1. Penny backend checks if an Alpaca sandbox account exists for the Auth0 `sub`.
2. If new, the secure sheet collects minimum required sandbox onboarding info (fictional legal name, address, DOB, mock SSN `000-12-3456`, and mandatory Alpaca Customer Agreement consent).
3. Backend calls Alpaca Broker API sandbox:
   `POST https://broker-api.sandbox.alpaca.markets/v1/accounts`
4. Backend stores `alpacaAccountId` and `alpacaAccountStatus` against `PennyUser`.
5. Sheet displays: "Alpaca Sandbox Account Created (Status: ACTIVE)".

### Scene 4: Virtual Account Funding
1. Secure sheet presents:
   > **[ Connect demo bank 🏦 ]**
2. Backend creates a sandbox ACH relationship using test routing/account numbers:
   `POST https://broker-api.sandbox.alpaca.markets/v1/accounts/{account_id}/ach_relationships`
3. Backend requests an incoming virtual transfer of $100:
   `POST https://broker-api.sandbox.alpaca.markets/v1/accounts/{account_id}/transfers`
4. Sandbox account buying power updates to $100.00.
5. Sheet displays:
   > "Demo bank connected ✓"
   > "$100 in virtual funds is ready for paper investing."
6. Sheet automatically dismisses and returns focus to the iMessage conversation.

### Scene 5: Return to Messages & Mandate Agreement
1. Penny proactively messages:
   > "You’re verified, and your Alpaca paper-trading account is connected 💚 Your $100 is virtual and no real money will move during this demo. Tell me what you need to protect before we invest anything."
2. Presenter / User types:
   > "I need $60 for textbooks."
3. Penny evaluates with the deterministic Safety Engine:
   - Starting virtual cash: $100
   - Protected: $60 (textbooks)
   - Investable: $40
   Penny responds:
   > "I’ll keep that $60 protected. That leaves at most $40 available for your portfolio. Which approach feels right?"
4. Penny renders native risk poll: Low, Medium, High.
5. User selects **🌿 Medium risk** (60% equities, 30% bonds, 10% cash equivalent).
6. Penny proposes the plan card and asks: "What would you like to do? [Approve plan ✨]".

### Scene 6: Fractional Sandbox Order Execution
1. User taps "Approve plan ✨".
2. Penny backend verifies user session and proposal invariants:
   - `investableCash` = $40.00.
   - 60% equities = $24.00 into `VTI` (or equity basket).
   - 30% bonds = $12.00 into `BND`.
   - 10% cash buffer = $4.00 kept in cash.
3. Backend submits fractional notional orders to Alpaca Broker API sandbox:
   `POST https://broker-api.sandbox.alpaca.markets/v1/accounts/{account_id}/orders`
4. Alpaca returns order IDs and statuses (`accepted` / `filled`).
5. Penny posts conversational execution confirmation in iMessage:
   > "Your Medium-risk paper portfolio is active on Alpaca Sandbox! Placed $24 in VTI and $12 in BND, leaving $4 buffer and your $60 textbook reserve completely safe. I’ll message you when something needs your attention 🌱"
6. Tasteful celebration effect triggers.

---

## 4. Security & Safety Model

1. **Production Guard**:
   ```ts
   if (process.env.ALPACA_BROKER_BASE_URL?.includes('api.alpaca.markets') && 
       !process.env.ALPACA_BROKER_BASE_URL?.includes('sandbox')) {
     throw new Error('FATAL: Production Alpaca URL detected. Penny only allows sandbox trading.');
   }
   ```
2. **Account-Linking Token Security**:
   - `crypto.randomBytes(32).toString('hex')`
   - Expire after 10 minutes (`expiresAt < Date.now()`).
   - Single-use: invalidates immediately upon consumption.
   - URL contains only token ID; no PII, sub, or brokerage credentials.
3. **Identity Verification**:
   - Client sends Auth0 access token or authorization code to backend.
   - Backend verifies JWT signature, issuer (`https://${AUTH0_DOMAIN}/`), and audience (`AUTH0_AUDIENCE`).
   - The user's stable identifier is Auth0 `sub`. Browser client is never trusted for user IDs.
4. **Deterministic Investment Capacity Invariants**:
   - $\text{investableCash} = \max(0, \text{availableCash} - \text{protectedCash})$.
   - Protected cash can NEVER be invested.
   - Orders cannot exceed $\text{investableCash}$.
   - Orders require explicit user confirmation. Duplicate confirmations are rejected (idempotency key).

---

## 5. Server Endpoints Contract

- `POST /api/auth/link/start`: Issue one-time link token for photonSenderId.
- `POST /api/auth/link/complete`: Exchange token + Auth0 code/token, link Photon sender to Auth0 sub.
- `GET  /api/me`: Return current user profile, Auth0 status, and Alpaca sandbox status.
- `POST /api/brokerage/onboard`: Create Alpaca Broker sandbox account with verified KYC payload.
- `GET  /api/brokerage/account`: Fetch live Alpaca sandbox balance, status, and buying power.
- `POST /api/brokerage/connect-demo-bank`: Setup sandbox ACH relationship.
- `POST /api/brokerage/fund-sandbox`: Execute virtual ACH transfer ($100).
- `POST /api/brokerage/proposals/:id/confirm`: Validate capacity and lock proposal.
- `POST /api/brokerage/proposals/:id/execute`: Submit fractional paper orders to Alpaca sandbox.
- `POST /api/photon/webhook`: Inbound simulated or real Photon message handler.
- `POST /api/alpaca/events`: Webhook receiver for Alpaca trade/transfer updates.
- `POST /api/penny/interpret`: Gemini structured intent interpretation.
