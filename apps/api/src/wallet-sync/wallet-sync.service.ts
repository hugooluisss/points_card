import { Injectable, NotFoundException } from "@nestjs/common";
import { WalletSyncRepository } from "./wallet-sync.repository";

@Injectable()
export class WalletSyncService {
  constructor(private readonly repository: WalletSyncRepository) {}
  failed() {
    return this.repository.failed();
  }
  async retry(id: string) {
    const job = await this.repository.retry(id);
    if (!job) throw new NotFoundException();
    return job;
  }
}
