const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth.middleware");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /upload
 * Protected - upload image for a spot
 */
router.post("/upload", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { spotId } = req.body;
    const file = req.file;

    if (!spotId || !file) return res.status(400).json({ error: "Missing spotId or file" });

    // Upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: "skatespots" },
      async (error, result) => {
        if (error) return res.status(500).json({ error: "Cloudinary upload failed" });

        // Save in DB
        const dbResult = await pool.query(
          "INSERT INTO media (spot_id, image_url) VALUES ($1, $2) RETURNING *",
          [spotId, result.secure_url]
        );
        
        // MODIFY RESPONSE to explicitly include 'url' or just return the whole object
        res.status(201).json({
            ...dbResult.rows[0],
            url: result.secure_url // <--- Explicitly sending the URL for the frontend to use
        });
      }
    );

    // Convert buffer to readable stream
    const readable = new Readable();
    readable._read = () => {};
    readable.push(file.buffer);
    readable.push(null);
    readable.pipe(stream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * GET /spot/:spotId
 * Public - get all images for a spot
 */
router.get("/spot/:spotId", async (req, res) => {
  try {
    const { spotId } = req.params;
    const result = await pool.query("SELECT * FROM media WHERE spot_id = $1 ORDER BY uploaded_at DESC", [spotId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

module.exports = router;

/**
 * DELETE /media/:id
 * Protected - delete an image
 */
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Find image in DB
    const result = await pool.query("SELECT * FROM media WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    const image = result.rows[0];

    // OPTIONAL: Check if user is allowed to delete
    // For now, assume the user can delete (or later check if they created the spot)
    // const spot = await pool.query("SELECT created_by FROM spots WHERE id=$1", [image.spot_id]);
    // if (spot.rows[0].created_by !== req.user.userId) return res.status(403).json({ error: "Forbidden" });

    // Extract public_id from Cloudinary URL
    const publicId = image.image_url
      .split("/")
      .slice(-1)[0]        // last segment
      .split(".")[0];       // remove extension

    // Delete from Cloudinary
    const cloudinary = require("../config/cloudinary");
    cloudinary.uploader.destroy(`skatespots/${publicId}`, async (err, resultCloud) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete image from Cloudinary" });
      }

      // Delete from DB
      await pool.query("DELETE FROM media WHERE id = $1", [id]);
      res.json({ message: "Image deleted successfully" });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

