import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database.options';
import { ConfigService } from '@nestjs/config';

config();

export default new DataSource(databaseOptions(new ConfigService(process.env)));
