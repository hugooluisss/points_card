import { Injectable, NotFoundException } from "@nestjs/common";
import { ConsentsService } from "../consents/consents.service";
import { CustomersRepository } from "./customers.repository";

@Injectable()
export class CustomersService {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly consents: ConsentsService,
  ) {}
  async exportData(id: string) {
    const data = await this.customers.exportData(id);
    if (!data) throw new NotFoundException("Cliente no encontrado.");
    const { movements, ...customerData } = data;
    return {
      ...customerData,
      consents: await this.consents.history(id),
      movements,
    };
  }
  async anonymize(id: string) {
    if (!(await this.customers.customer(id)))
      throw new NotFoundException("Cliente no encontrado.");
    return { anonymized: await this.customers.anonymize(id) };
  }
  async revokeMarketing(id: string) {
    if (!(await this.customers.customer(id)))
      throw new NotFoundException("Cliente no encontrado.");
    await this.consents.revokeMarketing(id);
    return { revoked: true };
  }
  async consentsHistory(id: string) {
    if (!(await this.customers.customer(id)))
      throw new NotFoundException("Cliente no encontrado.");
    return this.consents.history(id);
  }
}
