import { SetMetadata } from "@nestjs/common";
export const AUDIT_ACTION = "audit-action";
export const Audit = (action: string) => SetMetadata(AUDIT_ACTION, action);
