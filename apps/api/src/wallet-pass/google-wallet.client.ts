import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Clock } from "../ledger/clock";

const API = "https://walletobjects.googleapis.com/walletobjects/v1";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";
type Credentials = { client_email: string; private_key: string };

@Injectable()
export class GoogleWalletClient {
  private credentialsPromise?: Promise<Credentials>;
  private token?: { value: string; expiresAt: number };

  constructor(
    private readonly config: ConfigService,
    private readonly clock: Clock,
  ) {}

  get issuerId() {
    return this.config.getOrThrow<string>("GOOGLE_WALLET_ISSUER_ID");
  }

  id(value: string) {
    return `${this.issuerId}.${value}`;
  }

  private credentials() {
    return (this.credentialsPromise ??= readFile(
      this.config.getOrThrow<string>("GOOGLE_WALLET_KEY_PATH"),
      "utf8",
    ).then((value) => JSON.parse(value) as Credentials));
  }

  private signJwt(claims: Record<string, unknown>, credentials: Credentials) {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode(claims)}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsigned);
    return `${unsigned}.${signer.sign(credentials.private_key, "base64url")}`;
  }

  private async accessToken() {
    if (
      this.token &&
      this.token.expiresAt - 60_000 > this.clock.now().getTime()
    )
      return this.token.value;
    const now = Math.floor(this.clock.now().getTime() / 1000);
    const credentials = await this.credentials();
    const assertion = this.signJwt(
      {
        iss: credentials.client_email,
        scope: SCOPE,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      },
      credentials,
    );
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    if (!response.ok)
      throw new Error(`Google OAuth failed (${response.status})`);
    const result = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.token = {
      value: result.access_token,
      expiresAt: this.clock.now().getTime() + result.expires_in * 1000,
    };
    return result.access_token;
  }

  async request(
    url: string,
    method: string,
    body?: unknown,
    tolerateConflict = false,
  ) {
    const response = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${await this.accessToken()}`,
        "content-type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (tolerateConflict && response.status === 409) return;
    if (!response.ok)
      throw new Error(`Google Wallet request failed (${response.status})`);
    return response;
  }

  async saveUrl(object: unknown) {
    const credentials = await this.credentials();
    const now = Math.floor(this.clock.now().getTime() / 1000);
    const jwt = this.signJwt(
      {
        iss: credentials.client_email,
        aud: "google",
        typ: "savetowallet",
        iat: now,
        payload: { genericObjects: [object] },
      },
      credentials,
    );
    return `https://pay.google.com/gp/v/save/${jwt}`;
  }

  get apiUrl() {
    return API;
  }
}
