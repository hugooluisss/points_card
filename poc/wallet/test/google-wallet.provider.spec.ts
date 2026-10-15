import { generateKeyPairSync } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GoogleWalletProvider } from '../src/wallet/providers/google-wallet.provider';

describe('GoogleWalletProvider', () => {
  it('uses the opaque card id as barcode, signs a save payload, and tolerates an existing class', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const keyPath = join(tmpdir(), `wallet-key-${Date.now()}.json`);
    await writeFile(keyPath, JSON.stringify({ client_email: 'wallet@example.test', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) }));
    process.env.GOOGLE_WALLET_ISSUER_ID = 'issuer123';
    process.env.GOOGLE_WALLET_KEY_PATH = keyPath;
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      if (String(input).includes('oauth2.googleapis.com')) return new Response(JSON.stringify({ access_token: 'token', expires_in: 3600 }), { status: 200 });
      if (String(input).endsWith('/genericClass')) return new Response('{}', { status: 409 });
      if (String(input).endsWith('/genericObject')) return new Response('{}', { status: 409 });
      return new Response('{}', { status: 200 });
    });
    try {
      const provider = new GoogleWalletProvider();
      const url = await provider.issuePass({ cardId: 'opaque-abc', mode: 'stamps', platform: 'google', progress: '2 of 8' });
      const create = fetchMock.mock.calls.find(([input]) => String(input).endsWith('/genericObject'))!;
      const object = JSON.parse(String(create[1]?.body));
      expect(object.barcode.value).toBe('opaque-abc');
      const [, payload] = url.split('/').pop()!.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
      expect(decoded).toMatchObject({ iss: 'wallet@example.test', aud: 'google', typ: 'savetowallet', payload: { genericObjects: [{ id: 'issuer123.opaque-abc', classId: 'issuer123.stamps' }] } });
      expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/genericClass'))).toBe(true);
      expect(fetchMock.mock.calls.some(([input]) => String(input).endsWith('/genericObject'))).toBe(true);
    } finally {
      fetchMock.mockRestore();
      delete process.env.GOOGLE_WALLET_ISSUER_ID;
      delete process.env.GOOGLE_WALLET_KEY_PATH;
    }
  });
});
