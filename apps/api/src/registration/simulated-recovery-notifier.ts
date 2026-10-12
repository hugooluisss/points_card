import { Injectable, Logger } from "@nestjs/common";
import { RecoveryNotifier } from "./recovery-notifier";

@Injectable()
export class SimulatedRecoveryNotifier implements RecoveryNotifier {
  private readonly logger = new Logger(SimulatedRecoveryNotifier.name);
  async send(destination: string, link: string) {
    const masked = destination.includes("@")
      ? destination.replace(/^(.).+(@.*)$/, "$1***$2")
      : `${"*".repeat(Math.max(0, destination.length - 4))}${destination.slice(-4)}`;
    this.logger.log(`Recovery link to ${masked}: ${link}`);
  }
}
