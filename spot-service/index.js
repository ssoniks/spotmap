const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const spotRoutes = require("./routes/spot.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/spots", spotRoutes);

app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "Spot service running",
      dbTime: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Spot service running on port ${PORT}`);
});
