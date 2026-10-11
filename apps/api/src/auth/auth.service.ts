import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import * as argon2 from "argon2";
import { AuthResponse, AuthUser } from "@points-card/shared";
import { JwtService } from "@nestjs/jwt";
import { AuthRepository } from "./auth.repository";
import { StaffUser } from "../staff/entities/staff-user.entity";

const INVALID = "Correo o contraseña incorrectos.";
const WINDOW_MS = 15 * 60_000;
const LIMIT = 5; // shortcut: five attempts per email+IP per 15 minutes in this process, upgrade to shared storage before running multiple API instances.
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$FvMgRXvrcfkbUGgSTGkixg$xGtrCZPtJXjXGmjli+TmLbOG2PxTAcwaTYqtAp6U3cU";

interface AccessTokenClaims {
  sub: string;
  businessId: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  private readonly failures = new Map<
    string,
    { count: number; until: number }
  >();
  constructor(
    private readonly repository: AuthRepository,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private user(staff: StaffUser): AuthUser {
    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      businessId: staff.businessId,
      branchIds: staff.branchIds,
    };
  }
  private hash(token: string) {
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
  private async issue(
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
  async login(email: string, password: string, ip: string) {
    const key = `${email.trim().toLowerCase()}|${ip}`;
    const now = Date.now();
    const attempts = this.failures.get(key);
    if (attempts && attempts.until > now && attempts.count >= LIMIT)
      throw new HttpException(
        { message: "Demasiados intentos. Intenta más tarde." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    const staff = await this.repository.findStaffByEmail(
      email.trim().toLowerCase(),
    );
    const eligible = staff?.isActive && staff.business?.status === "active";
    const passwordMatches = await argon2
      .verify(eligible ? staff.passwordHash : DUMMY_PASSWORD_HASH, password)
      .catch(() => false);
    if (!eligible || !passwordMatches) {
      const current =
        attempts && attempts.until > now
          ? attempts
          : { count: 0, until: now + WINDOW_MS };
      this.failures.set(key, {
        count: current.count + 1,
        until: current.until,
      });
      throw new UnauthorizedException({ message: INVALID });
    }
    this.failures.delete(key);
    return this.issue(this.user(staff));
  }
  async refresh(token: string | undefined) {
    if (!token)
      throw new UnauthorizedException({ message: "Sesión inválida." });
    const stored = await this.repository.findRefreshToken(this.hash(token));
    if (!stored)
      throw new UnauthorizedException({ message: "Sesión inválida." });
    if (stored.revokedAt) {
      await this.repository.revokeFamily(stored.familyId);
      throw new UnauthorizedException({ message: "Sesión inválida." });
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      await this.repository.revokeToken(stored.id);
      throw new UnauthorizedException({ message: "Sesión inválida." });
    }
    if (!(await this.repository.revokeToken(stored.id)).affected) {
      await this.repository.revokeFamily(stored.familyId);
      throw new UnauthorizedException({ message: "Sesión inválida." });
    }
    const staff = await this.repository.findStaff(stored.staffUserId);
    if (!staff?.isActive || staff.business?.status !== "active")
      throw new UnauthorizedException({ message: "Sesión inválida." });
    return this.issue(this.user(staff), stored.familyId);
  }
  async logout(token: string | undefined) {
    if (token) {
      const stored = await this.repository.findRefreshToken(this.hash(token));
      if (stored) await this.repository.revokeToken(stored.id);
    }
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
