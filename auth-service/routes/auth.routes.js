const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

const getStatus = (points) => {
  if (points >= 1000) return "Legend";
  if (points >= 500) return "Hero";
  if (points >= 100) return "Local";
  return "Beginner";
};

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    res.status(500).json({ error: "Server error" });
  }
});

// auth-service/routes/auth.routes.js

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points || 0,       
        status: getStatus(user.points || 0) 
      },

    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, points FROM users WHERE id = $1", 
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      message: "You are authenticated",
      user: {
        ...user,
        status: getStatus(user.points || 0) 
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/add-points", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    // FIX: Use COALESCE(points, 0) to handle NULL values safely
    const result = await pool.query(
      "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2 RETURNING id, username, points",
      [amount, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update points" });
  }
});

/**
 * GET /users/:username
 * Public - Get public profile (Status only, no Points)
 */
router.get("/users/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    // We fetch points to calculate status, but we won't return them
    const result = await pool.query(
      "SELECT username, points FROM users WHERE username = $1", 
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      username: user.username,
      status: getStatus(user.points || 0) 
      // Note: We intentionally do NOT return 'points' here
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
