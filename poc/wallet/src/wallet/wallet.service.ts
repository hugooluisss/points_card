import { Injectable } from '@nestjs/common';
import { CardsRepository } from './cards.repository';
import { WalletMode } from './wallet.types';
import { GoogleWalletProvider } from './providers/google-wallet.provider';

@Injectable()
export class WalletService {
  constructor(private readonly cards: CardsRepository, private readonly google: GoogleWalletProvider) {}

  health() {
    return { status: 'ok' };
  }

  saveLink(mode: WalletMode, cardId: string) {
    return this.google.issuePass({ cardId, mode, platform: 'google' }).then((url) => ({ url }));
  }

  update(cardId: string, progress: string) {
    return this.google.updatePass(cardId, { progress });
  }
}
