import { ForbiddenException } from "@nestjs/common";
import { PlanLimitsService } from "./plan-limits.service";

describe("PlanLimitsService", () => {
  const billing = {
    businessId: jest.fn(() => "biz-a"),
    subscription: jest.fn(),
    usage: jest.fn(),
  };
  const access = { assertWritable: jest.fn() };
  const service = new PlanLimitsService(billing as never, access as never);
  beforeEach(() => jest.clearAllMocks());

  it("enforces staff, card, and branch limits for the chosen tenant", async () => {
    billing.subscription.mockResolvedValue({
      plan: { maxStaff: 3, maxCards: 500, maxBranches: 1 },
    });
    billing.usage.mockResolvedValue({ staff: 3, cards: 500, branches: 1 });
    await expect(service.assertCanCreate("staff")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.assertCanCreate("cards")).rejects.toThrow(
      "Mejora tu plan",
    );
    await expect(
      service.assertCanCreate("branches", 1, "biz-b"),
    ).rejects.toThrow("sucursales");
    expect(billing.subscription).toHaveBeenLastCalledWith("biz-b");
    expect(access.assertWritable).toHaveBeenLastCalledWith("biz-b");
  });

  it("allows existing usage after a limit is reduced, but blocks another creation", async () => {
    billing.subscription.mockResolvedValue({
      plan: { maxStaff: 2, maxCards: 5, maxBranches: 1 },
    });
    billing.usage.mockResolvedValue({ staff: 3, cards: 4, branches: 1 });
    await expect(service.assertCanCreate("cards")).resolves.toBeUndefined();
    await expect(service.assertCanCreate("staff")).rejects.toThrow("límite");
  });
});
