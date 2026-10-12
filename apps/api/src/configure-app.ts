import { INestApplication, ValidationPipe } from "@nestjs/common";

export function configureApp(app: INestApplication): void {
  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", process.env.TRUST_PROXY ?? "loopback");
  const adapter = app.getHttpAdapter() as unknown as {
    useBodyParser?: (type: "json", rawBody: boolean) => unknown;
  };
  adapter.useBodyParser?.("json", true);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
