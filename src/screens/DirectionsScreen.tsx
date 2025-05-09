import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useLocationStore } from "../state/stores/locationStore";
import { useDirectionsStore } from "../state/stores/directionsStore";
import { usePlaceStore } from "../state/stores/placeStore"; // To get place details if needed
import { Location } from "../models/locationTypes";
import { Place } from "../models/placeTypes";

// Define the route prop type for DirectionsScreen
type DirectionsScreenRouteProp = RouteProp<RootStackParamList, "Directions">;
// Define the navigation prop type
type DirectionsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Directions">;

const screenWidth = Dimensions.get("window").width;

const DirectionsScreen = () => {
  const route = useRoute<DirectionsScreenRouteProp>();
  const navigation = useNavigation<DirectionsScreenNavigationProp>();
  const { placeId } = route.params;

  const { locationA, locationB } = useLocationStore();
  const {
    directionsDataA,
    directionsDataB,
    isLoadingA: isLoadingDirectionsA,
    isLoadingB: isLoadingDirectionsB,
    error: directionsError,
    getDirectionsFromA,
    getDirectionsFromB,
    getDirectionsUrlFromA,
    getDirectionsUrlFromB,
    getStaticMapUrl,
    clearDirections,
    clearError: clearDirectionsError,
  } = useDirectionsStore();
  
  // We need the target place details (name, lat, long) to calculate directions to it.
  // This might come from the placeStore if already fetched, or we might need a specific fetch here.
  const { places, getPhotoUrl } = usePlaceStore(); // Assuming places array in placeStore might have it
  const [targetPlace, setTargetPlace] = useState<Place | Location | null>(null);
  const [isLoadingTargetPlace, setIsLoadingTargetPlace] = useState(true);
  const [staticMapUri, setStaticMapUri] = useState<string | null>(null);

  useEffect(() => {
    // Find the target place from the store or fetch its minimal details
    const foundPlace = places.find(p => p.placeId === placeId);
    if (foundPlace) {
      setTargetPlace(foundPlace);
      setIsLoadingTargetPlace(false);
    } else {
      // If not in store, fetch minimal details (name, lat, long) for the placeId
      // This requires an API call, e.g., a simplified getPlaceDetails from googleMapsApi
      // For now, let's assume it might be missing or we need a dedicated fetch.
      // Placeholder: if not found, user might need to go back. Or we fetch it.
      // This part is crucial and might need adjustment based on how place details are managed.
      console.warn(`Place with ID ${placeId} not found in store. Fetching details...`);
      // Simulate fetching basic details for now if not found
      // In a real app, you would call an API like googleMapsApi.getPlaceDetails(placeId)
      // and ensure it returns at least { name, latitude, longitude }
      const fetchMinimalDetails = async () => {
        // This is a conceptual fetch. Replace with actual API call.
        // const minimalDetails = await someApi.getMinimalPlaceDetails(placeId);
        // if (minimalDetails) setTargetPlace(minimalDetails);
        // else setError("Target place details could not be fetched.");
        setIsLoadingTargetPlace(false); // For now, assume it might fail or not be implemented
        setTargetPlace(null); // Or set an error
      };
      fetchMinimalDetails();
    }
    return () => {
        clearDirections();
        clearDirectionsError();
    }
  }, [placeId, places]);

  useEffect(() => {
    if (targetPlace && locationA && locationB) {
      getDirectionsFromA(locationA, targetPlace as Location);
      getDirectionsFromB(locationB, targetPlace as Location);
      const mapUrl = getStaticMapUrl(locationA, locationB, targetPlace as Location, Math.floor(screenWidth - 40));
      setStaticMapUri(mapUrl);
    }
  }, [targetPlace, locationA, locationB, getDirectionsFromA, getDirectionsFromB, getStaticMapUrl]);

  const openDirectionsInMap = (isLocationA: boolean) => {
    let url: string | null = null;
    if (targetPlace && locationA && isLocationA) {
      url = getDirectionsUrlFromA(locationA, targetPlace as Location);
    } else if (targetPlace && locationB && !isLocationA) {
      url = getDirectionsUrlFromB(locationB, targetPlace as Location);
    }
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  if (isLoadingTargetPlace) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /><Text>Loading place information...</Text></View>;
  }

  if (!targetPlace) {
    return <View style={styles.centered}><Text style={styles.errorText}>Could not load details for the selected place. Please try again.</Text></View>;
  }
  
  const renderDirectionDetails = (title: string, data: typeof directionsDataA, isLoading: boolean, isLocationA: boolean) => {
    if (isLoading) return <View style={styles.directionBox}><ActivityIndicator /><Text>Loading directions for {title}...</Text></View>;
    if (!data) return <View style={styles.directionBox}><Text>Directions for {title} not available.</Text></View>;
    return (
      <View style={styles.directionBox}>
        <Text style={styles.directionTitle}>{title} to {targetPlace?.name}</Text>
        <Text>Distance: {data.distance.text}</Text>
        <Text>Duration: {data.duration.text}</Text>
        <TouchableOpacity style={styles.mapButton} onPress={() => openDirectionsInMap(isLocationA)}>
          <Text style={styles.buttonText}>Open in Maps</Text>
        </TouchableOpacity>
        {/* Optional: Display steps data.steps.map(...) */}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.headerTitle}>Directions to {targetPlace?.name}</Text>
        
        {staticMapUri ? (
          <Image source={{ uri: staticMapUri }} style={styles.mapImage} resizeMode="contain" />
        ) : (
          <View style={styles.mapPlaceholder}><Text>Loading map...</Text></View>
        )}

        {directionsError && <Text style={styles.errorText}>Error fetching directions: {directionsError}</Text>}

        {locationA && renderDirectionDetails("Your Location (A)", directionsDataA, isLoadingDirectionsA, true)}
        {locationB && renderDirectionDetails("Friend's Location (B)", directionsDataB, isLoadingDirectionsB, false)}
        
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentContainer: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  mapImage: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 0.6, // Adjust aspect ratio as needed
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: "center",
  },
  mapPlaceholder: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 0.6,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  directionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  directionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#007AFF",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  mapButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default DirectionsScreen;

