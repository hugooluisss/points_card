import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

const WINDOW_MS = 15 * 60_000;
const LIMIT = 5; // shortcut: process-local limit, upgrade to shared storage before running multiple API instances.

@Injectable()
export class LoginRateLimiter {
  private readonly failures = new Map<
    string,
    { count: number; until: number }
  >();

  assertAllowed(email: string, ip: string, now = Date.now()) {
    const attempts = this.failures.get(`${email}|${ip}`);
    if (attempts && attempts.until > now && attempts.count >= LIMIT) {
      throw new HttpException(
        { message: "Demasiados intentos. Intenta más tarde." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(email: string, ip: string, now = Date.now()) {
    const key = `${email}|${ip}`;
    const attempts = this.failures.get(key);
    const current =
      attempts && attempts.until > now
        ? attempts
        : { count: 0, until: now + WINDOW_MS };
    this.failures.set(key, { count: current.count + 1, until: current.until });
  }

  clear(email: string, ip: string) {
    this.failures.delete(`${email}|${ip}`);
  }
}
