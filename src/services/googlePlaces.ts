/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// Google Places API (New) Integration Service
// Only called for the ONE selected location when placeId exists.
// Results are cached in-memory and in sessionStorage.
// Silently falls back to user data on any failure or missing key.
// ============================================================================

export interface GooglePlaceDetails {
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  photos?: Array<{
    name: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: Array<{ displayName: string; uri: string }>;
  }>;
  reviews?: Array<{
    name?: string;
    relativePublishTimeDescription?: string;
    rating?: number;
    text?: { text: string; languageCode?: string };
    authorAttribution?: {
      displayName: string;
      uri?: string;
      photoUri?: string;
    };
  }>;
}

const memoryCache = new Map<string, GooglePlaceDetails>();

/**
 * Retrieves the Google Maps API Key safely without hardcoding.
 * Priority:
 * 1. window.ENV?.GOOGLE_MAPS_API_KEY
 * 2. import.meta.env.VITE_GOOGLE_MAPS_API_KEY
 * 3. localStorage override (configured via in-app Settings modal)
 */
export function getGoogleApiKey(): string {
  if (typeof window !== "undefined") {
    const win = window as unknown as { ENV?: { GOOGLE_MAPS_API_KEY?: string } };
    if (win.ENV?.GOOGLE_MAPS_API_KEY) {
      return win.ENV.GOOGLE_MAPS_API_KEY;
    }
    const storedKey = localStorage.getItem("google_maps_api_key");
    if (storedKey) {
      return storedKey;
    }
  }
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || "";
}

/**
 * Fetches Google Place details via Places API (New)
 * Endpoint: https://places.googleapis.com/v1/places/{placeId}
 */
export async function fetchPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!placeId || !placeId.trim()) return null;

  // 1. Check in-memory cache
  if (memoryCache.has(placeId)) {
    return memoryCache.get(placeId) || null;
  }

  // 2. Check sessionStorage cache
  try {
    const sessionData = sessionStorage.getItem(`google_place_${placeId}`);
    if (sessionData) {
      const parsed = JSON.parse(sessionData) as GooglePlaceDetails;
      memoryCache.set(placeId, parsed);
      return parsed;
    }
  } catch {
    // Ignore sessionStorage failures
  }

  // 3. Check API key
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    // No API key configured: silently fall back to user data only
    return null;
  }

  try {
    const fieldMask = [
      "formattedAddress",
      "location",
      "rating",
      "userRatingCount",
      "regularOpeningHours",
      "internationalPhoneNumber",
      "websiteUri",
      "googleMapsUri",
      "photos",
      "reviews"
    ].join(",");

    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask
      }
    });

    if (!response.ok) {
      // Silently fall back without error popups
      return null;
    }

    const data: GooglePlaceDetails = await response.json();

    // Cache the result
    memoryCache.set(placeId, data);
    try {
      sessionStorage.setItem(`google_place_${placeId}`, JSON.stringify(data));
    } catch {
      // Ignore quota exceptions
    }

    return data;
  } catch {
    // Network or CORS failure: silently return null
    return null;
  }
}

/**
 * Generates photo URL using Places photo media endpoint
 */
export function getGooglePhotoUrl(photoName: string, apiKey: string): string {
  if (!photoName || !apiKey) return "";
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&maxWidthPx=800&key=${apiKey}`;
}
