import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { StaffUser } from "../staff/entities/staff-user.entity";
import { Business } from "../businesses/entities/business.entity";
import { RefreshToken } from "./entities/refresh-token.entity";

@Injectable()
// Allow-listed: login by globally unique email and refresh-token hash lookups precede tenant context.
export class AuthRepository {
  constructor(
    @InjectRepository(StaffUser) private readonly staff: Repository<StaffUser>,
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}
  findStaffByEmail(email: string) {
    return this.staff.findOne({
      where: { email },
      relations: { business: true },
    });
  }
  findStaff(id: string) {
    return this.staff.findOne({ where: { id }, relations: { business: true } });
  }
  saveRefreshToken(token: Partial<RefreshToken>) {
    return this.refreshTokens.save(this.refreshTokens.create(token));
  }
  findRefreshToken(tokenHash: string) {
    return this.refreshTokens.findOneBy({ tokenHash });
  }
  revokeToken(id: string) {
    return this.refreshTokens.update(
      { id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
  revokeFamily(familyId: string) {
    return this.refreshTokens.update(
      { familyId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
  async businessIsActive(id: string) {
    return (
      (
        await this.businesses.findOne({
          where: { id },
          select: { id: true, status: true },
        })
      )?.status === "active"
    );
  }
}
