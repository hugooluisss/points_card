import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthResponse, LoginRequest } from "@points-card/shared";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { CurrentUser } from "./current-user.decorator";
import { LoginBody } from "./dto/login.dto";
import { clearCookie, cookieHeader, readRefreshCookie } from "./auth-cookie";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}
  private send(
    res: Response,
    session: AuthResponse & { refreshToken: string },
  ) {
    const { refreshToken, ...body } = session;
    res.setHeader(
      "Set-Cookie",
      cookieHeader(
        refreshToken,
        process.env.NODE_ENV === "production",
        this.cookiePath(),
      ),
    );
    return body;
  }
  private cookiePath() {
    return this.config.get<string>("AUTH_COOKIE_PATH") ?? "/";
  }
  @Public()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: LoginBody,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.send(
      response,
      await this.auth.login(body.email, body.password, request.ip),
    );
  }
  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.send(
      response,
      await this.auth.refresh(readRefreshCookie(request)),
    );
  }
  @Public()
  @Post("logout")
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(readRefreshCookie(request));
    response.setHeader(
      "Set-Cookie",
      clearCookie(process.env.NODE_ENV === "production", this.cookiePath()),
    );
  }
  @Get("me") me(@CurrentUser() user: AuthResponse["user"]) {
    return { user };
  }
}
