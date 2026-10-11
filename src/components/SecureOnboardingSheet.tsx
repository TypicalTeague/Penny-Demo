import React, { useState } from 'react';
import { BrokerageClient, KycFormData } from '../services/brokerageClient';
import { ShieldCheck, Lock, Building, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';

interface SecureOnboardingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const SecureOnboardingSheet: React.FC<SecureOnboardingSheetProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState<'auth0' | 'kyc' | 'funding' | 'done'>('auth0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auth0Success, setAuth0Success] = useState(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState(true);

  // Fictional sandbox test data
  const [formData, setFormData] = useState<KycFormData>({
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
  });

  if (!isOpen) return null;

  // Step 1: Launch Auth0 Verification
  const handleAuth0Login = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Issue one-time link token from Penny backend
      const linkSession = await BrokerageClient.startLinkSession();
      setIsSimulatedMode(!linkSession.auth0Config.isConnectedMode);

      // Simulate realistic redirect-based Universal Login handshake latency
      await new Promise((r) => setTimeout(r, 800));

      // 2. Complete server-side verification using token
      const completeRes = await BrokerageClient.completeLinkSession(
        undefined,
        `auth0|demo_${Math.random().toString(36).substring(2, 7)}`
      );

      if (!completeRes.success) {
        throw new Error(completeRes.error || 'Auth0 token verification failed');
      }

      setAuth0Success(true);
      await new Promise((r) => setTimeout(r, 650));
      setStep('kyc');
    } catch (err: any) {
      setError(err.message || 'Auth0 authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit Alpaca Sandbox KYC Onboarding
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreementsSigned) {
      setError('You must accept the Alpaca Customer Agreement to open a sandbox account.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await BrokerageClient.submitKycOnboard(formData);
      if (!res.success) {
        throw new Error(res.error || 'Failed to create Alpaca sandbox account');
      }

      await new Promise((r) => setTimeout(r, 700));
      setStep('funding');
    } catch (err: any) {
      setError(err.message || 'Brokerage onboarding failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Connect Demo Bank & Virtual Sandbox Funding ($100)
  const handleConnectBankAndFund = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Connect ACH relationship with test data
      const achRes = await BrokerageClient.connectDemoBank();
      if (!achRes.success) {
        throw new Error(achRes.error || 'Failed to create sandbox ACH relationship');
      }

      // 2. Virtual incoming transfer of $100
      const fundRes = await BrokerageClient.fundVirtualSandbox(100);
      if (!fundRes.success) {
        throw new Error(fundRes.error || 'Failed to fund sandbox account');
      }

      setStep('done');
      setTimeout(() => {
        onComplete();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Funding error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center select-none animate-fade-in"
    >
      {/* Slide-Up System Sheet container */}
      <div className="w-full bg-[#f9f9fb] rounded-t-[32px] max-h-[90%] flex flex-col shadow-2xl border-t border-black/10 animate-scale-up overflow-hidden">
        {/* Grab handle */}
        <div className="pt-2 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 bg-zinc-300 rounded-full" />
        </div>

        {/* Top Sheet Header */}
        <div className="px-5 py-2.5 flex items-center justify-between border-b border-black/5 shrink-0 bg-white">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[13px] font-semibold text-black tracking-tight">
                  Penny Secure Verification
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md font-medium">
                  Alpaca Sandbox
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5">
                Private credential sheet · Encrypted off-chat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Banner if presentation mode */}
        {isSimulatedMode && (
          <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-1.5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1.5 text-amber-800 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>Presentation Simulation Mode</span>
            </div>
            <span className="text-[9px] text-amber-600 uppercase tracking-wider font-semibold">
              Sandbox Safe
            </span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-[12px] text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Sheet Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-[13px]">
          {/* STEP 1: AUTH0 IDENTITY */}
          {step === 'auth0' && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-[16px] font-semibold text-black tracking-tight">
                  Verify with Auth0 Universal Login
                </h3>
                <p className="text-[12px] text-zinc-500 mt-1 max-w-[270px]">
                  Penny uses Auth0 Authorization Code Flow with PKCE to securely link your iMessage identity without ever exposing secrets to chat.
                </p>
              </div>

              <div className="w-full bg-white rounded-2xl p-3 border border-black/5 text-left space-y-2 text-[12px]">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Protocol</span>
                  <span className="font-mono text-zinc-900">OAuth 2.0 / PKCE</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Identity Key</span>
                  <span className="font-mono text-zinc-900">Auth0 sub (opaque)</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Secret Storage</span>
                  <span className="font-mono text-emerald-600">Server-Side Only</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleAuth0Login}
                className="w-full min-h-[46px] rounded-xl bg-black text-white font-medium text-[14px] flex items-center justify-center space-x-2 active:scale-98 transition-all hover:bg-zinc-800 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <span>Authenticating with Auth0…</span>
                ) : auth0Success ? (
                  <span className="flex items-center text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Identity verified with Auth0 ✓
                  </span>
                ) : (
                  <>
                    <span>Continue with Auth0</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: ALPACA BROKERAGE ONBOARDING */}
          {step === 'kyc' && (
            <form onSubmit={handleKycSubmit} className="space-y-3">
              <div className="text-left mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Step 2 of 3 · Brokerage
                </span>
                <h3 className="text-[15px] font-semibold text-black tracking-tight">
                  Alpaca Sandbox Account Opening
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Penny backend is an Alpaca Broker API partner. Pre-filled with fictional sandbox test data:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-medium">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.givenName}
                    onChange={(e) => setFormData({ ...formData, givenName: e.target.value })}
                    className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[12px] text-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-medium">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.familyName}
                    onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                    className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[12px] text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-medium">Date of Birth</label>
                  <input
                    type="text"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[12px] text-black font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-medium">Mock Tax ID / SSN</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[12px] text-black font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-medium">Address</label>
                <input
                  type="text"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="w-full bg-white border border-black/10 rounded-lg px-2.5 py-1.5 text-[12px] text-black"
                />
              </div>

              {/* Mandatory Disclosures */}
              <div className="bg-white rounded-xl p-2.5 border border-black/5 text-[11px] space-y-1.5">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreementsSigned}
                    onChange={(e) => setFormData({ ...formData, agreementsSigned: e.target.checked })}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-zinc-600 leading-snug">
                    I accept the Alpaca Brokerage Customer Agreement and acknowledge this is a paper sandbox account.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px] rounded-xl bg-[#007AFF] text-white font-medium text-[13px] flex items-center justify-center space-x-1.5 active:scale-98 transition-all hover:bg-blue-600 disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isLoading ? (
                  <span>Opening Alpaca Sandbox Account…</span>
                ) : (
                  <>
                    <span>Create Sandbox Relationship</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: VIRTUAL FUNDING */}
          {step === 'funding' && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                <Building className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-[16px] font-semibold text-black tracking-tight">
                  Connect Demo Bank
                </h3>
                <p className="text-[12px] text-zinc-500 mt-0.5 max-w-[270px]">
                  Establish an incoming virtual ACH relationship with Alpaca Sandbox to grant $100 paper buying power.
                </p>
              </div>

              <div className="w-full bg-white rounded-xl p-3 border border-black/5 text-left text-[12px] space-y-1.5">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Virtual Bank</span>
                  <span className="font-medium text-black">Demo Checking (••• 6789)</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Routing Number</span>
                  <span className="font-mono text-zinc-700">021000021 (Sandbox Fed)</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 border-t border-black/5 pt-1.5">
                  <span className="font-medium text-black">Simulated Transfer</span>
                  <span className="font-bold text-emerald-600 tabular-nums font-mono">+$100.00 USD</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleConnectBankAndFund}
                className="w-full min-h-[46px] rounded-xl bg-emerald-600 text-white font-medium text-[14px] flex items-center justify-center space-x-1.5 active:scale-98 transition-all hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <span>Processing Virtual ACH…</span>
                ) : (
                  <span>Connect Demo Bank &amp; Add $100</span>
                )}
              </button>
            </div>
          )}

          {/* STEP 4: SUCCESS & RETURN */}
          {step === 'done' && (
            <div className="flex flex-col items-center text-center space-y-3 py-6 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <h3 className="text-[17px] font-bold text-black tracking-tight">
                Demo Bank Connected ✓
              </h3>
              <p className="text-[13px] text-zinc-600 max-w-[260px] leading-snug">
                $100 in virtual funds is ready for paper investing. Returning to Penny conversation…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
