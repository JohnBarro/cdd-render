import React, { useState } from "react";
import { View, Image, StyleSheet, Dimensions, Alert, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Card } from "react-native-paper";

const windowHeight = Dimensions.get("window").height;

export default function MainView({ navigation }) {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState(null);

  // Updated API endpoints
  const FASTAPI_SERVER_URL = "http://10.0.2.2:8000/predict/";
  const EXPRESS_RESULTS_URL = "http://10.0.2.2:5001/api/diseases/predictions";

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to allow camera access.");
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);
      await uploadImage(imageUri);
    }
  };

  const uploadImage = async (uri) => {
    let formData = new FormData();
    formData.append("file", {
      uri: uri,
      name: `image_${Date.now()}.jpg`,
      type: "image/jpeg",
    });
  
    console.log("📤 Sending image to FastAPI:", uri);
  
    try {
      const response = await fetch(FASTAPI_SERVER_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      if (!response.ok) {
        throw new Error(`FastAPI Server Error: ${response.status}`);
      }
  
      const responseJson = await response.json();
      console.log("✅ Prediction Result:", responseJson);
  
      setDiseaseResult({
        disease: responseJson.predicted_class,
        confidence: (responseJson.confidence * 100).toFixed(2) + "%",
      });
    } catch (error) {
      console.error("❌ FastAPI Upload error:", error);
      Alert.alert("Error", "Failed to send image to FastAPI.");
    }
  };  

  return (
    <View style={styles.container}>
      <Card.Title title="Capture a Photo" />
      <Card.Content>
        <Card style={styles.imageContainer}>
          {image && <Image source={{ uri: image }} style={styles.image} />}
        </Card>
      </Card.Content>
      {uploading && (
        <View style={{ alignItems: "center", margin: 10 }}>
          <Text>Uploading...</Text>
        </View>
      )}
      {diseaseResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>🦠 Disease: {diseaseResult.disease}</Text>
          <Text style={styles.resultText}>🎯 Confidence: {diseaseResult.confidence}</Text>
        </View>
      )}

      <Button
        style={styles.btnImage}
        mode="contained"
        onPress={takePhoto}
        loading={uploading}
      >
        {uploading ? "Uploading..." : "Take a Photo"}
      </Button>
      <Button
        style={styles.btnMap}
        mode="contained"
        onPress={() => navigation.navigate("Map")}
      >
        View Map
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  btnImage: {
    margin: 10,
    backgroundColor: "#000000",
  },
  btnMap: {
    margin: 10,
    backgroundColor: "#000000",
  },
  imageContainer: {
    height: windowHeight * 0.5,
    maxHeight: 500,
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  resultContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
