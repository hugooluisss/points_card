jest.mock("@nestjs/common", () => ({
  Controller: () => (target: Function) => target,
  Get: () => () => undefined,
  SetMetadata: () => () => undefined,
}));

import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns the health status", () => {
    expect(new HealthController().getHealth()).toEqual({ status: "ok" });
  });
});
