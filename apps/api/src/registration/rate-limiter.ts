import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class RateLimiter {
  // shortcut: single-instance memory limit, move to shared storage when running multiple API instances.
  private readonly hits = new Map<string, number[]>();
  assertAllowed(key: string, now: number) {
    const recent = (this.hits.get(key) ?? []).filter(
      (time) => now - time < 3_600_000,
    );
    if (recent.length >= 10)
      throw new HttpException(
        { message: "Demasiados registros. Intenta más tarde." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    recent.push(now);
    this.hits.set(key, recent);
  }
}
