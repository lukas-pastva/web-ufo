import { DataSource } from 'typeorm';
import { Generation } from '../models/Generation';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'ufo',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'ufo',
  entities: [Generation],
  synchronize: true,
  logging: process.env.NODE_ENV !== 'production',
});
