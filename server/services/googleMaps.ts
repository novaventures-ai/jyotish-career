import { Client } from "@googlemaps/google-maps-services-js";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

console.log("Backend GOOGLE_MAPS_API_KEY status:", GOOGLE_MAPS_API_KEY ? `Detected (${GOOGLE_MAPS_API_KEY.substring(0, 10)}...)` : "NOT DETECTED");

if (!GOOGLE_MAPS_API_KEY) {
    console.warn("⚠️  GOOGLE_MAPS_API_KEY not set - location services will be limited");
}

const mapsClient = new Client({});

export interface GeoLocationResult {
    placeName: string;
    latitude: number;
    longitude: number;
    timezone: string;
    timezoneOffset: number;
    country?: string;
    state?: string;
    formattedAddress: string;
}

/**
 * Geocode an address to get coordinates and location details
 * Uses Google Maps Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeoLocationResult> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error("Google Maps API key not set. Geocoding service unavailable.");
    }

    try {
        const response = await mapsClient.geocode({
            params: {
                address,
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        if (response.data.results.length === 0) {
            throw new Error(`No location found for: ${address}`);
        }

        const result = response.data.results[0];
        const location = result.geometry.location;

        // Get timezone for these coordinates
        const timezoneData = await getTimezone(location.lat, location.lng);

        // Extract country and state from address components
        const addressComponents = result.address_components;
        const country = addressComponents.find((c) => c.types.includes("country" as any))?.long_name;
        const state = addressComponents.find((c) => c.types.includes("administrative_area_level_1" as any))?.long_name;

        return {
            placeName: result.formatted_address,
            latitude: location.lat,
            longitude: location.lng,
            timezone: timezoneData.timeZoneId,
            timezoneOffset: timezoneData.rawOffset / 3600, // Convert seconds to hours
            country,
            state,
            formattedAddress: result.formatted_address,
        };
    } catch (error: any) {
        console.error("Google Maps geocoding failed specifically with error:", error.message);
        if (error.response?.data) {
            console.error("Error Details:", JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(`Failed to geocode address "${address}": ${error.message}`);
    }
}

/**
 * Get timezone information for coordinates
 */
export async function getTimezone(
    latitude: number,
    longitude: number,
    timestamp?: number
): Promise<{ timeZoneId: string; rawOffset: number; dstOffset: number }> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error("Google Maps API key required for timezone lookup");
    }

    try {
        const response = await mapsClient.timezone({
            params: {
                location: { lat: latitude, lng: longitude },
                timestamp: timestamp || Math.floor(Date.now() / 1000),
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        return {
            timeZoneId: response.data.timeZoneId,
            rawOffset: response.data.rawOffset,
            dstOffset: response.data.dstOffset,
        };
    } catch (error: any) {
        throw new Error(`Failed to get timezone: ${error.message}`);
    }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error("Google Maps API key required for reverse geocoding");
    }

    try {
        const response = await mapsClient.reverseGeocode({
            params: {
                latlng: { lat: latitude, lng: longitude },
                key: GOOGLE_MAPS_API_KEY,
            },
        });

        if (response.data.results.length === 0) {
            throw new Error("No address found for coordinates");
        }

        return response.data.results[0].formatted_address;
    } catch (error: any) {
        throw new Error(`Failed to reverse geocode: ${error.message}`);
    }
}

/**
 * Get autocomplete predictions for a place (for frontend autocomplete)
 */
export async function getPlaceAutocomplete(input: string): Promise<any[]> {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error("Google Maps API key required for autocomplete");
    }

    try {
        const response = await mapsClient.placeAutocomplete({
            params: {
                input,
                key: GOOGLE_MAPS_API_KEY,
                types: "(cities)" as any, // Only suggest cities
            },
        });

        return response.data.predictions;
    } catch (error: any) {
        throw new Error(`Failed to get autocomplete predictions: ${error.message}`);
    }
}
