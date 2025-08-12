export type LatLng = {
  lat: number;
  lng: number;
};

export type Subratings = {
  environment: number; // 1.0 - 5.0
  foodQuality: number; // 1.0 - 5.0
  service: number; // 1.0 - 5.0
  price: number; // average spending number
};

export type ReviewSnippet = {
  authorName?: string;
  rating?: number;
  text?: string;
  time?: string;
  language?: string;
};

export type Restaurant = {
  placeId: string;
  name: string;
  location: LatLng;
  address?: string;
  website?: string | null;
  openNow?: boolean | null;
  openingHours?: Array<string> | null;
  priceLevel?: number | null;
  googleRating?: number | null;
  googleUserRatingsTotal?: number | null;
  photos?: Array<{ photoReference: string; width?: number; height?: number }>; 
  reviews?: ReviewSnippet[];
  aiRating?: number | null; // 1.0 - 5.0 fit score
  subratings?: Subratings | null;
  adjectives?: {
    environment: Array<{ adjective: string; count: number }>; 
    food: Array<{ adjective: string; count: number }>; 
    service: Array<{ adjective: string; count: number }>; 
  } | null;
};

export type RequirementAnalysis = {
  reasoningSummary: string; // brief rationale only
  extractedConstraints: {
    cuisinePreferences?: string[];
    ambiancePreferences?: string[];
    priceCeiling?: number | null;
    dietaryNeeds?: string[];
    occasion?: string | null;
    noiseLevel?: 'quiet' | 'moderate' | 'lively' | null;
    mustHaves?: string[];
    avoid?: string[];
    otherNotes?: string[];
    keywords?: string[];
  };
};

export type SearchRestaurantsRequest = {
  query: string;
  location: LatLng;
};

export type SearchRestaurantsResponse = {
  analysis: RequirementAnalysis;
  restaurants: Restaurant[];
};