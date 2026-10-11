import { UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { clearCookie, cookieHeader, readRefreshCookie } from "./auth-cookie";

describe("auth cookie helpers", () => {
  it("formats and clears the refresh cookie", () => {
    expect(cookieHeader("token", true, "/auth")).toContain("Secure");
    expect(clearCookie(false, "/auth")).toContain("Max-Age=0");
  });

  it("reads a decoded refresh cookie and rejects malformed encoding", () => {
    expect(
      readRefreshCookie({
        headers: { cookie: "other=x; pc_refresh=a%2Fb" },
      } as Request),
    ).toBe("a/b");
    expect(() =>
      readRefreshCookie({ headers: { cookie: "pc_refresh=%" } } as Request),
    ).toThrow(UnauthorizedException);
  });
});
