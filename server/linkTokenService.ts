import crypto from 'crypto';
import { pennyStore, AccountLinkSession, PennyUser } from './models';

export class LinkTokenService {
  /**
   * Generates a 32-byte cryptographically secure random token,
   * valid for 10 minutes (600,000 ms), tied to photonSenderId.
   */
  static issueLinkToken(photonSenderId: string): { token: string; expiresAt: number } {
    if (!photonSenderId || typeof photonSenderId !== 'string') {
      throw new Error('Invalid photonSenderId provided');
    }
    const session = pennyStore.createLinkSession(photonSenderId);
    return {
      token: session.token,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Validates and single-use consumes the link token,
   * binding the Auth0 subject to the Penny user.
   */
  static completeLinkToken(
    token: string,
    auth0Subject: string,
    metadata?: { email?: string; name?: string }
  ): { success: boolean; user?: PennyUser; error?: string } {
    if (!token || !auth0Subject) {
      return { success: false, error: 'Missing token or auth0Subject' };
    }

    const session = pennyStore.getLinkSession(token);
    if (!session) {
      return { success: false, error: 'Invalid or unknown link token' };
    }

    if (session.consumed) {
      return { success: false, error: 'Link token has already been consumed' };
    }

    if (session.expiresAt < Date.now()) {
      return { success: false, error: 'Link token has expired (10 minute limit)' };
    }

    const linked = pennyStore.consumeLinkSession(token, auth0Subject);
    if (!linked) {
      return { success: false, error: 'Failed to bind identity to session' };
    }

    const user = pennyStore.getOrCreateUserByPhotonSender(session.photonSenderId);
    if (metadata?.email) user.email = metadata.email;
    if (metadata?.name) user.name = metadata.name;
    pennyStore.saveUser(user);

    pennyStore.addAuditEvent(
      'AUTH0_VERIFIED',
      `Auth0 identity verified (${auth0Subject.substring(0, 14)}...) and linked to iMessage user`,
      { auth0Subject, photonSenderId: session.photonSenderId }
    );

    return { success: true, user };
  }
}
