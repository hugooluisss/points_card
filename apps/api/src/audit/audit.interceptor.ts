import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { catchError, from, mergeMap, Observable, tap, throwError } from "rxjs";
import { AUDIT_ACTION } from "./audit.decorator";
import { AuditRepository } from "./audit.repository";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditRepository,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(AUDIT_ACTION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) return next.handle();
    const req = context.switchToHttp().getRequest();
    const actorId = req.user?.id ?? null;
    const businessId = req.user?.businessId ?? null;
    const targetId = req.params?.id ?? null;
    return next.handle().pipe(
      mergeMap((value) =>
        from(
          this.audit.write({
            actorId,
            businessId,
            action,
            targetId: targetId ?? value?.id ?? null,
            result: "success",
          }),
        ).pipe(
          tap(() => undefined),
          mergeMap(() => [value]),
        ),
      ),
      catchError((error) =>
        from(
          this.audit.write({
            actorId,
            businessId,
            action,
            targetId,
            result: "failure",
          }),
        ).pipe(mergeMap(() => throwError(() => error))),
      ),
    );
  }
}
