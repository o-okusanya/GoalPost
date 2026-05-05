const express     = require("express");
const pool        = require("../db/pool");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth); // all folder routes require login

// ── GET /folders ──────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.name, f.created_at,
              COUNT(g.id)::int AS goal_count
       FROM   folders f
       LEFT JOIN goals g ON g.folder_id = f.id
       WHERE  f.user_id = $1
       GROUP BY f.id
       ORDER BY f.created_at ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /folders error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── POST /folders ─────────────────────────────────────────────────────────────
//  Body: { name }
router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Folder name is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO folders (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at`,
      [req.userId, name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") { // unique violation
      return res.status(409).json({ error: "A folder with that name already exists." });
    }
    console.error("POST /folders error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── DELETE /folders/:id ───────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    // Unlink goals from this folder before deleting it
    await pool.query(
      "UPDATE goals SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );

    const result = await pool.query(
      "DELETE FROM folders WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Folder not found." });
    }

    res.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /folders/:id error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
