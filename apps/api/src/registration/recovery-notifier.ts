export interface RecoveryNotifier {
  send(destination: string, link: string): Promise<void>;
}
export const RECOVERY_NOTIFIER = Symbol("RECOVERY_NOTIFIER");
