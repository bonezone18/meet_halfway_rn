// ... other imports
import { getCurrentLocation } from "../../services/GeolocationService"; // Assuming this service exists
import { Location as LocationModel } from "../../models/locationTypes"; // Ensure correct path

export interface LocationState {
  locationA: LocationModel | null;
  locationB: LocationModel | null;
  isLoadingA: boolean;
  isLoadingB: boolean;
  errorA: string | null;
  errorB: string | null;
  setLocationA: (location: LocationModel) => void;
  setLocationB: (location: LocationModel) => void;
  fetchCurrentLocationA: () => Promise<void>; // Renamed and added here
  fetchCurrentLocationB: () => Promise<void>; // Renamed and added here
  // ... any other state or actions
}

export const useLocationStore = create<LocationState>((set, get) => ({
  locationA: null,
  locationB: null,
  isLoadingA: false,
  isLoadingB: false,
  errorA: null,
  errorB: null,
  setLocationA: (location) => set({ locationA: location, errorA: null }),
  setLocationB: (location) => set({ locationB: location, errorB: null }),

  fetchCurrentLocationA: async () => { // Renamed from useCurrentLocationForA
    set({ isLoadingA: true, errorA: null });
    try {
      const position = await getCurrentLocation();
      const currentLocation: LocationModel = {
        name: "Current Location A",
        address: "Fetched from device", // You might want to reverse geocode for a real address
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isCurrentLocation: true,
      };
      set({ locationA: currentLocation, isLoadingA: false });
    } catch (error: any) {
      console.error("Error fetching current location A:", error);
      set({ errorA: error.message || "Failed to fetch location", isLoadingA: false });
    }
  },

  fetchCurrentLocationB: async () => { // Renamed from useCurrentLocationForB
    set({ isLoadingB: true, errorB: null });
    try {
      const position = await getCurrentLocation();
      const currentLocation: LocationModel = {
        name: "Current Location B",
        address: "Fetched from device",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        isCurrentLocation: true,
      };
      set({ locationB: currentLocation, isLoadingB: false });
    } catch (error: any) {
      console.error("Error fetching current location B:", error);
      set({ errorB: error.message || "Failed to fetch location", isLoadingB: false });
    }
  },
  // ... other parts of your store
}));
