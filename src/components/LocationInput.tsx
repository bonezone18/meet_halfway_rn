import React, { useState } from "react";
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
import { ApiError } from "../api/types"; // Make sure this path is correct and ApiError is exported from types.ts

// Helper type guard to check for ApiError
function isApiError(response: any): response is ApiError {
  return response && typeof response.message === 'string';
}

interface LocationInputProps {
  isLocationA: boolean;
  placeholder: string;
}

const LocationInput: React.FC<LocationInputProps> = ({ isLocationA, placeholder }) => {
  const {
    setLocationA,
    setLocationB,
    fetchCurrentLocationA,
    fetchCurrentLocationB,
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
      if (isApiError(result)) {
        console.error("Error fetching place suggestions:", result.message);
        setSuggestions([]);
      } else {
        // result is PlaceSuggestion[] here
        setSuggestions(result);
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

    if (isApiError(placeDetailsResult)) {
      console.error("Error fetching place details:", placeDetailsResult.message);
      // Optionally, inform the user via an alert or toast message
    } else {
      // placeDetailsResult is LocationModel (aliased from Location) here
      const location: LocationModel = {
        name: placeDetailsResult.name, // name is optional in LocationModel, ensure it's handled if undefined
        address: placeDetailsResult.address, // address is optional
        latitude: placeDetailsResult.latitude,
        longitude: placeDetailsResult.longitude,
      };
      if (isLocationA) {
        setLocationA(location);
      } else {
        setLocationB(location);
      }
    }
  };

  const handleUseCurrentLocation = async () => {
    if (isLocationA) {
      await fetchCurrentLocationA();
    } else {
      await fetchCurrentLocationB();
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
              keyboardShouldPersistTaps="handled"
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
    top: 50, 
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000, 
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
