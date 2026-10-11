import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantRequestContext {
  businessId: string;
  userId?: string;
  role?: string;
  branchIds?: string[] | null;
}

export interface RequestContext extends TenantRequestContext {
  userId: string;
  role: string;
  branchIds: string[] | null;
}

@Injectable()
export class TenantContext {
  private readonly storage = new AsyncLocalStorage<TenantRequestContext>();

  run<T>(context: TenantRequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  getBusinessId(): string {
    const businessId = this.storage.getStore()?.businessId;
    if (!businessId) throw new Error("Tenant context is required");
    return businessId;
  }

  getRequestContext(): TenantRequestContext | undefined {
    return this.storage.getStore();
  }
}
