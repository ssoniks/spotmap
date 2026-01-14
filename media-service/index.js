const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const mediaRoutes = require("./routes/media.routes");
app.use("/media", mediaRoutes);

const pool = require("./db");

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "Media service running",
      dbTime: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Media service running on port ${PORT}`);
});
