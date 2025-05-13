// src/screens/PlaceDetailsScreen.tsx
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
  Platform,
} from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import * as googleMapsApi from "../api/googleMapsApi";
import { Place } from "../models/placeTypes";
import { ApiError } from "../api/types";
// Removed: import { usePlaceStore } from "../state/stores/placeStore"; 
// getPhotoUrl is now directly available from googleMapsApi.ts or can be a helper

// Define the route prop type for PlaceDetailsScreen
type PlaceDetailsScreenRouteProp = RouteProp<RootStackParamList, "PlaceDetails">;
// Define the navigation prop type
type PlaceDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, "PlaceDetails">;

const screenWidth = Dimensions.get("window").width;

// Helper type guard to check for ApiError
function isApiError(response: any): response is ApiError {
  return response && typeof response.message === 'string';
}

const PlaceDetailsScreen = () => {
  const route = useRoute<PlaceDetailsScreenRouteProp>();
  const navigation = useNavigation<PlaceDetailsScreenNavigationProp>();
  const { placeId } = route.params;

  const [placeDetails, setPlaceDetails] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      const result = await googleMapsApi.getPlaceDetails(placeId);

      if (isApiError(result)) {
        setError(result.message);
      } else {
        // result is Place here
        setPlaceDetails(result);
      }
      setIsLoading(false);
    };

    fetchDetails();
  }, [placeId]);

  const handleGetDirections = () => {
    if (placeDetails) {
      // Ensure you have a Directions screen that can handle placeId or full Place object
      navigation.navigate("Directions", { placeId: placeDetails.placeId });
    }
  };

  const openMap = () => {
    if (placeDetails && placeDetails.name) {
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

  // Use the photoReference from the main Place object if available
  const mainPhotoUrl = placeDetails.photoReference 
    ? googleMapsApi.getPhotoUrl(placeDetails.photoReference, screenWidth)
    : placeDetails.photos?.[0]?.photo_reference // Fallback to first photo in array
    ? googleMapsApi.getPhotoUrl(placeDetails.photos[0].photo_reference, screenWidth)
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
            <Text style={styles.infoText}>Rating: {placeDetails.rating.toFixed(1)} ({placeDetails.userRatingsTotal || 0} reviews)</Text>
          )}
        </View>

        {placeDetails.openingHours?.open_now !== undefined && (
          <Text style={placeDetails.openingHours.open_now ? styles.openNow : styles.closedNow}>
            {placeDetails.openingHours.open_now ? "Open Now" : "Currently Closed"}
          </Text>
        )}
        
        {placeDetails.types && placeDetails.types.length > 0 && (
            <Text style={styles.infoText}>Types: {placeDetails.types.join(", ")}</Text>
        )}

        {placeDetails.priceLevel !== undefined && (
            <Text style={styles.infoText}>Price Level: {"$ ".repeat(placeDetails.priceLevel as number)}</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleGetDirections}>
          <Text style={styles.buttonText}>Get Directions to this Place</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.mapButton]} onPress={openMap}>
          <Text style={styles.buttonText}>Open in Maps</Text>
        </TouchableOpacity>

        {/* Displaying multiple photos */}
        {placeDetails.photos && placeDetails.photos.length > 1 && (
          <View>
            <Text style={styles.sectionTitle}>More Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScrollView}>
              {placeDetails.photos.map((photo, index) => {
                const photoUrl = googleMapsApi.getPhotoUrl(photo.photo_reference, 150);
                return photoUrl ? <Image key={index} source={{ uri: photoUrl }} style={styles.smallPhoto} /> : null;
              })}
            </ScrollView>
          </View>
        )}
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
    height: screenWidth * 0.6, 
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
    marginRight: 16, 
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
    backgroundColor: "#4CAF50", 
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  photoScrollView: {
    // marginTop: 10, // Already handled by sectionTitle margin
  },
  smallPhoto: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#E0E0E0", // Placeholder color
  },
});

export default PlaceDetailsScreen;
