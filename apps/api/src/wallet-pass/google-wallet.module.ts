import { Module } from "@nestjs/common";
import { ClockModule } from "../ledger/clock.module";
import { GoogleWalletClient } from "./google-wallet.client";

@Module({
  imports: [ClockModule],
  providers: [GoogleWalletClient],
  exports: [GoogleWalletClient],
})
export class GoogleWalletModule {}
