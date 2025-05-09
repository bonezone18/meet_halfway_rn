import { Location, Place, PlaceSuggestion } from "../models/placeTypes";

// Types for Google Geocoding API
export interface GeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number };
    };
    place_id: string;
  }>;
  status: string; // e.g., "OK", "ZERO_RESULTS"
  error_message?: string;
}

// Types for Google Places API - Nearby Search
export interface NearbySearchResponse {
  results: Array<any>; // Raw place results, to be parsed into Place model
  status: string;
  error_message?: string;
  next_page_token?: string;
}

// Types for Google Places API - Autocomplete
export interface AutocompleteResponse {
  predictions: Array<{
    description: string;
    place_id: string;
    reference: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    terms: Array<{ offset: number; value: string }>;
    types: string[];
  }>;
  status: string;
  error_message?: string;
}

// Types for Google Places API - Details
export interface PlaceDetailsResponse {
  result: any; // Raw place details, to be parsed into Place model
  status: string;
  error_message?: string;
}

// Types for Google Directions API
export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_address: string;
      end_address: string;
      steps: Array<{
        html_instructions: string;
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        polyline: { points: string };
        travel_mode: string;
      }>;
    }>;
    overview_polyline: { points: string };
    summary: string;
  }>;
  status: string;
  error_message?: string;
}

// Generic API error structure if needed
export interface ApiError {
  message: string;
  status?: string;
}

