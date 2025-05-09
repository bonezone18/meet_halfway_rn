import Geolocation, { GeoPosition, GeoError, GeoOptions } from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";
import { Location } from "../models/locationTypes";
import { reverseGeocode } from "../api/googleMapsApi"; // Assuming reverseGeocode is in googleMapsApi.ts
import { ApiError } from "../api/types";

const defaultGeoOptions: GeoOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
};

/**
 * Requests location permission for Android.
 */
const requestLocationPermissionAndroid = async (): Promise<boolean> => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "This app needs access to your location to find meeting points.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

/**
 * Service for handling device geolocation.
 */
export class GeolocationService {
  /**
   * Gets the current device location and reverse geocodes it.
   */
  static async getCurrentLocation(options: GeoOptions = defaultGeoOptions): Promise<Location | ApiError> {
    if (Platform.OS === "android") {
      const hasPermission = await requestLocationPermissionAndroid();
      if (!hasPermission) {
        return { message: "Location permission denied." };
      }
    }
    // For iOS, permission is typically handled by Info.plist configuration and system prompts
    // react-native-geolocation-service handles the prompt if not already granted.

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        async (position: GeoPosition) => {
          const { latitude, longitude } = position.coords;
          const reverseGeocodedLocation = await reverseGeocode(latitude, longitude);
          
          if ("message" in reverseGeocodedLocation) { // It's an ApiError
            // If reverse geocoding fails but we have coords, return coords with a default name
            resolve({
              latitude,
              longitude,
              name: "Current Location",
              address: "Address not found",
              isCurrentLocation: true,
            });
          } else {
            resolve({ ...reverseGeocodedLocation, isCurrentLocation: true });
          }
        },
        (error: GeoError) => {
          console.error("Geolocation Error:", error.code, error.message);
          let errorMessage = "Failed to get current location.";
          if (error.code === 1) errorMessage = "Location permission denied.";
          if (error.code === 2) errorMessage = "Location provider not available.";
          if (error.code === 3) errorMessage = "Location request timed out.";
          resolve({ message: errorMessage });
        },
        options
      );
    });
  }
}

