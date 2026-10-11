import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { TenantContext } from "../tenancy/tenant-context.service";

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenant: TenantContext) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const user = context.switchToHttp().getRequest().user;
    if (!user) return next.handle();
    return new Observable((subscriber) =>
      this.tenant.run(user, () => next.handle().subscribe(subscriber)),
    );
  }
}
