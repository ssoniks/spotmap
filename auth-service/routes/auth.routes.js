const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth.middleware");
const amqp = require("amqplib"); 

const router = express.Router();

const getStatus = (points) => {
  if (points >= 1000) return "Legend";
  if (points >= 500) return "Hero";
  if (points >= 100) return "Local";
  return "Beginner";
};

async function sendNotification(userId, message, type) {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    const queue = "notifications";
    await channel.assertQueue(queue, { durable: true });
    
    const payload = JSON.stringify({ userId, message, type });
    channel.sendToQueue(queue, Buffer.from(payload));
    
    console.log(`[RabbitMQ] Sent notification to user ${userId}`);
    setTimeout(() => connection.close(), 500);
  } catch (err) {
    console.error("[RabbitMQ] Failed to send message:", err);
  }
}

/**
 * POST /register
 * Public - Register a new user + Send Welcome Notification
 */
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

    const newUser = result.rows[0];

    sendNotification(
      newUser.id, 
      `Welcome to SpotFinder, ${newUser.username}! Start adding spots to earn points.`, 
      'system'
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error(err);

    if (err.code === "23505") {
      return res.status(409).json({ error: "Username or email already exists" });
    }

    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /login
 * Public - Login user
 */
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

/**
 * GET /me
 * Protected - Get current user profile
 */
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

/**
 * PUT /add-points
 * Internal - Called by other services to reward users + Status Upgrades
 */
router.put("/add-points", async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    // 1. Update Points in DB
    const result = await pool.query(
      "UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2 RETURNING id, username, points",
      [amount, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    const updatedUser = result.rows[0];
    const newPoints = updatedUser.points;
    const oldPoints = newPoints - amount; // Calculate previous points

    // --- NEW: Check for Status Upgrade ---
    const oldStatus = getStatus(oldPoints);
    const newStatus = getStatus(newPoints);

    if (newStatus !== oldStatus) {
      console.log(`[Gamification] User ${userId} leveled up: ${oldStatus} -> ${newStatus}`);
      
      sendNotification(
        userId,
        `Congratulations! You've reached ${newStatus} status!`,
        'reward'
      );
    }

    res.json(updatedUser);
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;