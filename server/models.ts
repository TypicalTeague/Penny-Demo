import crypto from 'crypto';

export interface PennyUser {
  id: string;
  photonSenderId: string;
  auth0Subject: string | null;
  email?: string | null;
  name?: string | null;
  alpacaAccountId: string | null;
  alpacaAccountStatus: 'SUBMITTED' | 'APPROVAL_PENDING' | 'ACTIVE' | 'REJECTED' | null;
  onboardingStatus: 'UNVERIFIED' | 'AUTH0_VERIFIED' | 'BROKERAGE_ONBOARDED' | 'FUNDED' | 'ACTIVE';
  achRelationshipId: string | null;
  transferId: string | null;
  virtualBalance: number;
  buyingPower: number;
  currentMandateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountLinkSession {
  token: string;
  photonSenderId: string;
  createdAt: number;
  expiresAt: number; // typically 10 minutes (600,000 ms)
  consumed: boolean;
  consumedAt?: number;
  auth0Subject?: string;
}

export interface PortfolioOrder {
  id: string;
  symbol: string;
  notional: number; // e.g. $24.00 into VTI
  status: 'pending' | 'accepted' | 'filled' | 'failed';
  alpacaOrderId?: string;
  assetClass: 'equities' | 'bonds' | 'cash';
}

export interface Proposal {
  id: string;
  userId: string;
  startingCash: number;
  protectedCash: number;
  investableCash: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  allocation: {
    equities: number;
    bonds: number;
    cash: number;
  };
  status: 'PROPOSED' | 'CONFIRMED' | 'EXECUTED' | 'EXPIRED';
  orders?: PortfolioOrder[];
  createdAt: number;
  confirmedAt?: number;
  executedAt?: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  type:
    | 'AUTH0_VERIFIED'
    | 'ALPACA_ACCOUNT_CREATED'
    | 'ACH_RELATIONSHIP_CREATED'
    | 'VIRTUAL_TRANSFER_COMPLETED'
    | 'PROPOSAL_CONFIRMED'
    | 'SANDBOX_ORDERS_SUBMITTED';
  description: string;
  details?: Record<string, unknown>;
  isPresentationSimulation: boolean;
}

/**
 * Server-authoritative in-memory state repository
 */
class PennyStore {
  private users: Map<string, PennyUser> = new Map();
  private usersByAuth0Sub: Map<string, string> = new Map(); // sub -> userId
  private usersByPhotonSender: Map<string, string> = new Map(); // senderId -> userId
  private linkSessions: Map<string, AccountLinkSession> = new Map(); // token -> session
  private proposals: Map<string, Proposal> = new Map();
  private auditEvents: EventLogEntry[] = [];

  constructor() {
    this.seedDefaultDemoUser();
  }

  private seedDefaultDemoUser(): void {
    const demoPhotonSenderId = 'photon-user-demo-imessage-101';
    const demoUser: PennyUser = {
      id: 'usr_penny_demo_01',
      photonSenderId: demoPhotonSenderId,
      auth0Subject: null,
      alpacaAccountId: null,
      alpacaAccountStatus: null,
      onboardingStatus: 'UNVERIFIED',
      achRelationshipId: null,
      transferId: null,
      virtualBalance: 0,
      buyingPower: 0,
      currentMandateId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(demoUser.id, demoUser);
    this.usersByPhotonSender.set(demoPhotonSenderId, demoUser.id);
  }

  getOrCreateUserByPhotonSender(photonSenderId: string): PennyUser {
    const existingId = this.usersByPhotonSender.get(photonSenderId);
    if (existingId && this.users.has(existingId)) {
      return this.users.get(existingId)!;
    }

    const newUser: PennyUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      photonSenderId,
      auth0Subject: null,
      alpacaAccountId: null,
      alpacaAccountStatus: null,
      onboardingStatus: 'UNVERIFIED',
      achRelationshipId: null,
      transferId: null,
      virtualBalance: 0,
      buyingPower: 0,
      currentMandateId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(newUser.id, newUser);
    this.usersByPhotonSender.set(photonSenderId, newUser.id);
    return newUser;
  }

  getUserById(userId: string): PennyUser | undefined {
    return this.users.get(userId);
  }

  getUserByAuth0Sub(sub: string): PennyUser | undefined {
    const userId = this.usersByAuth0Sub.get(sub);
    return userId ? this.users.get(userId) : undefined;
  }

  saveUser(user: PennyUser): void {
    user.updatedAt = new Date().toISOString();
    this.users.set(user.id, user);
    if (user.auth0Subject) {
      this.usersByAuth0Sub.set(user.auth0Subject, user.id);
    }
    this.usersByPhotonSender.set(user.photonSenderId, user.id);
  }

  // Link Sessions
  createLinkSession(photonSenderId: string, ttlMs = 10 * 60 * 1000): AccountLinkSession {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const session: AccountLinkSession = {
      token,
      photonSenderId,
      createdAt: now,
      expiresAt: now + ttlMs,
      consumed: false,
    };
    this.linkSessions.set(token, session);
    return session;
  }

  getLinkSession(token: string): AccountLinkSession | undefined {
    return this.linkSessions.get(token);
  }

  consumeLinkSession(token: string, auth0Subject: string): boolean {
    const session = this.linkSessions.get(token);
    if (!session) return false;
    if (session.consumed || session.expiresAt < Date.now()) return false;

    session.consumed = true;
    session.consumedAt = Date.now();
    session.auth0Subject = auth0Subject;

    // Link user
    const user = this.getOrCreateUserByPhotonSender(session.photonSenderId);
    user.auth0Subject = auth0Subject;
    user.onboardingStatus = 'AUTH0_VERIFIED';
    this.saveUser(user);

    return true;
  }

  // Proposals
  saveProposal(proposal: Proposal): void {
    this.proposals.set(proposal.id, proposal);
  }

  getProposal(proposalId: string): Proposal | undefined {
    return this.proposals.get(proposalId);
  }

  // Audit Events for Hackathon Judges
  addAuditEvent(
    type: EventLogEntry['type'],
    description: string,
    details?: Record<string, unknown>,
    isPresentationSimulation = false
  ): EventLogEntry {
    const entry: EventLogEntry = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      type,
      description,
      details,
      isPresentationSimulation,
    };
    this.auditEvents.unshift(entry); // newest first
    return entry;
  }

  getAuditEvents(): EventLogEntry[] {
    return [...this.auditEvents];
  }

  resetStore(): void {
    this.users.clear();
    this.usersByAuth0Sub.clear();
    this.usersByPhotonSender.clear();
    this.linkSessions.clear();
    this.proposals.clear();
    this.auditEvents = [];
    this.seedDefaultDemoUser();
  }
}

export const pennyStore = new PennyStore();
