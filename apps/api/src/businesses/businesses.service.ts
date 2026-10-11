import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { BusinessRepository } from './business.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businesses: BusinessRepository) {}

  async register(input: { businessName: string; branchName?: string; ownerName: string; email: string; password: string }) {
    try {
      return await this.businesses.register({
        businessName: input.businessName,
        branchName: input.branchName?.trim() || input.businessName,
        ownerName: input.ownerName.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash: await argon2.hash(input.password),
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') throw new ConflictException('No fue posible registrar el comercio con esos datos.');
      throw error;
    }
  }

  async suspend(businessId: string): Promise<void> {
    if (!(await this.businesses.updateStatus(businessId, 'suspended'))) throw new NotFoundException('Comercio no encontrado.');
  }

  async reactivate(businessId: string): Promise<void> {
    if (!(await this.businesses.updateStatus(businessId, 'active'))) throw new NotFoundException('Comercio no encontrado.');
  }

  async assertBusinessActive(businessId: string): Promise<void> {
    if (!(await this.businesses.isActive(businessId))) throw new ForbiddenException('El comercio no está activo.');
  }
}
