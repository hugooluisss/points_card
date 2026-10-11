import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@points-card/shared";
import { AuthRepository } from "./auth.repository";
import { TokenService } from "./token.service";

describe("TokenService", () => {
  const config = new ConfigService({ JWT_ACCESS_SECRET: "a".repeat(40) });
  const jwt = new JwtService();

  it("rejects access tokens signed with another algorithm", async () => {
    const repository = {
      findStaff: jest.fn(),
    } as unknown as AuthRepository;
    const tokens = new TokenService(repository, config, jwt);
    const token = await jwt.signAsync(
      { sub: "staff-1", businessId: "business-1" },
      { secret: "a".repeat(40), algorithm: "HS384", expiresIn: "15m" },
    );

    await expect(tokens.verifyAccess(token)).rejects.toMatchObject({
      status: 401,
    });
  });

  it("maps a staff record to the public auth user shape", () => {
    const tokens = new TokenService({} as AuthRepository, config, jwt);
    expect(
      tokens.user({
        id: "staff-1",
        name: "Test",
        role: Role.Owner,
        businessId: "business-1",
        branchIds: null,
      } as any),
    ).toEqual({
      id: "staff-1",
      name: "Test",
      role: Role.Owner,
      businessId: "business-1",
      branchIds: null,
    });
  });
});
