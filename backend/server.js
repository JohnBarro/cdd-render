const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;
const FASTAPI_URL = process.env.FASTAPI_URL || "http://10.0.16.240:8000/predict/";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors());
app.use(express.json()); // ✅ Ensure JSON data is properly parsed

// ✅ Import Routes
const diseaseRoutes = require("./routes/diseaseRoutes");
app.use("/api/diseases", diseaseRoutes); // Base route for disease API

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const PredictionSchema = new mongoose.Schema({
    image_name: String,
    predicted_class: String,
    confidence: Number,
    timestamp: { type: Date, default: Date.now }
});

const Prediction = mongoose.model("Prediction", PredictionSchema);

// ✅ Upload an image & send to FastAPI for prediction
app.post("/api/diseases/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            console.error("❌ No file uploaded.");
            return res.status(400).json({ error: "No file uploaded." });
        }

        console.log("📸 Processing image:", file.originalname);

        // ✅ Send image to FastAPI for prediction
        const response = await axios.post(FASTAPI_URL, file.buffer, {
            headers: { "Content-Type": file.mimetype }
        });

        const result = response.data;
        console.log("✅ Prediction received from FastAPI:", result);

        // ✅ Save to MongoDB
        const newPrediction = new Prediction({
            image_name: result.image_name,
            predicted_class: result.predicted_class,
            confidence: parseFloat(result.confidence), // Ensure confidence is a float
            timestamp: result.timestamp
        });

        await newPrediction.save();
        res.json(result);
    } catch (error) {
        console.error("❌ Error processing image:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// ✅ New route to receive results from FastAPI
app.post("/api/diseases/upload-result", async (req, res) => {
    try {
        console.log("✅ Received AI prediction result:", req.body);

        const { image_name, predicted_class, confidence, timestamp } = req.body;

        if (!image_name || !predicted_class || !confidence || !timestamp) {
            console.error("❌ Missing required fields");
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newPrediction = new Prediction({
            image_name,
            predicted_class,
            confidence: parseFloat(confidence),
            timestamp
        });

        await newPrediction.save();
        res.status(201).json({ message: "Prediction saved successfully", data: newPrediction });
    } catch (error) {
        console.error("❌ Error saving prediction:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// ✅ Fetch last 10 predictions
app.get("/api/diseases/predictions", async (req, res) => {
    try {
        const predictions = await Prediction.find().sort({ timestamp: -1 }).limit(10);
        res.json(predictions);
    } catch (error) {
        console.error("❌ Error fetching predictions:", error);
        res.status(500).json({ error: "Failed to fetch predictions." });
    }
});

// ✅ Start the server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
