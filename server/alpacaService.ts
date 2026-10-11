import { pennyStore } from './models';

export interface KycOnboardingPayload {
  givenName: string;
  familyName: string;
  dateOfBirth: string; // YYYY-MM-DD
  taxId: string; // e.g. 000-12-3456 (sandbox fictional SSN)
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  agreementsSigned: boolean;
}

export interface AlpacaAccountResponse {
  id: string;
  accountNumber: string;
  status: 'SUBMITTED' | 'APPROVAL_PENDING' | 'ACTIVE' | 'REJECTED';
  currency: string;
  cash: number;
  buyingPower: number;
  isPresentationSimulation: boolean;
}

export interface AlpacaAchRelationshipResponse {
  id: string;
  accountId: string;
  bankAccountType: string;
  bankName: string;
  status: string;
  isPresentationSimulation: boolean;
}

export interface AlpacaTransferResponse {
  id: string;
  accountId: string;
  amount: number;
  status: 'PENDING' | 'QUEUED' | 'COMPLETE' | 'APPROVED';
  direction: 'INCOMING';
  isPresentationSimulation: boolean;
}

export interface AlpacaOrderResponse {
  id: string;
  symbol: string;
  notional: number;
  side: 'buy';
  type: 'market';
  timeInForce: 'day';
  status: 'accepted' | 'filled' | 'pending';
  filledAvgPrice?: number;
  isPresentationSimulation: boolean;
}

export class AlpacaBrokerSandboxService {
  private static get baseUrl(): string {
    const url = process.env.ALPACA_BROKER_BASE_URL || 'https://broker-api.sandbox.alpaca.markets';
    // Hard safety guard against production
    if (url.includes('api.alpaca.markets') && !url.includes('sandbox')) {
      throw new Error(
        'FATAL SAFETY GUARD TRIGGERED: Production Alpaca URL detected. Penny only allows broker-api.sandbox.alpaca.markets.'
      );
    }
    return url.replace(/\/+$/, '');
  }

  private static get apiKey(): string {
    return process.env.ALPACA_BROKER_API_KEY || '';
  }

  private static get apiSecret(): string {
    return process.env.ALPACA_BROKER_API_SECRET || '';
  }

  /**
   * Checks if live Alpaca sandbox credentials are provided.
   */
  public static isConnectedMode(): boolean {
    return Boolean(this.apiKey && this.apiSecret);
  }

  /**
   * Creates an Alpaca sandbox brokerage account for a user.
   */
  public static async createAccount(kyc: KycOnboardingPayload): Promise<AlpacaAccountResponse> {
    if (!kyc.agreementsSigned) {
      throw new Error('Mandatory Alpaca Customer Agreement and Terms must be accepted.');
    }

    if (!this.isConnectedMode()) {
      // Presentation Fallback Mode (clearly marked and logged)
      const simulatedId = `alp_sbx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      pennyStore.addAuditEvent(
        'ALPACA_ACCOUNT_CREATED',
        `Alpaca sandbox account created (ID: ${simulatedId}) [Presentation Simulation]`,
        { kycName: `${kyc.givenName} ${kyc.familyName}`, status: 'ACTIVE' },
        true
      );
      return {
        id: simulatedId,
        accountNumber: `SBX${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'ACTIVE',
        currency: 'USD',
        cash: 0,
        buyingPower: 0,
        isPresentationSimulation: true,
      };
    }

    // Connected Sandbox Mode: Real Alpaca Broker API sandbox call
    const authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
    const payload = {
      contact: {
        email_address: 'penny-sandbox-user@example.com',
        phone_number: '555-555-5555',
        street_address: [kyc.streetAddress || '100 Sandbox Way'],
        city: kyc.city || 'San Francisco',
        state: kyc.state || 'CA',
        postal_code: kyc.postalCode || '94105',
        country: kyc.country || 'USA',
      },
      identity: {
        given_name: kyc.givenName,
        family_name: kyc.familyName,
        date_of_birth: kyc.dateOfBirth,
        tax_id: kyc.taxId,
        tax_id_type: 'USA_SSN',
        country_of_citizenship: 'USA',
        country_of_birth: 'USA',
        country_of_tax_residence: 'USA',
        funding_source: ['employment_income'],
      },
      disclosures: {
        is_control_person: false,
        is_affiliated_exchange_or_finra: false,
        is_politically_exposed: false,
        immediate_family_exposed: false,
      },
      agreements: [
        {
          agreement: 'customer_agreement',
          signed_at: new Date().toISOString(),
          ip_address: '127.0.0.1',
        },
      ],
    };

    const res = await fetch(`${this.baseUrl}/v1/accounts`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Alpaca Broker API sandbox account creation response:', res.status, errText);
      // If Alpaca sandbox returns an error or permission limitation, fail safely
      throw new Error(`Alpaca Broker API error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    pennyStore.addAuditEvent(
      'ALPACA_ACCOUNT_CREATED',
      `Genuine Alpaca Broker API sandbox account created (${data.id})`,
      { accountNumber: data.account_number, status: data.status },
      false
    );

    return {
      id: data.id,
      accountNumber: data.account_number || 'SBX-LIVE',
      status: data.status === 'ACTIVE' ? 'ACTIVE' : 'APPROVAL_PENDING',
      currency: data.currency || 'USD',
      cash: 0,
      buyingPower: 0,
      isPresentationSimulation: false,
    };
  }

  /**
   * Connects a virtual sandbox demo bank via test ACH relationship.
   */
  public static async connectDemoBank(accountId: string): Promise<AlpacaAchRelationshipResponse> {
    if (!this.isConnectedMode()) {
      const simulatedAchId = `ach_sbx_${Date.now()}`;
      pennyStore.addAuditEvent(
        'ACH_RELATIONSHIP_CREATED',
        `Sandbox ACH relationship created with Demo Chase Bank [Presentation Simulation]`,
        { accountId, routingNumber: '021000021' },
        true
      );
      return {
        id: simulatedAchId,
        accountId,
        bankAccountType: 'CHECKING',
        bankName: 'Penny Virtual Sandbox Bank',
        status: 'APPROVED',
        isPresentationSimulation: true,
      };
    }

    const authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
    const payload = {
      bank_account_type: 'CHECKING',
      bank_account_number: '123456789',
      bank_routing_number: '021000021', // Well-known Fed test routing
      nickname: 'Demo Bank',
    };

    const res = await fetch(`${this.baseUrl}/v1/accounts/${accountId}/ach_relationships`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Alpaca sandbox ACH error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    pennyStore.addAuditEvent(
      'ACH_RELATIONSHIP_CREATED',
      `Genuine Alpaca sandbox ACH relationship connected (${data.id})`,
      { bankName: data.bank_name || 'Demo Bank' },
      false
    );

    return {
      id: data.id,
      accountId,
      bankAccountType: data.bank_account_type,
      bankName: data.bank_name || 'Demo Bank',
      status: data.status || 'APPROVED',
      isPresentationSimulation: false,
    };
  }

  /**
   * Executes a virtual $100 incoming transfer into the sandbox account.
   */
  public static async fundVirtualSandbox(
    accountId: string,
    relationshipId: string,
    amount = 100
  ): Promise<AlpacaTransferResponse> {
    if (!this.isConnectedMode()) {
      const simulatedTransferId = `trf_sbx_${Date.now()}`;
      pennyStore.addAuditEvent(
        'VIRTUAL_TRANSFER_COMPLETED',
        `Virtual sandbox incoming transfer of $${amount}.00 completed [Presentation Simulation]`,
        { amount, accountId },
        true
      );
      return {
        id: simulatedTransferId,
        accountId,
        amount,
        status: 'COMPLETE',
        direction: 'INCOMING',
        isPresentationSimulation: true,
      };
    }

    const authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
    const payload = {
      transfer_type: 'ach',
      relationship_id: relationshipId,
      amount: String(amount),
      direction: 'INCOMING',
    };

    const res = await fetch(`${this.baseUrl}/v1/accounts/${accountId}/transfers`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Alpaca sandbox transfer error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    pennyStore.addAuditEvent(
      'VIRTUAL_TRANSFER_COMPLETED',
      `Genuine Alpaca sandbox virtual transfer of $${amount}.00 executed (${data.id})`,
      { status: data.status },
      false
    );

    return {
      id: data.id,
      accountId,
      amount,
      status: 'COMPLETE',
      direction: 'INCOMING',
      isPresentationSimulation: false,
    };
  }

  /**
   * Submits fractional / notional paper market orders to Alpaca sandbox.
   * e.g., $24.00 into VTI (equities), $12.00 into BND (bonds).
   */
  public static async submitSandboxOrder(
    accountId: string,
    symbol: string,
    notionalDollars: number
  ): Promise<AlpacaOrderResponse> {
    if (!this.isConnectedMode()) {
      const orderId = `ord_sbx_${Date.now()}_${symbol}`;
      pennyStore.addAuditEvent(
        'SANDBOX_ORDERS_SUBMITTED',
        `Sandbox fractional order placed: $${notionalDollars.toFixed(2)} in ${symbol} [Presentation Simulation]`,
        { symbol, notional: notionalDollars, status: 'filled' },
        true
      );
      return {
        id: orderId,
        symbol,
        notional: notionalDollars,
        side: 'buy',
        type: 'market',
        timeInForce: 'day',
        status: 'filled',
        filledAvgPrice: symbol === 'VTI' ? 275.4 : 72.15,
        isPresentationSimulation: true,
      };
    }

    const authHeader = `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`;
    const payload = {
      symbol,
      notional: notionalDollars.toFixed(2),
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    };

    const res = await fetch(`${this.baseUrl}/v1/accounts/${accountId}/orders`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Alpaca sandbox order error for ${symbol} (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    pennyStore.addAuditEvent(
      'SANDBOX_ORDERS_SUBMITTED',
      `Genuine Alpaca sandbox order submitted: $${notionalDollars.toFixed(2)} in ${symbol} (${data.id})`,
      { symbol, status: data.status },
      false
    );

    return {
      id: data.id,
      symbol,
      notional: notionalDollars,
      side: 'buy',
      type: 'market',
      timeInForce: 'day',
      status: data.status || 'accepted',
      isPresentationSimulation: false,
    };
  }
}
