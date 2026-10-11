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
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
  exports: [AuthService],
})
export class AuthModule {}
