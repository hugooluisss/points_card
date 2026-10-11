import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { Business } from "../businesses/entities/business.entity";
import { StaffUser } from "../staff/entities/staff-user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { TokenService } from "./token.service";
import { LoginRateLimiter } from "./login-rate-limiter";
import { AuthGuard } from "./auth.guard";
import { TenantContextInterceptor } from "./tenant-context.interceptor";

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, StaffUser, RefreshToken]),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    TokenService,
    LoginRateLimiter,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
