import { UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

const COOKIE = "pc_refresh";

export function cookieHeader(token: string, secure: boolean, path: string) {
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=${path}; Max-Age=2592000${secure ? "; Secure" : ""}`;
}

export function clearCookie(secure: boolean, path: string) {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Path=${path}; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function readRefreshCookie(request: Request) {
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
