import { INestApplication, ValidationPipe } from "@nestjs/common";

export function configureApp(app: INestApplication): void {
  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", process.env.TRUST_PROXY ?? "loopback");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
