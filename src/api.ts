import express from "express";
import { timingSafeEqual } from "node:crypto";
import { requireEnv } from "./config.js";
import { initializeDatabase, pool } from "./db.js";

const API_KEY = requireEnv("API_KEY");

function isValidApiKey(provided: string | undefined): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(API_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  if (!isValidApiKey(req.get("x-api-key"))) {
    return res.status(401).json({ error: "Invalid or missing API key" });
  }
  next();
});


app.get("/campaigns", async (req, res) => {
  try {
    const status = req.query.status;

    let result;

    if (status) {
      result = await pool.query(
        `
        SELECT *
        FROM campaigns
        WHERE status = $1
        ORDER BY created_at DESC
        `,
        [status]
      );
    } else {
      result = await pool.query(`
        SELECT *
        FROM campaigns
        ORDER BY created_at DESC
      `);
    }

    return res.json(result.rows);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.get("/campaigns/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM campaigns
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Campaign not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});
initializeDatabase()
  .then(() => {
    app.listen(3000, "127.0.0.1", () => {
      console.log("Campaign API running on http://localhost:3000");
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });