import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import SuperCluster from "react-native-maps-super-cluster";

export default function MapViewScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [diseaseCases, setDiseaseCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    let locationSubscription;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }
  
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 }, // Update every 10 meters
        (loc) => {
          console.log("Updated location:", loc.coords); // ✅ See real-time location updates
          setLocation(loc.coords);
          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      );
    })();
  
    return () => {
      if (locationSubscription) locationSubscription.remove(); // Cleanup on unmount
    };
  }, []);  
  // Fetch disease cases from backend
  useEffect(() => {
    const fetchDiseaseCases = async () => {
      try {
        const response = await fetch("https://your-backend-url.com/api/disease-cases");
        const data = await response.json();
        setDiseaseCases(data); // Expecting [{ latitude, longitude, diseaseName }, ...]
      } catch (error) {
        console.error("Error fetching disease cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiseaseCases();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={region}>
        {/* User's Current Location Marker */}
        {location && <Marker coordinate={location} title="Your Location" pinColor="blue" />}

        {/* Disease Case Markers with Clustering */}
        <SuperCluster
          region={region}
          data={diseaseCases}
          renderMarker={(cluster, onPress) => {
            return cluster.isCluster ? (
              <Marker coordinate={cluster.coordinate} onPress={onPress}>
                <View style={styles.clusterMarker}>
                  <Text style={styles.clusterText}>{cluster.pointCount}</Text>
                </View>
              </Marker>
            ) : (
              <Marker coordinate={cluster.coordinate} title={cluster.item.diseaseName} pinColor="red" />
            );
          }}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  clusterMarker: { backgroundColor: "rgba(255, 0, 0, 0.8)", padding: 10, borderRadius: 20 },
  clusterText: { color: "white", fontWeight: "bold" },
});
