import { create } from "zustand";
import { Location } from "../../models/locationTypes";
import * as googleMapsApi from "../../api/googleMapsApi";
import { DirectionsResponse, ApiError } from "../../api/types";

interface DirectionsData {
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
}

interface DirectionsState {
  directionsDataA: DirectionsData | null;
  directionsDataB: DirectionsData | null;
  isLoadingA: boolean;
  isLoadingB: boolean;
  error: string | null;
  getDirectionsFromA: (locationA: Location, destination: Location, mode?: string) => Promise<void>;
  getDirectionsFromB: (locationB: Location, destination: Location, mode?: string) => Promise<void>;
  getDirectionsUrlFromA: (locationA: Location, destination: Location, mode?: string) => string | null;
  getDirectionsUrlFromB: (locationB: Location, destination: Location, mode?: string) => string | null;
  getStaticMapUrl: (locationA: Location, locationB: Location, meetingPlace: Location, width?: number, height?: number) => string | null;
  clearDirections: () => void;
  clearError: () => void;
}

export const useDirectionsStore = create<DirectionsState>((set, get) => ({
  directionsDataA: null,
  directionsDataB: null,
  isLoadingA: false,
  isLoadingB: false,
  error: null,

  getDirectionsFromA: async (locationA, destination, mode = "driving") => {
    set({ isLoadingA: true, error: null });
    const result = await googleMapsApi.getDirections(locationA, destination, mode);
    if ("message" in result) { // ApiError
      set({ isLoadingA: false, error: result.message, directionsDataA: null });
    } else {
      set({ directionsDataA: result as DirectionsData, isLoadingA: false });
    }
  },

  getDirectionsFromB: async (locationB, destination, mode = "driving") => {
    set({ isLoadingB: true, error: null });
    const result = await googleMapsApi.getDirections(locationB, destination, mode);
    if ("message" in result) { // ApiError
      set({ isLoadingB: false, error: result.message, directionsDataB: null });
    } else {
      set({ directionsDataB: result as DirectionsData, isLoadingB: false });
    }
  },

  getDirectionsUrlFromA: (locationA, destination, mode = "driving") => {
    // This was part of DirectionsService in Flutter, now directly constructing the URL
    // The actual launching will be handled by Linking module in the component.
    return `https://www.google.com/maps/dir/?api=1&origin=${locationA.latitude},${locationA.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=${mode}`;
  },

  getDirectionsUrlFromB: (locationB, destination, mode = "driving") => {
    return `https://www.google.com/maps/dir/?api=1&origin=${locationB.latitude},${locationB.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=${mode}`;
  },
  
  getStaticMapUrl: (locationA, locationB, meetingPlace, width = 600, height = 300) => {
    return googleMapsApi.getStaticMapUrl(locationA, locationB, meetingPlace, width, height);
  },

  clearDirections: () => set({ 
    directionsDataA: null, 
    directionsDataB: null, 
    isLoadingA: false, 
    isLoadingB: false, 
    error: null 
  }),
  
  clearError: () => set({ error: null }),
}));

