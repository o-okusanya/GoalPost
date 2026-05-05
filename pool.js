const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Verify connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌  Database connection failed:", err.message);
    process.exit(1);
  }
  release();
  console.log("✅  Connected to PostgreSQL");
});

module.exports = pool;
