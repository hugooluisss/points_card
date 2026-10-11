import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class UtcTimezoneService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}
  async onApplicationBootstrap() {
    await this.dataSource.query("SET time_zone = '+00:00'");
  }
}
