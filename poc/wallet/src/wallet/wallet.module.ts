import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { HealthController } from '../health.controller';
import { WalletService } from './wallet.service';
import { CardsRepository } from './cards.repository';
import { GoogleWalletProvider } from './providers/google-wallet.provider';

@Module({ controllers: [WalletController, HealthController], providers: [WalletService, CardsRepository, GoogleWalletProvider] })
export class WalletModule {}
