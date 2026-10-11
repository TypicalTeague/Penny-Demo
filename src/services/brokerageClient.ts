export interface KycFormData {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  taxId: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  agreementsSigned: boolean;
}

export interface LinkSessionResponse {
  success: boolean;
  token: string;
  expiresAt: number;
  auth0Config: {
    domain: string;
    clientId: string;
    audience: string;
    isConnectedMode: boolean;
  };
}

export interface BrokerageAccountState {
  accountId: string | null;
  status: string;
  virtualBalance: number;
  buyingPower: number;
  achRelationshipId: string | null;
  transferId: string | null;
  isPresentationSimulation: boolean;
}

export class BrokerageClient {
  private static activeLinkToken: string | null = null;
  private static authToken: string | null = null;

  static setLinkToken(token: string) {
    this.activeLinkToken = token;
  }

  static getLinkToken(): string | null {
    return this.activeLinkToken;
  }

  static setAuthToken(token: string) {
    this.authToken = token;
  }

  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (this.activeLinkToken) {
      headers['x-link-token'] = this.activeLinkToken;
    }
    return headers;
  }

  static async startLinkSession(photonSenderId = 'photon-user-demo-imessage-101'): Promise<LinkSessionResponse> {
    const res = await fetch('/api/auth/link/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photonSenderId }),
    });
    const data = await res.json();
    if (data.token) {
      this.setLinkToken(data.token);
    }
    return data;
  }

  static async completeLinkSession(auth0Token?: string, simulatedSub?: string) {
    const token = this.activeLinkToken;
    const res = await fetch('/api/auth/link/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, auth0Token, simulatedSub }),
    });
    return res.json();
  }

  static async submitKycOnboard(kyc: KycFormData) {
    const res = await fetch('/api/brokerage/onboard', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(kyc),
    });
    return res.json();
  }

  static async connectDemoBank() {
    const res = await fetch('/api/brokerage/connect-demo-bank', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    return res.json();
  }

  static async fundVirtualSandbox(amount = 100) {
    const res = await fetch('/api/brokerage/fund-sandbox', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount }),
    });
    return res.json();
  }

  static async getAccount(): Promise<BrokerageAccountState> {
    const res = await fetch('/api/brokerage/account', {
      headers: this.getHeaders(),
    });
    return res.json();
  }

  static async confirmProposal(proposalId: string, details: {
    startingCash: number;
    protectedCash: number;
    riskLevel: string;
  }) {
    const res = await fetch(`/api/brokerage/proposals/${proposalId}/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(details),
    });
    return res.json();
  }

  static async executeProposal(proposalId: string, details: {
    startingCash: number;
    protectedCash: number;
    riskLevel: string;
  }) {
    const res = await fetch(`/api/brokerage/proposals/${proposalId}/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(details),
    });
    return res.json();
  }

  static async getTimeline() {
    const res = await fetch('/api/audit/timeline');
    return res.json();
  }

  static async resetServer() {
    this.activeLinkToken = null;
    this.authToken = null;
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    return res.json();
  }
}
