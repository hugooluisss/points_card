import { NestFactory } from "@nestjs/core";
import { configureApp } from "./configure-app";
import { AppModule } from "./app.module";
import { DataSource } from "typeorm";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.get(DataSource).query("SET time_zone = '+00:00'");
  configureApp(app);
  await app.listen(process.env.PORT ?? 3030);
}

void bootstrap();
