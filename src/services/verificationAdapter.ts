/**
 * Replaceable verification adapter abstraction.
 * Currently provides simulated biometric/identity authentication for the prototype.
 * Can be swapped for an actual Auth0 / Passkey / Biometric client in production Photon Spectrum integration.
 */
export interface VerificationProgressCallback {
  (stage: 'in_progress' | 'verified', label: string): void;
}

export interface VerificationAdapter {
  verifyUserIdentity(onProgress: VerificationProgressCallback): Promise<boolean>;
}

export class DemoVerificationAdapter implements VerificationAdapter {
  async verifyUserIdentity(onProgress: VerificationProgressCallback): Promise<boolean> {
    // Stage 1: Initiating verification
    onProgress('in_progress', 'Verifying that it’s really you…');

    // Realistic verification latency for the demo
    await new Promise((resolve) => setTimeout(resolve, 900));

    // Stage 2: Verified completion
    onProgress('verified', 'Verified ✓');

    await new Promise((resolve) => setTimeout(resolve, 350));
    return true;
  }
}

export const defaultVerificationAdapter: VerificationAdapter = new DemoVerificationAdapter();
