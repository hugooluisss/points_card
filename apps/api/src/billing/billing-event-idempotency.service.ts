import { Injectable } from "@nestjs/common";
import { BillingRepository } from "./billing.repository";

@Injectable()
export class BillingEventIdempotencyService {
  constructor(private readonly billing: BillingRepository) {}
  claim(id: string, type: string) {
    return this.billing.claimEvent(id, type);
  }
  complete(id: string) {
    return this.billing.processedEvent(id);
  }
  release(id: string) {
    return this.billing.releaseEvent(id);
  }
}
