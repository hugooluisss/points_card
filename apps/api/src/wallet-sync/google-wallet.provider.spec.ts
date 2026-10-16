import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Clock } from "../ledger/clock";
import { GoogleWalletClient } from "../wallet-pass/google-wallet.client";
import { GoogleWalletProvider } from "./google-wallet.provider";

describe("GoogleWalletProvider", () => {
  let directory: string;
  let provider: GoogleWalletProvider;
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "google-wallet-test-"));
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const keyPath = join(directory, "service-account.json");
    await writeFile(
      keyPath,
      JSON.stringify({
        client_email: "test@example.invalid",
        private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
      }),
    );
    const config = {
      getOrThrow: (key: string) =>
        ({
          GOOGLE_WALLET_ISSUER_ID: "issuer",
          GOOGLE_WALLET_KEY_PATH: keyPath,
        })[key],
    } as never;
    provider = new GoogleWalletProvider(
      new GoogleWalletClient(config, new Clock()),
    );
    fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      });
    global.fetch = fetchMock;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("patches stamp progress and reward availability", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    await provider.updatePass({
      cardCode: "opaque",
      mode: "stamps",
      balance: 5,
      progress: 5,
      goal: 10,
      rewardAvailable: true,
    });
    expect(
      JSON.parse(fetchMock.mock.calls[1][1].body).textModulesData[0].body,
    ).toBe("5 of 10 · Reward available");
  });

  it("patches points balance", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    await provider.updatePass({
      cardCode: "opaque",
      mode: "points",
      balance: 20,
      progress: 20,
      goal: null,
      rewardAvailable: false,
    });
    expect(
      JSON.parse(fetchMock.mock.calls[1][1].body).textModulesData[0].body,
    ).toBe("20");
  });

  it("throws when Google rejects an update", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(
      provider.updatePass({
        cardCode: "opaque",
        mode: "points",
        balance: 20,
        progress: 20,
        goal: null,
        rewardAvailable: false,
      }),
    ).rejects.toThrow("Google Wallet request failed (503)");
  });
});
