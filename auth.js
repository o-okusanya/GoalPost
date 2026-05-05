const express  = require("express");
const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");
const pool     = require("../db/pool");

const router = express.Router();
const SALT_ROUNDS = 12;

// ── Helpers ──────────────────────────────────────────────────────────────────

function issueToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// ── POST /auth/register ───────────────────────────────────────────────────────
//  Body: { firstName, lastName, email, password }
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Basic password rules (mirror the frontend checks)
  const rules = [
    password.length >= 8,
    /\d/.test(password),
    /[!@#$%^&*]/.test(password),
    /[a-z]/.test(password) && /[A-Z]/.test(password),
  ];
  if (!rules.every(Boolean)) {
    return res.status(400).json({ error: "Password does not meet requirements." });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email`,
      [firstName.trim(), lastName.trim(), email.toLowerCase(), hash]
    );

    const user  = result.rows[0];
    const token = issueToken(user.id);

    res.status(201).json({
      token,
      user: {
        id:       user.id,
        fullName: `${user.first_name} ${user.last_name}`,
        email:    user.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
//  Body: { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Email not found." });
    }

    const user  = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const token = issueToken(user.id);

    res.json({
      token,
      user: {
        id:       user.id,
        fullName: `${user.first_name} ${user.last_name}`,
        email:    user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

module.exports = router;
