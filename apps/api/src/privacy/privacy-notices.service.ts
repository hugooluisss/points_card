import { Injectable } from "@nestjs/common";
import { PrivacyNoticesRepository } from "./privacy-notices.repository";

@Injectable()
export class PrivacyNoticesService {
  constructor(private readonly notices: PrivacyNoticesRepository) {}
  list() {
    return this.notices.list();
  }
  current() {
    return this.notices.current();
  }
  create(text: string) {
    return this.notices.createVersion(text);
  }
}
