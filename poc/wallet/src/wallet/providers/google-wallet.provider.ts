import { WalletProvider } from '../wallet.types';

export class GoogleWalletProvider implements WalletProvider {
  async issuePass(): Promise<void> { throw new Error('Google Wallet issuePass not implemented'); }
  async updatePass(): Promise<void> { throw new Error('Google Wallet updatePass not implemented'); }
  async notify(): Promise<void> { throw new Error('Google Wallet notify not implemented'); }
}
