import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { AuthResponse, AuthUser } from "@points-card/shared";
import { AuthRepository } from "./auth.repository";
import { StaffUser } from "../staff/entities/staff-user.entity";

interface AccessTokenClaims {
  sub: string;
  businessId: string;
  iat: number;
  exp: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  user(staff: StaffUser): AuthUser {
    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      businessId: staff.businessId,
      branchIds: staff.branchIds,
    };
  }

  hash(token: string) {
    return createHmac(
      "sha256",
      this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
    )
      .update(token)
      .digest("hex");
  }

  private accessToken(user: AuthUser): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, businessId: user.businessId },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        algorithm: "HS256",
        expiresIn: "15m",
      },
    );
  }

  async issue(
    user: AuthUser,
    familyId: string = randomUUID(),
  ): Promise<AuthResponse & { refreshToken: string }> {
    const refreshToken = randomBytes(48).toString("base64url");
    await this.repository.saveRefreshToken({
      businessId: user.businessId,
      staffUserId: user.id,
      tokenHash: this.hash(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + 30 * 86400_000),
      revokedAt: null,
    });
    return { accessToken: await this.accessToken(user), user, refreshToken };
  }

  async verifyAccess(token: string): Promise<AuthUser> {
    let claims: AccessTokenClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessTokenClaims>(token, {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        algorithms: ["HS256"],
      });
    } catch {
      throw new UnauthorizedException();
    }
    if (typeof claims.sub !== "string" || typeof claims.businessId !== "string")
      throw new UnauthorizedException();
    const staff = await this.repository.findStaff(claims.sub);
    if (
      !staff?.isActive ||
      staff.business?.status !== "active" ||
      staff.businessId !== claims.businessId
    )
      throw new UnauthorizedException();
    return this.user(staff);
  }
}
