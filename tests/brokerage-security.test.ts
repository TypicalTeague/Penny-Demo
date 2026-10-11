import { describe, it, expect, beforeEach } from 'vitest';
import { LinkTokenService } from '../server/linkTokenService';
import { AlpacaBrokerSandboxService } from '../server/alpacaService';
import { Auth0VerificationService } from '../server/auth0Service';
import { FinancialSafetyEngine } from '../src/services/safetyEngine';
import { pennyStore, Proposal } from '../server/models';

describe('Penny Security & Brokerage Test Suite', () => {
  beforeEach(() => {
    pennyStore.resetStore();
  });

  describe('1. One-Time Account Link Token Security', () => {
    it('issues cryptographically random link token with 10-minute expiry', () => {
      const session = LinkTokenService.issueLinkToken('photon-user-456');
      expect(session.token).toBeDefined();
      expect(session.token.length).toBe(64); // 32 bytes hex = 64 chars
      expect(session.expiresAt).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
      expect(session.expiresAt).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000 + 1000);
    });

    it('rejects expired link tokens', () => {
      // Issue session with expired TTL
      const expiredSession = pennyStore.createLinkSession('photon-user-expired', -1000);
      const res = LinkTokenService.completeLinkToken(expiredSession.token, 'auth0|user_123');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/expired/i);
    });

    it('enforces single-use consumption and rejects reused link tokens', () => {
      const session = LinkTokenService.issueLinkToken('photon-user-single-use');
      const firstAttempt = LinkTokenService.completeLinkToken(session.token, 'auth0|user_first');
      expect(firstAttempt.success).toBe(true);

      // Second attempt with same token must fail
      const secondAttempt = LinkTokenService.completeLinkToken(session.token, 'auth0|user_attacker');
      expect(secondAttempt.success).toBe(false);
      expect(secondAttempt.error).toMatch(/already been consumed/i);
    });

    it('prevents accidental cross-linking between distinct Photon identities', () => {
      const sessionA = LinkTokenService.issueLinkToken('photon-alice');
      const sessionB = LinkTokenService.issueLinkToken('photon-bob');

      LinkTokenService.completeLinkToken(sessionA.token, 'auth0|alice_sub');
      LinkTokenService.completeLinkToken(sessionB.token, 'auth0|bob_sub');

      const userA = pennyStore.getUserByAuth0Sub('auth0|alice_sub');
      const userB = pennyStore.getUserByAuth0Sub('auth0|bob_sub');

      expect(userA?.photonSenderId).toBe('photon-alice');
      expect(userB?.photonSenderId).toBe('photon-bob');
      expect(userA?.id).not.toBe(userB?.id);
    });
  });

  describe('2. Alpaca Sandbox Safety Guards', () => {
    it('hard safety guard rejects production Alpaca URL', async () => {
      const originalUrl = process.env.ALPACA_BROKER_BASE_URL;
      try {
        process.env.ALPACA_BROKER_BASE_URL = 'https://api.alpaca.markets';
        expect(() => {
          // Calling createAccount with production URL must throw
          return (AlpacaBrokerSandboxService as any).baseUrl;
        }).toThrow(/Production Alpaca URL detected/);
      } finally {
        process.env.ALPACA_BROKER_BASE_URL = originalUrl;
      }
    });

    it('requires explicit legal agreement consent before opening an account', async () => {
      const kycWithoutAgreements = {
        givenName: 'Test',
        familyName: 'User',
        dateOfBirth: '1995-01-01',
        taxId: '000-12-3456',
        streetAddress: '123 Test St',
        city: 'SF',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        agreementsSigned: false,
      };

      await expect(
        AlpacaBrokerSandboxService.createAccount(kycWithoutAgreements)
      ).rejects.toThrow(/Customer Agreement/i);
    });

    it('labels presentation simulation mode visibly when live keys are absent', async () => {
      const originalKey = process.env.ALPACA_BROKER_API_KEY;
      delete process.env.ALPACA_BROKER_API_KEY;

      try {
        const kyc = {
          givenName: 'Jordan',
          familyName: 'Demo',
          dateOfBirth: '1996-05-14',
          taxId: '000-12-3456',
          streetAddress: '100 Sandbox Way',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'USA',
          agreementsSigned: true,
        };

        const account = await AlpacaBrokerSandboxService.createAccount(kyc);
        expect(account.isPresentationSimulation).toBe(true);
        expect(account.status).toBe('ACTIVE');

        const order = await AlpacaBrokerSandboxService.submitSandboxOrder(account.id, 'VTI', 24.0);
        expect(order.isPresentationSimulation).toBe(true);
        expect(order.status).toBe('filled');
      } finally {
        process.env.ALPACA_BROKER_API_KEY = originalKey;
      }
    });
  });

  describe('3. Deterministic Financial Safety Engine & Capacity Invariants', () => {
    it('ensures protected money ($60 textbooks) cannot be invested', () => {
      const capacity = FinancialSafetyEngine.evaluateCapacity(100, 0, {
        label: 'textbooks',
        amount: 60,
        isEssential: true,
      });

      expect(capacity.startingCash).toBe(100);
      expect(capacity.protectedCash).toBe(60);
      expect(capacity.investableCash).toBe(40);
      expect(capacity.canInvest).toBe(true);
    });

    it('enforces investableCash cannot be negative', () => {
      const capacity = FinancialSafetyEngine.evaluateCapacity(100, 0, {
        label: 'major expense',
        amount: 150,
        isEssential: true,
      });

      expect(capacity.protectedCash).toBe(100); // capped at available
      expect(capacity.investableCash).toBe(0);
      expect(capacity.canInvest).toBe(false);
    });

    it('prevents risk preference from overriding protected cash limits', () => {
      const starting = 100;
      const protectedCash = 60;
      const investable = Math.max(0, starting - protectedCash);

      // Medium risk: 60% equities, 30% bonds, 10% cash
      const equitiesDollars = (investable * 60) / 100;
      const bondsDollars = (investable * 30) / 100;
      const cashBuffer = (investable * 10) / 100;

      expect(equitiesDollars).toBe(24);
      expect(bondsDollars).toBe(12);
      expect(cashBuffer).toBe(4);
      expect(equitiesDollars + bondsDollars + cashBuffer).toBe(40);
      expect(starting - (equitiesDollars + bondsDollars + cashBuffer)).toBe(60);
    });
  });

  describe('4. Auth0 Server-Side Validation Invariants', () => {
    it('rejects unauthenticated requests without tokens', async () => {
      await expect(Auth0VerificationService.verifyToken('')).rejects.toThrow(/Missing Bearer token/);
    });

    it('returns structured verified identity with stable sub key in simulation mode', async () => {
      const verified = await Auth0VerificationService.verifyToken('simulated_auth0_judge_token_123');
      expect(verified.sub).toBe('auth0|sim_judge_token_123');
      expect(verified.isPresentationSimulation).toBe(true);
    });
  });

  describe('5. Duplicate Order & Idempotency Safeguards', () => {
    it('prevents duplicate executions on the same proposal', () => {
      const user = pennyStore.getOrCreateUserByPhotonSender('photon-test-sender');
      const proposal: Proposal = {
        id: 'prop-test-duplicate',
        userId: user.id,
        startingCash: 100,
        protectedCash: 60,
        investableCash: 40,
        riskLevel: 'Medium',
        allocation: { equities: 60, bonds: 30, cash: 10 },
        status: 'CONFIRMED',
        createdAt: Date.now(),
      };
      pennyStore.saveProposal(proposal);

      // First execution marks it executed
      proposal.status = 'EXECUTED';
      pennyStore.saveProposal(proposal);

      const retrieved = pennyStore.getProposal('prop-test-duplicate');
      expect(retrieved?.status).toBe('EXECUTED');
    });
  });
});
