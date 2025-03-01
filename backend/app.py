import os
import io
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from tensorflow.keras.models import load_model
from PIL import Image
import certifi
import aiohttp
import logging
from datetime import datetime
from bson.objectid import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure MongoDB credentials using environment variables
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://johnbarro48:6oC2myyvIomEgJfS@poultrydetect.xc9z7.mongodb.net/?retryWrites=true&w=majority&appName=PoultryDetect")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is not set!")

EXPRESS_BACKEND_URL = os.getenv("EXPRESS_BACKEND_URL", "http://10.0.16.240:5001")
if not EXPRESS_BACKEND_URL:
    raise RuntimeError("EXPRESS_BACKEND_URL environment variable is not set!")

# Connect to MongoDB
client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["chicken_disease_db"]
predictions_collection = db["predictions"]

# Load the trained model
try:
    model = load_model("chicken_disease_model.h5", compile=False)
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
    logging.info("Model loaded successfully.")
except Exception as e:
    logging.error(f"Error loading model: {e}")
    raise RuntimeError("Failed to load the AI model.")

# Class labels
CLASS_NAMES = ["Coccidiosis", "Healthy", "New Castle Disease", "Salmonella"]
CONFIDENCE_THRESHOLD = 0.7

def preprocess_image(image_data):
    try:
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0  # Normalize
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        return img_array
    except Exception as e:
        logging.error(f"Image preprocessing error: {e}")
        raise HTTPException(status_code=400, detail="Invalid image format.")

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        img_array = preprocess_image(image_data)
        prediction = model.predict(img_array)
        max_confidence = float(np.max(prediction))
        predicted_index = np.argmax(prediction)

        predicted_class = "Not Chicken Poop" if max_confidence < CONFIDENCE_THRESHOLD else CLASS_NAMES[predicted_index]

        result = {
            "image_name": file.filename,
            "predicted_class": predicted_class,
            "confidence": max_confidence,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Save prediction to MongoDB
        inserted_result = await predictions_collection.insert_one(result)
        result["_id"] = str(inserted_result.inserted_id)  # Convert ObjectId to string
        logging.info(f"Saved prediction to MongoDB: {result}")

        # Send result to Express backend asynchronously
        response_data = {"message": "Not sent to Express"}
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(f"{EXPRESS_BACKEND_URL}/api/diseases/upload-result", json=result) as response:
                    response_data = await response.json()
                    logging.info("Data successfully sent to Express backend.")
            except aiohttp.ClientError as e:
                logging.error(f"Error sending data to Express: {e}")

        return {
            "image_name": file.filename,
            "predicted_class": predicted_class,
            "confidence": max_confidence,
            "express_response": response_data,
        }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logging.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@app.get("/predictions/")
async def get_predictions():
    try:
        predictions = await predictions_collection.find({}, {"_id": 1, "image_name": 1, "predicted_class": 1, "confidence": 1, "timestamp": 1}).to_list(None)
        for prediction in predictions:
            prediction["_id"] = str(prediction["_id"])  # Convert ObjectId to string
        return predictions
    except Exception as e:
        logging.error(f"Error fetching predictions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch predictions.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
