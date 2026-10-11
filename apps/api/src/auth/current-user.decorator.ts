import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "@points-card/shared";
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest().user,
);
