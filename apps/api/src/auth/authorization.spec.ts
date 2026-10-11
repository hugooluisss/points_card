import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Role } from "@points-card/shared";
import { RolesGuard } from "./roles.guard";
import { assertBranchAccess } from "./branch-access";

describe("authorization helpers", () => {
  it("denies cashier access to owner-only configuration", () => {
    const reflector: any = {
      getAllAndOverride: () => [Role.Owner, Role.Manager],
    };
    const request = { user: { role: Role.Cashier } };
    const context = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    expect(() => new RolesGuard(reflector).canActivate(context)).toThrow(
      ForbiddenException,
    );
  });
  it("denies access to a branch outside the assigned branch ids", () => {
    expect(() =>
      assertBranchAccess(
        {
          id: "u",
          name: "Cashier",
          role: Role.Cashier,
          businessId: "b",
          branchIds: ["branch-x"],
        },
        "branch-y",
      ),
    ).toThrow(ForbiddenException);
  });
});
