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
  
