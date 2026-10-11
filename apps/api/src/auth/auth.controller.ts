import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { IsEmail, IsString, MinLength } from "class-validator";
import { Request, Response } from "express";
import { AuthResponse, LoginRequest } from "@points-card/shared";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";
import { CurrentUser } from "./current-user.decorator";

class LoginBody implements LoginRequest {
  @IsEmail({}, { message: "Ingresa un correo electrónico válido." })
  email!: string;
  @IsString() @MinLength(1) password!: string;
}
const COOKIE = "pc_refresh";
function cookieHeader(token: string, secure: boolean, path: string) {
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=${path}; Max-Age=2592000${secure ? "; Secure" : ""}`;
}
function clearCookie(secure: boolean, path: string) {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=${path}; Max-Age=0${secure ? "; Secure" : ""}`;
}

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
  private readCookie(request: Request) {
    const value = request.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    try {
      return value ? decodeURIComponent(value) : undefined;
    } catch {
      throw new UnauthorizedException();
    }
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
      await this.auth.refresh(this.readCookie(request)),
    );
  }
  @Public()
  @Post("logout")
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(this.readCookie(request));
    response.setHeader(
      "Set-Cookie",
      clearCookie(process.env.NODE_ENV === "production", this.cookiePath()),
    );
  }
  @Get("me") me(@CurrentUser() user: AuthResponse["user"]) {
    return { user };
  }
}
