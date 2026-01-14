const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * GET /spots
 * Public - for map markers
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, latitude, longitude FROM spots ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch spots" });
  }
});

/**
 * GET /spots/:id
 * Public - spot details
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM spots WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Spot not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch spot" });
  }
});

module.exports = router;

/**
 * POST /spots
 * Protected - add new spot
 */
router.post("/", authMiddleware, async (req, res) => {
    try {
      const {
        name,
        description,
        latitude,
        longitude,
        spot_type,
        tips,
      } = req.body;
  
      if (!name || !description || !latitude || !longitude || !spot_type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      const userId = req.user.userId;
  
      const result = await pool.query(
        `INSERT INTO spots
         (name, description, latitude, longitude, spot_type, tips, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, description, latitude, longitude, spot_type, tips, userId]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create spot" });
    }
  });
  
/**
 * PUT /spots/:id
 * Protected - update a spot (only creator)
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { name, description, latitude, longitude, spot_type, tips } = req.body;

    // Check if spot exists and was created by this user
    const check = await pool.query("SELECT * FROM spots WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Spot not found" });
    }
    if (check.rows[0].created_by !== userId) {
      return res.status(403).json({ error: "You are not allowed to update this spot" });
    }

    // Update spot
    const result = await pool.query(
      `UPDATE spots
       SET name=$1, description=$2, latitude=$3, longitude=$4, spot_type=$5, tips=$6
       WHERE id=$7
       RETURNING *`,
      [name, description, latitude, longitude, spot_type, tips, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update spot" });
  }
});

/**
 * DELETE /spots/:id
 * Protected - delete a spot (only creator)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if spot exists and was created by this user
    const check = await pool.query("SELECT * FROM spots WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Spot not found" });
    }
    if (check.rows[0].created_by !== userId) {
      return res.status(403).json({ error: "You are not allowed to delete this spot" });
    }

    await pool.query("DELETE FROM spots WHERE id = $1", [id]);
    res.json({ message: "Spot deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete spot" });
  }
});
