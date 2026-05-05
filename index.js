require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes    = require("./routes/auth");
const goalsRoutes   = require("./routes/goals");
const foldersRoutes = require("./routes/folders");

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth",    authRoutes);
app.use("/goals",   goalsRoutes);
app.use("/folders", foldersRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  GoalPost API running on http://localhost:${PORT}`);
});
