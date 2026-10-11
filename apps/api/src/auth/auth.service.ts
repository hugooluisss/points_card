import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AuthResponse } from "@points-card/shared";
import { AuthRepository } from "./auth.repository";
import { LoginRateLimiter } from "./login-rate-limiter";
import { TokenService } from "./token.service";

const INVALID = "Correo o contraseña incorrectos.";
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,p=4,t=3$FvMgRXvrcfkbUGgSTGkixg$xGtrCZPtJXjXGmjli+TmLbOG2PxTAcwaTYqtAp6U3cU";

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokens: TokenService,
    private readonly limiter: LoginRateLimiter,
  ) {}

  async login(
    email: string,
    password: string,
    ip: string,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    this.limiter.assertAllowed(normalizedEmail, ip);
    const staff = await this.repository.findStaffByEmail(normalizedEmail);
    const eligible = staff?.isActive && staff.business?.status === "active";
    const passwordMatches = await argon2
      .verify(eligible ? staff.passwordHash : DUMMY_PASSWORD_HASH, password)
      .catch(() => false);
    if (!eligible || !passwordMatches) {
      this.limiter.recordFailure(normalizedEmail, ip);
      throw new UnauthorizedException({ message: INVALID });
    }
    this.limiter.clear(normalizedEmail, ip);
    return this.tokens.issue(this.tokens.user(staff));
  }

  async refresh(token: string | undefined) {
    if (!token)
      throw new UnauthorizedException({ message: "Sesión inválida." });
    const stored = await this.repository.findRefreshToken(
      this.tokens.hash(token),
    );
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
    return this.tokens.issue(this.tokens.user(staff), stored.familyId);
  }

  async logout(token: string | undefined) {
    if (!token) return;
    const stored = await this.repository.findRefreshToken(
      this.tokens.hash(token),
    );
    if (stored) await this.repository.revokeToken(stored.id);
  }
}
