import { create } from "zustand";
import { Place, PlaceSuggestion } from "../../models/placeTypes";
import { Location } from "../../models/locationTypes";
import * as googleMapsApi from "../../api/googleMapsApi";
import { ApiError } from "../../api/types";
import { MidpointCalculator } from "../../services/MidpointCalculator";

export enum SortOption {
  distance = "distance",
  rating = "rating",
  priceAsc = "priceAsc",
  priceDesc = "priceDesc",
}

interface PlaceState {
  places: Place[];
  filteredPlaces: Place[];
  isLoading: boolean;
  error: string | null;
  selectedCategories: Set<string>;
  sortOption: SortOption;
  searchPlaces: (midpoint: Location, locationA: Location, locationB: Location) => Promise<void>;
  toggleCategory: (category: string) => void;
  clearCategoryFilters: () => void;
  resetCategoryFilters: () => void;
  setSortOption: (option: SortOption) => void;
  getPlaceSuggestions: (input: string) => Promise<PlaceSuggestion[] | ApiError>;
  getPhotoUrl: (place: Place, maxWidth?: number) => string | null;
  clearError: () => void;
}

const defaultCategories = new Set(["cafe", "restaurant", "bar"]);

const applyFiltersAndSort = (places: Place[], categories: Set<string>, sortOpt: SortOption): Place[] => {
  let updated = [...places];

  if (categories.size > 0) {
    updated = updated.filter((place) => 
      place.types.some(type => categories.has(type))
    );
  }

  switch (sortOpt) {
    case SortOption.distance:
      updated.sort((a, b) => a.distanceFromMidpoint - b.distanceFromMidpoint);
      break;
    case SortOption.rating:
      // Sort by rating descending, nulls last
      updated.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
      break;
    case SortOption.priceAsc:
      // Ensure priceLevel is treated consistently (e.g., as numbers or specific strings)
      updated.sort((a, b) => 
        (typeof a.priceLevel === "number" ? a.priceLevel : 5) - 
        (typeof b.priceLevel === "number" ? b.priceLevel : 5)
      );
      break;
    case SortOption.priceDesc:
      updated.sort((a, b) => 
        (typeof b.priceLevel === "number" ? b.priceLevel : -1) - 
        (typeof a.priceLevel === "number" ? a.priceLevel : -1)
      );
      break;
  }
  return updated;
};

export const usePlaceStore = create<PlaceState>((set, get) => ({
  places: [],
  filteredPlaces: [],
  isLoading: false,
  error: null,
  selectedCategories: new Set(defaultCategories), // Initialize with default categories
  sortOption: SortOption.distance,

  searchPlaces: async (midpoint, locationA, locationB) => {
    set({ isLoading: true, error: null });
    try {
      const distanceKm = MidpointCalculator.calculateDistance(locationA, locationB);
      let radius = (distanceKm / 2 * 1000).clamp(3000.0, 50000.0); // Clamp between 3km-50km

      const currentSelectedCategories = get().selectedCategories;
      const categoriesToSearch = currentSelectedCategories.size > 0 ? Array.from(currentSelectedCategories) : Array.from(defaultCategories);

      let allResults: Place[] = [];

      // Initial search with selected/default categories
      const searchPromises = categoriesToSearch.map(category =>
        googleMapsApi.searchNearbyPlaces(midpoint, radius, category)
      );
      const settledResults = await Promise.allSettled(searchPromises);
      
      settledResults.forEach(result => {
        if (result.status === "fulfilled" && !("message" in result.value)) {
          allResults.push(...(result.value as Place[]));
        }
      });
      
      // If no results and specific categories were selected, try with default categories
      if (allResults.length === 0 && currentSelectedCategories.size > 0 && currentSelectedCategories !== defaultCategories) {
        const defaultSearchPromises = Array.from(defaultCategories).map(category => 
            googleMapsApi.searchNearbyPlaces(midpoint, radius, category)
        );
        const defaultSettledResults = await Promise.allSettled(defaultSearchPromises);
        defaultSettledResults.forEach(result => {
            if (result.status === "fulfilled" && !("message" in result.value)) {
                allResults.push(...(result.value as Place[]));
            }
        });
      }

      // Escalate radius if still no results
      if (allResults.length === 0) {
        for (const newRadius of [50000.0]) { // Max radius as per original logic (100km was clamped to 50km)
            const escalationPromises = categoriesToSearch.map(category =>
                googleMapsApi.searchNearbyPlaces(midpoint, newRadius, category)
            );
            const escalationSettledResults = await Promise.allSettled(escalationPromises);
            escalationSettledResults.forEach(result => {
                if (result.status === "fulfilled" && !("message" in result.value)) {
                    allResults.push(...(result.value as Place[]));
                }
            });
            if (allResults.length > 0) break;
        }
      }

      // Remove duplicates and update distances
      const uniquePlacesMap = new Map<string, Place>();
      allResults.forEach(place => {
        const dist = MidpointCalculator.calculateDistance(midpoint, { latitude: place.latitude, longitude: place.longitude });
        uniquePlacesMap.set(place.placeId, { ...place, distanceFromMidpoint: dist });
      });
      const uniquePlaces = Array.from(uniquePlacesMap.values());

      if (uniquePlaces.length === 0) {
        set({ places: [], filteredPlaces: [], isLoading: false, error: `No places found within ${(radius / 1000).toFixed(0)} km.` });
      } else {
        const filtered = applyFiltersAndSort(uniquePlaces, get().selectedCategories, get().sortOption);
        set({ places: uniquePlaces, filteredPlaces: filtered, isLoading: false });
      }

    } catch (e: any) {
      set({ isLoading: false, error: `Failed to load places: ${e.message}` });
    }
  },

  toggleCategory: (category) => {
    const currentCategories = new Set(get().selectedCategories);
    if (currentCategories.has(category)) {
      currentCategories.delete(category);
    } else {
      currentCategories.add(category);
    }
    const filtered = applyFiltersAndSort(get().places, currentCategories, get().sortOption);
    set({ selectedCategories: currentCategories, filteredPlaces: filtered });
  },

  clearCategoryFilters: () => {
    const filtered = applyFiltersAndSort(get().places, new Set(), get().sortOption);
    set({ selectedCategories: new Set(), filteredPlaces: filtered });
  },
  
  resetCategoryFilters: () => {
    const filtered = applyFiltersAndSort(get().places, new Set(defaultCategories), get().sortOption);
    set({ selectedCategories: new Set(defaultCategories), filteredPlaces: filtered });
  },

  setSortOption: (option) => {
    const filtered = applyFiltersAndSort(get().places, get().selectedCategories, option);
    set({ sortOption: option, filteredPlaces: filtered });
  },

  getPlaceSuggestions: async (input) => {
    return googleMapsApi.getPlaceSuggestions(input);
  },

  getPhotoUrl: (place, maxWidth = 400) => {
    if (!place.photoReference) return null;
    return googleMapsApi.getPhotoUrl(place.photoReference, maxWidth);
  },
  
  clearError: () => set({ error: null }),
}));

// Helper extension for clamping numbers (not available in JS by default)
(Number.prototype as any).clamp = function(min: number, max: number) {
  return Math.min(Math.max(this, min), max);
};

