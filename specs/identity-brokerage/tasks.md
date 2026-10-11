# Tasks: Auth0 Identity & Alpaca Broker API Sandbox Integration

## Task List & Execution Status

- [x] **Task 1: Dependencies & Configuration**
  - Install dependencies: `@auth0/auth0-spa-js`, `jsonwebtoken`, `jwks-rsa`, `vitest`, `@types/jsonwebtoken`.
  - Update `.env.example` with Auth0 and Alpaca sandbox variables.
  - *Verification*: `npm ls` confirms installed packages.

- [x] **Task 2: Server State & Secure One-Time Link Token Engine**
  - Create `server/models.ts` with `PennyUser`, `AccountLinkSession`, `Proposal`, `BrokerageAccount` models.
  - Create `server/linkTokenService.ts` with crypto random token generation, 10-minute expiry, single-use invalidation, and mismatch protection.
  - *Verification*: Unit tests verify token generation, expiration, and replay prevention.

- [x] **Task 3: Alpaca Broker API Sandbox Client**
  - Create `server/alpacaService.ts`.
  - Add hard safety guard rejecting production Alpaca URLs.
  - Implement sandbox account creation (`/v1/accounts`), ACH relationship (`/ach_relationships`), virtual funding transfer (`/transfers`), and fractional order placement (`/orders`).
  - Provide cleanly labeled Presentation Fallback adapter if sandbox credentials are not set.
  - *Verification*: Test verifies production URL throws error; sandbox mock/live handles full sequence.

- [x] **Task 4: Auth0 Token Verification Service**
  - Create `server/auth0Service.ts`.
  - Validate JWT signature, issuer, audience, and expiration using JWKS.
  - Extract stable `sub` as user identity.
  - Provide labeled presentation fallback for demo environments without live Auth0 credentials.
  - *Verification*: Test verifies unauthenticated/tampered token rejection.

- [x] **Task 5: Server Brokerage & Linking API Endpoints**
  - In `server.ts` / `server/brokerageRoutes.ts`, implement:
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
    - `GET  /api/audit/timeline`
    - `POST /api/demo/reset`
  - *Verification*: Integration tests verify all endpoints with valid and invalid tokens.

- [x] **Task 6: Secure System Sheet UI Component**
  - Create `src/components/SecureOnboardingSheet.tsx`:
    - Native mobile slide-up sheet styling (Apple Pay / Safari View Controller aesthetic).
    - Step 1: Auth0 Universal Login / PKCE authentication.
    - Step 2: Sandbox KYC form with pre-filled test data + mandatory legal agreement checkboxes.
    - Step 3: Connect demo bank & virtual $100 transfer.
    - Step 4: Verification badge "Identity verified with Auth0 ✓" & "Alpaca Paper Trading Account Active".
    - Visible "Alpaca Paper Trading" status indicator.
  - *Verification*: Component renders cleanly within mobile viewport without overflowing.

- [x] **Task 7: Client Brokerage Service**
  - Create `src/services/brokerageClient.ts` to coordinate link session, Auth0 login, onboarding submission, funding, and order execution.
  - *Verification*: Tested in end-to-end conversation flow.

- [x] **Task 8: iMessage Demo Flow Update in App.tsx**
  - Scene 1: Penny prompts verification with "Verify & connect securely" action button.
  - Scene 2: Secure sheet completes Auth0 + Alpaca sandbox onboarding + $100 virtual funding.
  - Scene 3: Returns to iMessage. Penny confirms Alpaca connection and prompts for cash to protect.
  - Scene 4: User states textbook expense ($60 protected, $40 investable).
  - Scene 5: User selects Medium risk, reviews plan, approves plan.
  - Scene 6: Backend executes fractional orders in Alpaca sandbox ($24 VTI, $12 BND). Penny confirms execution.
  - *Verification*: Complete sequence runs seamlessly in under 90 seconds.

- [x] **Task 9: Judge Presenter Event Timeline Overlay**
  - Create `src/components/JudgeTimelineModal.tsx` accessible via `P` or `J` key or header shield button.
  - Displays tamper-proof event audit log:
    - Auth0 identity verified
    - Alpaca sandbox account created
    - Virtual transfer completed
    - Proposal confirmed
    - Paper orders submitted
  - *Verification*: Shortcut toggles overlay without disrupting message flow.

- [x] **Task 10: Automated Tests**
  - Create `tests/brokerage-security.test.ts`.
  - Run with `npx vitest run`.
  - *Verification*: All 13 test cases pass.

- [x] **Task 11: Documentation & Judge Pitch Guide**
  - Update `README.md` and create `DEMO.md` detailing architecture, genuine vs simulated components, and the 3-minute demo script.
  - *Verification*: Clear, truthful documentation aligned with all guidelines.

- [x] **Task 12: Final Compilation & Verification**
  - Run `compile_applet` and `lint_applet`.
  - *Verification*: 0 build errors, 0 lint errors.
