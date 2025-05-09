import { create } from "zustand";
import { Location } from "../../models/locationTypes";
import { MidpointCalculator } from "../../services/MidpointCalculator";
import { ApiError } from "../../api/types";

interface MidpointState {
  midpoint: Location | null;
  locationA: Location | null; // Store copies of locations used for midpoint calculation
  locationB: Location | null;
  isLoading: boolean;
  error: string | null;
  distanceFromA: number; // in km, as MidpointCalculator returns km
  distanceFromB: number; // in km
  midpointFairnessDelta: number; // in km
  midpointFairnessLabel: string;
  calculateMidpoint: (locA: Location, locB: Location) => Promise<void>;
  calculateWeightedMidpoint: (locA: Location, locB: Location, weightA: number, weightB: number) => Promise<void>;
  setMidpoint: (midpoint: Location) => void;
  clearMidpoint: () => void;
  clearError: () => void;
  // UI-related state/methods like buildTripSummaryCard will be handled in React components
}

const calculateFairness = (distA: number, distB: number): { delta: number; label: string } => {
  const delta = Math.abs(distA - distB);
  let label = "Unknown";
  // Assuming distances are in km. Flutter app used miles, so conversion or threshold adjustment is needed.
  // For now, using km with slightly adjusted thresholds for demonstration.
  // 1 mile ~ 1.6 km. Original: <1 mile (Perfect), <3 miles (Moderate)
  // New (km): <1.6km (Perfect), <4.8km (Moderate)
  if (delta < 1.6) label = "Perfectly Fair";
  else if (delta < 4.8) label = "Moderately Fair";
  else label = "Unbalanced";
  return { delta, label };
};

export const useMidpointStore = create<MidpointState>((set, get) => ({
  midpoint: null,
  locationA: null,
  locationB: null,
  isLoading: false,
  error: null,
  distanceFromA: 0,
  distanceFromB: 0,
  midpointFairnessDelta: 0,
  midpointFairnessLabel: "Unknown",

  calculateMidpoint: async (locA, locB) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate async operation as in Flutter version
      await new Promise(resolve => setTimeout(resolve, 500));
      const calculatedMidpoint = MidpointCalculator.calculateGeographicMidpoint(locA, locB);
      const distA = MidpointCalculator.calculateDistance(locA, calculatedMidpoint);
      const distB = MidpointCalculator.calculateDistance(locB, calculatedMidpoint);
      const fairness = calculateFairness(distA, distB);
      set({
        midpoint: calculatedMidpoint,
        locationA: locA,
        locationB: locB,
        isLoading: false,
        distanceFromA: distA,
        distanceFromB: distB,
        midpointFairnessDelta: fairness.delta,
        midpointFairnessLabel: fairness.label,
      });
    } catch (e: any) {
      set({ isLoading: false, error: `Failed to calculate midpoint: ${e.message}` });
    }
  },

  calculateWeightedMidpoint: async (locA, locB, weightA, weightB) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const calculatedMidpoint = MidpointCalculator.calculateWeightedMidpoint(locA, locB, weightA, weightB);
      const distA = MidpointCalculator.calculateDistance(locA, calculatedMidpoint);
      const distB = MidpointCalculator.calculateDistance(locB, calculatedMidpoint);
      const fairness = calculateFairness(distA, distB);
      set({
        midpoint: calculatedMidpoint,
        locationA: locA,
        locationB: locB,
        isLoading: false,
        distanceFromA: distA,
        distanceFromB: distB,
        midpointFairnessDelta: fairness.delta,
        midpointFairnessLabel: fairness.label,
      });
    } catch (e: any) {
      set({ isLoading: false, error: `Failed to calculate weighted midpoint: ${e.message}` });
    }
  },

  setMidpoint: (newMidpoint) => {
    const locA = get().locationA;
    const locB = get().locationB;
    let distA = 0;
    let distB = 0;
    let fairness = { delta: 0, label: "Unknown" };

    if (locA && locB) {
      distA = MidpointCalculator.calculateDistance(locA, newMidpoint);
      distB = MidpointCalculator.calculateDistance(locB, newMidpoint);
      fairness = calculateFairness(distA, distB);
    }
    set({
      midpoint: newMidpoint,
      error: null,
      distanceFromA: distA,
      distanceFromB: distB,
      midpointFairnessDelta: fairness.delta,
      midpointFairnessLabel: fairness.label,
    });
  },

  clearMidpoint: () => set({
    midpoint: null,
    locationA: null,
    locationB: null,
    isLoading: false,
    error: null,
    distanceFromA: 0,
    distanceFromB: 0,
    midpointFairnessDelta: 0,
    midpointFairnessLabel: "Unknown",
  }),

  clearError: () => set({ error: null }),
}));

