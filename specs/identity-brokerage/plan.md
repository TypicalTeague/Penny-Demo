# Implementation Plan: Auth0 Identity & Alpaca Broker API Sandbox

## 1. Current Architecture vs. Target Specification

### Current Architecture
- **Verification**: `DemoVerificationAdapter` in `src/services/verificationAdapter.ts` simulates identity verification with a simple JavaScript timer and `Verified ✓` text.
- **Brokerage / Execution**: `PortfolioSimulationService` in `src/services/portfolioSimulation.ts` computes static model percentages (60% / 30% / 10%) without interacting with an external brokerage partner.
- **Identity & State**: State is saved solely to browser `localStorage` (`penny_demo_state_v1`). There is no persistent server-side user entity linking iMessage/Photon senders to an identity provider.
- **Endpoints**: `server.ts` currently only exposes `POST /api/penny/interpret` and Vite middleware serving.

### Identified Conflicts & Gaps
1. **Client-Trusted State**: Previously, all decisions were coordinated on the frontend. The new specification requires server-authoritative account linking (`PennyUser`), token validation, and order execution.
2. **Missing Brokerage API Calls**: No Alpaca Broker API client exists. We need a server-side client that signs requests with `ALPACA_BROKER_API_KEY` and `ALPACA_BROKER_API_SECRET`, targets `https://broker-api.sandbox.alpaca.markets`, and enforces a production URL block.
3. **Missing Auth0 Flow**: No Auth0 integration exists. We need an official Authorization Code Flow with PKCE in the frontend, coupled with server-side JWT verification.
4. **Chat Privacy Boundary**: Previously, the user verified directly in chat bubbles. The new specification explicitly prohibits collecting KYC, legal agreements, and bank details through text messages, requiring a native-style **Secure System Sheet**.

---

## 2. Technical Stack & Additions
- **Auth0 Client**: `@auth0/auth0-spa-js` (or PKCE client) for browser; `jsonwebtoken` and `jwks-rsa` for server token verification.
- **Alpaca Client**: Server-side Broker API sandbox client targeting `https://broker-api.sandbox.alpaca.markets/v1`.
- **Database / Store**: Server-side in-memory + file-backed persistent store for `PennyUser`, `AccountLinkSession`, `AlpacaAccountRecord`, and `Proposal`.
- **Testing**: `vitest` suite covering security rules, token expiration, Alpaca URL guard, capacity invariants, and duplicate order prevention.

---

## 3. Phased Implementation Roadmap

### Phase 1: Server-Side Data Models & Security Foundations
- Create `server/models.ts` defining `PennyUser`, `AccountLinkSession`, `Proposal`, and `AlpacaRecord`.
- Implement `server/linkTokenService.ts` for cryptographically secure 10-minute single-use link tokens.
- Add server configuration helpers for Auth0 and Alpaca sandbox credentials in `.env.example`.

### Phase 2: Alpaca Broker API Sandbox Service (`server/alpacaService.ts`)
- Implement `AlpacaBrokerSandboxClient`:
  - **Safety Guard**: Hard error if URL contains production `api.alpaca.markets` without `sandbox`.
  - `createAccount(kycData)`: Calls `/v1/accounts`.
  - `getAccount(accountId)`: Calls `/v1/accounts/{accountId}`.
  - `createAchRelationship(accountId, bankData)`: Calls `/v1/accounts/{accountId}/ach_relationships`.
  - `createTransfer(accountId, amount)`: Calls `/v1/accounts/{accountId}/transfers`.
  - `submitOrder(accountId, orderData)`: Calls `/v1/accounts/{accountId}/orders` for fractional shares ($24 VTI, $12 BND).
  - **Presentation Fallback Adapter**: Visually marked "Presentation Simulation" mode when Alpaca sandbox keys are not present in `.env`.

### Phase 3: Auth0 Verification Service (`server/auth0Service.ts`)
- Implement JWT token validator using JWKS for `AUTH0_DOMAIN` and `AUTH0_AUDIENCE`.
- Extract stable `sub` identity.
- Fallback verification handler when Auth0 credentials are in presentation mode.

### Phase 4: Express API Endpoints in `server.ts`
- Implement all 10 required routes:
  - `POST /api/auth/link/start`
  - `POST /api/auth/link/complete`
  - `GET  /api/me`
  - `POST /api/brokerage/onboard`
  - `GET  /api/brokerage/account`
  - `POST /api/brokerage/connect-demo-bank`
  - `POST /api/brokerage/fund-sandbox`
  - `POST /api/brokerage/proposals/:id/confirm`
  - `POST /api/brokerage/proposals/:id/execute`
  - `POST /api/photon/webhook`
  - `POST /api/alpaca/events`

### Phase 5: Client-Side Secure System Sheet (`src/components/SecureOnboardingSheet.tsx`)
- Native slide-up iOS sheet (looks like Apple Pay / Safari View Controller).
- Step 1: Auth0 Universal Login / PKCE verification.
- Step 2: KYC form (pre-filled with fictional sandbox test data + mandatory agreement checkboxes).
- Step 3: Demo Bank Connect & $100 virtual funding.
- Step 4: Success confirmation & automatic return to iMessage.

### Phase 6: Updated iMessage Demo Flow & Presenter Tools
- Update `src/App.tsx` to launch the secure sheet on "Verify & connect securely".
- Connect Medium risk proposal confirmation to `POST /api/brokerage/proposals/:id/execute`.
- Add judge presenter timeline overlay (`P` or `J` key) revealing event timestamps:
  - Auth0 identity verified
  - Alpaca sandbox account created
  - Virtual transfer completed
  - Proposal confirmed
  - Paper orders submitted

### Phase 7: Test Suite & Documentation
- Write unit and integration tests in `tests/security.test.ts`.
- Run tests via `npx vitest run`.
- Update `README.md` and create `DEMO.md` with complete judge walkthrough.
