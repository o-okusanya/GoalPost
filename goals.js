const express     = require("express");
const pool        = require("../db/pool");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
router.use(requireAuth);

// ── GET /goals ────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.genre, g.type, g.progress, g.checked,
              g.created_at, g.completed_at,
              g.folder_id,
              f.name AS folder_name
       FROM   goals g
       LEFT JOIN folders f ON f.id = g.folder_id
       WHERE  g.user_id = $1
       ORDER BY g.created_at ASC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /goals error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── POST /goals ───────────────────────────────────────────────────────────────
//  Body: { name, genre, type, folderId? }
router.post("/", async (req, res) => {
  const { name, genre, type, folderId } = req.body;

  if (!name || !genre || !type) {
    return res.status(400).json({ error: "name, genre, and type are required." });
  }
  if (!["progress", "checkbox"].includes(type)) {
    return res.status(400).json({ error: "type must be 'progress' or 'checkbox'." });
  }

  try {
    // Validate folderId belongs to this user if provided
    if (folderId) {
      const folderCheck = await pool.query(
        "SELECT id FROM folders WHERE id = $1 AND user_id = $2",
        [folderId, req.userId]
      );
      if (folderCheck.rowCount === 0) {
        return res.status(400).json({ error: "Invalid folder." });
      }
    }

    const result = await pool.query(
      `INSERT INTO goals (user_id, folder_id, name, genre, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, genre, type, progress, checked, created_at, completed_at, folder_id`,
      [req.userId, folderId || null, name.trim(), genre, type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /goals error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── PATCH /goals/:id ──────────────────────────────────────────────────────────
//  Body (any subset): { name, genre, folderId, progress, checked }
router.patch("/:id", async (req, res) => {
  const { name, genre, folderId, progress, checked } = req.body;

  try {
    // Fetch current goal (confirms ownership)
    const current = await pool.query(
      "SELECT * FROM goals WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (current.rowCount === 0) {
      return res.status(404).json({ error: "Goal not found." });
    }

    const g = current.rows[0];

    // Build updated values
    const newName      = name      !== undefined ? name.trim()    : g.name;
    const newGenre     = genre     !== undefined ? genre           : g.genre;
    const newFolderId  = folderId  !== undefined ? (folderId || null) : g.folder_id;
    const newProgress  = progress  !== undefined ? parseInt(progress, 10) : g.progress;
    const newChecked   = checked   !== undefined ? Boolean(checked) : g.checked;

    // Stamp or clear completed_at based on completion state
    let newCompletedAt = g.completed_at;
    const nowComplete  = (g.type === "progress" && newProgress === 100)
                      || (g.type === "checkbox"  && newChecked);
    const wasComplete  = g.completed_at !== null;

    if (nowComplete  && !wasComplete) newCompletedAt = new Date().toISOString();
    if (!nowComplete &&  wasComplete) newCompletedAt = null;

    const result = await pool.query(
      `UPDATE goals
       SET  name         = $1,
            genre        = $2,
            folder_id    = $3,
            progress     = $4,
            checked      = $5,
            completed_at = $6
       WHERE id = $7 AND user_id = $8
       RETURNING id, name, genre, type, progress, checked,
                 created_at, completed_at, folder_id`,
      [newName, newGenre, newFolderId, newProgress, newChecked, newCompletedAt,
       req.params.id, req.userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /goals/:id error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ── DELETE /goals/:id ─────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Goal not found." });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /goals/:id error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
