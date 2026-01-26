const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");
const axios = require("axios");

const router = express.Router();

/**
 * GET /spots
 * Public - for map markers
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, latitude, longitude, spot_type, image_url, created_by, creator_username FROM spots ORDER BY created_at DESC"
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
    console.log(`[Spot Service] GET /${id} requested`); // <--- LOG

    const result = await pool.query("SELECT * FROM spots WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Spot not found" });
    }

    console.log(`[Spot Service] Returning spot:`, result.rows[0]); // <--- LOG
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch spot" });
  }
});

module.exports = router;

/**
 * POST /spots
 * Protected - add new spot + REWARD POINTS
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("--- DEBUG: POST /spots called ---");
    console.log("Request Body:", req.body); // <--- CHECK THIS LOG

    const {
      name,
      description,
      latitude,
      longitude,
      spot_type,
      tips,
      image_url,
      creator_username
    } = req.body;

    console.log("Extracted Username:", creator_username);

    if (!name || !description || !latitude || !longitude || !spot_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = req.user.userId;

    // 1. Create the Spot
    const result = await pool.query(
      `INSERT INTO spots
       (name, description, latitude, longitude, spot_type, tips, created_by, image_url, creator_username)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, description, latitude, longitude, spot_type, tips, userId, image_url, creator_username]
    );

    const newSpot = result.rows[0];

    // 2. GAMIFICATION: Reward the user (+50 Points)
    // We do this *after* the spot is created successfully.
    try {
      // Assume Auth Service is running on localhost:4000 (adjust port if needed)
      const authServiceUrl = "http://localhost:4001/auth/add-points";
      
      await axios.put(authServiceUrl, {
        userId: userId,
        amount: 50 // Points for creating a spot
      });

      console.log(`[Gamification] Awarded 50 points to user ${userId}`);
    } catch (rewardErr) {
      // If the reward fails, we log it but DON'T fail the request. 
      // The spot was created, so we return success to the user.
      console.error("[Gamification] Failed to award points:", rewardErr.message);
    }

    res.status(201).json(newSpot);

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
    console.log(`[Spot Service] PUT /${id} called with body:`, req.body);
    const userId = req.user.userId;
    const { name, description, latitude, longitude, spot_type, tips, image_url } = req.body;

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
       SET name=$1, description=$2, latitude=$3, longitude=$4, spot_type=$5, tips=$6,
           image_url=COALESCE($7, image_url)
       WHERE id=$8
       RETURNING *`,
      [name, description, latitude, longitude, spot_type, tips, image_url, id]
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
