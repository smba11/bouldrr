"use client";
import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  loadGoogleMaps,
  type GoogleGeocodeResult,
} from "@/components/maps/google-maps";
export type LocatedAddress = {
  addressLine1: string;
  city: string;
  county: string;
  formattedAddress: string;
  googlePlaceId: string;
  latitude: string;
  longitude: string;
  postalCode: string;
  state: string;
};
export const blankAddress: LocatedAddress = {
  addressLine1: "",
  city: "",
  county: "",
  formattedAddress: "",
  googlePlaceId: "",
  latitude: "",
  longitude: "",
  postalCode: "",
  state: "",
};
export function toLocatedAddress(result: GoogleGeocodeResult): LocatedAddress {
  const c = (type: string, short = false) =>
    result.address_components.find((c) => c.types.includes(type))?.[
      short ? "short_name" : "long_name"
    ] ?? "";
  return {
    addressLine1:
      [c("street_number"), c("route")].filter(Boolean).join(" ") ||
      result.formatted_address.split(",")[0],
    city: c("locality") || c("postal_town") || c("sublocality"),
    county: c("administrative_area_level_2"),
    state: c("administrative_area_level_1", true),
    postalCode: c("postal_code"),
    formattedAddress: result.formatted_address,
    googlePlaceId: result.place_id,
    latitude: String(result.geometry.location.lat()),
    longitude: String(result.geometry.location.lng()),
  };
}
export function AddressLocator({
  onLocate,
}: {
  onLocate: (address: LocatedAddress) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [placesError, setPlacesError] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  const latest = useRef(onLocate);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  useEffect(() => {
    latest.current = onLocate;
  }, [onLocate]);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let element: google.maps.places.PlaceAutocompleteElement | undefined;
    async function init() {
      try {
        const g = await loadGoogleMaps(key!);
        const { PlaceAutocompleteElement } = (await g.maps.importLibrary(
          "places",
        )) as google.maps.PlacesLibrary;
        if (cancelled || !widget.current) return;
        element = new PlaceAutocompleteElement({});
        element.setAttribute("aria-label", "Find a property address");
        element.addEventListener("gmp-select", async (e) => {
          try {
            const place = (
              e as google.maps.places.PlacePredictionSelectEvent
            ).placePrediction.toPlace();
            await place.fetchFields({
              fields: [
                "addressComponents",
                "formattedAddress",
                "location",
                "id",
              ],
            });
            if (cancelled || !place.location) return;
            latest.current(
              toLocatedAddress({
                address_components: (place.addressComponents ?? []).map(
                  (c) => ({
                    long_name: c.longText ?? "",
                    short_name: c.shortText ?? "",
                    types: c.types,
                  }),
                ),
                types: [],
                formatted_address: place.formattedAddress ?? "",
                place_id: place.id,
                geometry: {
                  location: place.location,
                  location_type: google.maps.GeocoderLocationType.ROOFTOP,
                  viewport: new google.maps.LatLngBounds(),
                },
              }),
            );
          } catch {
            if (!cancelled)
              setStatus(
                "That location couldn’t be retrieved. Try a full address below.",
              );
          }
        });
        element.addEventListener("gmp-error", () => setPlacesError(true));
        widget.current.replaceChildren(element);
      } catch {
        if (!cancelled) setPlacesError(true);
      }
    }
    void init();
    return () => {
      cancelled = true;
      element?.remove();
    };
  }, [key]);
  async function locate() {
    if (!key || query.trim().length < 3) return;
    setPending(true);
    setStatus("");
    try {
      const g = await loadGoogleMaps(key);
      const { Geocoder } = (await g.maps.importLibrary(
        "geocoding",
      )) as google.maps.GeocodingLibrary;
      const result = await new Geocoder().geocode({ address: query });
      if (!result.results[0]) throw Error();
      onLocate(toLocatedAddress(result.results[0]));
    } catch {
      setStatus(
        "We couldn’t locate that address. Check the street and city, or enter the property details manually.",
      );
    } finally {
      setPending(false);
    }
  }
  if (!key)
    return (
      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm font-medium">Start with the address.</p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Address suggestions aren’t connected yet. Enter the property details
          below; you can add coordinates now or locate it later.
        </p>
      </div>
    );
  return (
    <div className="space-y-4">
      <div ref={widget} className="min-h-12" />
      {placesError && (
        <p className="text-xs text-muted-foreground">
          Address suggestions are unavailable. You can still search the full
          address below.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <label className="search-field min-w-0 flex-1">
          <Search className="size-4 text-primary" />
          <span className="sr-only">Full property address</span>
          <input
            className="min-w-0 w-full bg-transparent py-3 text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Street address, city, state"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void locate();
              }
            }}
          />
        </label>
        <button
          className="button-primary"
          disabled={pending || query.trim().length < 3}
          type="button"
          onClick={locate}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Find property"
          )}
        </button>
      </div>
      {status && (
        <p role="alert" className="error-message">
          {status}
        </p>
      )}
    </div>
  );
}
