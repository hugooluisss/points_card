import { INestApplication } from "@nestjs/common";
import { configureApp } from "./configure-app";

describe("configureApp", () => {
  const original = process.env.TRUST_PROXY;
  afterEach(() => {
    if (original === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = original;
  });

  it("trusts loopback proxies by default and accepts an explicit proxy setting", () => {
    const express = { set: jest.fn() };
    const app = {
      getHttpAdapter: () => ({ getInstance: () => express }),
      useGlobalPipes: jest.fn(),
    } as unknown as INestApplication;
    delete process.env.TRUST_PROXY;
    configureApp(app);
    expect(express.set).toHaveBeenCalledWith("trust proxy", "loopback");

    process.env.TRUST_PROXY = "10.0.0.0/8";
    configureApp(app);
    expect(express.set).toHaveBeenLastCalledWith("trust proxy", "10.0.0.0/8");
  });
});
