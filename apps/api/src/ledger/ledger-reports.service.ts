import { BadRequestException, Injectable } from "@nestjs/common";
import { LedgerRepository } from "./ledger.repository";

@Injectable()
export class LedgerReportsService {
  constructor(private readonly ledger: LedgerRepository) {}

  async anomalies(date: string) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException("La fecha debe tener formato YYYY-MM-DD.");
    }
    return this.ledger.staffAnomalies(
      date,
      process.env.BUSINESS_TIMEZONE ?? "America/Mexico_City",
    );
  }
}
