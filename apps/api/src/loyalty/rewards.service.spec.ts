import { RewardsService } from "./rewards.service";

describe("RewardsService", () => {
  it("soft removes a reward and returns the retained inactive row", async () => {
    const reward = { id: "r1", isActive: true };
    const programs = {
      program: jest.fn().mockResolvedValue({ id: "p1", mode: "points" }),
    };
    const rewards = {
      reward: jest
        .fn()
        .mockResolvedValueOnce(reward)
        .mockResolvedValueOnce({ ...reward, isActive: false }),
      updateReward: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new RewardsService(programs as never, rewards as never);
    await expect(service.delete("p1", "r1")).resolves.toEqual({
      ...reward,
      isActive: false,
    });
    expect(rewards.updateReward).toHaveBeenCalledWith("p1", "r1", {
      isActive: false,
    });
  });
});
