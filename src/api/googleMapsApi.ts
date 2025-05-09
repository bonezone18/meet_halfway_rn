import axios from "axios";
import env from "../config/env";
import { Location } from "../models/locationTypes";
import { Place, PlaceSuggestion } from "../models/placeTypes";
import {
  GeocodingResponse,
  NearbySearchResponse,
  AutocompleteResponse,
  PlaceDetailsResponse,
  DirectionsResponse,
  ApiError,
} from "./types";

const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  params: {
    key: GOOGLE_MAPS_API_KEY,
  },
});

const handleApiError = (error: any, defaultMessage: string): ApiError => {
  if (axios.isAxiosError(error) && error.response) {
    console.error("API Error:", error.response.data);
    return {
      message: error.response.data?.error_message || error.response.data?.status || defaultMessage,
      status: error.response.data?.status,
    };
  }
  console.error("Network/Request Error:", error);
  return { message: error.message || defaultMessage };
};

/**
 * Geocodes a human-readable address into geographic coordinates.
 */
export const geocodeAddress = async (address: string): Promise<Location | ApiError> => {
  if (!GOOGLE_MAPS_API_KEY) return { message: "API key is missing" };
  try {
    const response = await apiClient.get<GeocodingResponse>("/geocode/json", {
      params: { address },
    });
    if (response.data.status === "OK" && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return {
        latitude: lat,
        longitude: lng,
        address: response.data.results[0].formatted_address,
        name: address, // Or derive a better name if possible
      };
    }
    return { message: response.data.error_message || `Failed to geocode: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to geocode address");
  }
};

/**
 * Converts geographic coordinates to a human-readable address.
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<Location | ApiError> => {
  if (!GOOGLE_MAPS_API_KEY) return { message: "API key is missing" };
  try {
    const response = await apiClient.get<GeocodingResponse>("/geocode/json", {
      params: { latlng: `${latitude},${longitude}` },
    });
    if (response.data.status === "OK" && response.data.results.length > 0) {
      return {
        latitude,
        longitude,
        address: response.data.results[0].formatted_address,
        name: response.data.results[0].formatted_address.split(",")[0], // Use first part of address as name
        isCurrentLocation: true, // Assuming this is used for current location reverse geocoding
      };
    }
    // Fallback if no address found but coordinates are valid
    if (response.data.status === "ZERO_RESULTS") {
        return {
            latitude,
            longitude,
            address: "Unknown location",
            name: "Current Location",
            isCurrentLocation: true,
        };
    }
    return { message: response.data.error_message || `Failed to reverse geocode: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to reverse geocode coordinates");
  }
};

/**
 * Gets place autocomplete suggestions based on user input.
 */
export const getPlaceSuggestions = async (input: string): Promise<PlaceSuggestion[] | ApiError> => {
  if (!GOOGLE_MAPS_API_KEY) return { message: "API key is missing" };
  if (input.trim().length === 0) return [];
  try {
    const response = await apiClient.get<AutocompleteResponse>("/place/autocomplete/json", {
      params: { input },
    });
    if (response.data.status === "OK") {
      return response.data.predictions.map((p) => ({
        description: p.description,
        place_id: p.place_id,
      }));
    }
    if (response.data.status === "ZERO_RESULTS") return [];
    return { message: response.data.error_message || `Failed to get suggestions: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to fetch place suggestions");
  }
};

/**
 * Retrieves detailed information for a specific place using its place ID.
 */
export const getPlaceDetails = async (placeId: string): Promise<Location | ApiError> => {
  if (!GOOGLE_MAPS_API_KEY) return { message: "API key is missing" };
  try {
    const response = await apiClient.get<PlaceDetailsResponse>("/place/details/json", {
      params: {
        place_id: placeId,
        fields: "formatted_address,geometry,name", // Add more fields as needed from Place model
      },
    });
    if (response.data.status === "OK") {
      const { result } = response.data;
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
        name: result.name,
      };
    }
    return { message: response.data.error_message || `Failed to get place details: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to fetch place details");
  }
};

/**
 * Searches for places near the specified midpoint location.
 * Note: This is a simplified version. The original Flutter app had more complex logic for types and radius.
 */
export const searchNearbyPlaces = async (
  location: Location,
  radius: number = 5000, // in meters
  type?: string // e.g., "restaurant", "cafe"
): Promise<Place[] | ApiError> => {
  if (!GOOGLE_MAPS_API_KEY) return { message: "API key is missing" };
  try {
    const params: any = {
      location: `${location.latitude},${location.longitude}`,
      radius,
    };
    if (type) params.type = type;

    const response = await apiClient.get<NearbySearchResponse>("/place/nearbysearch/json", { params });

    if (response.data.status === "OK") {
      return response.data.results.map((p: any) => ({
        placeId: p.place_id,
        name: p.name,
        latitude: p.geometry.location.lat,
        longitude: p.geometry.location.lng,
        vicinity: p.vicinity,
        address: p.formatted_address, // Nearby search might not return formatted_address, vicinity is more common
        rating: p.rating,
        userRatingsTotal: p.user_ratings_total,
        photoReference: p.photos?.[0]?.photo_reference,
        photos: p.photos,
        openingHours: p.opening_hours,
        types: p.types,
        priceLevel: p.price_level,
        icon: p.icon,
        // Distance from midpoint needs to be calculated separately if this function is called with the midpoint
        // The original Flutter app calculated this in the PlaceService/Provider after fetching.
        distanceFromMidpoint: 0, // Placeholder, to be calculated later
      }));
    }
    if (response.data.status === "ZERO_RESULTS") return [];
    return { message: response.data.error_message || `Failed to search places: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to search nearby places");
  }
};

/**
 * Constructs the URL for retrieving a place photo.
 */
export const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string | null => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("API key is missing for photo URL");
    return null;
  }
  return `${BASE_URL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
};

/**
 * Fetches route directions and travel time between two locations.
 */
export const getDirections = async (
  origin: Location,
  destination: Location,
  mode: string = "driving"
): Promise<DirectionsResponse["routes"][0]["legs"][0] | ApiError> => {
  if (!GOOGLE_MAPS_API_KEY) return { message: "API key is missing" };
  try {
    const response = await apiClient.get<DirectionsResponse>("/directions/json", {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode,
      },
    });
    if (response.data.status === "OK" && response.data.routes.length > 0) {
      return response.data.routes[0].legs[0]; // Return the first leg of the first route
    }
    if (response.data.status === "ZERO_RESULTS") return { message: "No routes found", status: "ZERO_RESULTS" };
    return { message: response.data.error_message || `Failed to get directions: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to fetch directions");
  }
};

/**
 * Constructs a URL for a Google Static Maps API image.
 */
export const getStaticMapUrl = (
  origin: Location,
  destination: Location,
  midpoint: Location,
  width: number = 600,
  height: number = 300
): string | null => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("API key is missing for static map URL");
    return null;
  }
  const markers = 
    `markers=color:red|label:A|${origin.latitude},${origin.longitude}` +
    `&markers=color:green|label:M|${midpoint.latitude},${midpoint.longitude}` +
    `&markers=color:blue|label:B|${destination.latitude},${destination.longitude}`;
  // Path can be added if needed, simplified for now
  // const path = `path=color:0x0000ff|weight:5|${origin.latitude},${origin.longitude}|${midpoint.latitude},${midpoint.longitude}|${destination.latitude},${destination.longitude}`;
  return `${BASE_URL}/staticmap?size=${width}x${height}&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
};

