/*import React, { useState, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";
import { useLocationStore } from "../state/stores/locationStore";
import * as googleMapsApi from "../api/googleMapsApi";
import { PlaceSuggestion, Location as LocationModel } from "../models/placeTypes";
import { ApiError } from "../api/types";
*/

import React, { useState } from "react"; // Removed useCallback
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";
import { useLocationStore } from "../state/stores/locationStore";
import * as googleMapsApi from "../api/googleMapsApi";
import { PlaceSuggestion, Location as LocationModel } from "../models/placeTypes";
// ApiError import removed as it was unused in this specific file

interface LocationInputProps {
  isLocationA: boolean;
  placeholder: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ isLocationA, placeholder }) => {
  const {
    setLocationA,
    setLocationB,
    // Ensure these are renamed in your locationStore.ts file:
    fetchCurrentLocationA, // formerly useCurrentLocationForA
    fetchCurrentLocationB, // formerly useCurrentLocationForB
    isLoadingA,
    isLoadingB,
  } = useLocationStore();

  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isLoadingCurrent = isLocationA ? isLoadingA : isLoadingB;

  const handleInputChange = async (text: string) => {
    setInputValue(text);
    if (text.length > 2) {
      setIsFetchingSuggestions(true);
      setShowSuggestions(true);
      const result = await googleMapsApi.getPlaceSuggestions(text);
      // Check if result is not an ApiError-like object before setting suggestions
      if (result && !(result as any).message && Array.isArray(result)) {
        setSuggestions(result as PlaceSuggestion[]);
      } else if ((result as any).message) {
        console.error("Error fetching place suggestions:", (result as any).message);
        setSuggestions([]); // Clear suggestions on error
      } else {
        setSuggestions([]); // Clear if not an array or unexpected format
      }
      setIsFetchingSuggestions(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();

    const placeDetailsResult = await googleMapsApi.getPlaceDetails(suggestion.place_id);
    if (placeDetailsResult && !(placeDetailsResult as any).message) {
      const location: LocationModel = {
        name: placeDetailsResult.name,
        address: placeDetailsResult.address,
        latitude: placeDetailsResult.latitude,
        longitude: placeDetailsResult.longitude,
      };
      if (isLocationA) {
        setLocationA(location);
      } else {
        setLocationB(location);
      }
    } else {
      console.error("Error fetching place details:", (placeDetailsResult as any).message);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (isLocationA) {
      await fetchCurrentLocationA(); // Use the renamed async function
    } else {
      await fetchCurrentLocationB(); // Use the renamed async function
    }
    setInputValue("Current Location"); 
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={() => {
            if (inputValue.length > 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding suggestions to allow press on suggestion item
            setTimeout(() => {
              setShowSuggestions(false);
            }, 150);
          }}
        />
        <TouchableOpacity style={styles.currentLocationButton} onPress={handleUseCurrentLocation} disabled={isLoadingCurrent}>
          {isLoadingCurrent ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.currentLocationText}>📍</Text>
          )}
        </TouchableOpacity>
      </View>
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {isFetchingSuggestions && <ActivityIndicator style={{ marginVertical: 10 }} />}
          {!isFetchingSuggestions && suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                  <Text>{item.description}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled" // Important for scrollable suggestions
            />
          )}
          {!isFetchingSuggestions && suggestions.length === 0 && inputValue.length > 2 && (
            <Text style={styles.noSuggestionsText}>No suggestions found.</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    // Ensure the container can host absolutely positioned children if suggestions overflow
    // zIndex might be needed if other elements overlap, but usually `position: absolute` on child is enough
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    backgroundColor: "#FFF",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  currentLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currentLocationText: {
    fontSize: 18,
    color: "#007AFF",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 50, // Adjust this based on your input field's height + a small margin
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000, // Ensure suggestions appear above other elements
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  noSuggestionsText: {
    padding: 12,
    textAlign: "center",
    color: "#777",
  },
});

export default LocationInput;
