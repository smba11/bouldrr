"use client";
export type GoogleAddressComponent = google.maps.GeocoderAddressComponent;
export type GoogleGeocodeResult = google.maps.GeocoderResult;
export type GoogleMapsRuntime = typeof google;
declare global {
  interface Window {
    __bouldrrMapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}
let loading: Promise<GoogleMapsRuntime> | null = null;
export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsRuntime> {
  if (typeof google !== "undefined") return Promise.resolve(google);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => fail(), 15000);
    function fail() {
      clearTimeout(timeout);
      script?.remove();
      loading = null;
      reject(
        new Error("The map couldn’t connect. Your project is still available."),
      );
    }
    window.gm_authFailure = () => {
      window.dispatchEvent(new Event("bouldrr:maps-error"));
      fail();
    };
    window.__bouldrrMapsReady = () => {
      clearTimeout(timeout);
      if (typeof google !== "undefined") resolve(google);
      else fail();
    };
    script.async = true;
    script.dataset.bouldrrGoogleMaps = "true";
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=" +
      encodeURIComponent(apiKey) +
      "&v=quarterly&loading=async&callback=__bouldrrMapsReady";
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}
