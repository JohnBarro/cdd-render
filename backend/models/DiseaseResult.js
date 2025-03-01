const mongoose = require("mongoose");

const DiseaseResultSchema = new mongoose.Schema({
  image_url: { type: String, required: true }, 
  predicted_disease: { type: String, required: true }, 
  confidence: { type: Number, required: true }, 
  location: {
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false }
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DiseaseResult", DiseaseResultSchema);
