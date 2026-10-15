import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletMode } from './wallet.types';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get('health')
  health() {
    return this.wallet.health();
  }

  @Get('google/save-link')
  saveLink(@Query('mode') mode: WalletMode, @Query('cardId') cardId: string) {
    return this.wallet.saveLink(mode, cardId);
  }

  @Post('google/update')
  update(@Body() body: { cardId: string; progress: string }) {
    return this.wallet.update(body.cardId, body.progress);
  }
}
