import { BadRequestException } from "@nestjs/common";
import { Role } from "@points-card/shared";
import { StaffRepository } from "./staff.repository";
import { StaffService } from "./staff.service";

describe("StaffService", () => {
  it("prevents disabling or demoting the last active owner", async () => {
    const repository = {
      byId: jest
        .fn()
        .mockResolvedValue({ id: "owner-1", role: Role.Owner, isActive: true }),
      activeOwnerCount: jest.fn().mockResolvedValue(1),
      updateStaff: jest.fn(),
    } as unknown as StaffRepository;
    const service = new StaffService(repository);
    await expect(service.setActive("owner-1", false)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.setRole("owner-1", Role.Manager),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateStaff).not.toHaveBeenCalled();
  });
});
