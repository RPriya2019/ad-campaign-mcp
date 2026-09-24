import pg from "pg";
import { requireEnv } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  database: process.env.DB_NAME ?? "adplatform",
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS advertisers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id VARCHAR(50) PRIMARY KEY,
      advertiser_id INTEGER REFERENCES advertisers(id),
      name VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL,
      budget DECIMAL(12, 2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS impressions (
      id BIGSERIAL PRIMARY KEY,
      campaign_id VARCHAR(50) REFERENCES campaigns(id),
      zone_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id BIGSERIAL PRIMARY KEY,
      campaign_id VARCHAR(50) REFERENCES campaigns(id),
      zone_id VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Database initialized");
}