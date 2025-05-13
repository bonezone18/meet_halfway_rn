// import { Location, Place, PlaceSuggestion } from "../models/placeTypes"; // This was correctly commented out as unused in this file

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
  results: Array<any>; // Raw place results, to be parsed into Place model. Consider making this more specific if possible.
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
  result: {
    icon: string | undefined;
    formatted_address?: string;
    geometry: {
      location: { lat: number; lng: number };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    name?: string;
    place_id?: string;
    photos?: Array<{
      height?: number;
      html_attributions?: string[];
      photo_reference: string;
      width?: number;
    }>;
    rating?: number;
    user_ratings_total?: number;
    opening_hours?: {
      open_now?: boolean;
      periods?: Array<{
        close?: { day: number; time: string };
        open?: { day: number; time: string };
      }>;
      weekday_text?: string[];
    };
    types?: string[];
    vicinity?: string; // Often returned instead of formatted_address for some place types
    website?: string;
    international_phone_number?: string;
    price_level?: number; // Typically 0-4
    reviews?: Array<{
      author_name?: string;
      profile_photo_url?: string;
      rating?: number;
      relative_time_description?: string;
      text?: string;
      time?: number;
    }>;
    // Add any other fields you might request and use from the Google Places Details API
  };
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
