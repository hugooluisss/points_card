import { generateKeyPairSync } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Clock } from "../ledger/clock";
import { GoogleWalletClient } from "./google-wallet.client";
import { GoogleWalletPassProvider } from "./google-wallet-pass.provider";

describe("GoogleWalletPassProvider", () => {
  let directory: string;
  let provider: GoogleWalletPassProvider;
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
    provider = new GoogleWalletPassProvider(
      new GoogleWalletClient(config, new Clock()),
    );
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("creates a pass whose QR contains only cardCode and tolerates class/object conflicts", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 409 })
      .mockResolvedValueOnce({ ok: false, status: 409 });
    const result = await provider.issue("business", "account", "opaque-code", {
      mode: "stamps",
      balance: 2,
      progress: 2,
      goal: 10,
      rewardAvailable: false,
    });
    expect(result).toEqual([
      {
        platform: "google",
        saveUrl: expect.stringContaining("https://pay.google.com/gp/v/save/"),
      },
    ]);
    const object = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(object.barcode.value).toBe("opaque-code");
    expect(object.barcode.value).not.toContain("issuer");
    expect(object.textModulesData[0].body).toBe("2 of 10");
  });

  it("shows points balance", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: "token", expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    await provider.issue("business", "account", "opaque-code", {
      mode: "points",
      balance: 2,
      progress: 2,
      goal: null,
      rewardAvailable: false,
    });
    expect(
      JSON.parse(fetchMock.mock.calls[2][1].body).textModulesData[0].body,
    ).toBe("2");
  });
});
