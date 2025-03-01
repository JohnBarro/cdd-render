import axios from "axios";

// Backend URLs
const FASTAPI_BASE_URL = "http://10.0.2.2:8000"; // FastAPI for AI model inference
const EXPRESS_BASE_URL = "http://10.0.2.2:5001"; // Express for MongoDB storage

const api = axios.create({
  baseURL: EXPRESS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Upload Image to FastAPI for Analysis
 * @param {string} imageUri - The URI of the image to be analyzed
 */
export const uploadImage = async (imageUri) => {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    name: "chicken_poop.jpg",
    type: "image/jpeg",
  });

  try {
    // Send the image to FastAPI for disease prediction
    const response = await axios.post(`${FASTAPI_BASE_URL}/predict/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const result = response.data;

    // If prediction is successful, send result to Express for storage
    await axios.post(`${EXPRESS_BASE_URL}/api/diseases/upload-result`, result);

    return result;
  } catch (error) {
    console.error("Upload Error:", error?.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch Disease Detection Results from Express API
 */
export const getDiseaseResults = async () => {
  try {
    const response = await api.get("/api/diseases/predictions");
    return response.data;
  } catch (error) {
    console.error("Error fetching disease results:", error?.response?.data || error.message);
    throw error;
  }
};

export default api;
