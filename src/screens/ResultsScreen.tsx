import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { usePlaceStore, SortOption } from "../state/stores/placeStore";
import { useMidpointStore } from "../state/stores/midpointStore";
import { useLocationStore } from "../state/stores/locationStore";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Place } from "../models/placeTypes";

// Define the navigation prop type for ResultsScreen
type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, "Results">;

const PlaceCard: React.FC<{ place: Place; onPress: () => void; getPhotoUrl: (place: Place, maxWidth?: number) => string | null }> = ({ place, onPress, getPhotoUrl }) => {
  const photoUrl = getPhotoUrl(place, 100); // Small photo for card
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {photoUrl && <Image source={{ uri: photoUrl }} style={styles.cardImage} />}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{place.name}</Text>
        {place.rating !== undefined && (
          <Text style={styles.cardRating}>Rating: {place.rating} ({place.userRatingsTotal || 0} reviews)</Text>
        )}
        <Text style={styles.cardDistance}>Distance: {place.distanceFromMidpoint.toFixed(1)} km</Text>
        {place.priceLevel && <Text style={styles.cardPrice}>Price: {"$".repeat(typeof place.priceLevel === "number" ? place.priceLevel : 0)}</Text>}
        {place.openingHours?.open_now !== undefined && (
            <Text style={place.openingHours.open_now ? styles.openNow : styles.closedNow}>
                {place.openingHours.open_now ? "Open Now" : "Closed"}
            </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ResultsScreen = () => {
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const {
    filteredPlaces,
    isLoading,
    error,
    searchPlaces,
    selectedCategories,
    sortOption,
    toggleCategory,
    setSortOption,
    getPhotoUrl,
    resetCategoryFilters,
  } = usePlaceStore();
  const { midpoint } = useMidpointStore();
  const { locationA, locationB } = useLocationStore();

  const availableCategories = ["cafe", "restaurant", "bar", "park", "store", "movie_theater"]; // Example categories
  const sortOptions = [
    { label: "Distance", value: SortOption.distance },
    { label: "Rating", value: SortOption.rating },
    { label: "Price (Low-High)", value: SortOption.priceAsc },
    { label: "Price (High-Low)", value: SortOption.priceDesc },
  ];

  useEffect(() => {
    if (midpoint && locationA && locationB) {
      searchPlaces(midpoint, locationA, locationB);
    }
  }, [midpoint, locationA, locationB, searchPlaces]);

  const handlePlacePress = (place: Place) => {
    navigation.navigate("PlaceDetails", { placeId: place.placeId });
  };

  if (isLoading && filteredPlaces.length === 0) {
    return (
      <View style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading places...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => midpoint && locationA && locationB && searchPlaces(midpoint, locationA, locationB)}>
            <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!midpoint) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Text>No midpoint calculated. Please go back and set locations.</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Categories:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
          {availableCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategories.has(cat) && styles.chipSelected]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.chipText, selectedCategories.has(cat) && styles.chipTextSelected]}>{cat.replace("_", " ")}</Text>
            </TouchableOpacity>
          ))}
           <TouchableOpacity style={styles.chip} onPress={resetCategoryFilters}>
              <Text style={styles.chipText}>Reset</Text>
            </TouchableOpacity>
        </ScrollView>

        <Text style={styles.filterTitle}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScrollView}>
          {sortOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, sortOption === opt.value && styles.chipSelected]}
              onPress={() => setSortOption(opt.value)}
            >
              <Text style={[styles.chipText, sortOption === opt.value && styles.chipTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && <ActivityIndicator style={{marginVertical: 10}} size="small" color="#007AFF"/>}

      {filteredPlaces.length === 0 && !isLoading && (
        <View style={styles.centeredMessageContainer}>
          <Text>No places found matching your criteria.</Text>
        </View>
      )}

      <FlatList
        data={filteredPlaces}
        keyExtractor={(item) => item.placeId}
        renderItem={({ item }) => <PlaceCard place={item} onPress={() => handlePlacePress(item)} getPhotoUrl={getPhotoUrl} />}
        contentContainerStyle={styles.listContentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  filtersContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  categoryScrollView: {
    marginBottom: 10,
  },
  chip: {
    backgroundColor: "#E0E0E0",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: "#007AFF",
  },
  chipText: {
    color: "#333",
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  cardRating: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  cardDistance: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  openNow: {
    fontSize: 13,
    color: "green",
    fontWeight: "bold",
  },
  closedNow: {
    fontSize: 13,
    color: "red",
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default ResultsScreen;

