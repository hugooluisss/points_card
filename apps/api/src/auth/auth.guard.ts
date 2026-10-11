import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TokenService } from "./token.service";
import { PUBLIC_ROUTE } from "./public.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest();
    const match = /^Bearer (.+)$/.exec(request.headers.authorization ?? "");
    if (!match) throw new UnauthorizedException();
    const user = await this.tokens.verifyAccess(match[1]);
    request.user = user;
    return true;
  }
}
