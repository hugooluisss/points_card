export type WalletMode = 'stamps' | 'points' | 'club';
export type WalletPlatform = 'google' | 'apple';

export interface WalletCard {
  cardId: string;
  mode: WalletMode;
  platform: WalletPlatform;
}

export interface WalletProvider {
  issuePass(card: WalletCard): Promise<void>;
  updatePass(cardId: string, patch: Partial<WalletCard>): Promise<void>;
  notify(cardId: string, message: string): Promise<void>;
}
