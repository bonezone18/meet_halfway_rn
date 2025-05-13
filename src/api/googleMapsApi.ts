// src/api/googleMapsApi.ts
import axios from "axios";
import env from "../config/env";
import { Location, Place, PlaceSuggestion } from "../models/placeTypes"; // Ensure Place is imported
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
}) ;

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

// ... (geocodeAddress, reverseGeocode, getPlaceSuggestions remain the same)

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
        name: address, 
      };
    }
    return { message: response.data.error_message || `Failed to geocode: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to geocode address");
  }
};

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
        name: response.data.results[0].formatted_address.split(",")[0],
        isCurrentLocation: true, 
      };
    }
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
 * Returns a full Place object or an ApiError.
 */
export const getPlaceDetails = async (placeId: string): Promise<Place | ApiError> => {
  if (!GOOGLE_MAPS_API_KEY) return { message: "API key is missing" };
  try {
    const response = await apiClient.get<PlaceDetailsResponse>("/place/details/json", {
      params: {
        place_id: placeId,
        // Request fields needed for the Place model
        fields: "place_id,name,formatted_address,geometry,vicinity,photos,rating,user_ratings_total,opening_hours,types,price_level,website,international_phone_number,reviews,icon_mask_base_uri,icon_background_color,icon"
      },
    });

    if (response.data.status === "OK") {
      const { result } = response.data;
      // Map the API result to our Place model
      const place: Place = {
        placeId: result.place_id || placeId, // Ensure placeId is set
        name: result.name || "Unknown Place",
        address: result.formatted_address || result.vicinity,
        vicinity: result.vicinity,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        rating: result.rating,
        userRatingsTotal: result.user_ratings_total,
        photos: result.photos, // This is an array of photo objects from API
        photoReference: result.photos?.[0]?.photo_reference, // Keep for convenience if needed for a primary photo
        openingHours: result.opening_hours ? {
          open_now: result.opening_hours.open_now,
          weekday_text: result.opening_hours.weekday_text,
        } : undefined,
        types: result.types || [],
        priceLevel: result.price_level,
        icon: result.icon, // Google Places icon URL
        // distanceFromMidpoint will be calculated later if needed, not available from this API directly
        distanceFromMidpoint: 0, // Placeholder or remove if not set here
      };
      return place;
    }
    return { message: response.data.error_message || `Failed to get place details: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to fetch place details");
  }
};

// ... (searchNearbyPlaces, getPhotoUrl, getDirections, getStaticMapUrl remain the same or can be reviewed separately)

export const searchNearbyPlaces = async (
  location: Location,
  radius: number = 5000, 
  type?: string 
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
        address: p.formatted_address, 
        rating: p.rating,
        userRatingsTotal: p.user_ratings_total,
        photoReference: p.photos?.[0]?.photo_reference,
        photos: p.photos,
        openingHours: p.opening_hours,
        types: p.types,
        priceLevel: p.price_level,
        icon: p.icon,
        distanceFromMidpoint: 0, 
      }));
    }
    if (response.data.status === "ZERO_RESULTS") return [];
    return { message: response.data.error_message || `Failed to search places: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to search nearby places");
  }
};

export const getPhotoUrl = (photoReference: string, maxWidth: number = 400): string | null => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("API key is missing for photo URL");
    return null;
  }
  return `${BASE_URL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
};

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
      return response.data.routes[0].legs[0]; 
    }
    if (response.data.status === "ZERO_RESULTS") return { message: "No routes found", status: "ZERO_RESULTS" };
    return { message: response.data.error_message || `Failed to get directions: ${response.data.status}`, status: response.data.status };
  } catch (error) {
    return handleApiError(error, "Failed to fetch directions");
  }
};

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
  return `${BASE_URL}/staticmap?size=${width}x${height}&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
};
