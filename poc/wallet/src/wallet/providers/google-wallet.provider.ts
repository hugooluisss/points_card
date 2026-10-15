import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import { WalletCard, WalletMode, WalletProvider } from '../wallet.types';

const API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

@Injectable()
export class GoogleWalletProvider implements WalletProvider {
  private token?: { value: string; expiresAt: number };

  private async credentials() {
    const keyPath = process.env.GOOGLE_WALLET_KEY_PATH;
    if (!keyPath || !process.env.GOOGLE_WALLET_ISSUER_ID) throw new Error('Google Wallet environment is not configured');
    return JSON.parse(await readFile(keyPath, 'utf8')) as { client_email: string; private_key: string };
  }

  private id(value: string): string {
    return `${process.env.GOOGLE_WALLET_ISSUER_ID}.${value}`;
  }

  private async signJwt(claims: Record<string, unknown>): Promise<string> {
    const credentials = await this.credentials();
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode(claims)}`;
    const signer = createSign('RSA-SHA256');
    signer.update(unsigned);
    return `${unsigned}.${signer.sign(credentials.private_key, 'base64url')}`;
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt - 60_000 > Date.now()) return this.token.value;
    const now = Math.floor(Date.now() / 1000);
    const credentials = await this.credentials();
    const assertion = await this.signJwt({ iss: credentials.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
    if (!response.ok) throw new Error(`Google OAuth failed (${response.status})`);
    const result = await response.json() as { access_token: string; expires_in: number };
    this.token = { value: result.access_token, expiresAt: Date.now() + result.expires_in * 1000 };
    return result.access_token;
  }

  private async request(url: string, method: string, body?: unknown, tolerateConflict = false) {
    const response = await fetch(url, { method, headers: { authorization: `Bearer ${await this.accessToken()}`, 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (tolerateConflict && response.status === 409) return;
    if (!response.ok) throw new Error(`Google Wallet request failed (${response.status})`);
    return response;
  }

  private progress(card: WalletCard): string {
    return card.progress ?? (card.mode === 'club' ? 'Club member' : card.mode === 'points' ? '0' : '0 of 0');
  }

  private async ensureClass(mode: WalletMode): Promise<void> {
    const id = this.id(mode);
    await this.request(`${API}/genericClass`, 'POST', { id }, true);
  }

  private objectPayload(card: WalletCard) {
    return { id: this.id(card.cardId), classId: this.id(card.mode), state: 'ACTIVE', barcode: { type: 'QR_CODE', value: card.cardId }, cardTitle: { defaultValue: { language: 'en-US', value: card.mode === 'club' ? 'Club' : card.mode === 'points' ? 'Points' : 'Stamps' } }, header: { defaultValue: { language: 'en-US', value: card.mode === 'club' ? 'Club membership' : card.mode === 'points' ? 'Points balance' : 'Stamp progress' } }, textModulesData: [{ id: 'progress', header: 'Progress', body: this.progress(card) }] };
  }

  private async saveUrl(card: WalletCard): Promise<string> {
    const credentials = await this.credentials();
    const now = Math.floor(Date.now() / 1000);
    const jwt = await this.signJwt({ iss: credentials.client_email, aud: 'google', typ: 'savetowallet', iat: now, payload: { genericObjects: [this.objectPayload(card)] } });
    return `https://pay.google.com/gp/v/save/${jwt}`;
  }

  async issuePass(card: WalletCard): Promise<string> {
    await this.ensureClass(card.mode);
    await this.request(`${API}/genericObject`, 'POST', this.objectPayload(card), true);
    return this.saveUrl(card);
  }

  async updatePass(cardId: string, patch: Partial<WalletCard>): Promise<void> {
    const body = patch.progress === undefined ? {} : { textModulesData: [{ id: 'progress', header: 'Progress', body: patch.progress }] };
    await this.request(`${API}/genericObject/${this.id(cardId)}`, 'PATCH', body);
  }

  async notify(cardId: string, message: string): Promise<void> {
    await this.request(`${API}/genericObject/${this.id(cardId)}/addMessage`, 'POST', { message: { header: 'Update', body: message, messageType: 'TEXT_AND_NOTIFY' } });
  }
}
