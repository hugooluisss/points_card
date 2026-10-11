import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet/wallet.service';

@Controller('health')
export class HealthController {
  constructor(private readonly wallet: WalletService) {}
  @Get()
  getHealth() {
    return this.wallet.health();
  }
}
