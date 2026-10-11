import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";

@Injectable()
// Allow-listed: audit records must capture failed cross-tenant attempts too.
export class AuditRepository {
  constructor(
    @InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>,
  ) {}
  write(entry: Partial<AuditLog>) {
    return this.logs.save(this.logs.create(entry));
  }
}
