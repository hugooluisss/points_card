import { Module } from "@nestjs/common";
import { Clock } from "./clock";

@Module({ providers: [Clock], exports: [Clock] })
export class ClockModule {}
