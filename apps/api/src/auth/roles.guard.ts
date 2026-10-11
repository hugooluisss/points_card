import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@points-card/shared";
import { ROLES } from "./roles.decorator";
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (
      !roles ||
      roles.includes(context.switchToHttp().getRequest().user?.role)
    )
      return true;
    throw new ForbiddenException();
  }
}
