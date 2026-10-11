import { Router, Request, Response } from 'express';
import { pennyStore, PennyUser, Proposal, PortfolioOrder } from './models';
import { LinkTokenService } from './linkTokenService';
import { AlpacaBrokerSandboxService, KycOnboardingPayload } from './alpacaService';
import { Auth0VerificationService } from './auth0Service';

export const brokerageRouter = Router();

// Helper to authenticate user via Bearer token or link session
async function resolveAuthUser(req: Request): Promise<PennyUser> {
  const authHeader = req.headers.authorization;
  const linkToken = (req.headers['x-link-token'] || req.query.linkToken) as string;

  // 1. Bearer Token Auth
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.split(' ')[1];
    const verified = await Auth0VerificationService.verifyToken(rawToken);
    const user = pennyStore.getUserByAuth0Sub(verified.sub);
    if (user) return user;

    // If new user with verified Auth0 sub, link or create
    if (linkToken) {
      const linkResult = LinkTokenService.completeLinkToken(linkToken, verified.sub, {
        email: verified.email,
        name: verified.name,
      });
      if (linkResult.user) return linkResult.user;
    }

    // Default demo user fallback for presentation testing
    const demoUser = pennyStore.getOrCreateUserByPhotonSender('photon-user-demo-imessage-101');
    demoUser.auth0Subject = verified.sub;
    pennyStore.saveUser(demoUser);
    return demoUser;
  }

  // 2. Link Token Session Fallback
  if (linkToken) {
    const session = pennyStore.getLinkSession(linkToken);
    if (session && !session.consumed && session.expiresAt >= Date.now()) {
      return pennyStore.getOrCreateUserByPhotonSender(session.photonSenderId);
    }
  }

  // 3. Fallback to default demo user if unauthenticated in presentation mode
  const defaultDemo = pennyStore.getOrCreateUserByPhotonSender('photon-user-demo-imessage-101');
  return defaultDemo;
}

// 1. POST /api/auth/link/start
brokerageRouter.post('/auth/link/start', (req: Request, res: Response) => {
  const photonSenderId = req.body.photonSenderId || 'photon-user-demo-imessage-101';
  try {
    const result = LinkTokenService.issueLinkToken(photonSenderId);
    res.json({
      success: true,
      token: result.token,
      expiresAt: result.expiresAt,
      auth0Config: {
        domain: process.env.AUTH0_DOMAIN || '',
        clientId: process.env.AUTH0_CLIENT_ID || '',
        audience: process.env.AUTH0_AUDIENCE || '',
        isConnectedMode: Auth0VerificationService.isConnectedMode(),
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 2. POST /api/auth/link/complete
brokerageRouter.post('/auth/link/complete', async (req: Request, res: Response) => {
  const { token, auth0Token, simulatedSub } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required' });
  }

  try {
    let sub = simulatedSub;
    let email: string | undefined;
    let name: string | undefined;

    if (auth0Token) {
      const verified = await Auth0VerificationService.verifyToken(auth0Token);
      sub = verified.sub;
      email = verified.email;
      name = verified.name;
    } else if (!sub) {
      sub = `auth0|sim_${Math.random().toString(36).substring(2, 10)}`;
    }

    const result = LinkTokenService.completeLinkToken(token, sub, { email, name });
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      user: result.user,
      isConnectedMode: Auth0VerificationService.isConnectedMode(),
    });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// 3. GET /api/me
brokerageRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await resolveAuthUser(req);
    res.json({
      user,
      auth0Mode: Auth0VerificationService.isConnectedMode() ? 'CONNECTED' : 'PRESENTATION_SIMULATION',
      alpacaMode: AlpacaBrokerSandboxService.isConnectedMode() ? 'CONNECTED' : 'PRESENTATION_SIMULATION',
      timeline: pennyStore.getAuditEvents(),
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// 4. POST /api/brokerage/onboard
brokerageRouter.post('/brokerage/onboard', async (req: Request, res: Response) => {
  try {
    const user = await resolveAuthUser(req);
    const kyc: KycOnboardingPayload = {
      givenName: req.body.givenName || 'Jordan',
      familyName: req.body.familyName || 'Demo',
      dateOfBirth: req.body.dateOfBirth || '1996-05-14',
      taxId: req.body.taxId || '000-12-3456',
      streetAddress: req.body.streetAddress || '100 Sandbox Way',
      city: req.body.city || 'San Francisco',
      state: req.body.state || 'CA',
      postalCode: req.body.postalCode || '94105',
      country: req.body.country || 'USA',
      agreementsSigned: req.body.agreementsSigned ?? true,
    };

    const account = await AlpacaBrokerSandboxService.createAccount(kyc);
    user.alpacaAccountId = account.id;
    user.alpacaAccountStatus = account.status;
    user.onboardingStatus = 'BROKERAGE_ONBOARDED';
    pennyStore.saveUser(user);

    res.json({
      success: true,
      account,
      user,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. GET /api/brokerage/account
brokerageRouter.get('/brokerage/account', async (req: Request, res: Response) => {
  try {
    const user = await resolveAuthUser(req);
    res.json({
      accountId: user.alpacaAccountId,
      status: user.alpacaAccountStatus || 'UNINITIALIZED',
      virtualBalance: user.virtualBalance,
      buyingPower: user.buyingPower,
      achRelationshipId: user.achRelationshipId,
      transferId: user.transferId,
      isPresentationSimulation: !AlpacaBrokerSandboxService.isConnectedMode(),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. POST /api/brokerage/connect-demo-bank
brokerageRouter.post('/brokerage/connect-demo-bank', async (req: Request, res: Response) => {
  try {
    const user = await resolveAuthUser(req);
    const accountId = user.alpacaAccountId || `alp_sbx_mock_${Date.now()}`;
    const ach = await AlpacaBrokerSandboxService.connectDemoBank(accountId);

    user.achRelationshipId = ach.id;
    pennyStore.saveUser(user);

    res.json({
      success: true,
      relationship: ach,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. POST /api/brokerage/fund-sandbox
brokerageRouter.post('/brokerage/fund-sandbox', async (req: Request, res: Response) => {
  try {
    const user = await resolveAuthUser(req);
    const accountId = user.alpacaAccountId || `alp_sbx_mock_${Date.now()}`;
    const relationshipId = user.achRelationshipId || `ach_rel_${Date.now()}`;
    const amount = req.body.amount ? parseFloat(req.body.amount) : 100;

    const transfer = await AlpacaBrokerSandboxService.fundVirtualSandbox(accountId, relationshipId, amount);

    user.transferId = transfer.id;
    user.virtualBalance = amount;
    user.buyingPower = amount;
    user.onboardingStatus = 'ACTIVE';
    pennyStore.saveUser(user);

    res.json({
      success: true,
      transfer,
      buyingPower: user.buyingPower,
      virtualBalance: user.virtualBalance,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. POST /api/brokerage/proposals/:id/confirm
brokerageRouter.post('/brokerage/proposals/:id/confirm', async (req: Request, res: Response) => {
  const proposalId = req.params.id;
  try {
    const user = await resolveAuthUser(req);
    let proposal = pennyStore.getProposal(proposalId);

    if (!proposal) {
      // Create proposal if new
      const startingCash = req.body.startingCash || 100;
      const protectedCash = req.body.protectedCash || 60;
      const investableCash = Math.max(0, startingCash - protectedCash);
      const riskLevel = req.body.riskLevel || 'Medium';

      proposal = {
        id: proposalId,
        userId: user.id,
        startingCash,
        protectedCash,
        investableCash,
        riskLevel,
        allocation:
          riskLevel === 'Low'
            ? { equities: 20, bonds: 60, cash: 20 }
            : riskLevel === 'High'
            ? { equities: 85, bonds: 10, cash: 5 }
            : { equities: 60, bonds: 30, cash: 10 },
        status: 'CONFIRMED',
        createdAt: Date.now(),
        confirmedAt: Date.now(),
      };
    } else {
      proposal.status = 'CONFIRMED';
      proposal.confirmedAt = Date.now();
    }

    pennyStore.saveProposal(proposal);
    pennyStore.addAuditEvent(
      'PROPOSAL_CONFIRMED',
      `Proposal ${proposalId} confirmed: $${proposal.investableCash} investable at ${proposal.riskLevel} risk`,
      { proposalId, investableCash: proposal.investableCash }
    );

    res.json({
      success: true,
      proposal,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. POST /api/brokerage/proposals/:id/execute
brokerageRouter.post('/brokerage/proposals/:id/execute', async (req: Request, res: Response) => {
  const proposalId = req.params.id;
  try {
    const user = await resolveAuthUser(req);
    let proposal = pennyStore.getProposal(proposalId);

    if (!proposal) {
      // Auto-construct proposal if executing from chat direct confirmation
      const startingCash = req.body.startingCash || 100;
      const protectedCash = req.body.protectedCash || 60;
      const investableCash = Math.max(0, startingCash - protectedCash);
      const riskLevel = req.body.riskLevel || 'Medium';

      proposal = {
        id: proposalId,
        userId: user.id,
        startingCash,
        protectedCash,
        investableCash,
        riskLevel,
        allocation: { equities: 60, bonds: 30, cash: 10 },
        status: 'CONFIRMED',
        createdAt: Date.now(),
        confirmedAt: Date.now(),
      };
    }

    // Idempotency: Reject duplicate executions
    if (proposal.status === 'EXECUTED') {
      return res.json({
        success: true,
        alreadyExecuted: true,
        proposal,
        message: 'Proposal was already executed',
      });
    }

    // Safety Engine check: Recalculate deterministic capacity
    const safeInvestable = Math.max(0, proposal.startingCash - proposal.protectedCash);
    if (safeInvestable !== proposal.investableCash) {
      throw new Error('Capacity invariant violated. Investable cash mismatch.');
    }

    // Calculate fractional allocations (e.g. for $40: 60% = $24 VTI, 30% = $12 BND, 10% = $4 cash)
    const equitiesDollars = (safeInvestable * proposal.allocation.equities) / 100;
    const bondsDollars = (safeInvestable * proposal.allocation.bonds) / 100;
    const accountId = user.alpacaAccountId || `alp_sbx_mock_${Date.now()}`;

    const executedOrders: PortfolioOrder[] = [];

    // Order 1: Equities (VTI)
    if (equitiesDollars > 0) {
      const orderVti = await AlpacaBrokerSandboxService.submitSandboxOrder(accountId, 'VTI', equitiesDollars);
      executedOrders.push({
        id: `ord_${Date.now()}_1`,
        symbol: 'VTI',
        notional: equitiesDollars,
        status: orderVti.status,
        alpacaOrderId: orderVti.id,
        assetClass: 'equities',
      });
    }

    // Order 2: Bonds (BND)
    if (bondsDollars > 0) {
      const orderBnd = await AlpacaBrokerSandboxService.submitSandboxOrder(accountId, 'BND', bondsDollars);
      executedOrders.push({
        id: `ord_${Date.now()}_2`,
        symbol: 'BND',
        notional: bondsDollars,
        status: orderBnd.status,
        alpacaOrderId: orderBnd.id,
        assetClass: 'bonds',
      });
    }

    proposal.status = 'EXECUTED';
    proposal.executedAt = Date.now();
    proposal.orders = executedOrders;
    pennyStore.saveProposal(proposal);

    res.json({
      success: true,
      proposal,
      orders: executedOrders,
      protectedCashPreserved: proposal.protectedCash,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 10. POST /api/photon/webhook (Simulated/Real Photon Webhook)
brokerageRouter.post('/photon/webhook', (req: Request, res: Response) => {
  const { event, senderId, text } = req.body;
  res.json({
    received: true,
    event,
    senderId,
    timestamp: new Date().toISOString(),
  });
});

// 11. POST /api/alpaca/events (Alpaca Broker Webhook)
brokerageRouter.post('/alpaca/events', (req: Request, res: Response) => {
  const { event, account_id, order } = req.body;
  res.json({
    received: true,
    event,
    accountId: account_id,
    orderId: order?.id,
  });
});

// 12. GET /api/audit/timeline
brokerageRouter.get('/audit/timeline', (_req: Request, res: Response) => {
  res.json({
    events: pennyStore.getAuditEvents(),
  });
});

// 13. POST /api/demo/reset
brokerageRouter.post('/demo/reset', (_req: Request, res: Response) => {
  pennyStore.resetStore();
  res.json({ success: true, message: 'Server state and audit events reset.' });
});
