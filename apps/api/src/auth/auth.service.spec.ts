import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { Role } from "@points-card/shared";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const config = new ConfigService({
    JWT_ACCESS_SECRET: "a".repeat(40),
    JWT_REFRESH_SECRET: "b".repeat(40),
  });
  const jwt = new JwtService();
  const staff: any = {
    id: "staff-1",
    businessId: "business-1",
    name: "Test",
    email: "test@example.test",
    role: Role.Owner,
    isActive: true,
    branchIds: null,
    passwordHash: "",
    business: { status: "active" },
  };
  beforeEach(async () => {
    staff.passwordHash = await argon2.hash("correct-password");
  });

  it("issues short access tokens and rotates refresh tokens, revoking the family on reuse", async () => {
    const tokens: any[] = [];
    const repository = {
      findStaffByEmail: jest.fn().mockResolvedValue(staff),
      findStaff: jest.fn().mockResolvedValue(staff),
      saveRefreshToken: jest.fn(async (token) => {
        tokens.push({ ...token, id: `token-${tokens.length + 1}` });
      }),
      findRefreshToken: jest.fn(async (hash) =>
        tokens.find((token) => token.tokenHash === hash),
      ),
      revokeToken: jest.fn(async (id) => {
        const item = tokens.find((token) => token.id === id);
        if (!item || item.revokedAt) return { affected: 0 };
        item.revokedAt = new Date();
        return { affected: 1 };
      }),
      revokeFamily: jest.fn(async (familyId) => {
        for (const item of tokens.filter(
          (token) => token.familyId === familyId,
        ))
          item.revokedAt ??= new Date();
      }),
    } as unknown as AuthRepository;
    const auth = new AuthService(repository, config, jwt);
    const first = await auth.login(
      staff.email,
      "correct-password",
      "127.0.0.1",
    );
    expect(
      JSON.parse(
        Buffer.from(first.accessToken.split(".")[1], "base64url").toString(),
      ).exp - Math.floor(Date.now() / 1000),
    ).toBeLessThanOrEqual(900);
    const second = await auth.refresh(first.refreshToken);
    expect(second.user).toEqual({
      id: staff.id,
      name: staff.name,
      role: staff.role,
      businessId: staff.businessId,
      branchIds: null,
    });
    await expect(auth.refresh(first.refreshToken)).rejects.toMatchObject({
      status: 401,
    });
    await expect(auth.refresh(second.refreshToken)).rejects.toMatchObject({
      status: 401,
    });
  });

  it("uses a generic credential error and returns 429 after five attempts for the same email and IP", async () => {
    const repository = {
      findStaffByEmail: jest.fn().mockResolvedValue(null),
    } as unknown as AuthRepository;
    const auth = new AuthService(repository, config, jwt);
    for (let attempt = 0; attempt < 5; attempt++)
      await expect(
        auth.login("bad@example.test", "wrong", "192.0.2.1"),
      ).rejects.toMatchObject({
        status: 401,
        response: { message: "Correo o contraseña incorrectos." },
      });
    await expect(
      auth.login("bad@example.test", "wrong", "192.0.2.1"),
    ).rejects.toMatchObject({ status: 429 });
  });

  it("runs the dummy Argon2 hash for inactive users and rejects non-HS256 access tokens", async () => {
    const repository = {
      findStaffByEmail: jest.fn().mockResolvedValue({
        ...staff,
        isActive: false,
      }),
    } as unknown as AuthRepository;
    const auth = new AuthService(repository, config, jwt);
    await expect(
      auth.login(staff.email, "wrong-password", "192.0.2.2"),
    ).rejects.toMatchObject({ status: 401 });
    const token = await jwt.signAsync(
      { sub: staff.id, businessId: staff.businessId },
      { secret: "a".repeat(40), algorithm: "HS384", expiresIn: "15m" },
    );
    await expect(auth.verifyAccess(token)).rejects.toMatchObject({
      status: 401,
    });
  });
});
