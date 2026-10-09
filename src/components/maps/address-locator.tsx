"use client";

import { useMemo, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import {
  type GoogleAddressComponent,
  type GoogleGeocodeResult,
  loadGoogleMaps,
} from "@/components/maps/google-maps";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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

type AddressLocatorProps = {
  addressLine1: string;
  city: string;
  onLocate: (address: LocatedAddress) => void;
  postalCode: string;
  stateValue: string;
};

function findComponent(
  components: GoogleAddressComponent[],
  type: string,
  field: "long_name" | "short_name" = "long_name",
) {
  return (
    components.find((component) => component.types.includes(type))?.[field] ?? ""
  );
}

function stripCountySuffix(value: string) {
  return value.replace(/\s+County$/i, "");
}

function toLocatedAddress(result: GoogleGeocodeResult): LocatedAddress {
  const components = result.address_components;
  const streetNumber = findComponent(components, "street_number");
  const route = findComponent(components, "route");
  const addressLine1 = [streetNumber, route].filter(Boolean).join(" ");
  const location = result.geometry.location;

  return {
    addressLine1:
      addressLine1 || result.formatted_address.split(",")[0] || "",
    city:
      findComponent(components, "locality") ||
      findComponent(components, "postal_town") ||
      findComponent(components, "sublocality") ||
      "",
    county: stripCountySuffix(
      findComponent(components, "administrative_area_level_2"),
    ),
    formattedAddress: result.formatted_address,
    googlePlaceId: result.place_id,
    latitude: String(location.lat()),
    longitude: String(location.lng()),
    postalCode: findComponent(components, "postal_code"),
    state: findComponent(components, "administrative_area_level_1", "short_name"),
  };
}

export function AddressLocator({
  addressLine1,
  city,
  onLocate,
  postalCode,
  stateValue,
}: AddressLocatorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<{
    setPosition: (position: { lat: number; lng: number }) => void;
  } | null>(null);
  const mapInstanceRef = useRef<{
    setCenter: (center: { lat: number; lng: number }) => void;
    setZoom: (zoom: number) => void;
  } | null>(null);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [locatedAddress, setLocatedAddress] = useState<LocatedAddress | null>(
    null,
  );
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const query = useMemo(() => {
    return [addressLine1, city, stateValue, postalCode]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }, [addressLine1, city, postalCode, stateValue]);

  async function locateAddress() {
    if (!apiKey) {
      setStatus("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable locating.");
      return;
    }

    if (!query) {
      setStatus("Enter an address before locating the property.");
      return;
    }

    setPending(true);
    setStatus("");

    try {
      const google = await loadGoogleMaps(apiKey);
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<GoogleGeocodeResult>((resolve, reject) => {
        geocoder.geocode({ address: query }, (results, geocoderStatus) => {
          if (geocoderStatus === google.maps.GeocoderStatus.OK && results?.[0]) {
            resolve(results[0]);
            return;
          }

          reject(new Error(`Google Maps returned ${geocoderStatus}.`));
        });
      });
      const nextAddress = toLocatedAddress(result);
      const center = {
        lat: Number(nextAddress.latitude),
        lng: Number(nextAddress.longitude),
      };

      if (mapRef.current) {
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center,
            disableDefaultUI: true,
            mapTypeControl: false,
            streetViewControl: false,
            zoom: 17,
          });
          markerRef.current = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: center,
          });
        } else {
          mapInstanceRef.current.setCenter(center);
          mapInstanceRef.current.setZoom(17);
          markerRef.current?.setPosition(center);
        }
      }

      setLocatedAddress(nextAddress);
      onLocate(nextAddress);
      setStatus("Property located and coordinates added to this project.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not locate address.");
    } finally {
      setPending(false);
    }
  }

  if (!apiKey) {
    return (
      <Alert>
        <MapPin className="size-4" />
        <AlertTitle>Google Maps is not configured locally</AlertTitle>
        <AlertDescription>
          Manual address entry still works. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          in Vercel and pull it into local development to enable location lookup.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Google Maps location</p>
          <p className="text-sm text-muted-foreground">
            Resolve the address, coordinates, and formatted Google place record.
          </p>
        </div>
        <Button disabled={pending || !query} onClick={locateAddress} type="button">
          <LocateFixed className="size-4" />
          {pending ? "Locating..." : "Locate"}
        </Button>
      </div>
      <div
        className="flex aspect-video items-center justify-center rounded-lg border bg-muted/40 text-sm text-muted-foreground"
        ref={mapRef}
      >
        {!locatedAddress && "Map preview appears after locating the property."}
      </div>
      {locatedAddress && (
        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <p className="font-medium">{locatedAddress.formattedAddress}</p>
          <p className="mt-1 text-muted-foreground">
            {locatedAddress.latitude}, {locatedAddress.longitude}
          </p>
        </div>
      )}
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  );
}
