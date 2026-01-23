import { useState } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const libraries: ("places")[] = ["places"];

interface PlaceAutocompleteProps {
    value: string;
    onPlaceSelect: (place: {
        name: string;
        latitude: number;
        longitude: number;
        formattedAddress: string;
    }) => void;
    placeholder?: string;
    className?: string;
}

export default function PlaceAutocomplete({
    value,
    onPlaceSelect,
    placeholder = "Enter your birth place",
    className = "",
}: PlaceAutocompleteProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Debug: Log API key status (first few characters only for security)
    console.log("Google Maps API Key status:", apiKey ? `Set (${apiKey.substring(0, 10)}...)` : "NOT SET");

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || "",
        libraries,
    });

    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [inputValue, setInputValue] = useState(value);

    const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    };

    const onPlaceChanged = () => {
        if (autocomplete) {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.geometry.location) {
                console.error("No geometry found for place");
                return;
            }

            const latitude = place.geometry.location.lat();
            const longitude = place.geometry.location.lng();
            const formattedAddress = place.formatted_address || place.name || "";

            onPlaceSelect({
                name: formattedAddress,
                latitude,
                longitude,
                formattedAddress,
            });

            setInputValue(formattedAddress);
        }
    };

    if (loadError) {
        console.error("Google Maps Load Error:", loadError);
        return (
            <div className="space-y-2">
                <div className="text-sm text-destructive border border-destructive/50 rounded-md p-3">
                    ⚠️ Google Maps failed to load
                    <div className="text-xs mt-1 text-muted-foreground">
                        Check console for details. You can use "Enter custom coordinates" below as an alternative.
                    </div>
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={placeholder}
                    className={className + " border-destructive"}
                    disabled
                />
            </div>
        );
    }

    if (!isLoaded) {
        console.log("Google Maps: Loading...");
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading location search...
            </div>
        );
    }

    console.log("Google Maps: Loaded successfully!");
    return (
        <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
                types: ["(cities)"],
                fields: ["formatted_address", "geometry", "name"],
            }}
        >
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className={className}
            />
        </Autocomplete>
    );
}
