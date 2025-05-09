export interface Location {
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  isCurrentLocation?: boolean;
}

export interface Place {
  placeId: string;
  name: string;
  address?: string; // From formatted_address or vicinity
  vicinity?: string; // vicinity is often more user-friendly than full formatted_address
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  photoReference?: string;
  photos?: Array<{ photo_reference: string; [key: string]: any }>; // Array of photo objects
  openingHours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  types: string[];
  priceLevel?: string | number; // Can be number (0-4) or string representation
  distanceFromMidpoint: number; // in kilometers
  icon?: string; // URL to an icon
  // Additional fields from Google Places API as needed
}

export interface PlaceSuggestion {
  description: string;
  place_id: string;
}

