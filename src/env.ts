import 'dotenv/config';
import { z } from "zod";
import 'dotenv/config'; 

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(10, "JWT_SECRET muito curto"),
  DATABASE_URL: z.string().url("DATABASE_URL inválida")
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  JWT_SECRET: process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL
});

export const corsOrigins = env.CORS_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
