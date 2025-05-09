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
  Dimensions,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import * as googleMapsApi from "../api/googleMapsApi";
import { Place } from "../models/placeTypes"; // Assuming full Place model is fetched or constructed
import { ApiError } from "../api/types";
import { usePlaceStore } from "../state/stores/placeStore"; // For getPhotoUrl

// Define the route prop type for PlaceDetailsScreen
type PlaceDetailsScreenRouteProp = RouteProp<RootStackParamList, "PlaceDetails">;
// Define the navigation prop type
type PlaceDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, "PlaceDetails">;

const screenWidth = Dimensions.get("window").width;

const PlaceDetailsScreen = () => {
  const route = useRoute<PlaceDetailsScreenRouteProp>();
  const navigation = useNavigation<PlaceDetailsScreenNavigationProp>();
  const { placeId } = route.params;

  const [placeDetails, setPlaceDetails] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPhotoUrl } = usePlaceStore(); // Accessing getPhotoUrl from the store

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      // The getPlaceDetails in googleMapsApi.ts currently returns a simplified Location object.
      // It needs to be augmented to return a full Place object or we fetch more details here.
      // For now, let's assume googleMapsApi.getPlaceDetails is updated to fetch comprehensive details.
      // Or, we can use the existing place data from the store if it was already fetched comprehensively.
      // Let's assume a more detailed fetch:
      const result = await googleMapsApi.searchNearbyPlaces({latitude: 0, longitude: 0}, 1, undefined); // This is a placeholder call
      // A better approach would be a dedicated getFullPlaceDetails(placeId) in googleMapsApi.ts
      // For demonstration, we will simulate fetching more details or assume the store has them.
      // This part needs refinement based on actual API capabilities for full details.

      // Let's try to get full details using a more specific API call if available or construct it.
      // This is a conceptual adaptation. The `googleMapsApi.getPlaceDetails` was simplified.
      // We need a function that returns the full `Place` model structure.
      // For now, we will mock this part or assume a more robust `getPlaceDetails`.

      // Simulate fetching full place details. In a real app, this would be a dedicated API call.
      // This is a simplified placeholder for fetching full details.
      // We will use the existing getPlaceDetails and augment it conceptually.
      const detailsResponse = await googleMapsApi.getPlaceDetails(placeId); // This returns Location like object
      
      if (!("message" in detailsResponse)) {
        // Augment with more details if possible, or ensure getPlaceDetails returns more.
        // This is a conceptual step. The actual implementation depends on how `googleMapsApi.getPlaceDetails` is structured.
        // For now, we will use what we have and add placeholders for other fields.
        const fetchedPlace: Place = {
            placeId: placeId,
            name: detailsResponse.name || "Unknown Place",
            address: detailsResponse.address,
            latitude: detailsResponse.latitude,
            longitude: detailsResponse.longitude,
            // These would come from a more detailed API response:
            rating: Math.random() * 5, // Mocked
            userRatingsTotal: Math.floor(Math.random() * 1000), // Mocked
            photos: [{photo_reference: "mock_photo_ref"}], // Mocked, use actual from API
            openingHours: {open_now: Math.random() > 0.5}, // Mocked
            types: ["mock_type"], // Mocked
            distanceFromMidpoint: 0, // Not relevant here or needs to be passed
        };
        setPlaceDetails(fetchedPlace);
      } else {
        setError(detailsResponse.message);
      }
      setIsLoading(false);
    };

    fetchDetails();
  }, [placeId]);

  const handleGetDirections = () => {
    if (placeDetails) {
      navigation.navigate("Directions", { placeId: placeDetails.placeId });
    }
  };

  const openMap = () => {
    if (placeDetails) {
      const scheme = Platform.OS === "ios" ? "maps:0,0?q=" : "geo:0,0?q=";
      const latLng = `${placeDetails.latitude},${placeDetails.longitude}`;
      const label = encodeURIComponent(placeDetails.name);
      const url = Platform.OS === "ios" ? `${scheme}${label}@${latLng}` : `${scheme}${latLng}(${label})`;
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>Error: {error}</Text></View>;
  }

  if (!placeDetails) {
    return <View style={styles.centered}><Text>Place details not found.</Text></View>;
  }

  const mainPhotoUrl = placeDetails.photos?.[0]?.photo_reference 
    ? getPhotoUrl({ ...placeDetails, photoReference: placeDetails.photos[0].photo_reference }, screenWidth)
    : null;

  return (
    <ScrollView style={styles.container}>
      {mainPhotoUrl && (
        <Image source={{ uri: mainPhotoUrl }} style={styles.headerImage} />
      )}
      <View style={styles.contentContainer}>
        <Text style={styles.placeName}>{placeDetails.name}</Text>
        {placeDetails.address && <Text style={styles.address}>{placeDetails.address}</Text>}
        
        <View style={styles.infoRow}>
          {placeDetails.rating !== undefined && (
            <Text style={styles.infoText}>Rating: {placeDetails.rating.toFixed(1)} ({placeDetails.userRatingsTotal} reviews)</Text>
          )}
        </View>

        {placeDetails.openingHours?.open_now !== undefined && (
          <Text style={placeDetails.openingHours.open_now ? styles.openNow : styles.closedNow}>
            {placeDetails.openingHours.open_now ? "Open Now" : "Currently Closed"}
          </Text>
        )}
        
        {/* Add more details like types, price level etc. as available */}
        {placeDetails.types && placeDetails.types.length > 0 && (
            <Text style={styles.infoText}>Types: {placeDetails.types.join(", ")}</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleGetDirections}>
          <Text style={styles.buttonText}>Get Directions to this Place</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.mapButton]} onPress={openMap}>
          <Text style={styles.buttonText}>Open in Maps</Text>
        </TouchableOpacity>

        {/* Placeholder for more photos if available */}
        {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScrollView}>
          {placeDetails.photos?.slice(1).map((photo, index) => {
            const photoUrl = getPhotoUrl({ ...placeDetails, photoReference: photo.photo_reference }, 150);
            return photoUrl ? <Image key={index} source={{ uri: photoUrl }} style={styles.smallPhoto} /> : null;
          })}
        </ScrollView> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  headerImage: {
    width: screenWidth,
    height: screenWidth * 0.6, // Aspect ratio for the image
    resizeMode: "cover",
  },
  contentContainer: {
    padding: 20,
  },
  placeName: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  address: {
    fontSize: 16,
    color: "#555",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#444",
    marginRight: 16, // Spacing between info items
    marginBottom: 4,
  },
  openNow: {
    fontSize: 15,
    color: "green",
    fontWeight: "bold",
    marginBottom: 12,
  },
  closedNow: {
    fontSize: 15,
    color: "red",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  mapButton: {
    backgroundColor: "#4CAF50", // Green for map button
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  photoScrollView: {
    marginTop: 20,
  },
  smallPhoto: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
});

export default PlaceDetailsScreen;

