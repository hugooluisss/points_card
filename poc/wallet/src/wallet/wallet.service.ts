import { Injectable } from '@nestjs/common';
import { CardsRepository } from './cards.repository';

@Injectable()
export class WalletService {
  constructor(private readonly cards: CardsRepository) {}

  health() {
    return { status: 'ok' };
  }
}
