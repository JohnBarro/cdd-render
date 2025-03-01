const express = require("express");
const DiseaseResult = require("../models/DiseaseResult");
const router = express.Router();

// ✅ Route: Save AI prediction result
router.post("/upload-result", async (req, res) => {
  try {
    console.log("✅ Received AI prediction result");
    console.log("📩 Request Body:", req.body);

    // ✅ Ensure the request contains all required fields
    const { image_name, predicted_class, confidence, timestamp } = req.body;

    if (!image_name || !predicted_class || !confidence || !timestamp) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Save result to MongoDB
    const newResult = new DiseaseResult({
      imageUrl: `/uploads/${image_name}`,
      diseaseName: predicted_class,
      confidence: parseFloat(confidence), // Ensure confidence is a number
      timestamp,
    });

    await newResult.save();
    res.status(201).json({ message: "Prediction saved successfully", data: newResult });
  } catch (err) {
    console.error("❌ Error saving prediction:", err);
    res.status(500).json({ error: err.message || "Error saving result" });
  }
});

// ✅ Route: Get all saved disease detection results
router.get("/results", async (req, res) => {
  try {
    const results = await DiseaseResult.find().sort({ timestamp: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Error fetching results" });
  }
});

module.exports = router;
