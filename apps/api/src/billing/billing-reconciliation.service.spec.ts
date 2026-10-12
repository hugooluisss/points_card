import { BillingReconciliationService } from "./billing-reconciliation.service";

describe("BillingReconciliationService", () => {
  it("does nothing when Stripe is not configured", async () => {
    const billing = {
      migrateExpiredTrials: jest.fn(),
      subscriptionsForReconciliation: jest.fn(),
    };
    const stripe = { configured: () => false, retrieveSubscription: jest.fn() };
    const service = new BillingReconciliationService(
      billing as never,
      { get: () => 7 } as never,
      { now: () => new Date("2026-01-01T00:00:00Z") } as never,
      stripe as never,
    );
    await service.reconcile();
    expect(billing.migrateExpiredTrials).not.toHaveBeenCalled();
    expect(billing.subscriptionsForReconciliation).not.toHaveBeenCalled();
  });

  it("updates drift using the injected clock", async () => {
    const businessId = "biz-a";
    const local = {
      businessId,
      status: "active",
      stripeSubscriptionId: "sub-a",
      currentPeriodEnd: null,
    };
    const billing = {
      migrateExpiredTrials: jest.fn(),
      subscriptionsForReconciliation: jest.fn().mockResolvedValue([local]),
      saveSubscription: jest.fn(),
    };
    const stripe = {
      configured: () => true,
      retrieveSubscription: jest.fn().mockResolvedValue({
        status: "canceled",
        current_period_end: 1_800_000_000,
      }),
    };
    const now = new Date("2026-10-11T12:00:00Z");
    const service = new BillingReconciliationService(
      billing as never,
      {
        get: (key: string) => (key === "BILLING_RETENTION_DAYS" ? 90 : 7),
      } as never,
      { now: () => now } as never,
      stripe as never,
    );
    await service.reconcile();
    expect(billing.saveSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId,
        status: "canceled",
        canceledAt: now,
        retentionEndsAt: new Date(now.getTime() + 90 * 86_400_000),
      }),
    );
  });
});
