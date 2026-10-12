import { Injectable } from "@nestjs/common";
import { ConsentsRepository } from "./consents.repository";

@Injectable()
export class ConsentsService {
  constructor(private readonly consents: ConsentsRepository) {}
  record(input: {
    customerId: string;
    purpose: "privacy_notice" | "marketing";
    channel: "wallet" | "email" | "sms" | "all";
    status: "granted" | "revoked";
    origin: "registration" | "recovery_link" | "admin" | "arco";
    noticeVersion?: number | null;
  }) {
    return this.consents.append({
      ...input,
      noticeVersion: input.noticeVersion ?? null,
    });
  }
  history(customerId: string) {
    return this.consents.history(customerId);
  }
  isMarketingActive(
    customerId: string,
    channel: "wallet" | "email" | "sms" | "all",
  ) {
    return this.consents.marketingActive(customerId, channel);
  }
  async revokeMarketing(customerId: string) {
    const history = await this.consents.history(customerId);
    const latest = new Map<string, (typeof history)[number]>();
    for (const row of history.filter(
      ({ purpose }) => purpose === "marketing",
    )) {
      if (!latest.has(row.channel)) latest.set(row.channel, row);
    }
    for (const [channel, consent] of latest as Map<
      "wallet" | "email" | "sms" | "all",
      (typeof history)[number]
    >) {
      if (consent.status === "granted")
        await this.record({
          customerId,
          purpose: "marketing",
          channel,
          status: "revoked",
          origin: "arco",
        });
    }
  }
}
