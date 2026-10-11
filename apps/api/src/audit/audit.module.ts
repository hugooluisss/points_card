import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "./entities/audit-log.entity";
import { AuditRepository } from "./audit.repository";
import { AuditInterceptor } from "./audit.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [
    AuditRepository,
    AuditInterceptor,
    { provide: APP_INTERCEPTOR, useExisting: AuditInterceptor },
  ],
})
export class AuditModule {}
