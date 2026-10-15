import { WalletProvider } from '../wallet.types';

export class AppleWalletProvider implements WalletProvider {
  async issuePass(): Promise<string> { throw new Error('Apple Wallet issuePass not implemented'); }
  async updatePass(): Promise<void> { throw new Error('Apple Wallet updatePass not implemented'); }
  async notify(): Promise<void> { throw new Error('Apple Wallet notify not implemented'); }
}
