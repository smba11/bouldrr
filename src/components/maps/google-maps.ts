"use client";

type LatLng = {
  lat: () => number;
  lng: () => number;
};

export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GoogleGeocodeResult = {
  address_components: GoogleAddressComponent[];
  formatted_address: string;
  geometry: {
    location: LatLng;
  };
  place_id: string;
};

export type GoogleMapsRuntime = {
  maps: {
    Geocoder: new () => {
      geocode: (
        request: { address: string },
        callback: (
          results: GoogleGeocodeResult[] | null,
          status: string,
        ) => void,
      ) => void;
    };
    GeocoderStatus: {
      OK: string;
    };
    Map: new (
      element: HTMLElement,
      options: {
        center: { lat: number; lng: number };
        disableDefaultUI?: boolean;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        zoom: number;
      },
    ) => {
      setCenter: (center: { lat: number; lng: number }) => void;
      setZoom: (zoom: number) => void;
    };
    Marker: new (options: {
      map: {
        setCenter: (center: { lat: number; lng: number }) => void;
        setZoom: (zoom: number) => void;
      };
      position: { lat: number; lng: number };
    }) => {
      setPosition: (position: { lat: number; lng: number }) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsRuntime;
  }
}

let loadingPromise: Promise<GoogleMapsRuntime> | null = null;

export function loadGoogleMaps(apiKey: string) {
  if (window.google) {
    return Promise.resolve(window.google);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-bouldrr-google-maps]",
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google) {
          resolve(window.google);
        } else {
          reject(new Error("Google Maps did not initialize."));
        }
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Google Maps failed to load."));
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.bouldrrGoogleMaps = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&v=weekly&loading=async`;
    script.addEventListener("load", () => {
      if (window.google) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps did not initialize."));
      }
    });
    script.addEventListener("error", () => {
      reject(new Error("Google Maps failed to load."));
    });
    document.head.appendChild(script);
  });

  return loadingPromise;
}

