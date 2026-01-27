const express = require("express");
const cors = require("cors");
const amqp = require("amqplib");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER || "skozaliev",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "skatespot_notifications",
  port: process.env.DB_PORT || 5432,
});

// RabbitMQ Connection URL (Default)
const RABBITMQ_URL = "amqp://localhost";

async function startConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = "notifications";

    await channel.assertQueue(queue, { durable: true });
    console.log(`[Notification Service] Waiting for messages in ${queue}...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        console.log("[RabbitMQ] Received:", content);

        try {
          // Save to Database
          await pool.query(
            "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)",
            [content.userId, content.message, content.type]
          );
          console.log("Notification saved to DB");
          
          channel.ack(msg); // Confirm processing
        } catch (err) {
          console.error("Failed to save notification:", err);
          // Don't ack if failed, so it stays in queue (optional strategy)
        }
      }
    });
  } catch (err) {
    console.error("RabbitMQ Connection Error:", err);
    setTimeout(startConsumer, 5000); // Retry after 5s
  }
}

// Start RabbitMQ Consumer
startConsumer();

// API Endpoint for Frontend to fetch notifications
app.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// API Endpoint to mark as read
app.put("/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});