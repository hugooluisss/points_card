import { BadRequestException } from "@nestjs/common";
import { ProgramsService } from "./programs.service";

describe("ProgramsService", () => {
  it("rejects invalid rules and keeps existing ledger records untouched when changing a rule", async () => {
    const repo = {
      program: jest
        .fn()
        .mockResolvedValue({
          id: "p1",
          mode: "points",
          status: "inactive",
          validFrom: "2026-01-01",
          validUntil: null,
          pointsPerCurrencyUnit: "1.0000",
        }),
      updateProgram: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new ProgramsService(repo as never);
    await expect(
      service.create({
        name: "Sellos",
        mode: "stamps",
        validFrom: "2026-01-01",
        stampsGoal: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await service.update("p1", { pointsPerCurrencyUnit: 2 });
    expect(repo.updateProgram).toHaveBeenCalledWith("p1", {
      pointsPerCurrencyUnit: "2",
      mode: "points",
    });
  });

  it("rejects a stamps goal below any existing reward cost", async () => {
    const repo = {
      program: jest
        .fn()
        .mockResolvedValue({
          id: "p2",
          mode: "stamps",
          validFrom: "2026-01-01",
          validUntil: null,
          stampsGoal: 8,
        }),
      hasRewardCostAbove: jest.fn().mockResolvedValue(true),
      updateProgram: jest.fn(),
    };
    const service = new ProgramsService(repo as never);
    await expect(service.update("p2", { stampsGoal: 4 })).rejects.toMatchObject(
      { status: 400 },
    );
    expect(repo.updateProgram).not.toHaveBeenCalled();
  });
});
