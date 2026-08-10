import { useEffect, useMemo, useRef, useState } from "react";
import ListingVisualCard from "../../components/app/ListingVisualCard";
import ViewingRequestModal from "../../components/app/ViewingRequestModal";
import LocalProgramPickerModal from "../../components/app/LocalProgramPickerModal";
import FurnishingToggle from "../../components/app/FurnishingToggle";
import AiGuidedAssistant from "../../components/app/AiGuidedAssistant";
import Breadcrumbs from "../../components/layout/Breadcrumbs";
import { buildAmenityAliasMap, propertyAmenityOptions } from "../../lib/propertyAmenityIcons";
import {
  EyeIcon,
  FilterIcon,
  ListIcon,
  MapIcon,
  ResetIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
} from "../../components/icons/UiIcons";
import { listingApi } from "../../api";
import { districtOptions, listingTypes } from "../../data/mockData";
import { PLATFORM_GOOGLE_MAP_STYLE } from "../../lib/googleMapStyles";
import { navigateTo, normalizeAppRole } from "../../lib/router";

const districtMapLayout = {
  Solna: { x: 42, y: 18 },
  Norrmalm: { x: 48, y: 34 },
  Vasastan: { x: 38, y: 33 },
  Östermalm: { x: 59, y: 34 },
  Kungsholmen: { x: 41, y: 42 },
  Södermalm: { x: 50, y: 48 }
};

const districtGeo = {
  Solna: { lat: 59.3608, lng: 18.0003 },
  Norrmalm: { lat: 59.3346, lng: 18.0628 },
  Vasastan: { lat: 59.3458, lng: 18.0344 },
  Östermalm: { lat: 59.3385, lng: 18.0916 },
  Kungsholmen: { lat: 59.3319, lng: 18.0418 },
  Södermalm: { lat: 59.3148, lng: 18.0632 }
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-sdk-script";
const editorAmenityOptions = propertyAmenityOptions;

const furnishedOptions = [
  { value: "all", label: "Alla" },
  { value: "yes", label: "Möblerad" },
  { value: "no", label: "Omöblerad" }
];
const transitDistanceOptions = ["Alla", "0-3 min", "3-7 min", "7-12 min", "12+ min"];
const contractFlexOptions = ["Alla", "Korttid", "Långtid", "Flexibelt avtal", "Break option"];
const accessHoursOptions = ["Alla", "24/7", "Kontorstid", "Kväll/helg"];
const parkingTypeOptions = ["Alla", "Ingen parkering", "Garage", "Gatuparkering", "Laddplatser"];
const layoutTypeOptions = ["Alla", "Öppet landskap", "Cellkontor", "Hybrid", "Showroom"];
const advertiserOptions = ["Alla", "AMF Fastigheter", "Vasakronan", "Castellum", "Fabege", "Skandia Fastigheter"];
const amenityAliasesByValue = {
  ...buildAmenityAliasMap(),
  garage: ["garage", "parkering"],
  säkerhetsdörr: ["säkerhetsdörr", "säkerhet", "secure", "security", "säker entré", "säker entre"]
};

const heroInputClass = "w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0b0a0e] focus:outline-none";
const heroSelectClass = "select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0b0a0e] focus:outline-none";

function parseAmenityTerms(value) {
  return String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseTypeSelection(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "Alla" || normalized === "Alla typer") return [];
  return normalized.split(",").map((item) => item.trim()).filter(Boolean);
}

function mapRenterProgramToSearchFilters(program = {}, defaultFilters = {}) {
  const districtRaw = String(program?.district || "").trim();
  const districtValues = districtRaw.split(",").map((item) => item.trim()).filter(Boolean);
  const district = districtValues.length > 1 ? "Alla" : districtRaw;
  const contractFlex = String(program?.contractFlex || "").trim();
  const transitDistance = String(program?.transitDistance || "").trim();
  const accessHours = String(program?.accessHours || "").trim();
  const parkingType = String(program?.parkingType || "").trim();
  const layoutType = String(program?.layoutType || "").trim();

  return {
    ...defaultFilters,
    district: district || defaultFilters.district || "Alla",
    type: parseTypeSelection(program?.type),
    teamSize: String(program?.teamSize || "").trim(),
    minSize: String(program?.minSize || "").trim(),
    maxSize: String(program?.maxSize || "").trim(),
    minBudget: String(program?.minBudget || "").trim(),
    maxBudget: String(program?.maxBudget || "").trim(),
    moveInDate: String(program?.moveInDate || "").trim(),
    contractFlex: contractFlex === "Alla" ? "" : contractFlex,
    transitDistance: transitDistance === "Alla" ? "" : transitDistance,
    accessHours: accessHours === "Alla" ? "" : accessHours,
    parkingType: parkingType === "Alla" ? "" : parkingType,
    layoutType: layoutType === "Alla" ? "" : layoutType,
    includeOperatingCosts: Boolean(program?.includeOperatingCosts),
    accessibilityAdapted: Boolean(program?.accessibilityAdapted),
    ecoCertified: Boolean(program?.ecoCertified),
    advertiser: defaultFilters.advertiser || "Alla",
    query: ""
  };
}

function normalizeAmenityTerm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function applyAmenityAndFurnishedFilters(listings, amenityQuery, furnishedFilter = "all") {
  const amenityTerms = parseAmenityTerms(amenityQuery).map((term) => term.toLowerCase());

  return listings.filter((listing) => {
    const amenityText = Array.isArray(listing.amenities) ? listing.amenities.join(" ").toLowerCase() : "";
    if (amenityTerms.length > 0 && !amenityTerms.some((term) => amenityText.includes(term))) {
      return false;
    }

    const furnishedSignal = /möbler|furnished|inredd/i.test(amenityText);
    if (furnishedFilter === "yes" && !furnishedSignal) return false;
    if (furnishedFilter === "no" && furnishedSignal) return false;

    return true;
  });
}

function hashSeed(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function markerPointForListing(listing) {
  const base = districtMapLayout[listing.district] || { x: 50, y: 50 };
  const seed = hashSeed(String(listing.id || listing.title || "listing"));
  const jitterX = ((seed % 11) - 5) * 0.75;
  const jitterY = (((seed >> 4) % 11) - 5) * 0.75;
  return {
    x: clamp(base.x + jitterX, 8, 92),
    y: clamp(base.y + jitterY, 12, 88)
  };
}

function markerGeoForListing(listing) {
  const base = districtGeo[listing.district] || { lat: 59.3293, lng: 18.0686 };
  const seed = hashSeed(String(listing.id || listing.title || "listing"));
  const jitterLat = ((seed % 9) - 4) * 0.001;
  const jitterLng = (((seed >> 4) % 9) - 4) * 0.001;
  return {
    lat: base.lat + jitterLat,
    lng: base.lng + jitterLng
  };
}

function normalizeFocusedDistrict(value) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "Alla" || normalized === "Alla områden" || normalized === "Alla områden i Stockholm") {
    return "";
  }
  return normalized;
}

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__googleMapsLoadPromise) {
    return window.__googleMapsLoadPromise;
  }

  window.__googleMapsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

    const previousAuthFailure = window.gm_authFailure;
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Google Maps timeout. Kontrollera nätverk eller domänbegränsning för API-nyckeln."));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      window.gm_authFailure = previousAuthFailure;
    }

    window.gm_authFailure = () => {
      cleanup();
      reject(new Error("Google Maps nekade API-nyckeln för denna domän."));
    };

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      cleanup();
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps SDK laddades men kunde inte initieras."));
      }
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Kunde inte ladda Google Maps SDK."));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    window.__googleMapsLoadPromise = null;
    throw error;
  });

  return window.__googleMapsLoadPromise;
}

function GoogleListingsMap({
  listings,
  onMarkerClick,
  onOpenListing,
  onBookViewing,
  onToggleShortlist,
  shortlistedIds,
  selectedListing,
  hoveredListingId = null,
  focusedDistrict = "",
  onCloseSelectedListing,
  showMatchChip = false,
  dense = false,
  className = ""
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const markersByIdRef = useRef(new Map());
  const infoWindowRef = useRef(null);
  const markerClickRef = useRef(onMarkerClick);
  const closeSelectedListingRef = useRef(onCloseSelectedListing);
  const suppressMapClickCloseRef = useRef(false);
  const didInitialFitRef = useRef(false);
  const lastListingsSignatureRef = useRef("");
  const lastFocusedDistrictRef = useRef("");
  const [status, setStatus] = useState("loading");
  const [retryToken, setRetryToken] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  function inactiveMarkerIcon() {
    if (!window.google?.maps) return null;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path fill="#ea4335" stroke="#c5221f" stroke-width="1.4" d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12c0 7.71 8.58 16.56 9.57 17.55a.97.97 0 0 0 1.36 0c.99-.99 9.57-9.84 9.57-17.55 0-5.66-4.59-10.25-10.25-10.25Z"/><circle cx="12" cy="12" r="4.1" fill="#ffffff"/></svg>`
      )}`,
      scaledSize: new window.google.maps.Size(20, 28),
      anchor: new window.google.maps.Point(10, 28)
    };
  }

  function activeMarkerIcon() {
    if (!window.google?.maps) return null;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path fill="#0b0a0e" stroke="#0b1428" stroke-width="1.4" d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12c0 7.71 8.58 16.56 9.57 17.55a.97.97 0 0 0 1.36 0c.99-.99 9.57-9.84 9.57-17.55 0-5.66-4.59-10.25-10.25-10.25Z"/><circle cx="12" cy="12" r="4.1" fill="#ffffff"/></svg>`
      )}`,
      scaledSize: new window.google.maps.Size(30, 42),
      anchor: new window.google.maps.Point(15, 42)
    };
  }

  function hoverMarkerIcon() {
    if (!window.google?.maps) return null;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path fill="#1b2a4d" stroke="#0b0a0e" stroke-width="1.4" d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12c0 7.71 8.58 16.56 9.57 17.55a.97.97 0 0 0 1.36 0c.99-.99 9.57-9.84 9.57-17.55 0-5.66-4.59-10.25-10.25-10.25Z"/><circle cx="12" cy="12" r="4.1" fill="#ffffff"/></svg>`
      )}`,
      scaledSize: new window.google.maps.Size(26, 36),
      anchor: new window.google.maps.Point(13, 36)
    };
  }

  useEffect(() => {
    markerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    closeSelectedListingRef.current = onCloseSelectedListing;
  }, [onCloseSelectedListing]);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      if (!GOOGLE_MAPS_API_KEY) {
        setStatus("missing_key");
        setErrorMessage("Google Maps API-nyckel saknas.");
        return;
      }
      try {
        setStatus("loading");
        setErrorMessage("");
        const maps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        mapsRef.current = maps;
        if (cancelled || !containerRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center: { lat: 59.3293, lng: 18.0686 },
            zoom: 11,
            styles: PLATFORM_GOOGLE_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
            fullscreenControl: false,
            mapTypeControl: false,
            clickableIcons: false,
            gestureHandling: "greedy"
          });
          mapRef.current.addListener("click", () => {
            if (suppressMapClickCloseRef.current) return;
            closeSelectedListingRef.current?.();
          });
        }

        const visibleListings = listings.slice(0, 120);
        const signature = visibleListings.map((listing) => String(listing.id)).join("|");
        if (signature === lastListingsSignatureRef.current) {
          setStatus("ready");
          return;
        }
        lastListingsSignatureRef.current = signature;

        const bounds = new maps.LatLngBounds();
        const nextIds = new Set();

        visibleListings.forEach((listing) => {
          nextIds.add(String(listing.id));
          const position = markerGeoForListing(listing);
          let marker = markersByIdRef.current.get(String(listing.id));
          if (!marker) {
            marker = new maps.Marker({
              map: mapRef.current,
              position,
              title: listing.title,
              icon: inactiveMarkerIcon()
            });
            marker.addListener("click", () => {
              suppressMapClickCloseRef.current = true;
              window.setTimeout(() => {
                suppressMapClickCloseRef.current = false;
              }, 180);
              markerClickRef.current?.(marker.__listing);
            });
            markersByIdRef.current.set(String(listing.id), marker);
          } else {
            marker.setPosition(position);
            marker.setTitle(listing.title);
          }
          marker.__listing = listing;
          bounds.extend(position);
        });

        markersByIdRef.current.forEach((marker, id) => {
          if (!nextIds.has(id)) {
            marker.setMap(null);
            markersByIdRef.current.delete(id);
          }
        });

        if (!didInitialFitRef.current && visibleListings.length > 0) {
          mapRef.current.fitBounds(bounds, 60);
          didInitialFitRef.current = true;
        }

        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(error?.message || "Google Maps kunde inte laddas.");
        }
      }
    }

    setupMap();

    return () => {
      cancelled = true;
    };
  }, [listings, retryToken]);

  useEffect(() => {
    markersByIdRef.current.forEach((marker) => {
      const markerListingId = String(marker?.__listing?.id || "");
      const isActive = Boolean(selectedListing && markerListingId === String(selectedListing.id));
      const isHovered = Boolean(hoveredListingId && markerListingId === String(hoveredListingId));
      marker.setIcon(isActive ? activeMarkerIcon() : isHovered ? hoverMarkerIcon() : inactiveMarkerIcon());
      marker.setZIndex(isActive ? 99 : isHovered ? 60 : 1);
    });
  }, [hoveredListingId, selectedListing]);

  useEffect(() => {
    if (!hoveredListingId || !mapRef.current) return;
    const marker = markersByIdRef.current.get(String(hoveredListingId));
    const markerPosition = marker?.getPosition?.();
    if (!markerPosition) return;
    mapRef.current.panTo(markerPosition);
    const currentZoom = Number(mapRef.current.getZoom?.() || 0);
    if (currentZoom > 0 && currentZoom < 13) {
      mapRef.current.setZoom(13);
    }
  }, [hoveredListingId]);

  useEffect(() => {
    const normalizedDistrict = normalizeFocusedDistrict(focusedDistrict);
    if (!normalizedDistrict || !mapRef.current || !mapsRef.current) {
      lastFocusedDistrictRef.current = normalizedDistrict;
      return;
    }
    if (lastFocusedDistrictRef.current === normalizedDistrict) return;

    const districtCenter = districtGeo[normalizedDistrict];
    if (!districtCenter) {
      lastFocusedDistrictRef.current = normalizedDistrict;
      return;
    }

    mapRef.current.panTo(districtCenter);
    const currentZoom = Number(mapRef.current.getZoom?.() || 0);
    if (currentZoom > 0 && currentZoom < 12) {
      mapRef.current.setZoom(12);
    }
    lastFocusedDistrictRef.current = normalizedDistrict;
  }, [focusedDistrict]);

  function handleCycleSelectedListing(direction) {
    if (!Array.isArray(listings) || listings.length === 0) return;
    const currentId = String(selectedListing?.id || "");
    const currentIndex = listings.findIndex((item) => String(item.id) === currentId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + direction + listings.length) % listings.length;
    const nextListing = listings[nextIndex];
    if (!nextListing) return;
    markerClickRef.current?.(nextListing);
    const marker = markersByIdRef.current.get(String(nextListing.id));
    if (marker && mapRef.current) {
      const markerPosition = marker.getPosition?.();
      if (markerPosition) {
        mapRef.current.panTo(markerPosition);
      }
    }
  }

  useEffect(() => {
    infoWindowRef.current?.close();
  }, [selectedListing]);

  useEffect(() => {
    return () => {
      markersByIdRef.current.forEach((marker) => marker.setMap(null));
      markersByIdRef.current.clear();
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-black/10 bg-transparent ${dense ? "h-[340px] sm:h-[460px]" : "h-[480px]"} ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/55 text-xs font-semibold text-ink-700">Laddar karta...</div>
      ) : null}
      {status === "missing_key" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/70 p-4 text-center text-xs font-semibold text-rose-700">
          Google Maps API-nyckel saknas. Lägg till `VITE_GOOGLE_MAPS_API_KEY` i `.env` och starta om `npm run dev`.
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/75 p-4 text-center text-xs font-semibold text-rose-700">
          <div className="space-y-2">
            <p>{errorMessage || "Google Maps kunde inte laddas."}</p>
            <p>
              Kontrollera att `Maps JavaScript API` + billing är aktiverat och att referrer tillåter
              `http://localhost:5173/*` samt `http://127.0.0.1:5173/*`.
            </p>
            <button
              type="button"
              className="mx-auto rounded-lg border border-rose-300 bg-[#ffffff] px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              Försök igen
            </button>
          </div>
        </div>
      ) : null}
      {selectedListing && onOpenListing && onToggleShortlist ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 sm:bottom-4 sm:left-4">
          <div className="flex items-start gap-2">
            <div className="pointer-events-auto w-[min(420px,calc(100vw-6rem))]">
              <ListingVisualCard
                listing={selectedListing}
                shortlisted={shortlistedIds?.has?.(selectedListing.id)}
                onOpenListing={onOpenListing}
                onBookViewing={onBookViewing}
                onToggleShortlist={onToggleShortlist}
                showMatchChip={showMatchChip}
              />
            </div>
            <div className="pointer-events-auto flex flex-col gap-2">
              <button
                type="button"
                aria-label="Stäng objekt"
                className="close-circle-button inline-flex items-center justify-center rounded-full border border-black/10 bg-[#ffffff] text-lg font-semibold leading-none text-ink-700 hover:bg-[#eef3fa]"
                onClick={() => onCloseSelectedListing?.()}
              >
                ×
              </button>
              <button
                type="button"
                aria-label="Föregående objekt"
                className="inline-flex h-9 w-9 min-h-9 min-w-9 aspect-square items-center justify-center rounded-full border border-black/10 bg-[#ffffff] p-0 text-base font-semibold leading-none text-ink-700 hover:bg-[#eef3fa]"
                onClick={() => handleCycleSelectedListing(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Nästa objekt"
                className="inline-flex h-9 w-9 min-h-9 min-w-9 aspect-square items-center justify-center rounded-full border border-black/10 bg-[#ffffff] p-0 text-base font-semibold leading-none text-ink-700 hover:bg-[#eef3fa]"
                onClick={() => handleCycleSelectedListing(1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MapCanvas({ listings, onMarkerClick, dense = false }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#c6d1df] bg-[#ffffff] ${dense ? "h-64 sm:h-72" : "h-[420px]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,#e9f2fb_0%,transparent_35%),radial-gradient(circle_at_75%_65%,#d2e3f5_0%,transparent_40%),linear-gradient(135deg,#cfdfef_0%,#e9f2fb_100%)]" />
      <div className="absolute inset-x-0 top-[32%] h-px bg-[#ffffff]/60" />
      <div className="absolute inset-x-0 top-[58%] h-px bg-[#ffffff]/50" />
      <div className="absolute left-[36%] top-0 h-full w-px bg-[#ffffff]/50" />
      <div className="absolute left-[62%] top-0 h-full w-px bg-[#ffffff]/45" />

      {listings.map((listing) => {
        const point = markerPointForListing(listing);
        return (
          <button
            key={listing.id}
            type="button"
            onClick={() => onMarkerClick?.(listing)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0b0a0e]/25 bg-[#ffffff] px-2 py-1 text-[10px] font-semibold text-[#0b0a0e] hover:border-[#0b0a0e] hover:bg-[#0b0a0e] hover:text-white"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            title={listing.title}
          >
            {listing.sizeSqm} m²
          </button>
        );
      })}
    </div>
  );
}

function PillToggle({ checked, onToggle, ariaLabel, className = "", thumbClassName = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-[background-color,border-color] duration-200 ease-out ${
        checked ? "bg-[#0b0a0e]" : "bg-[#d8dde5]"
      } ${className}`}
      onClick={onToggle}
    >
      <span
        aria-hidden="true"
        className={`rounded-full bg-[#ffffff] shadow-[0_1px_2px_rgba(15,25,48,0.35)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          checked ? "translate-x-4" : "translate-x-0"
        } ${thumbClassName}`}
      />
    </button>
  );
}

function AuthPromptModal({ mode, onClose, onRequireAuth }) {
  if (!mode) {
    return null;
  }

  const message = mode === "save"
    ? "Logga in eller skapa konto för att spara objekt och bygga en lista med sparade objekt."
    : "Logga in eller skapa konto för att boka visning och skicka förfrågan till hyresvärd.";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-transparent p-4 sm:items-center" onClick={onClose}>
      <div className="surface w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Konto krävs</p>
        <h3 className="mt-1 text-xl font-semibold text-ink-900">Fortsätt med konto</h3>
        <p className="mt-2 text-sm text-ink-600">{message}</p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              onClose?.();
              onRequireAuth?.("login");
            }}
          >
            Logga in
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onClose?.();
              onRequireAuth?.("signup", "renter");
            }}
          >
            Skapa konto
          </button>
        </div>
        <button type="button" className="mt-3 w-full rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700" onClick={onClose}>
          Fortsätt söka som gäst
        </button>
      </div>
    </div>
  );
}

function hasRunSearchInUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("run") === "1";
}

function hasAvailableListingsViewInUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("view") === "available";
}

function shouldForceCoreStepFromUrl() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("run") !== "1") return false;
  const teamSizeFromUrl = String(params.get("teamSize") || "").trim();
  const districtFromUrl = String(params.get("district") || "").trim();
  return Boolean(teamSizeFromUrl || districtFromUrl);
}

function readFlagParam(params, key, legacyKey = "") {
  const raw = params.get(key) ?? (legacyKey ? params.get(legacyKey) : "");
  return raw === "1" || raw === "true";
}

function buildSearchChipEntries(searchMeta, defaultMaxBudget) {
  const chips = [];
  const activeFilters = searchMeta?.filters || {};
  const minBudgetValue = String(activeFilters.minBudget ?? "").trim();
  const maxBudgetValue = String(activeFilters.maxBudget ?? "").trim();
  const defaultMaxBudgetValue = String(defaultMaxBudget ?? "").trim();
  const hasExplicitMinBudget = minBudgetValue !== "";
  const hasExplicitMaxBudget = maxBudgetValue !== "" && maxBudgetValue !== defaultMaxBudgetValue;

  if (activeFilters.query) chips.push({ key: "query", label: `Sökord: ${activeFilters.query}` });
  const districtValue = String(activeFilters.district || "").trim();
  if (districtValue && districtValue !== "Alla" && districtValue !== "Alla områden" && districtValue !== "Alla områden i Stockholm") {
    chips.push({ key: "district", label: `Område: ${districtValue}` });
  }
  if (Array.isArray(activeFilters.type) && activeFilters.type.length > 0) chips.push({ key: "type", label: `Typ: ${activeFilters.type.join(", ")}` });
  if (activeFilters.teamSize) chips.push({ key: "teamSize", label: `Platser: ${activeFilters.teamSize}+` });
  if (activeFilters.minSize || activeFilters.maxSize) chips.push({ key: "size", label: `Yta: ${activeFilters.minSize || 0}-${activeFilters.maxSize || "∞"} kvm` });
  if (hasExplicitMinBudget || hasExplicitMaxBudget) chips.push({ key: "budget", label: `Budget: ${minBudgetValue || 0}-${maxBudgetValue || "∞"} kr` });
  if (activeFilters.transitDistance) chips.push({ key: "transitDistance", label: `Kommunaltrafik: ${activeFilters.transitDistance}` });
  if (activeFilters.moveInDate) chips.push({ key: "moveInDate", label: `Inflytt: ${activeFilters.moveInDate}` });
  if (activeFilters.contractFlex) chips.push({ key: "contractFlex", label: `Avtal: ${activeFilters.contractFlex}` });
  if (activeFilters.accessHours) chips.push({ key: "accessHours", label: `Access: ${activeFilters.accessHours}` });
  if (activeFilters.parkingType) chips.push({ key: "parkingType", label: `Parkering: ${activeFilters.parkingType}` });
  if (activeFilters.layoutType) chips.push({ key: "layoutType", label: `Planlösning: ${activeFilters.layoutType}` });
  if (activeFilters.advertiser && activeFilters.advertiser !== "Alla") chips.push({ key: "advertiser", label: `Hyresvärd: ${activeFilters.advertiser}` });
  if (activeFilters.includeOperatingCosts) chips.push({ key: "includeOperatingCosts", label: "Driftkostnader ingår" });
  if (activeFilters.accessibilityAdapted) chips.push({ key: "accessibilityAdapted", label: "Tillgänglighetsanpassad" });
  if (activeFilters.ecoCertified) chips.push({ key: "ecoCertified", label: "Miljöcertifierad" });
  if (searchMeta?.amenityQuery) chips.push({ key: "amenityQuery", label: `Bekvämlighet: ${searchMeta.amenityQuery}` });
  if (searchMeta?.furnishedFilter === "yes") chips.push({ key: "furnishedFilter", label: "Möblerad" });
  if (searchMeta?.furnishedFilter === "no") chips.push({ key: "furnishedFilter", label: "Ej möblerad" });

  return chips;
}

const SEARCH_CHIP_ORDER = [
  "query",
  "district",
  "type",
  "teamSize",
  "size",
  "budget",
  "transitDistance",
  "moveInDate",
  "contractFlex",
  "accessHours",
  "parkingType",
  "layoutType",
  "advertiser",
  "includeOperatingCosts",
  "accessibilityAdapted",
  "ecoCertified",
  "amenityQuery",
  "furnishedFilter"
];

function mergeAiChangedChipEntries(baseEntries, aiChangedChipEntries = []) {
  const mergedByKey = new Map(baseEntries.map((entry) => [entry.key, entry]));
  aiChangedChipEntries.forEach((entry) => {
    if (!entry?.key || !entry?.label) return;
    mergedByKey.set(entry.key, { key: entry.key, label: entry.label });
  });
  return Array.from(mergedByKey.values()).sort((left, right) => {
    const leftIndex = SEARCH_CHIP_ORDER.indexOf(left.key);
    const rightIndex = SEARCH_CHIP_ORDER.indexOf(right.key);
    const normalizedLeft = leftIndex === -1 ? SEARCH_CHIP_ORDER.length : leftIndex;
    const normalizedRight = rightIndex === -1 ? SEARCH_CHIP_ORDER.length : rightIndex;
    return normalizedLeft - normalizedRight;
  });
}

function filterAlignedAiChangedChipEntries(searchMeta, defaultMaxBudget) {
  const aiChangedChipEntries = Array.isArray(searchMeta?.aiChangedChipEntries) ? searchMeta.aiChangedChipEntries : [];
  if (aiChangedChipEntries.length === 0) return [];

  const baseEntries = buildSearchChipEntries(searchMeta, defaultMaxBudget);
  const baseByKey = new Map(baseEntries.map((entry) => [entry.key, entry.label]));
  const filters = searchMeta?.filters || {};
  const districtValue = String(filters.district || "").trim();
  const typeValues = Array.isArray(filters.type) ? filters.type.filter(Boolean) : [];
  const teamSizeValue = String(filters.teamSize || "").trim();
  const minSizeValue = String(filters.minSize || "").trim();
  const maxSizeValue = String(filters.maxSize || "").trim();
  const minBudgetValue = String(filters.minBudget || "").trim();
  const maxBudgetValue = String(filters.maxBudget ?? defaultMaxBudget ?? "").trim();
  const moveInDateValue = String(filters.moveInDate || "").trim();
  const contractFlexValue = String(filters.contractFlex || "").trim();
  const transitDistanceValue = String(filters.transitDistance || "").trim();
  const accessHoursValue = String(filters.accessHours || "").trim();
  const parkingTypeValue = String(filters.parkingType || "").trim();
  const layoutTypeValue = String(filters.layoutType || "").trim();
  const advertiserValue = String(filters.advertiser || "").trim();
  const furnishedFilterValue = searchMeta?.furnishedFilter || "all";
  const amenityQueryValue = String(searchMeta?.amenityQuery || "").trim();
  const normalizedDefaultBudget = String(defaultMaxBudget ?? "").trim();

  return aiChangedChipEntries.filter((entry) => {
    if (!entry?.key || !entry?.label) return false;
    const normalized = String(entry.label).toLowerCase().replace(/\s+/g, " ").trim();

    if (baseByKey.get(entry.key) === entry.label) {
      return true;
    }

    if (entry.key === "furnishedFilter") {
      if (furnishedFilterValue === "all") {
        return normalized === "möblering: alla";
      }
      if (furnishedFilterValue === "yes") {
        return normalized === "möblerad" || normalized === "möblering: möblerad";
      }
      if (furnishedFilterValue === "no") {
        return normalized === "ej möblerad" || normalized === "möblering: omöblerad";
      }
      return false;
    }

    if (entry.key === "amenityQuery") {
      if (amenityQueryValue === "") {
        return normalized === "bekvämligheter: inga specifika krav"
          || normalized === "bekvämlighet: inga specifika krav"
          || normalized === "bekvämligheter: utan specifika krav";
      }
      return normalized === `bekvämlighet: ${amenityQueryValue.toLowerCase()}`
        || normalized === `bekvämligheter: ${amenityQueryValue.toLowerCase()}`;
    }

    if (entry.key === "district") {
      return districtValue === ""
        ? normalized === "område: alla områden"
        : districtValue === "Alla"
          ? normalized === "område: alla områden"
          : normalized === `område: ${districtValue.toLowerCase()}`;
    }

    if (entry.key === "type") {
      return typeValues.length === 0
        ? normalized === "typ: alla typer"
        : normalized === `typ: ${typeValues.join(", ").toLowerCase()}`;
    }

    if (entry.key === "teamSize") {
      return teamSizeValue === ""
        ? normalized === "platser: utan minimikrav"
        : normalized === `platser: ${teamSizeValue}+` || normalized === `platser: ${teamSizeValue}`;
    }

    if (entry.key === "size") {
      if (minSizeValue === "" && maxSizeValue === "") {
        return normalized === "yta: valfri";
      }
      return normalized === `yta: ${minSizeValue || "0"}-${maxSizeValue || "∞"} kvm`;
    }

    if (entry.key === "budget") {
      const isDefaultBudget =
        minBudgetValue === ""
        && (maxBudgetValue === "" || maxBudgetValue === normalizedDefaultBudget);
      if (isDefaultBudget) {
        return normalized === "budget: valfri";
      }
      return normalized === `budget: ${minBudgetValue || "0"}-${maxBudgetValue || "∞"} kr`;
    }

    if (entry.key === "moveInDate") {
      return moveInDateValue === ""
        ? normalized === "inflyttning: flexibelt datum" || normalized === "inflyttning: utan fast datum"
        : normalized === `inflytt: ${moveInDateValue}` || normalized === `inflyttning: ${moveInDateValue}`;
    }

    if (entry.key === "contractFlex") {
      return contractFlexValue === ""
        ? normalized === "avtal: alla" || normalized === "avtal: mer flexibelt"
        : normalized === `avtal: ${contractFlexValue.toLowerCase()}`;
    }

    if (entry.key === "transitDistance") {
      return transitDistanceValue === ""
        ? normalized === "kommunaltrafik: alla" || normalized === "kommunaltrafik: alla avstånd"
        : normalized === `kommunaltrafik: ${transitDistanceValue.toLowerCase()}`;
    }

    if (entry.key === "accessHours") {
      return accessHoursValue === ""
        ? normalized === "access: alla" || normalized === "access: alla tider"
        : normalized === `access: ${accessHoursValue.toLowerCase()}`;
    }

    if (entry.key === "parkingType") {
      return parkingTypeValue === ""
        ? normalized === "parkering: alla" || normalized === "parkering: alla alternativ"
        : normalized === `parkering: ${parkingTypeValue.toLowerCase()}`;
    }

    if (entry.key === "layoutType") {
      return layoutTypeValue === ""
        ? normalized === "planlösning: alla" || normalized === "planlösning: alla alternativ"
        : normalized === `planlösning: ${layoutTypeValue.toLowerCase()}`;
    }

    if (entry.key === "advertiser") {
      return advertiserValue === "" || advertiserValue === "Alla"
        ? normalized === "hyresvärd: alla"
        : normalized === `hyresvärd: ${advertiserValue.toLowerCase()}`;
    }

    if (entry.key === "includeOperatingCosts") {
      return filters.includeOperatingCosts
        ? normalized === "driftkostnader ingår" || normalized === "driftkostnad ingår: ja"
        : normalized === "driftkostnader: valfritt" || normalized === "driftkostnad: valfri";
    }

    if (entry.key === "accessibilityAdapted") {
      return filters.accessibilityAdapted
        ? normalized === "tillgänglighetsanpassad" || normalized === "tillgänglighetsanpassad: ja"
        : normalized === "tillgänglighet: valfritt";
    }

    if (entry.key === "ecoCertified") {
      return filters.ecoCertified
        ? normalized === "miljöcertifierad" || normalized === "miljöcertifierad: ja"
        : normalized === "miljöcertifiering: valfritt";
    }

    return false;
  });
}

function buildDisplayedSearchChipEntries(searchMeta, defaultMaxBudget) {
  const baseEntries = buildSearchChipEntries(searchMeta, defaultMaxBudget);
  const alignedAiEntries = filterAlignedAiChangedChipEntries(searchMeta, defaultMaxBudget);
  return mergeAiChangedChipEntries(baseEntries, alignedAiEntries);
}

function getChangedChipKeys(previousMeta, nextMeta, defaultMaxBudget) {
  const previousEntries = buildSearchChipEntries(previousMeta, defaultMaxBudget);
  const nextEntries = buildSearchChipEntries(nextMeta, defaultMaxBudget);
  const previousByKey = new Map(previousEntries.map((entry) => [entry.key, entry.label]));
  const nextByKey = new Map(nextEntries.map((entry) => [entry.key, entry.label]));
  const allKeys = new Set([...previousByKey.keys(), ...nextByKey.keys()]);
  return Array.from(allKeys).filter((key) => previousByKey.get(key) !== nextByKey.get(key));
}

function buildAiChangedChipEntriesFromSummary(summary) {
  const parts = String(summary || "")
    .split(" • ")
    .map((item) => item.trim())
    .filter(Boolean);

  const entries = [];
  parts.forEach((item) => {
    let key = "";
    if (item.startsWith("Område:")) key = "district";
    else if (item.startsWith("Typ:")) key = "type";
    else if (item.startsWith("Platser:")) key = "teamSize";
    else if (item.startsWith("Yta:")) key = "size";
    else if (item.startsWith("Budget:")) key = "budget";
    else if (item.startsWith("Kommunaltrafik:")) key = "transitDistance";
    else if (item.startsWith("Inflyttning:") || item.startsWith("Inflytt:")) key = "moveInDate";
    else if (item.startsWith("Avtal:")) key = "contractFlex";
    else if (item.startsWith("Access:")) key = "accessHours";
    else if (item.startsWith("Parkering:")) key = "parkingType";
    else if (item.startsWith("Planlösning:")) key = "layoutType";
    else if (item.startsWith("Hyresvärd:")) key = "advertiser";
    else if (item.startsWith("Driftkostnad") || item.startsWith("Driftkostnader")) key = "includeOperatingCosts";
    else if (item.startsWith("Tillgänglighet") || item.startsWith("Tillgänglighetsanpassad")) key = "accessibilityAdapted";
    else if (item.startsWith("Miljöcertifierad") || item.startsWith("Miljöcertifiering")) key = "ecoCertified";
    else if (item.startsWith("Bekvämligheter:") || item.startsWith("Bekvämlighet:")) key = "amenityQuery";
    else if (item.startsWith("Möblering:") || item === "Möblerad" || item === "Ej möblerad") key = "furnishedFilter";
    if (!key) return;
    entries.push({ key, label: item });
  });
  return entries;
}

function formatSuggestionChanges(candidate, baseline) {
  const parts = [];
  const nextFilters = candidate?.nextFilters || {};
  const baseFilters = baseline?.filters || {};
  const nextAmenityQuery = String(candidate?.nextAmenityQuery || "").trim();
  const baseAmenityQuery = String(baseline?.amenityQuery || "").trim();
  const nextFurnished = candidate?.nextFurnishedFilter || "all";
  const baseFurnished = baseline?.furnishedFilter || "all";

  if ((nextFilters.district || "Alla") !== (baseFilters.district || "Alla")) {
    parts.push(`Område: ${nextFilters.district || "Alla områden"}`);
  }
  const nextType = Array.isArray(nextFilters.type) && nextFilters.type.length > 0 ? nextFilters.type.join(", ") : "Alla typer";
  const baseType = Array.isArray(baseFilters.type) && baseFilters.type.length > 0 ? baseFilters.type.join(", ") : "Alla typer";
  if (nextType !== baseType) {
    parts.push(`Typ: ${nextType}`);
  }
  if ((nextFilters.teamSize || "") !== (baseFilters.teamSize || "")) {
    parts.push(`Platser: ${nextFilters.teamSize || "utan minimikrav"}`);
  }
  if ((nextFilters.minSize || "") !== (baseFilters.minSize || "") || (nextFilters.maxSize || "") !== (baseFilters.maxSize || "")) {
    parts.push(`Yta: ${nextFilters.minSize || "min valfri"} - ${nextFilters.maxSize || "max valfri"}`);
  }
  if ((nextFilters.minBudget || "") !== (baseFilters.minBudget || "") || (nextFilters.maxBudget || "") !== (baseFilters.maxBudget || "")) {
    parts.push(`Budget: ${nextFilters.minBudget || "från valfri"} - ${nextFilters.maxBudget || "till valfri"} kr`);
  }
  if ((nextFilters.moveInDate || "") !== (baseFilters.moveInDate || "")) {
    parts.push(`Inflyttning: ${nextFilters.moveInDate || "flexibelt datum"}`);
  }
  if ((nextFilters.contractFlex || "") !== (baseFilters.contractFlex || "")) {
    parts.push(`Avtal: ${nextFilters.contractFlex || "alla"}`);
  }
  if ((nextFilters.transitDistance || "") !== (baseFilters.transitDistance || "")) {
    parts.push(`Kommunaltrafik: ${nextFilters.transitDistance || "alla avstånd"}`);
  }
  if ((nextFilters.accessHours || "") !== (baseFilters.accessHours || "")) {
    parts.push(`Access: ${nextFilters.accessHours || "alla tider"}`);
  }
  if ((nextFilters.parkingType || "") !== (baseFilters.parkingType || "")) {
    parts.push(`Parkering: ${nextFilters.parkingType || "alla alternativ"}`);
  }
  if ((nextFilters.layoutType || "") !== (baseFilters.layoutType || "")) {
    parts.push(`Planlösning: ${nextFilters.layoutType || "alla"}`);
  }
  if ((nextFilters.advertiser || "Alla") !== (baseFilters.advertiser || "Alla")) {
    parts.push(`Hyresvärd: ${nextFilters.advertiser || "Alla"}`);
  }
  if (Boolean(nextFilters.includeOperatingCosts) !== Boolean(baseFilters.includeOperatingCosts)) {
    parts.push(`Driftkostnad ingår: ${nextFilters.includeOperatingCosts ? "ja" : "nej"}`);
  }
  if (Boolean(nextFilters.accessibilityAdapted) !== Boolean(baseFilters.accessibilityAdapted)) {
    parts.push(`Tillgänglighetsanpassad: ${nextFilters.accessibilityAdapted ? "ja" : "nej"}`);
  }
  if (Boolean(nextFilters.ecoCertified) !== Boolean(baseFilters.ecoCertified)) {
    parts.push(`Miljöcertifierad: ${nextFilters.ecoCertified ? "ja" : "nej"}`);
  }
  if (nextAmenityQuery !== baseAmenityQuery) {
    parts.push(`Bekvämligheter: ${nextAmenityQuery || "utan specifika krav"}`);
  }
  if (nextFurnished !== baseFurnished) {
    parts.push(`Möblering: ${nextFurnished === "all" ? "alla" : nextFurnished === "yes" ? "möblerad" : "omöblerad"}`);
  }

  if (parts.length === 0) return candidate?.preview || "";
  return parts.join(" • ");
}

function getSuggestionProblemText(suggestion) {
  const detail = String(suggestion?.detail || "").trim();
  if (detail) {
    const firstSentence = detail.split(". ")[0]?.trim();
    if (firstSentence) {
      return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
    }
  }
  return String(suggestion?.title || "").trim();
}

function renderTextWithBoldMarkers(text) {
  const value = String(text || "");
  if (!value.includes("**")) return value;

  return value.split(/(\*\*.*?\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

function joinSuggestionLabels(values) {
  const items = values.map((value) => String(value || "").trim()).filter(Boolean);
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} och ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} och ${items.at(-1)}`;
}

function getFurnishedLabel(value) {
  if (value === "yes") return "Möblerad";
  if (value === "no") return "Omöblerad";
  return "Alla";
}

function formatRangeLabel(minValue, maxValue, unit) {
  const min = String(minValue || "").trim();
  const max = String(maxValue || "").trim();
  if (!min && !max) return "";
  return `${min || "min valfri"}-${max || "max valfri"} ${unit}`;
}

function buildResultsSuggestionCandidates({
  baseFilters,
  baseAmenityQuery,
  baseFurnished,
  defaultMaxBudget
}) {
  const defaultBudget = Number(defaultMaxBudget || 250000);
  const amenityTerms = parseAmenityTerms(baseAmenityQuery);
  const typeLabel = Array.isArray(baseFilters.type) && baseFilters.type.length > 0
    ? joinSuggestionLabels(baseFilters.type)
    : "";
  const minBudgetValue = String(baseFilters.minBudget || "").trim();
  const maxBudgetValue = String(baseFilters.maxBudget || "").trim();
  const defaultBudgetValue = String(defaultBudget || "").trim();
  const hasExplicitBudget = minBudgetValue !== "" || (maxBudgetValue !== "" && maxBudgetValue !== defaultBudgetValue);
  const nextBudgetMax = Math.max(
    Number.isFinite(Number(baseFilters.maxBudget)) && Number(baseFilters.maxBudget) > 0
      ? Math.round(Number(baseFilters.maxBudget) * 1.2)
      : 0,
    Number.isFinite(Number(baseFilters.maxBudget)) && Number(baseFilters.maxBudget) > 0
      ? Number(baseFilters.maxBudget) + 10000
      : defaultBudget
  );
  const fullyRelaxedFilters = {
    ...baseFilters,
    district: "Alla",
    type: [],
    teamSize: "",
    minSize: "",
    maxSize: "",
    minBudget: "",
    maxBudget: String(defaultBudget),
    moveInDate: "",
    contractFlex: "",
    transitDistance: "",
    accessHours: "",
    parkingType: "",
    layoutType: "",
    advertiser: "Alla",
    includeOperatingCosts: false,
    accessibilityAdapted: false,
    ecoCertified: false
  };

  const explicitCandidates = [
    baseFurnished !== "all"
      ? {
          id: "furnished-all",
          title: `Möblering är satt till ${getFurnishedLabel(baseFurnished)}`,
          detail: `Kravet på ${getFurnishedLabel(baseFurnished).toLowerCase()} begränsar resultaten just nu. Om du öppnar upp till alla möbleringsalternativ kan fler lokaler visas.`,
          suggestedChange: "Möblering: Alla",
          targetStep: "core",
          nextFilters: { ...baseFilters },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: "all"
        }
      : null,
    amenityTerms.length > 0
      ? {
          id: "amenities-clear",
          title: `Bekvämligheter är satt till ${joinSuggestionLabels(amenityTerms)}`,
          detail: `Bekvämlighetskravet **${joinSuggestionLabels(amenityTerms)}** begränsar resultaten just nu. Om du gör det valfritt kan fler lokaler visas.`,
          suggestedChange: "Bekvämligheter: inga specifika krav",
          targetStep: "amenities",
          nextFilters: { ...baseFilters },
          nextAmenityQuery: "",
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.district && baseFilters.district !== "Alla"
      ? {
          id: "district-all",
          title: `Område är satt till ${baseFilters.district}`,
          detail: `Områdeskravet **${baseFilters.district}** begränsar resultaten just nu. Om du breddar till alla områden kan fler lokaler visas.`,
          suggestedChange: "Område: Alla områden",
          targetStep: "core",
          nextFilters: { ...baseFilters, district: "Alla" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    typeLabel
      ? {
          id: "type-all",
          title: `Typ är satt till ${typeLabel}`,
          detail: `Typkravet **${typeLabel}** begränsar resultaten just nu. Om du öppnar upp till fler lokaltyper kan fler lokaler visas.`,
          suggestedChange: "Typ: Alla typer",
          targetStep: "type",
          nextFilters: { ...baseFilters, type: [] },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.layoutType
      ? {
          id: "layout-clear",
          title: `Planlösning är satt till ${baseFilters.layoutType}`,
          detail: `Planlösningskravet **${baseFilters.layoutType}** begränsar resultaten just nu. Om du gör planlösning valfri kan fler lokaler visas.`,
          suggestedChange: "Planlösning: Alla",
          targetStep: "type",
          nextFilters: { ...baseFilters, layoutType: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    String(baseFilters.teamSize || "").trim()
      ? {
          id: "team-clear",
          title: `Platser är satt till minst ${baseFilters.teamSize} st`,
          detail: `Platskravet **${baseFilters.teamSize} st** begränsar resultaten just nu. Om du sänker eller tar bort minimikravet kan fler lokaler visas.`,
          suggestedChange: "Platser: utan minimikrav",
          targetStep: "core",
          nextFilters: { ...baseFilters, teamSize: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    (baseFilters.minSize || baseFilters.maxSize)
      ? {
          id: "size-clear",
          title: `Yta är satt till ${formatRangeLabel(baseFilters.minSize, baseFilters.maxSize, "kvm")}`,
          detail: `Ytkravet **${formatRangeLabel(baseFilters.minSize, baseFilters.maxSize, "kvm")}** begränsar resultaten just nu. Om du gör ytan mer flexibel kan fler lokaler visas.`,
          suggestedChange: "Yta: valfri",
          targetStep: "size",
          nextFilters: { ...baseFilters, minSize: "", maxSize: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    hasExplicitBudget
      ? {
          id: "budget-clear",
          title: `Budget är satt till ${formatRangeLabel(baseFilters.minBudget, baseFilters.maxBudget, "kr")}`,
          detail: `Budgetkravet **${formatRangeLabel(baseFilters.minBudget, baseFilters.maxBudget, "kr")}** begränsar resultaten just nu. Om du gör budgeten mer flexibel kan fler lokaler visas.`,
          suggestedChange: "Budget: valfri",
          targetStep: "budget",
          nextFilters: { ...baseFilters, minBudget: "", maxBudget: String(defaultBudget) },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.moveInDate
      ? {
          id: "movein-clear",
          title: `Inflyttning är satt till ${baseFilters.moveInDate}`,
          detail: `Inflyttningskravet **${baseFilters.moveInDate}** begränsar resultaten just nu. Om du gör datumet flexibelt kan fler lokaler visas.`,
          suggestedChange: "Inflyttning: flexibelt datum",
          targetStep: "moveAndContract",
          nextFilters: { ...baseFilters, moveInDate: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.contractFlex
      ? {
          id: "contract-clear",
          title: `Avtal är satt till ${baseFilters.contractFlex}`,
          detail: `Avtalskravet **${baseFilters.contractFlex}** begränsar resultaten just nu. Om du gör avtalet mer flexibelt kan fler lokaler visas.`,
          suggestedChange: "Avtal: Alla",
          targetStep: "moveAndContract",
          nextFilters: { ...baseFilters, contractFlex: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.transitDistance
      ? {
          id: "transit-clear",
          title: `Kommunaltrafik är satt till ${baseFilters.transitDistance}`,
          detail: `Kravet på kommunaltrafik **${baseFilters.transitDistance}** begränsar resultaten just nu. Om du öppnar upp till alla avstånd kan fler lokaler visas.`,
          suggestedChange: "Kommunaltrafik: Alla",
          targetStep: "amenities",
          nextFilters: { ...baseFilters, transitDistance: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.parkingType
      ? {
          id: "parking-clear",
          title: `Parkering är satt till ${baseFilters.parkingType}`,
          detail: `Parkeringskravet **${baseFilters.parkingType}** begränsar resultaten just nu. Om du gör parkering valfri kan fler lokaler visas.`,
          suggestedChange: "Parkering: Alla",
          targetStep: "amenities",
          nextFilters: { ...baseFilters, parkingType: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.accessHours
      ? {
          id: "access-clear",
          title: `Access är satt till ${baseFilters.accessHours}`,
          detail: `Accesskravet **${baseFilters.accessHours}** begränsar resultaten just nu. Om du gör access mer flexibel kan fler lokaler visas.`,
          suggestedChange: "Access: Alla",
          targetStep: "accessAndAdvertiser",
          nextFilters: { ...baseFilters, accessHours: "" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.advertiser && baseFilters.advertiser !== "Alla"
      ? {
          id: "advertiser-clear",
          title: `Hyresvärd är satt till ${baseFilters.advertiser}`,
          detail: `Hyresvärdskravet **${baseFilters.advertiser}** begränsar resultaten just nu. Om du öppnar upp till alla hyresvärder kan fler lokaler visas.`,
          suggestedChange: "Hyresvärd: Alla",
          targetStep: "accessAndAdvertiser",
          nextFilters: { ...baseFilters, advertiser: "Alla" },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.includeOperatingCosts
      ? {
          id: "operating-clear",
          title: "Driftkostnader ingår är aktiverat",
          detail: "Kravet **Driftkostnader ingår** begränsar resultaten just nu. Om du gör driftkostnader valfria kan fler lokaler visas.",
          suggestedChange: "Driftkostnader: valfritt",
          targetStep: "compliance",
          nextFilters: { ...baseFilters, includeOperatingCosts: false },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.accessibilityAdapted
      ? {
          id: "accessibility-clear",
          title: "Tillgänglighetsanpassad är aktiverat",
          detail: "Kravet **Tillgänglighetsanpassad** begränsar resultaten just nu. Om du gör tillgänglighetskravet valfritt kan fler lokaler visas.",
          suggestedChange: "Tillgänglighet: valfritt",
          targetStep: "compliance",
          nextFilters: { ...baseFilters, accessibilityAdapted: false },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    baseFilters.ecoCertified
      ? {
          id: "eco-clear",
          title: "Miljöcertifierad är aktiverat",
          detail: "Kravet **Miljöcertifierad** begränsar resultaten just nu. Om du gör miljöcertifiering valfri kan fler lokaler visas.",
          suggestedChange: "Miljöcertifiering: valfritt",
          targetStep: "compliance",
          nextFilters: { ...baseFilters, ecoCertified: false },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null
  ].filter(Boolean);

  const fallbackCandidates = [
    amenityTerms.length > 0 || (baseFilters.district && baseFilters.district !== "Alla")
      ? {
          id: "district-amenities-combo",
          title: "Område och bekvämligheter är för snäva tillsammans",
          detail: `Kombinationen av området **${baseFilters.district && baseFilters.district !== "Alla" ? baseFilters.district : "Alla områden"}**${amenityTerms.length > 0 ? ` och bekvämligheterna **${joinSuggestionLabels(amenityTerms)}**` : ""} ger för få träffar. Om du öppnar upp båda samtidigt kan fler lokaler visas.`,
          suggestedChange: "Område: Alla områden • Bekvämligheter: inga specifika krav",
          targetStep: amenityTerms.length > 0 ? "amenities" : "core",
          nextFilters: { ...baseFilters, district: "Alla" },
          nextAmenityQuery: "",
          nextFurnishedFilter: baseFurnished
        }
      : null,
    (baseFilters.minSize || baseFilters.maxSize || hasExplicitBudget)
      ? {
          id: "size-budget-combo",
          title: "Yta och budget är för snäva tillsammans",
          detail: `Kombinationen av ytan **${formatRangeLabel(baseFilters.minSize, baseFilters.maxSize, "kvm") || "valfri"}** och budgeten **${formatRangeLabel(baseFilters.minBudget, baseFilters.maxBudget, "kr") || "valfri"}** ger för få träffar. Om du gör båda mer flexibla kan fler lokaler visas.`,
          suggestedChange: "Yta: valfri • Budget: bredare intervall",
          targetStep: "size",
          nextFilters: {
            ...baseFilters,
            minSize: "",
            maxSize: "",
            minBudget: "",
            maxBudget: String(Math.max(nextBudgetMax, defaultBudget))
          },
          nextAmenityQuery: baseAmenityQuery,
          nextFurnishedFilter: baseFurnished
        }
      : null,
    {
      id: "reset-to-broad",
      title: "Sökningen är för snäv totalt sett",
      detail: "Flera aktiva krav i sökningen begränsar resultaten just nu. Om du gör sökningen bredare kan fler lokaler visas direkt.",
      suggestedChange: "Bredare sökning med färre begränsningar",
      targetStep: "core",
      nextFilters: fullyRelaxedFilters,
      nextAmenityQuery: "",
      nextFurnishedFilter: "all"
    }
  ].filter(Boolean);

  return { explicitCandidates, fallbackCandidates };
}

function RentPage({ app, isGuest = false, onRequireAuth }) {
  const {
    user,
    listings,
    favorites,
    savedFilters,
    searchListings,
    resetSearchToAllListings,
    saveCurrentFilters,
    toggleFavorite,
    requestViewing,
    runAiSearch
  } = app;

  const [filters, setFilters] = useState(savedFilters);
  const [isHydratingLandingSearch, setIsHydratingLandingSearch] = useState(() => hasRunSearchInUrl());
  const [showSearchEditor, setShowSearchEditor] = useState(false);
  const [isClosingSearchEditor, setIsClosingSearchEditor] = useState(false);
  const [showAdvancedSearchEditor, setShowAdvancedSearchEditor] = useState(false);
  const [showAdvancedSearchOverlay, setShowAdvancedSearchOverlay] = useState(false);
  const [isAdvancedSearchOverlayActive, setIsAdvancedSearchOverlayActive] = useState(false);
  const [isClosingAdvancedSearchOverlay, setIsClosingAdvancedSearchOverlay] = useState(false);
  const [showEditorAiPanel, setShowEditorAiPanel] = useState(false);
  const [sidePanelMode, setSidePanelMode] = useState("filter");
  const [isSwitchingSidePanel, setIsSwitchingSidePanel] = useState(false);
  const [showAdvancedFiltersContent, setShowAdvancedFiltersContent] = useState(false);
  const [isCollapsingAdvancedFilters, setIsCollapsingAdvancedFilters] = useState(false);
  const [showEditorAiInfo, setShowEditorAiInfo] = useState(false);
  const [hideLocalProgramQuickCard, setHideLocalProgramQuickCard] = useState(false);
  const [isLocalProgramQuickCardDissolving, setIsLocalProgramQuickCardDissolving] = useState(false);
  const [editorModeOpacity, setEditorModeOpacity] = useState(1);
  const [amenityQuery, setAmenityQuery] = useState("");
  const [furnishedFilter, setFurnishedFilter] = useState("all");
  const [appliedSearchMeta, setAppliedSearchMeta] = useState({
    filters: savedFilters,
    amenityQuery: "",
    furnishedFilter: "all",
    aiPrompt: "",
    aiSuggestionLabel: "",
    aiChangedChipKeys: [],
    aiChangedChipEntries: []
  });
  const [bookingListing, setBookingListing] = useState(null);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [selectedMapListing, setSelectedMapListing] = useState(null);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [authPromptMode, setAuthPromptMode] = useState("");
  const [resultViewMode, setResultViewMode] = useState("list");
  const [aiGuideResetKey, setAiGuideResetKey] = useState(0);
  const [sortBy, setSortBy] = useState("relevance");
  const [useNewSearchCta, setUseNewSearchCta] = useState(false);
  const [isAvailableListingsView, setIsAvailableListingsView] = useState(() => hasAvailableListingsViewInUrl());
  const [isLeavingAvailableView, setIsLeavingAvailableView] = useState(false);
  const [isEnteringAvailableView, setIsEnteringAvailableView] = useState(false);
  const [isResettingToAvailable, setIsResettingToAvailable] = useState(false);
  const [showSearchSummaryCard, setShowSearchSummaryCard] = useState(() => !hasAvailableListingsViewInUrl());
  const [animateSearchSummaryIn, setAnimateSearchSummaryIn] = useState(false);
  const [animateLocalProgramResultsIn, setAnimateLocalProgramResultsIn] = useState(false);
  const [isLocalProgramResultsTransitioning, setIsLocalProgramResultsTransitioning] = useState(false);
  const [localProgramTransitionSnapshot, setLocalProgramTransitionSnapshot] = useState(null);
  const [forceSearchResultsMode, setForceSearchResultsMode] = useState(false);
  const [aiLivePreview, setAiLivePreview] = useState({
    filters: null,
    amenityQuery: "",
    furnishedFilter: "all",
    aiPrompt: "",
    matchCount: null,
    aiChangedChipKeys: [],
    aiChangedChipEntries: []
  });
  const [aiGuideStepRequest, setAiGuideStepRequest] = useState(null);
  const [forceAiGuideCoreStep, setForceAiGuideCoreStep] = useState(() => shouldForceCoreStepFromUrl());
  const [resultsSuggestion, setResultsSuggestion] = useState(null);
  const [resultsSuggestionLoading, setResultsSuggestionLoading] = useState(false);
  const [dismissedResultsSuggestionKey, setDismissedResultsSuggestionKey] = useState("");
  const [noMatchSuggestions, setNoMatchSuggestions] = useState([]);
  const [noMatchSuggestionsLoading, setNoMatchSuggestionsLoading] = useState(false);
  const landingSearchAppliedRef = useRef(false);
  const editorModeTimerRef = useRef(null);
  const closeEditorTimerRef = useRef(null);
  const summaryFadeTimerRef = useRef(null);
  const availableTransitionTimerRef = useRef(null);
  const resultsSuggestionRequestRef = useRef(0);
  const availableEnterTimerRef = useRef(null);
  const resetToAvailableTimerRef = useRef(null);
  const sidePanelSwitchTimerRef = useRef(null);
  const advancedFiltersTimerRef = useRef(null);
  const advancedSearchOverlayTimerRef = useRef(null);
  const localProgramQuickCardTimerRef = useRef(null);
  const localProgramResultsAnimationTimerRef = useRef(null);
  const liveFilterTimerRef = useRef(null);
  const noMatchSuggestionRequestRef = useRef(0);
  const filterExpandedBeforeAiRef = useRef(false);
  const resultsTopRef = useRef(null);
  const searchChipRenderOrderRef = useRef([]);

  const favoriteIds = useMemo(() => new Set(favorites.map((entry) => entry.listingId)), [favorites]);
  const renterProgram = useMemo(() => app.user?.profile?.renterProgram || null, [app.user?.profile?.renterProgram]);
  const renterPrograms = useMemo(() => {
    const list = Array.isArray(app.user?.profile?.renterPrograms) ? app.user.profile.renterPrograms.filter(Boolean) : [];
    if (list.length > 0) return list;
    return renterProgram ? [renterProgram] : [];
  }, [app.user?.profile?.renterPrograms, renterProgram]);
  const hasCompanyAdminRole = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
    return roles.map(normalizeAppRole).includes("company_admin");
  }, [user?.role, user?.roles]);
  const hasRenterRole = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
    return roles.map(normalizeAppRole).includes("renter");
  }, [user?.role, user?.roles]);
  const implicitMaxBudget = app.allListingsFilters?.maxBudget ?? app.defaultFilters?.maxBudget ?? "";
  const hasTeamSizeForMatchChip = useMemo(() => {
    const parsed = Number(String(filters.teamSize || "").trim());
    return Number.isFinite(parsed) && parsed > 0;
  }, [filters.teamSize]);
  const hasBeyondCoreAiInput = useMemo(() => {
    const query = String(filters.query || "").trim();
    const hasType = Array.isArray(filters.type) && filters.type.length > 0;
    const minSize = String(filters.minSize || "").trim();
    const maxSize = String(filters.maxSize || "").trim();
    const minBudget = String(filters.minBudget || "").trim();
    const maxBudget = String(filters.maxBudget || "").trim();
    const hasNonDefaultBudget = minBudget !== "" || (maxBudget !== "" && Number(maxBudget) !== Number(implicitMaxBudget));
    const hasDate = String(filters.moveInDate || "").trim() !== "";
    const hasContract = String(filters.contractFlex || "").trim() !== "";
    const hasTransit = String(filters.transitDistance || "").trim() !== "";
    const hasAccess = String(filters.accessHours || "").trim() !== "";
    const hasParking = String(filters.parkingType || "").trim() !== "";
    const hasLayout = String(filters.layoutType || "").trim() !== "";
    const advertiser = String(filters.advertiser || "").trim();
    const hasAdvertiser = advertiser !== "" && advertiser !== "Alla";
    const hasCompliance = Boolean(filters.includeOperatingCosts) || Boolean(filters.accessibilityAdapted) || Boolean(filters.ecoCertified);
    const hasAmenities = String(amenityQuery || "").trim() !== "";

    return Boolean(
      query ||
      hasType ||
      minSize ||
      maxSize ||
      hasNonDefaultBudget ||
      hasDate ||
      hasContract ||
      hasTransit ||
      hasAccess ||
      hasParking ||
      hasLayout ||
      hasAdvertiser ||
      hasCompliance ||
      hasAmenities
    );
  }, [filters, amenityQuery, implicitMaxBudget]);
  const listingsById = useMemo(() => new Map(listings.map((item) => [item.id, item])), [listings]);
  const advertiserOptions = useMemo(() => {
    const names = Array.from(new Set(listings.map((item) => item.advertiserName).filter(Boolean)));
    return names.sort((a, b) => a.localeCompare(b, "sv"));
  }, [listings]);
  const sortedListings = useMemo(() => {
    const items = [...listings];

    items.sort((a, b) => {
      if (sortBy === "price_asc") return Number(a.priceMonthly || 0) - Number(b.priceMonthly || 0);
      if (sortBy === "price_desc") return Number(b.priceMonthly || 0) - Number(a.priceMonthly || 0);
      if (sortBy === "size_asc") return Number(a.sizeSqm || 0) - Number(b.sizeSqm || 0);
      if (sortBy === "size_desc") return Number(b.sizeSqm || 0) - Number(a.sizeSqm || 0);
      return Number(b.score || 0) - Number(a.score || 0);
    });

    return items;
  }, [listings, sortBy]);

  useEffect(() => {
    setFilters(savedFilters);
  }, [savedFilters]);

  useEffect(() => {
    function syncAvailableViewFromUrl() {
      setIsAvailableListingsView(hasAvailableListingsViewInUrl());
    }

    window.addEventListener("popstate", syncAvailableViewFromUrl);
    window.addEventListener("app:navigate", syncAvailableViewFromUrl);
    return () => {
      window.removeEventListener("popstate", syncAvailableViewFromUrl);
      window.removeEventListener("app:navigate", syncAvailableViewFromUrl);
    };
  }, []);

  useEffect(() => {
    if (!isAvailableListingsView) return;
    if (closeEditorTimerRef.current) {
      clearTimeout(closeEditorTimerRef.current);
      closeEditorTimerRef.current = null;
    }
    if (availableTransitionTimerRef.current) {
      clearTimeout(availableTransitionTimerRef.current);
      availableTransitionTimerRef.current = null;
    }
    setIsClosingSearchEditor(false);
    setIsLeavingAvailableView(false);
    setIsResettingToAvailable(false);
    setShowSearchEditor(false);
    setShowSearchSummaryCard(false);
    setAnimateSearchSummaryIn(false);
    setShowAdvancedSearchEditor(false);
    setShowAdvancedSearchOverlay(false);
    setIsAdvancedSearchOverlayActive(false);
    setIsClosingAdvancedSearchOverlay(false);
    setShowEditorAiPanel(false);
    setSidePanelMode("filter");
    setIsSwitchingSidePanel(false);
    setShowAdvancedFiltersContent(false);
    setIsCollapsingAdvancedFilters(false);
    setEditorModeOpacity(1);
  }, [isAvailableListingsView]);

  useEffect(() => {
    return () => {
      if (editorModeTimerRef.current) {
        clearTimeout(editorModeTimerRef.current);
      }
      if (closeEditorTimerRef.current) {
        clearTimeout(closeEditorTimerRef.current);
      }
      if (summaryFadeTimerRef.current) {
        clearTimeout(summaryFadeTimerRef.current);
      }
      if (availableTransitionTimerRef.current) {
        clearTimeout(availableTransitionTimerRef.current);
      }
      if (availableEnterTimerRef.current) {
        clearTimeout(availableEnterTimerRef.current);
      }
      if (resetToAvailableTimerRef.current) {
        clearTimeout(resetToAvailableTimerRef.current);
      }
      if (sidePanelSwitchTimerRef.current) {
        clearTimeout(sidePanelSwitchTimerRef.current);
      }
      if (advancedFiltersTimerRef.current) {
        clearTimeout(advancedFiltersTimerRef.current);
      }
      if (advancedSearchOverlayTimerRef.current) {
        clearTimeout(advancedSearchOverlayTimerRef.current);
      }
      if (localProgramQuickCardTimerRef.current) {
        clearTimeout(localProgramQuickCardTimerRef.current);
      }
      if (localProgramResultsAnimationTimerRef.current) {
        clearTimeout(localProgramResultsAnimationTimerRef.current);
      }
      if (liveFilterTimerRef.current) {
        clearTimeout(liveFilterTimerRef.current);
      }
    };
  }, []);

  function collapseLocalProgramHeaderCta() {
    if (hideLocalProgramQuickCard || isLocalProgramQuickCardDissolving) return;
    setIsLocalProgramQuickCardDissolving(true);
    if (localProgramQuickCardTimerRef.current) {
      clearTimeout(localProgramQuickCardTimerRef.current);
    }
    localProgramQuickCardTimerRef.current = setTimeout(() => {
      setHideLocalProgramQuickCard(true);
      setIsLocalProgramQuickCardDissolving(false);
      localProgramQuickCardTimerRef.current = null;
    }, 280);
  }

  function restoreLocalProgramHeaderCta() {
    if (localProgramQuickCardTimerRef.current) {
      clearTimeout(localProgramQuickCardTimerRef.current);
      localProgramQuickCardTimerRef.current = null;
    }
    setIsLocalProgramQuickCardDissolving(false);
    setHideLocalProgramQuickCard(false);
  }

  function animateLocalProgramResultsPresentation(delay = 0) {
    if (localProgramResultsAnimationTimerRef.current) {
      clearTimeout(localProgramResultsAnimationTimerRef.current);
      localProgramResultsAnimationTimerRef.current = null;
    }
    setAnimateLocalProgramResultsIn(false);
    localProgramResultsAnimationTimerRef.current = setTimeout(() => {
      setAnimateLocalProgramResultsIn(true);
      localProgramResultsAnimationTimerRef.current = setTimeout(() => {
        setAnimateLocalProgramResultsIn(false);
        localProgramResultsAnimationTimerRef.current = null;
      }, 420);
    }, delay);
  }

  const hasManualSearchInput = useMemo(() => {
    const hasTeamSize = String(filters.teamSize || "").trim() !== "";
    const district = String(filters.district || "").trim();
    const hasDistrict = district !== "" && district !== "Alla";
    const hasFurnished = furnishedFilter !== "all";
    return hasTeamSize || hasDistrict || hasFurnished || hasBeyondCoreAiInput;
  }, [filters.teamSize, filters.district, furnishedFilter, hasBeyondCoreAiInput]);

  useEffect(() => {
    if (hasManualSearchInput) {
      collapseLocalProgramHeaderCta();
      return;
    }
    if (localProgramQuickCardTimerRef.current) {
      clearTimeout(localProgramQuickCardTimerRef.current);
      localProgramQuickCardTimerRef.current = null;
    }
    setIsLocalProgramQuickCardDissolving(false);
    setHideLocalProgramQuickCard(false);
  }, [hasManualSearchInput]);

  useEffect(() => {
    const targetMode = showEditorAiPanel ? "ai" : "filter";
    if (targetMode === sidePanelMode) return;
    if (sidePanelSwitchTimerRef.current) {
      clearTimeout(sidePanelSwitchTimerRef.current);
    }
    setIsSwitchingSidePanel(true);
    sidePanelSwitchTimerRef.current = setTimeout(() => {
      setSidePanelMode(targetMode);
      setIsSwitchingSidePanel(false);
      sidePanelSwitchTimerRef.current = null;
    }, 320);
  }, [showEditorAiPanel, sidePanelMode]);

  useEffect(() => {
    if (showAdvancedSearchEditor) {
      setShowAdvancedSearchOverlay(true);
      setIsAdvancedSearchOverlayActive(false);
      setIsClosingAdvancedSearchOverlay(false);
      if (advancedFiltersTimerRef.current) {
        clearTimeout(advancedFiltersTimerRef.current);
        advancedFiltersTimerRef.current = null;
      }
      setShowAdvancedFiltersContent(true);
      setIsCollapsingAdvancedFilters(false);
      return;
    }
    if (!showAdvancedFiltersContent) return;
    setIsCollapsingAdvancedFilters(true);
    advancedFiltersTimerRef.current = setTimeout(() => {
      setShowAdvancedFiltersContent(false);
      setIsCollapsingAdvancedFilters(false);
      advancedFiltersTimerRef.current = null;
    }, 320);
  }, [showAdvancedSearchEditor, showAdvancedFiltersContent]);

  useEffect(() => {
    if (!showAdvancedSearchOverlay || isAdvancedSearchOverlayActive || isClosingAdvancedSearchOverlay) return;
    if (advancedSearchOverlayTimerRef.current) {
      clearTimeout(advancedSearchOverlayTimerRef.current);
    }
    advancedSearchOverlayTimerRef.current = setTimeout(() => {
      setIsAdvancedSearchOverlayActive(true);
      advancedSearchOverlayTimerRef.current = null;
    }, 16);
    return () => {
      if (advancedSearchOverlayTimerRef.current) {
        clearTimeout(advancedSearchOverlayTimerRef.current);
        advancedSearchOverlayTimerRef.current = null;
      }
    };
  }, [showAdvancedSearchOverlay, isAdvancedSearchOverlayActive, isClosingAdvancedSearchOverlay]);

  function closeAdvancedSearchOverlay() {
    if (!showAdvancedSearchOverlay || !isAdvancedSearchOverlayActive) return;
    setIsClosingAdvancedSearchOverlay(true);
    setIsAdvancedSearchOverlayActive(false);
    setShowAdvancedSearchEditor(false);
    if (advancedSearchOverlayTimerRef.current) {
      clearTimeout(advancedSearchOverlayTimerRef.current);
    }
    advancedSearchOverlayTimerRef.current = setTimeout(() => {
      setShowAdvancedSearchOverlay(false);
      setIsClosingAdvancedSearchOverlay(false);
      advancedSearchOverlayTimerRef.current = null;
    }, 240);
  }

  function transitionFromAvailableToResults() {
    if (availableTransitionTimerRef.current) {
      clearTimeout(availableTransitionTimerRef.current);
    }
    setShowSearchSummaryCard(false);
    setAnimateSearchSummaryIn(false);
    setIsLeavingAvailableView(true);
    setShowAdvancedSearchEditor(false);
    setShowEditorAiPanel(false);
    setEditorModeOpacity(1);
    availableTransitionTimerRef.current = setTimeout(() => {
      setIsAvailableListingsView(false);
      setShowSearchEditor(false);
      setIsLeavingAvailableView(false);
      setShowSearchSummaryCard(true);
      setAnimateSearchSummaryIn(true);
      if (summaryFadeTimerRef.current) clearTimeout(summaryFadeTimerRef.current);
      summaryFadeTimerRef.current = setTimeout(() => {
        setAnimateSearchSummaryIn(false);
        summaryFadeTimerRef.current = null;
      }, 280);
      navigateTo("/app/rent?run=1", { replace: true });
      availableTransitionTimerRef.current = null;
    }, 420);
  }

  function transitionFromResultsToAvailable(onCommit) {
    if (resetToAvailableTimerRef.current) {
      clearTimeout(resetToAvailableTimerRef.current);
    }
    if (availableEnterTimerRef.current) {
      clearTimeout(availableEnterTimerRef.current);
    }
    setAnimateSearchSummaryIn(false);
    setIsResettingToAvailable(true);
    resetToAvailableTimerRef.current = setTimeout(async () => {
      if (typeof onCommit === "function") {
        await onCommit();
      }
      setForceSearchResultsMode(false);
      setShowSearchSummaryCard(false);
      setIsAvailableListingsView(true);
      setIsEnteringAvailableView(true);
      setIsResettingToAvailable(false);
      navigateTo("/app/rent?view=available", { replace: true });
      availableEnterTimerRef.current = setTimeout(() => {
        setIsEnteringAvailableView(false);
        availableEnterTimerRef.current = null;
      }, 360);
      resetToAvailableTimerRef.current = null;
    }, 240);
  }

  function closeSearchEditorSmooth() {
    if (isClosingSearchEditor) return;
    setShowSearchSummaryCard(false);
    setAnimateSearchSummaryIn(false);
    setIsClosingSearchEditor(true);
    setShowAdvancedSearchEditor(false);
    closeEditorTimerRef.current = setTimeout(() => {
      setShowSearchEditor(false);
      setIsClosingSearchEditor(false);
      if (!isAvailableListingsView) {
        setShowSearchSummaryCard(true);
        setAnimateSearchSummaryIn(true);
        if (summaryFadeTimerRef.current) clearTimeout(summaryFadeTimerRef.current);
        summaryFadeTimerRef.current = setTimeout(() => {
          setAnimateSearchSummaryIn(false);
          summaryFadeTimerRef.current = null;
        }, 280);
      }
      closeEditorTimerRef.current = null;
    }, 420);
  }

  function isAmenitySelected(value) {
    const normalizedValue = normalizeAmenityTerm(value);
    const aliases = amenityAliasesByValue[normalizedValue] || [normalizedValue];
    const selectedTerms = parseAmenityTerms(amenityQuery).map(normalizeAmenityTerm);
    return selectedTerms.some((term) => aliases.some((alias) => term === normalizeAmenityTerm(alias)));
  }

  function toggleAmenity(value) {
    const tokens = parseAmenityTerms(amenityQuery);
    const normalizedValue = normalizeAmenityTerm(value);
    const hasValue = tokens.some((token) => normalizeAmenityTerm(token) === normalizedValue);
    const nextTokens = hasValue
      ? tokens.filter((token) => normalizeAmenityTerm(token) !== normalizedValue)
      : [...tokens, value];
    setAmenityQuery(nextTokens.join(", "));
  }

  function switchEditorSearchMode(nextAiEnabled) {
    if (nextAiEnabled === showEditorAiPanel) return;
    if (editorModeTimerRef.current) {
      clearTimeout(editorModeTimerRef.current);
    }
    if (nextAiEnabled) {
      filterExpandedBeforeAiRef.current = showAdvancedSearchEditor;
    }
    setEditorModeOpacity(0);
    editorModeTimerRef.current = setTimeout(() => {
      setShowEditorAiPanel(nextAiEnabled);
      setShowAdvancedSearchEditor(nextAiEnabled ? true : filterExpandedBeforeAiRef.current);
      if (!nextAiEnabled) {
        setAiLivePreview({
          filters: null,
          amenityQuery: "",
          furnishedFilter: "all",
          aiPrompt: "",
          matchCount: null,
          aiChangedChipKeys: [],
          aiChangedChipEntries: []
        });
      }
      setEditorModeOpacity(1);
      editorModeTimerRef.current = null;
    }, 140);
  }

  function inferAmenitiesFromText(text) {
    const normalized = String(text || "").toLowerCase();
    const inferred = [];
    for (const option of editorAmenityOptions) {
      const normalizedValue = String(option.value).toLowerCase();
      const aliases = amenityAliasesByValue[normalizedValue] || [normalizedValue];
      if (aliases.some((alias) => normalized.includes(alias))) {
        inferred.push(option.value);
      }
    }
    return inferred;
  }

  async function previewEditorAiFilters(nextFilters, context = {}) {
    const nextAmenityTerms = String(context.amenityQuery || "").trim();
    const nextPrompt = String(context.prompt || "").trim();
    const nextFurnishedFilter = typeof context.furnishedFilter === "string" ? context.furnishedFilter : furnishedFilter;
    setFilters(nextFilters);
    setAmenityQuery(nextAmenityTerms);
    setFurnishedFilter(nextFurnishedFilter);
    setAiLivePreview((prev) => ({
      filters: nextFilters,
      amenityQuery: nextAmenityTerms,
      furnishedFilter: nextFurnishedFilter,
      aiPrompt: nextPrompt,
      matchCount: null,
      aiChangedChipKeys: prev.aiChangedChipKeys || [],
      aiChangedChipEntries: prev.aiChangedChipEntries || []
    }));
    const listingData = await searchListings(nextFilters);
    const narrowed = applyAmenityAndFurnishedFilters(listingData, nextAmenityTerms, nextFurnishedFilter);
    setAiLivePreview((prev) => ({
      filters: nextFilters,
      amenityQuery: nextAmenityTerms,
      furnishedFilter: nextFurnishedFilter,
      aiPrompt: nextPrompt,
      matchCount: narrowed.length,
      aiChangedChipKeys: prev.aiChangedChipKeys || [],
      aiChangedChipEntries: prev.aiChangedChipEntries || []
    }));
    return narrowed.length;
  }

  async function submitGuidedEditorAiSearch(payload) {
    const prompt = String(payload?.prompt || "").trim();
    if (!prompt) {
      app.pushToast("Skriv en AI-prompt eller ett sökord först.", "info");
      return;
    }

    const assistantFilters = payload?.filters || filters;
    const assistantAmenityTerms = String(payload?.amenityQuery || "").trim();
    const assistantFurnishedFilter = typeof payload?.furnishedFilter === "string" ? payload.furnishedFilter : furnishedFilter;

    try {
      const aiResponse = await runAiSearch(prompt, assistantFilters);
      const nextFilters = aiResponse?.suggestedFilters || assistantFilters;
      const inferredAmenities = inferAmenitiesFromText(prompt);
      const explicitAmenities = parseAmenityTerms(assistantAmenityTerms);
      const mergedAmenityTerms = Array.from(new Set([...explicitAmenities, ...inferredAmenities])).join(", ");

      setFilters(nextFilters);
      setAmenityQuery(mergedAmenityTerms);
      setFurnishedFilter(assistantFurnishedFilter);
      setAiLivePreview({
        filters: nextFilters,
        amenityQuery: mergedAmenityTerms,
        furnishedFilter: assistantFurnishedFilter,
        aiPrompt: prompt,
        matchCount: null,
        aiChangedChipKeys: [],
        aiChangedChipEntries: []
      });
      await executeSearch(nextFilters, {
        aiPrompt: prompt,
        amenityQuery: mergedAmenityTerms,
        furnishedFilter: assistantFurnishedFilter
      });
      setAiLivePreview({
        filters: null,
        amenityQuery: "",
        furnishedFilter: "all",
        aiPrompt: "",
        matchCount: null,
        aiChangedChipKeys: [],
        aiChangedChipEntries: []
      });
      if (isAvailableListingsView) {
        transitionFromAvailableToResults();
      } else {
        closeSearchEditorSmooth();
      }
    } catch (_error) {
      app.pushToast("AI-sök kunde inte köras just nu.", "error");
    }
  }

  async function submitEditorSearch(event) {
    event.preventDefault();
    if (showEditorAiPanel) {
      return;
    }
    const amenityTerms = amenityQuery.trim();

    setAiLivePreview({
      filters: null,
      amenityQuery: "",
      furnishedFilter: "all",
      aiPrompt: "",
      matchCount: null,
      aiChangedChipKeys: [],
      aiChangedChipEntries: []
    });
    await executeSearch(filters, { amenityQuery: amenityTerms, furnishedFilter });
    if (isAvailableListingsView) {
      transitionFromAvailableToResults();
    } else {
      closeSearchEditorSmooth();
    }
  }

  async function submitAvailableListingsSearch(event) {
    event.preventDefault();
    await executeSearch(filters, { amenityQuery, furnishedFilter });
    transitionFromAvailableToResults();
  }

  function openAuthPrompt(mode) {
    setAuthPromptMode(mode);
  }

  function openExpandedSearchEditor() {
    setShowSearchEditor((value) => {
      const nextValue = !value;
      if (nextValue) {
        setShowSearchSummaryCard(false);
        setAnimateSearchSummaryIn(false);
        if (closeEditorTimerRef.current) {
          clearTimeout(closeEditorTimerRef.current);
          closeEditorTimerRef.current = null;
        }
        setIsClosingSearchEditor(false);
        if (editorModeTimerRef.current) {
          clearTimeout(editorModeTimerRef.current);
          editorModeTimerRef.current = null;
        }
        setEditorModeOpacity(1);
        setShowAdvancedSearchEditor(false);
        setShowEditorAiPanel(false);
        setAmenityQuery(appliedSearchMeta.amenityQuery || amenityQuery);
        setFurnishedFilter(appliedSearchMeta.furnishedFilter || furnishedFilter);
      }
      return nextValue;
    });
  }

  function openAiSearchEditor() {
    if (isAvailableListingsView) {
      setShowEditorAiPanel(true);
      setShowAdvancedSearchEditor(true);
      setEditorModeOpacity(1);
      return;
    }

    setShowSearchSummaryCard(false);
    setAnimateSearchSummaryIn(false);
    if (closeEditorTimerRef.current) {
      clearTimeout(closeEditorTimerRef.current);
      closeEditorTimerRef.current = null;
    }
    if (editorModeTimerRef.current) {
      clearTimeout(editorModeTimerRef.current);
      editorModeTimerRef.current = null;
    }
    setIsClosingSearchEditor(false);
    setEditorModeOpacity(1);
    setShowAdvancedSearchEditor(true);
    setShowEditorAiPanel(false);
    setShowSearchEditor(true);
  }

  function handleFilterSearchToggle() {
    const nextAiEnabled = !showEditorAiPanel;
    setShowEditorAiPanel(nextAiEnabled);
    if (!nextAiEnabled) {
      setShowAdvancedSearchEditor(false);
      setAiLivePreview({
        filters: null,
        amenityQuery: "",
        furnishedFilter: "all",
        aiPrompt: "",
        matchCount: null,
        aiChangedChipKeys: [],
        aiChangedChipEntries: []
      });
      return;
    }
  }

  async function submitSideFilterSearch(event) {
    event.preventDefault();
    await executeSearch(filters, { amenityQuery, furnishedFilter });
    if (isAvailableListingsView) {
      transitionFromAvailableToResults();
    }
  }

  async function executeSearch(nextFilters = filters, options = {}) {
    await searchListings(nextFilters);
    setIsHydratingLandingSearch(false);
    if (options.closeEditor) {
      setShowSearchEditor(false);
    }
    setUseNewSearchCta(Boolean(options.markAsNewSearch));
    const amenityValue = typeof options.amenityQuery === "string" ? options.amenityQuery : amenityQuery;
    const furnishedValue = typeof options.furnishedFilter === "string" ? options.furnishedFilter : furnishedFilter;
    setAppliedSearchMeta({
      filters: nextFilters,
      amenityQuery: amenityValue,
      furnishedFilter: furnishedValue,
      aiPrompt: options.aiPrompt || "",
      aiSuggestionLabel: options.aiSuggestionLabel || "",
      aiChangedChipKeys: Array.isArray(options.aiChangedChipKeys) ? options.aiChangedChipKeys : [],
      aiChangedChipEntries: Array.isArray(options.aiChangedChipEntries) ? options.aiChangedChipEntries : []
    });
  }

  useEffect(() => {
    if (showEditorAiPanel || isHydratingLandingSearch) return;

    const appliedSignature = JSON.stringify({
      filters: appliedSearchMeta.filters || {},
      amenityQuery: appliedSearchMeta.amenityQuery || "",
      furnishedFilter: appliedSearchMeta.furnishedFilter || "all"
    });
    const nextSignature = JSON.stringify({
      filters,
      amenityQuery,
      furnishedFilter
    });

    if (appliedSignature === nextSignature) return;

    if (liveFilterTimerRef.current) {
      clearTimeout(liveFilterTimerRef.current);
    }

    liveFilterTimerRef.current = setTimeout(() => {
      void executeSearch(filters, { amenityQuery, furnishedFilter });
      liveFilterTimerRef.current = null;
    }, 220);

    return () => {
      if (liveFilterTimerRef.current) {
        clearTimeout(liveFilterTimerRef.current);
        liveFilterTimerRef.current = null;
      }
    };
  }, [
    showEditorAiPanel,
    isHydratingLandingSearch,
    filters,
    amenityQuery,
    furnishedFilter,
    appliedSearchMeta.filters,
    appliedSearchMeta.amenityQuery,
    appliedSearchMeta.furnishedFilter
  ]);

  async function handleAiSuggestedFilters(payload) {
    const nextFilters = payload?.suggestedFilters || filters;
    const aiPrompt = String(payload?.prompt || "").trim();
    setFilters(nextFilters);
    await executeSearch(nextFilters, { aiPrompt });
  }

  async function handleResetSearchResults() {
    const resetFilters = { ...(app.allListingsFilters || app.defaultFilters), accessHours: "" };
    transitionFromResultsToAvailable(async () => {
      restoreLocalProgramHeaderCta();
      setFilters(resetFilters);
      setAmenityQuery("");
      setFurnishedFilter("all");
      await resetSearchToAllListings?.();
      setIsHydratingLandingSearch(false);
      setAppliedSearchMeta({
        filters: resetFilters,
        amenityQuery: "",
        furnishedFilter: "all",
        aiPrompt: "",
        aiSuggestionLabel: "",
        aiChangedChipKeys: [],
        aiChangedChipEntries: []
      });
      setUseNewSearchCta(false);
      setShowSearchEditor(false);
      setAiLivePreview({
        filters: null,
        amenityQuery: "",
        furnishedFilter: "all",
        aiPrompt: "",
        matchCount: null,
        aiChangedChipKeys: [],
        aiChangedChipEntries: []
      });
      setAiGuideResetKey((value) => value + 1);
    });
  }

  useEffect(() => {
    if (landingSearchAppliedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("run") !== "1") {
      setIsHydratingLandingSearch(false);
      setForceAiGuideCoreStep(false);
      return;
    }

    landingSearchAppliedRef.current = true;
    const queryFromUrl = String(params.get("query") || params.get("q") || "").trim();
    const districtFromUrl = String(params.get("district") || "").trim();
    const typeFromUrl = String(params.get("type") || "").trim();
    const minSizeFromUrl = String(params.get("minSize") || "").trim();
    const teamSizeFromUrl = String(params.get("teamSize") || "").trim();
    const minBudgetFromUrl = String(params.get("minBudget") || "").trim();
    const maxBudgetFromUrl = String(params.get("maxBudget") || "").trim();
    const maxSizeFromUrl = String(params.get("maxSize") || "").trim();
    const transitDistanceFromUrl = String(params.get("transitDistance") || params.get("transit") || "").trim();
    const moveInDateFromUrl = String(params.get("moveInDate") || params.get("moveIn") || "").trim();
    const contractFlexFromUrl = String(params.get("contractFlex") || "").trim();
    const accessHoursFromUrl = String(params.get("accessHours") || "").trim();
    const parkingTypeFromUrl = String(params.get("parkingType") || params.get("parking") || "").trim();
    const layoutTypeFromUrl = String(params.get("layoutType") || params.get("layout") || "").trim();
    const advertiserFromUrl = String(params.get("advertiser") || "").trim();
    const includeOperatingCostsFromUrl = readFlagParam(params, "includeOperatingCosts", "costsIncluded");
    const accessibilityAdaptedFromUrl = readFlagParam(params, "accessibilityAdapted", "accessibility");
    const ecoCertifiedFromUrl = readFlagParam(params, "ecoCertified");
    const amenityFromUrl = String(params.get("amenity") || "").trim();
    const furnishedFromUrl = String(params.get("furnished") || "").trim();
    const aiEnabledFromUrl = params.get("ai") === "1";
    const aiPromptFromUrl = String(params.get("aiPrompt") || "").trim();
    const baseFilters = { ...app.defaultFilters };
    const nextFilters = {
      ...baseFilters,
      query: queryFromUrl,
      district: districtFromUrl || baseFilters.district,
      type: typeFromUrl ? [typeFromUrl] : baseFilters.type,
      minSize: minSizeFromUrl || baseFilters.minSize,
      maxSize: maxSizeFromUrl || baseFilters.maxSize,
      teamSize: teamSizeFromUrl || baseFilters.teamSize,
      minBudget: minBudgetFromUrl || baseFilters.minBudget,
      maxBudget: maxBudgetFromUrl || baseFilters.maxBudget,
      transitDistance: transitDistanceFromUrl || baseFilters.transitDistance,
      moveInDate: moveInDateFromUrl || baseFilters.moveInDate,
      contractFlex: contractFlexFromUrl || baseFilters.contractFlex,
      accessHours: accessHoursFromUrl || baseFilters.accessHours,
      parkingType: parkingTypeFromUrl || baseFilters.parkingType,
      layoutType: layoutTypeFromUrl || baseFilters.layoutType,
      advertiser: advertiserFromUrl || baseFilters.advertiser,
      includeOperatingCosts: includeOperatingCostsFromUrl || Boolean(baseFilters.includeOperatingCosts),
      accessibilityAdapted: accessibilityAdaptedFromUrl || Boolean(baseFilters.accessibilityAdapted),
      ecoCertified: ecoCertifiedFromUrl || Boolean(baseFilters.ecoCertified)
    };
    setFilters(nextFilters);
    if (amenityFromUrl) setAmenityQuery(amenityFromUrl);
    if (furnishedFromUrl === "yes" || furnishedFromUrl === "no") setFurnishedFilter(furnishedFromUrl);
    setAppliedSearchMeta({
      filters: nextFilters,
      amenityQuery: amenityFromUrl || "",
      furnishedFilter: furnishedFromUrl === "yes" || furnishedFromUrl === "no" ? furnishedFromUrl : "all",
      aiPrompt: aiPromptFromUrl || "",
      aiSuggestionLabel: "",
      aiChangedChipKeys: [],
      aiChangedChipEntries: []
    });
    setShowEditorAiPanel(false);
    setForceAiGuideCoreStep(false);
    setAiGuideStepRequest(null);

    async function bootstrapFromLandingSearch() {
      try {
        let filtersToApply = nextFilters;
        let aiPromptApplied = "";
        let nextAmenityQuery = amenityFromUrl;

        if (aiEnabledFromUrl && aiPromptFromUrl) {
          try {
            const aiResponse = await runAiSearch(aiPromptFromUrl, nextFilters);
            if (aiResponse?.suggestedFilters) {
              filtersToApply = aiResponse.suggestedFilters;
            }
            const inferredAmenities = inferAmenitiesFromText(aiPromptFromUrl);
            if (inferredAmenities.length > 0) {
              const explicitAmenities = parseAmenityTerms(nextAmenityQuery);
              nextAmenityQuery = Array.from(new Set([...explicitAmenities, ...inferredAmenities])).join(", ");
            }
            aiPromptApplied = aiPromptFromUrl;
          } catch (_error) {
            app.pushToast("AI-sök kunde inte tolkas. Visar resultat med dina vanliga filter.", "info");
          }
        }

        setAmenityQuery(nextAmenityQuery);
        setFilters(filtersToApply);
        await executeSearch(filtersToApply, {
          amenityQuery: nextAmenityQuery,
          furnishedFilter: furnishedFromUrl === "yes" || furnishedFromUrl === "no" ? furnishedFromUrl : "all",
          aiPrompt: aiPromptApplied
        });
      } catch (_error) {
        setIsHydratingLandingSearch(false);
      }
    }

    void bootstrapFromLandingSearch();
  }, [app.defaultFilters, runAiSearch]);

  const showInlineAiGuide = true;
  const useLiveAiSearchMeta = showInlineAiGuide && showEditorAiPanel;
  const effectiveFilters = useLiveAiSearchMeta ? (aiLivePreview.filters || filters) : (appliedSearchMeta.filters || filters);
  const effectiveAmenityQuery = useLiveAiSearchMeta ? (aiLivePreview.amenityQuery || amenityQuery) : appliedSearchMeta.amenityQuery;
  const effectiveFurnishedFilter = useLiveAiSearchMeta ? (aiLivePreview.furnishedFilter || furnishedFilter) : appliedSearchMeta.furnishedFilter;
  const effectiveAiPrompt = useLiveAiSearchMeta ? (aiLivePreview.aiPrompt || "") : (appliedSearchMeta.aiPrompt || "");

  const visibleListings = useMemo(() => {
    return applyAmenityAndFurnishedFilters(
      sortedListings,
      effectiveAmenityQuery,
      effectiveFurnishedFilter
    );
  }, [sortedListings, effectiveAmenityQuery, effectiveFurnishedFilter]);

  const activeSearchChips = useMemo(() => {
    const useLiveFilterChips = showInlineAiGuide && !showEditorAiPanel;
    const chipMeta = useLiveFilterChips
      ? {
          ...appliedSearchMeta,
          filters,
          amenityQuery,
          furnishedFilter
        }
      : appliedSearchMeta;
    return buildDisplayedSearchChipEntries(chipMeta, implicitMaxBudget);
  }, [appliedSearchMeta, implicitMaxBudget, showInlineAiGuide, showEditorAiPanel, filters, amenityQuery, furnishedFilter]);

  const liveAiChips = useMemo(() => {
    if (!useLiveAiSearchMeta) return [];
    const hasLiveAiPreview = Boolean(aiLivePreview.filters);
    return buildDisplayedSearchChipEntries(
      {
        filters: effectiveFilters,
        amenityQuery: effectiveAmenityQuery,
        furnishedFilter: effectiveFurnishedFilter,
        aiPrompt: effectiveAiPrompt,
        aiChangedChipEntries: hasLiveAiPreview
          ? (aiLivePreview.aiChangedChipEntries || [])
          : (appliedSearchMeta.aiChangedChipEntries || [])
      },
      implicitMaxBudget
    );
  }, [
    useLiveAiSearchMeta,
    effectiveFilters,
    effectiveAmenityQuery,
    effectiveFurnishedFilter,
    effectiveAiPrompt,
    aiLivePreview.aiChangedChipEntries,
    appliedSearchMeta.aiChangedChipEntries,
    implicitMaxBudget
  ]);
  const displayedAiPrompt = useLiveAiSearchMeta ? effectiveAiPrompt : (appliedSearchMeta.aiPrompt || "");
  const displayedSearchChips = useLiveAiSearchMeta ? liveAiChips : activeSearchChips;
  const orderedDisplayedSearchChips = useMemo(() => {
    const chipEntriesByKey = new Map(displayedSearchChips.map((chip) => [chip.key, chip]));
    const previousOrder = Array.isArray(searchChipRenderOrderRef.current) ? searchChipRenderOrderRef.current : [];
    const nextOrder = previousOrder.filter((key) => chipEntriesByKey.has(key));
    const existingKeys = new Set(nextOrder);

    displayedSearchChips.forEach((chip) => {
      if (existingKeys.has(chip.key)) return;
      nextOrder.push(chip.key);
      existingKeys.add(chip.key);
    });

    searchChipRenderOrderRef.current = nextOrder;
    return nextOrder.map((key) => chipEntriesByKey.get(key)).filter(Boolean);
  }, [displayedSearchChips]);
  const displayedAiChangedChipKeys = useMemo(() => {
    const hasLiveAiPreview = useLiveAiSearchMeta && Boolean(aiLivePreview.filters);
    const activeMeta = useLiveAiSearchMeta
      ? {
          filters: effectiveFilters,
          amenityQuery: effectiveAmenityQuery,
          furnishedFilter: effectiveFurnishedFilter,
          aiChangedChipEntries: hasLiveAiPreview
            ? (aiLivePreview.aiChangedChipEntries || [])
            : (appliedSearchMeta.aiChangedChipEntries || [])
        }
      : {
          ...appliedSearchMeta,
          filters: effectiveFilters,
          amenityQuery: effectiveAmenityQuery,
          furnishedFilter: effectiveFurnishedFilter
        };
    return Array.from(new Set(
      filterAlignedAiChangedChipEntries(activeMeta, implicitMaxBudget)
        .map((entry) => entry.key)
        .filter(Boolean)
    ));
  }, [
    useLiveAiSearchMeta,
    effectiveFilters,
    effectiveAmenityQuery,
    effectiveFurnishedFilter,
    aiLivePreview.aiChangedChipEntries,
    appliedSearchMeta.aiChangedChipEntries,
    implicitMaxBudget
  ]);
  const hasBegunSearch = Boolean(String(displayedAiPrompt || "").trim()) || displayedSearchChips.length > 0;
  const displayedVisibleListings = isLocalProgramResultsTransitioning && localProgramTransitionSnapshot
    ? localProgramTransitionSnapshot.visibleListings
    : visibleListings;
  const displayedSelectedMapListing = isLocalProgramResultsTransitioning && localProgramTransitionSnapshot
    ? localProgramTransitionSnapshot.selectedMapListing
    : selectedMapListing;
  const displayedSummaryResultCount = isLocalProgramResultsTransitioning && localProgramTransitionSnapshot
    ? localProgramTransitionSnapshot.summaryResultCount
    : (aiLivePreview.matchCount ?? visibleListings.length);
  const displayedHasBegunSearch = isLocalProgramResultsTransitioning && localProgramTransitionSnapshot
    ? localProgramTransitionSnapshot.hasBegunSearch
    : (forceSearchResultsMode || hasBegunSearch);
  const focusedDistrict = useMemo(
    () => normalizeFocusedDistrict(filters.district),
    [filters.district]
  );
  const noMatchSuggestionSignature = useMemo(
    () =>
      JSON.stringify({
        filters: effectiveFilters,
        amenityQuery: effectiveAmenityQuery,
        furnishedFilter: effectiveFurnishedFilter,
        hasBegunSearch,
        resultViewMode
      }),
    [effectiveFilters, effectiveAmenityQuery, effectiveFurnishedFilter, hasBegunSearch, resultViewMode]
  );

  useEffect(() => {
    if (!selectedMapListing?.id) return;
    const exists = visibleListings.some((item) => String(item.id) === String(selectedMapListing.id));
    if (!exists) {
      setSelectedMapListing(null);
    }
  }, [visibleListings, selectedMapListing]);

  useEffect(() => {
    if (resultViewMode !== "map") {
      setSelectedMapListing(null);
    }
  }, [resultViewMode]);

  useEffect(() => {
    if (!hoveredListingId) return;
    const exists = visibleListings.some((item) => String(item.id) === String(hoveredListingId));
    if (!exists) {
      setHoveredListingId(null);
    }
  }, [hoveredListingId, visibleListings]);

  useEffect(() => {
    if (!hasBegunSearch || resultViewMode !== "list" || visibleListings.length > 0) {
      setNoMatchSuggestions([]);
      setNoMatchSuggestionsLoading(false);
      return;
    }

    const requestId = noMatchSuggestionRequestRef.current + 1;
    noMatchSuggestionRequestRef.current = requestId;
    let cancelled = false;

    const baseFilters = { ...(effectiveFilters || filters) };
    const baseAmenityQuery = String(effectiveAmenityQuery || "");
    const baseFurnished = effectiveFurnishedFilter || furnishedFilter || "all";
    const baselineMeta = {
      filters: baseFilters,
      amenityQuery: baseAmenityQuery,
      furnishedFilter: baseFurnished
    };
    const defaultMaxBudget = Number(app.defaultFilters?.maxBudget || 250000);
    const currentMaxBudget = Number(baseFilters.maxBudget || defaultMaxBudget || 0);
    const nextBudgetMax = Math.max(
      Number.isFinite(currentMaxBudget) && currentMaxBudget > 0 ? Math.round(currentMaxBudget * 1.2) : 0,
      Number.isFinite(currentMaxBudget) && currentMaxBudget > 0 ? currentMaxBudget + 10000 : defaultMaxBudget
    );

    const fullyRelaxedFilters = {
      ...baseFilters,
      district: "Alla",
      type: [],
      minSize: "",
      maxSize: "",
      minBudget: "",
      maxBudget: String(defaultMaxBudget || 250000),
      moveInDate: "",
      contractFlex: "",
      transitDistance: "",
      layoutType: "",
      advertiser: "Alla",
      includeOperatingCosts: false,
      accessibilityAdapted: false,
      ecoCertified: false
    };

    const minBudgetValue = String(baseFilters.minBudget || "").trim();
    const maxBudgetValue = String(baseFilters.maxBudget || "").trim();
    const defaultBudgetValue = String(defaultMaxBudget || "").trim();
    const hasExplicitBudget = minBudgetValue !== "" || (maxBudgetValue !== "" && maxBudgetValue !== defaultBudgetValue);

    const explicitCandidates = [
      baseFilters.district && baseFilters.district !== "Alla"
        ? {
            id: "district-all",
            label: "Bredda område",
            preview: "Område: alla områden",
            nextFilters: { ...baseFilters, district: "Alla" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      Array.isArray(baseFilters.type) && baseFilters.type.length > 0
        ? {
            id: "type-all",
            label: "Bredda lokaltyp",
            preview: "Typ: alla typer av lokal",
            nextFilters: { ...baseFilters, type: [] },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      String(baseFilters.teamSize || "").trim()
        ? {
            id: "team-clear",
            label: "Minska platskrav",
            preview: "Platser: utan minimikrav",
            nextFilters: { ...baseFilters, teamSize: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      (baseFilters.minSize || baseFilters.maxSize)
        ? {
            id: "size-clear",
            label: "Bredda yta",
            preview: "Yta: valfri",
            nextFilters: { ...baseFilters, minSize: "", maxSize: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      hasExplicitBudget
        ? {
            id: "budget-clear",
            label: "Minska budgetkrav",
            preview: "Budget: valfri",
            nextFilters: {
              ...baseFilters,
              minBudget: "",
              maxBudget: String(defaultMaxBudget || 250000)
            },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.moveInDate
        ? {
            id: "movein-clear",
            label: "Gör inflyttning mer flexibel",
            preview: "Inflyttning: utan fast datum",
            nextFilters: { ...baseFilters, moveInDate: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.contractFlex
        ? {
            id: "contract-clear",
            label: "Minska avtalskrav",
            preview: "Avtal: mer flexibelt",
            nextFilters: { ...baseFilters, contractFlex: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.transitDistance
        ? {
            id: "transit-clear",
            label: "Minska krav på kommunaltrafik",
            preview: "Kommunaltrafik: alla avstånd",
            nextFilters: { ...baseFilters, transitDistance: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.parkingType
        ? {
            id: "parking-clear",
            label: "Minska parkeringskrav",
            preview: "Parkering: alla alternativ",
            nextFilters: { ...baseFilters, parkingType: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.layoutType
        ? {
            id: "layout-clear",
            label: "Minska planlösningskrav",
            preview: "Planlösning: alla alternativ",
            nextFilters: { ...baseFilters, layoutType: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.accessHours
        ? {
            id: "access-clear",
            label: "Minska accesskrav",
            preview: "Access: alla tider",
            nextFilters: { ...baseFilters, accessHours: "" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.advertiser && baseFilters.advertiser !== "Alla"
        ? {
            id: "advertiser-clear",
            label: "Minska hyresvärdskrav",
            preview: "Hyresvärd: alla",
            nextFilters: { ...baseFilters, advertiser: "Alla" },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.includeOperatingCosts
        ? {
            id: "operating-clear",
            label: "Minska krav på driftkostnad",
            preview: "Driftkostnad: valfri",
            nextFilters: { ...baseFilters, includeOperatingCosts: false },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.accessibilityAdapted
        ? {
            id: "accessibility-clear",
            label: "Minska tillgänglighetskrav",
            preview: "Tillgänglighet: valfri",
            nextFilters: { ...baseFilters, accessibilityAdapted: false },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFilters.ecoCertified
        ? {
            id: "eco-clear",
            label: "Minska miljökrav",
            preview: "Miljöcertifiering: valfri",
            nextFilters: { ...baseFilters, ecoCertified: false },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: baseFurnished
          }
        : null,
      String(baseAmenityQuery).trim()
        ? {
            id: "amenities-clear",
            label: "Minska bekvämlighetskrav",
            preview: "Bekvämligheter: inga specifika krav",
            nextFilters: { ...baseFilters },
            nextAmenityQuery: "",
            nextFurnishedFilter: baseFurnished
          }
        : null,
      baseFurnished !== "all"
        ? {
            id: "furnished-all",
            label: "Återställ möblering",
            preview: "Möblering: alla",
            nextFilters: { ...baseFilters },
            nextAmenityQuery: baseAmenityQuery,
            nextFurnishedFilter: "all"
          }
        : null
    ].filter(Boolean);

    const fallbackCandidates = [
      {
        id: "combo-relax",
        label: "Bredda område och bekvämligheter",
        preview: "Område: alla • Bekvämligheter: valfria",
        nextFilters: { ...baseFilters, district: "Alla" },
        nextAmenityQuery: "",
        nextFurnishedFilter: baseFurnished
      },
      {
        id: "flex-date-contract",
        label: "Gör tidplanen flexibel",
        preview: "Inflyttning + avtal: flexibelt",
        nextFilters: {
          ...baseFilters,
          moveInDate: "",
          contractFlex: ""
        },
        nextAmenityQuery: baseAmenityQuery,
        nextFurnishedFilter: baseFurnished
      },
      {
        id: "relax-size-budget",
        label: "Bredda yta och budget",
        preview: "Yta: valfri • Budget: bredare intervall",
        nextFilters: {
          ...baseFilters,
          minSize: "",
          maxSize: "",
          minBudget: "",
          maxBudget: String(Math.max(nextBudgetMax, defaultMaxBudget || 250000))
        },
        nextAmenityQuery: baseAmenityQuery,
        nextFurnishedFilter: baseFurnished
      },
      {
        id: "reset-to-broad",
        label: "Visa bredare matchning",
        preview: "Bred sökning med färre begränsningar",
        nextFilters: fullyRelaxedFilters,
        nextAmenityQuery: "",
        nextFurnishedFilter: "all"
      }
    ];

    async function evaluateCandidates(candidates, limit = 3) {
      const validSuggestions = [];
      for (const candidate of candidates) {
        if (cancelled || noMatchSuggestionRequestRef.current !== requestId) return [];
        try {
          const { listings: nextListings } = await listingApi.getListings(candidate.nextFilters);
          const filtered = applyAmenityAndFurnishedFilters(
            nextListings,
            candidate.nextAmenityQuery,
            candidate.nextFurnishedFilter
          );
          if (filtered.length > 0) {
            validSuggestions.push({
              ...candidate,
              count: filtered.length,
              changeSummary: formatSuggestionChanges(candidate, baselineMeta)
            });
          }
          if (validSuggestions.length >= limit) break;
        } catch (_error) {
          // Ignore individual suggestion failures.
        }
      }
      return validSuggestions;
    }

    async function buildSuggestions() {
      setNoMatchSuggestionsLoading(true);
      const primary = await evaluateCandidates(explicitCandidates, 3);
      const validSuggestions = primary.length > 0 ? primary : await evaluateCandidates(fallbackCandidates, 3);
      if (cancelled || noMatchSuggestionRequestRef.current !== requestId) return;
      setNoMatchSuggestions(validSuggestions);
      setNoMatchSuggestionsLoading(false);
    }

    void buildSuggestions();

    return () => {
      cancelled = true;
    };
  }, [
    noMatchSuggestionSignature,
    visibleListings.length,
    hasBegunSearch,
    resultViewMode,
    effectiveFilters,
    filters,
    effectiveAmenityQuery,
    effectiveFurnishedFilter,
    furnishedFilter,
    app.defaultFilters?.maxBudget
  ]);

  function handleToggleShortlist(listingId) {
    if (isGuest) {
      openAuthPrompt("save");
      return;
    }
    toggleFavorite(listingId);
  }

  function handleBookViewing(listing) {
    if (isGuest) {
      openAuthPrompt("book");
      return;
    }
    setBookingListing(listing);
  }

  function openListingDetail(listing) {
    if (!listing?.id) return;
    const source = isAvailableListingsView ? "available" : "search";
    navigateTo(`/app/listings/${encodeURIComponent(listing.id)}?source=${source}`);
  }

  function handleMapMarkerClick(listing) {
    if (!listing?.id) return;
    setSelectedMapListing(listing);
  }

  async function applyLocalProgramSearch(programOverride) {
    if (isGuest) {
      openAuthPrompt("save");
      return false;
    }

    const activeProgram = programOverride || renterProgram;

    if (!activeProgram) {
      app.pushToast("Inget lokalprogram hittades i din profil ännu.", "info");
      return false;
    }

    const hasAnyProgramInput = [
      activeProgram.district,
      activeProgram.type,
      activeProgram.teamSize,
      activeProgram.minSize,
      activeProgram.maxSize,
      activeProgram.minBudget,
      activeProgram.maxBudget,
      activeProgram.moveInDate,
      activeProgram.contractFlex,
      activeProgram.transitDistance,
      activeProgram.accessHours,
      activeProgram.parkingType,
      activeProgram.layoutType,
      activeProgram.amenities,
      activeProgram.includeOperatingCosts,
      activeProgram.accessibilityAdapted,
      activeProgram.ecoCertified
    ].some((value) => Boolean(String(value || "").trim() || value === true));

    if (!hasAnyProgramInput) {
      app.pushToast("Ditt lokalprogram är tomt. Lägg till preferenser i Profil först.", "info");
      return false;
    }

    const nextFilters = mapRenterProgramToSearchFilters(activeProgram, app.defaultFilters || {});
    const nextAmenityQuery = parseAmenityTerms(activeProgram.amenities || "").join(", ");

    // Use Filter-sök with prefilled values, but do not open the advanced
    // filter overlay here. Opening and immediately tearing it down causes
    // a visible flash in the header flow.
    setShowEditorAiPanel(false);
    setShowAdvancedSearchEditor(false);
    setShowSearchSummaryCard(true);
    setAnimateSearchSummaryIn(true);

    setFilters(nextFilters);
    setAmenityQuery(nextAmenityQuery);
    setFurnishedFilter("all");
    await executeSearch(nextFilters, {
      amenityQuery: nextAmenityQuery,
      furnishedFilter: "all"
    });

    if (isAvailableListingsView) {
      transitionFromAvailableToResults();
    }

    if (!isAvailableListingsView) {
      if (summaryFadeTimerRef.current) clearTimeout(summaryFadeTimerRef.current);
      summaryFadeTimerRef.current = setTimeout(() => {
        setAnimateSearchSummaryIn(false);
        summaryFadeTimerRef.current = null;
      }, 280);
    }

    return true;
  }

  async function handleApplyLocalProgramFromQuickCard(programOverride) {
    setLocalProgramTransitionSnapshot({
      visibleListings,
      selectedMapListing,
      summaryResultCount: aiLivePreview.matchCount ?? visibleListings.length,
      hasBegunSearch,
      showingSearchResults,
      showPreferencesSummaryCard
    });
    setIsLocalProgramResultsTransitioning(true);
    const didApply = await applyLocalProgramSearch(programOverride);
    if (!didApply) {
      setIsLocalProgramResultsTransitioning(false);
      setLocalProgramTransitionSnapshot(null);
      return;
    }
    setForceSearchResultsMode(true);
    setIsLocalProgramResultsTransitioning(false);
    setLocalProgramTransitionSnapshot(null);
    animateLocalProgramResultsPresentation(isAvailableListingsView ? 440 : 0);
    collapseLocalProgramHeaderCta();
  }

  async function submitInlineGuidedAiSearch(payload) {
    const prompt = String(payload?.prompt || "").trim();
    const nextFilters = payload?.filters || filters;
    const nextAmenityQuery = String(payload?.amenityQuery || "").trim();
    const nextFurnishedFilter = typeof payload?.furnishedFilter === "string" ? payload.furnishedFilter : furnishedFilter;
    setFilters(nextFilters);
    setFurnishedFilter(nextFurnishedFilter);
    await executeSearch(nextFilters, {
      aiPrompt: prompt,
      amenityQuery: nextAmenityQuery,
      furnishedFilter: nextFurnishedFilter
    });
  }

  async function applyNoMatchSuggestion(suggestion) {
    if (!suggestion) return;
    const previousMeta = {
      filters: effectiveFilters || filters,
      amenityQuery: effectiveAmenityQuery || amenityQuery,
      furnishedFilter: effectiveFurnishedFilter || furnishedFilter
    };
    const nextFilters = suggestion.nextFilters || filters;
    const nextAmenityQuery = typeof suggestion.nextAmenityQuery === "string" ? suggestion.nextAmenityQuery : amenityQuery;
    const nextFurnishedFilter = suggestion.nextFurnishedFilter || furnishedFilter;
    const nextAiPrompt = String(appliedSearchMeta.aiPrompt || "").trim();
    const nextMeta = {
      filters: nextFilters,
      amenityQuery: nextAmenityQuery,
      furnishedFilter: nextFurnishedFilter
    };
    const aiChangedChipKeys = getChangedChipKeys(previousMeta, nextMeta, app.defaultFilters?.maxBudget);
    const aiChangedChipEntries = buildAiChangedChipEntriesFromSummary(
      suggestion.changeSummary || suggestion.suggestedChange || suggestion.preview
    );
    setFilters(nextFilters);
    setAmenityQuery(nextAmenityQuery);
    setFurnishedFilter(nextFurnishedFilter);
    setAiLivePreview({
      filters: nextFilters,
      amenityQuery: nextAmenityQuery,
      furnishedFilter: nextFurnishedFilter,
      aiPrompt: nextAiPrompt,
      matchCount: Number.isFinite(suggestion.count) ? suggestion.count : null,
      aiChangedChipKeys,
      aiChangedChipEntries
    });
    await executeSearch(nextFilters, {
      amenityQuery: nextAmenityQuery,
      furnishedFilter: nextFurnishedFilter,
      aiPrompt: nextAiPrompt,
      aiChangedChipKeys,
      aiChangedChipEntries
    });
    setAiGuideResetKey((value) => value + 1);
    setNoMatchSuggestions([]);
  }

  async function applyResultsSuggestion(suggestion) {
    if (!suggestion) return;
    const previousMeta = {
      filters: effectiveFilters || filters,
      amenityQuery: effectiveAmenityQuery || amenityQuery,
      furnishedFilter: effectiveFurnishedFilter || furnishedFilter
    };
    const nextFilters = suggestion.nextFilters || filters;
    const nextAmenityQuery = typeof suggestion.nextAmenityQuery === "string" ? suggestion.nextAmenityQuery : amenityQuery;
    const nextFurnishedFilter = suggestion.nextFurnishedFilter || furnishedFilter;
    const nextAiPrompt = String(appliedSearchMeta.aiPrompt || "").trim();
    const nextMeta = {
      filters: nextFilters,
      amenityQuery: nextAmenityQuery,
      furnishedFilter: nextFurnishedFilter
    };
    const aiChangedChipKeys = getChangedChipKeys(previousMeta, nextMeta, app.defaultFilters?.maxBudget);
    const aiChangedChipEntries = buildAiChangedChipEntriesFromSummary(
      suggestion.changeSummary || suggestion.suggestedChange || suggestion.preview
    );
    setFilters(nextFilters);
    setAmenityQuery(nextAmenityQuery);
    setFurnishedFilter(nextFurnishedFilter);
    setAiLivePreview({
      filters: nextFilters,
      amenityQuery: nextAmenityQuery,
      furnishedFilter: nextFurnishedFilter,
      aiPrompt: nextAiPrompt,
      matchCount: Number.isFinite(suggestion.count) ? suggestion.count : null,
      aiChangedChipKeys,
      aiChangedChipEntries
    });
    await executeSearch(nextFilters, {
      amenityQuery: nextAmenityQuery,
      furnishedFilter: nextFurnishedFilter,
      aiPrompt: nextAiPrompt,
      aiChangedChipKeys,
      aiChangedChipEntries
    });
    setAiGuideResetKey((value) => value + 1);
    setDismissedResultsSuggestionKey("");
    if (isAvailableListingsView) {
      transitionFromAvailableToResults();
    }
  }

  function handleSaveSearchAction() {
    if (isGuest) {
      openAuthPrompt("save");
      return;
    }
    void saveCurrentFilters(summaryBaseFilters);
  }

  function handleWatchSearchAction() {
    if (isGuest) {
      openAuthPrompt("save");
      return;
    }
    void saveCurrentFilters(summaryBaseFilters);
    app.pushToast("Bevakning aktiverad för sökningen.", "success");
  }

  const showPreferencesSummaryCard = !showSearchEditor
    && !isResettingToAvailable
    && !isLeavingAvailableView
    && (showInlineAiGuide || (hasBegunSearch && showSearchSummaryCard));

  const summaryBaseFilters = showInlineAiGuide ? (effectiveFilters || filters) : (appliedSearchMeta.filters || filters);
  const summaryPrompt = showInlineAiGuide ? String(effectiveAiPrompt || "").trim() : String(appliedSearchMeta.aiPrompt || "").trim();
  const summaryResultCount = aiLivePreview.matchCount ?? visibleListings.length;
  const visibleResultsSuggestion = resultsSuggestion && resultsSuggestion.key !== dismissedResultsSuggestionKey
    ? resultsSuggestion
    : null;
  const showingSearchResults = hasBegunSearch;
  const displayedShowingSearchResults = isLocalProgramResultsTransitioning && localProgramTransitionSnapshot
    ? localProgramTransitionSnapshot.showingSearchResults
    : (forceSearchResultsMode || showingSearchResults);
  const displayedShowPreferencesSummaryCard = isLocalProgramResultsTransitioning && localProgramTransitionSnapshot
    ? localProgramTransitionSnapshot.showPreferencesSummaryCard
    : (forceSearchResultsMode || showPreferencesSummaryCard);

  useEffect(() => {
    if (!showPreferencesSummaryCard || !hasBegunSearch || summaryResultCount > 3) {
      setResultsSuggestion(null);
      setResultsSuggestionLoading(false);
      return;
    }

    const requestId = resultsSuggestionRequestRef.current + 1;
    resultsSuggestionRequestRef.current = requestId;
    let cancelled = false;

    const baseFilters = { ...(effectiveFilters || filters) };
    const baseAmenityQuery = String(effectiveAmenityQuery || "");
    const baseFurnished = effectiveFurnishedFilter || furnishedFilter || "all";
    const { explicitCandidates, fallbackCandidates } = buildResultsSuggestionCandidates({
      baseFilters,
      baseAmenityQuery,
      baseFurnished,
      defaultMaxBudget: app.defaultFilters?.maxBudget
    });

    async function evaluateCandidates(candidates) {
      for (const candidate of candidates) {
        if (cancelled || resultsSuggestionRequestRef.current !== requestId) return null;
        try {
          const { listings: nextListings } = await listingApi.getListings(candidate.nextFilters);
          const filtered = applyAmenityAndFurnishedFilters(
            nextListings,
            candidate.nextAmenityQuery,
            candidate.nextFurnishedFilter
          );
          if (filtered.length > summaryResultCount) {
            return {
              ...candidate,
              count: filtered.length,
              key: `${candidate.id}:${candidate.suggestedChange}:${filtered.length}`
            };
          }
        } catch (_error) {
          // Ignore individual suggestion failures.
        }
      }
      return null;
    }

    async function buildSuggestion() {
      setResultsSuggestionLoading(true);
      const primarySuggestion = await evaluateCandidates(explicitCandidates);
      const nextSuggestion = primarySuggestion || await evaluateCandidates(fallbackCandidates);
      if (cancelled || resultsSuggestionRequestRef.current !== requestId) return;
      setResultsSuggestion(nextSuggestion);
      setResultsSuggestionLoading(false);
    }

    void buildSuggestion();

    return () => {
      cancelled = true;
    };
  }, [
    showPreferencesSummaryCard,
    hasBegunSearch,
    summaryResultCount,
    effectiveFilters,
    filters,
    effectiveAmenityQuery,
    effectiveFurnishedFilter,
    furnishedFilter,
    app.defaultFilters?.maxBudget
  ]);

  const viewToggleControl = (
      <div className="view-toggle-group inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#ffffff] p-1 xl:hidden">
        <button
          type="button"
          className={`view-toggle-option inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
            resultViewMode === "list"
              ? "bg-[#0b0a0e] text-white"
              : "text-ink-700 hover:bg-[#ffffff]"
          }`}
          onClick={() => setResultViewMode("list")}
          aria-pressed={resultViewMode === "list"}
        >
          <ListIcon className="h-3.5 w-3.5" />
          Lista
        </button>
        <button
          type="button"
          className={`view-toggle-option inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
            resultViewMode === "map"
              ? "bg-[#0b0a0e] text-white"
              : "text-ink-700 hover:bg-[#ffffff]"
          }`}
          onClick={() => setResultViewMode("map")}
          aria-pressed={resultViewMode === "map"}
        >
          <MapIcon className="h-3.5 w-3.5" />
          Karta
        </button>
      </div>
  );

  const sortControl = (
      <div className="inline-flex items-center gap-2">
        <label className="text-xs font-semibold text-ink-700">Sortera</label>
        <select
          className="select-chevron min-h-[40px] min-w-[132px] rounded-full border border-black/10 bg-[#ffffff] px-4 text-xs font-semibold text-ink-800 focus:border-[#0b0a0e] focus:outline-none"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="relevance">Relevans</option>
          <option value="price_asc">Hyra: lägst först</option>
          <option value="price_desc">Hyra: högst först</option>
          <option value="size_asc">Yta: minst först</option>
          <option value="size_desc">Yta: störst först</option>
        </select>
      </div>
  );

  const summaryControls = (
    <>
      {viewToggleControl}
      {sortControl}
    </>
  );

  const preferencesSummaryCard = displayedShowPreferencesSummaryCard ? (
    <div
      className={`${displayedHasBegunSearch ? "py-0" : "py-1"} ${
        animateSearchSummaryIn ? "search-summary-dissolve-in" : ""
      } ${
        animateLocalProgramResultsIn ? "localprogram-section-enter" : ""
      } ${isResettingToAvailable ? "search-summary-dissolve-out" : ""}`}
    >
      <div className="flex flex-nowrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-black/10 bg-[#ffffff] px-3 py-1 text-sm font-semibold text-ink-800">
            {displayedHasBegunSearch ? <SparklesIcon className="h-4 w-4 text-[#4f46e5]" /> : null}
            {displayedHasBegunSearch ? `${displayedSummaryResultCount} lokaler matchar dina preferenser` : `${displayedSummaryResultCount} lediga lokaler`}
          </p>
        </div>
        <div className="ml-2 flex flex-nowrap items-center justify-end gap-2 xl:hidden">
          {viewToggleControl}
          {sortControl}
        </div>
        <div className="hidden xl:flex shrink-0 items-center gap-2">
          <label className="text-xs font-semibold text-ink-700">Sortera</label>
          <select
            className="select-chevron min-h-[40px] min-w-[132px] rounded-full border border-black/10 bg-[#ffffff] px-4 text-xs font-semibold text-ink-800 focus:border-[#0b0a0e] focus:outline-none"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="relevance">Relevans</option>
            <option value="price_asc">Hyra: lägst först</option>
            <option value="price_desc">Hyra: högst först</option>
            <option value="size_asc">Yta: minst först</option>
            <option value="size_desc">Yta: störst först</option>
          </select>
        </div>
      </div>
      {!isLocalProgramResultsTransitioning && summaryResultCount <= 3 ? (
        resultsSuggestionLoading ? (
          <div className="mt-4 rounded-2xl border border-[#4f46e5]/20 bg-[#eef0ff] p-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#312e81]">
                <SparklesIcon className="h-4 w-4 text-[#4f46e5]" />
                AI-förslag
              </p>
              <p className="text-[1.05rem] font-semibold text-ink-900">Ingen matchning just nu</p>
              <p className="text-sm text-ink-700">AI granskar vilken inställning som begränsar träffarna mest.</p>
            </div>
          </div>
        ) : visibleResultsSuggestion ? (
          <div className="mt-4 rounded-2xl border border-[#4f46e5]/20 bg-[#eef0ff] p-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#312e81]">
                <SparklesIcon className="h-4 w-4 text-[#4f46e5]" />
                AI-förslag
              </p>
              <p className="text-[1.05rem] font-semibold text-ink-900">Ingen matchning just nu</p>
              <p className="text-sm font-semibold text-ink-900">
                {renderTextWithBoldMarkers(getSuggestionProblemText(visibleResultsSuggestion))}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#4f46e5]/35 bg-[#ffffff] px-3 py-1.5 text-[13px] font-semibold text-[#312e81]">
                Föreslagen ändring: {visibleResultsSuggestion.suggestedChange}
              </span>
              <span className="rounded-full border border-[#4f46e5]/35 px-3 py-1.5 text-[13px] font-semibold text-[#312e81]">
                {visibleResultsSuggestion.count} träffar efter ändring
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex h-[40px] items-center gap-1.5 rounded-xl bg-[#0b0a0e] px-3 text-xs font-semibold text-white"
                onClick={() => void applyResultsSuggestion(visibleResultsSuggestion)}
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Redigera med AI
              </button>
              <button
                type="button"
                className="inline-flex h-[40px] items-center gap-1.5 rounded-xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]"
                onClick={() => {
                  setShowEditorAiPanel(false);
                  setShowAdvancedSearchEditor(true);
                }}
              >
                Redigera manuellt
              </button>
            </div>
          </div>
        ) : null
      ) : null}
    </div>
  ) : null;

  const aiGuideToggleControl = (
    <div className="inline-flex h-[44px] items-center gap-1.5 rounded-full border border-[#4f46e5]/12 bg-gradient-to-r from-[#fbfaff] to-white px-3 text-xs font-semibold text-ink-700">
      <span className="inline-flex items-center gap-1">
        <SparklesIcon className="h-3.5 w-3.5 text-[#4f46e5]" />
        <span>AI-guide</span>
      </span>
      <PillToggle
        checked={showEditorAiPanel}
        onToggle={handleFilterSearchToggle}
        ariaLabel="AI-guide i sökraden"
        className="h-7 w-11"
        thumbClassName="h-6 w-6"
      />
    </div>
  );

  const sideFilterPanel = (
    <div className="space-y-3">
      <form className="mt-3 flex flex-col" onSubmit={submitSideFilterSearch}>
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Antal platser</span>
              <div className="flex h-[48px] items-center rounded-2xl border border-black/10 bg-transparent px-3">
                <input
                  value={filters.teamSize}
                  onChange={(event) => setFilters((prev) => ({ ...prev, teamSize: event.target.value }))}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                  placeholder="Platser"
                  type="number"
                  min="1"
                />
                <span className="ml-2 text-sm font-medium text-ink-700">st</span>
              </div>
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Område</span>
              <select
                value={filters.district}
                onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))}
                className={heroSelectClass}
              >
                <option value="Alla" className="text-black">Alla områden</option>
                {districtOptions.map((district) => <option key={district} value={district} className="text-black">{district}</option>)}
              </select>
            </label>
            <button
              type="button"
              className="inline-flex h-[48px] w-auto justify-center justify-self-start self-end items-center gap-1.5 rounded-2xl border border-black/10 bg-[#ffffff] px-4 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]"
              onClick={() => setShowAdvancedSearchEditor(true)}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              <span>Visa alla filter</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  const primaryHeaderAction = !hideLocalProgramQuickCard && hasRenterRole && !hasCompanyAdminRole ? (
    <button
      type="button"
      className={`inline-flex h-[38px] items-center justify-center gap-1.5 rounded-full border border-[#0b0a0e]/15 bg-gradient-to-r from-[#f8fafc] to-white pl-1.5 pr-3 text-xs font-semibold text-ink-900 transition hover:border-[#0b0a0e] hover:text-[#0b0a0e] ${
        isLocalProgramQuickCardDissolving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onClick={() => {
        if (renterPrograms.length > 1) {
          setShowProgramPicker(true);
          return;
        }
        void handleApplyLocalProgramFromQuickCard();
      }}
    >
      {user?.profile?.avatarUrl ? (
        <img
          src={user.profile.avatarUrl}
          alt={user?.name || "Profilbild"}
          className="h-7 w-7 rounded-full border border-white object-cover"
        />
      ) : (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0b1733] text-[10px] font-semibold text-white">
          {(user?.name || user?.email || "A")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || "")
            .join("")}
        </span>
      )}
      Sök med lokalprogram
    </button>
  ) : null;

  const secondaryHeaderActions = hideLocalProgramQuickCard ? (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="group inline-flex min-h-0 items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:border-[#0b0a0e] hover:text-[#0b0a0e]"
        onClick={handleSaveSearchAction}
      >
        <StarIcon className="h-4 w-4 shrink-0 transition group-hover:text-[#0b0a0e]" />
        Spara sökning
      </button>
      <button
        type="button"
        className="group inline-flex min-h-0 items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:border-[#0b0a0e] hover:text-[#0b0a0e]"
        onClick={handleWatchSearchAction}
      >
        <EyeIcon className="h-4 w-4 shrink-0 transition group-hover:text-[#0b0a0e]" />
        Bevaka sökning
      </button>
      <button
        type="button"
        className="group inline-flex min-h-0 items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:border-[#0b0a0e] hover:text-[#0b0a0e]"
        onClick={() => {
          void handleResetSearchResults();
        }}
      >
        <ResetIcon className="h-4 w-4 shrink-0 transition group-hover:text-[#0b0a0e]" />
        Nollställ
      </button>
    </div>
  ) : null;

  const horizontalFeatureListings = displayedVisibleListings.slice(0, 3);
  const remainingListings = displayedVisibleListings.slice(horizontalFeatureListings.length);
  const showMatchChipOnListingCards = displayedHasBegunSearch;

  const renderedListingCards = [
    ...horizontalFeatureListings.map((listing) => (
      <div key={`${listing.id}-horizontal`} className="md:col-span-2">
        <ListingVisualCard
          listing={listing}
          shortlisted={favoriteIds.has(listing.id)}
          onOpenListing={openListingDetail}
          onBookViewing={(item) => setBookingListing(item)}
          onToggleShortlist={handleToggleShortlist}
          onHoverStart={(item) => setHoveredListingId(item.id)}
          onHoverEnd={() => setHoveredListingId(null)}
          showMatchChip={showMatchChipOnListingCards}
          horizontal
        />
      </div>
    )),
    ...remainingListings.map((listing) => (
      <div key={listing.id}>
        <ListingVisualCard
          listing={listing}
          shortlisted={favoriteIds.has(listing.id)}
          onOpenListing={openListingDetail}
          onBookViewing={(item) => setBookingListing(item)}
          onToggleShortlist={handleToggleShortlist}
          onHoverStart={(item) => setHoveredListingId(item.id)}
          onHoverEnd={() => setHoveredListingId(null)}
          showMatchChip={showMatchChipOnListingCards}
        />
      </div>
    ))
  ].filter(Boolean);

  const emptyResultsContent = displayedVisibleListings.length === 0 ? null : (
    <div className="rounded-3xl border border-black/10 bg-[#ffffff] p-5">
      <p className="text-xl font-semibold text-ink-900">Ingen matchning just nu</p>
      <p className="mt-1 text-[1.05rem] text-ink-700">
        Prova en snabb justering så kan jag hitta närliggande träffar direkt.
      </p>
      {noMatchSuggestionsLoading ? (
        <p className="mt-3 text-sm text-ink-700">Tar fram justeringar som ger träffar...</p>
      ) : noMatchSuggestions.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {noMatchSuggestions.map((suggestion) => {
            const changeItems = String(suggestion.changeSummary || suggestion.preview || "")
              .split(" • ")
              .map((item) => item.trim())
              .filter(Boolean);
            const visibleChanges = changeItems.slice(0, 3);
            const extraChanges = Math.max(changeItems.length - visibleChanges.length, 0);
            return (
              <button
                key={suggestion.id}
                type="button"
                className="group rounded-[24px] border border-black/10 bg-[#ffffff] p-3 text-left transition hover:border-[#0b0a0e]/35 hover:bg-[#ffffff]"
                onClick={() => void applyNoMatchSuggestion(suggestion)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-ink-900">{suggestion.label}</span>
                  <span className="shrink-0 rounded-full border border-black/10 bg-[#ffffff] px-2 py-0.5 text-xs font-semibold text-ink-700">
                    {suggestion.count} träffar
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-600">Ändrar</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {visibleChanges.map((item) => (
                    <span key={`${suggestion.id}-${item}`} className="rounded-full border border-black/10 bg-[#ffffff] px-2 py-0.5 text-xs font-medium text-ink-700">
                      {item}
                    </span>
                  ))}
                  {extraChanges > 0 ? (
                    <span className="rounded-full border border-black/10 bg-[#ffffff] px-2 py-0.5 text-xs font-medium text-ink-700">
                      +{extraChanges} fler
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-700">
          Inga säkra justeringar hittades just nu. Justera filter manuellt för att se fler alternativ.
        </p>
      )}
    </div>
  );

  const desktopListContent = displayedVisibleListings.length === 0 ? emptyResultsContent : (
    <div className={`grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 ${animateLocalProgramResultsIn ? "localprogram-results-enter" : ""}`}>
      {renderedListingCards}
    </div>
  );

  const mobileResultsContent = (
    <>
      {resultViewMode === "map" ? (
        <div className={`space-y-2 xl:hidden ${animateLocalProgramResultsIn ? "localprogram-section-enter" : ""}`}>
            <GoogleListingsMap
              listings={displayedVisibleListings}
              onMarkerClick={handleMapMarkerClick}
              onOpenListing={openListingDetail}
              onBookViewing={(item) => setBookingListing(item)}
              onToggleShortlist={handleToggleShortlist}
            shortlistedIds={favoriteIds}
            selectedListing={displayedSelectedMapListing}
            hoveredListingId={hoveredListingId}
            focusedDistrict={focusedDistrict}
            onCloseSelectedListing={() => setSelectedMapListing(null)}
            showMatchChip={hasTeamSizeForMatchChip}
            dense
          />
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-600"><MapIcon className="h-3.5 w-3.5" />Klicka på en markör för att visa objektkort direkt på kartan.</p>
        </div>
      ) : null}

      {resultViewMode === "list" ? (
        displayedVisibleListings.length === 0 ? (
          <div className="xl:hidden">
            {emptyResultsContent}
          </div>
        ) : (
          <div className={`grid items-stretch gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 xl:hidden ${animateLocalProgramResultsIn ? "localprogram-results-enter" : ""}`}>
            {renderedListingCards}
          </div>
        )
      ) : null}
    </>
  );

  return (
    <section className="relative h-full overflow-hidden px-4 py-2 sm:px-6 sm:py-2.5">
      <div className="relative mx-auto flex h-full w-full max-w-[1540px] flex-col">
        {isHydratingLandingSearch ? (
          <div className="grid min-h-0 flex-1 place-items-center">
            <div className="rounded-2xl border border-[#c8d1de] bg-[#ffffff] px-5 py-4 text-sm font-semibold text-ink-700">
              Laddar sökresultat...
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {false ? (
              <article
                className={`mx-auto w-full text-ink-900 ${
                  showSearchEditor && !isAvailableListingsView && !isClosingSearchEditor ? "search-editor-expand-in" : ""
                } ${
                  (isClosingSearchEditor || isLeavingAvailableView) ? "search-editor-collapse-out" : ""
                } ${
                  isAvailableListingsView && isEnteringAvailableView ? "search-editor-expand-in" : ""
                }`}
              >
                <form className="space-y-6" onSubmit={submitEditorSearch}>
                  <div className="transition-opacity duration-200" style={{ opacity: editorModeOpacity }}>
                  {showEditorAiPanel ? (
                    <AiGuidedAssistant
                      key={`editor-ai-${aiGuideResetKey}`}
                      initialFilters={filters}
                      districtOptions={districtOptions}
                      listingTypes={listingTypes}
                      amenityOptions={editorAmenityOptions}
                      transitDistanceOptions={transitDistanceOptions}
                      contractFlexOptions={contractFlexOptions}
                      accessHoursOptions={accessHoursOptions}
                      parkingTypeOptions={parkingTypeOptions}
                      layoutTypeOptions={layoutTypeOptions}
                      advertiserOptions={advertiserOptions}
                      initialAmenityQuery={amenityQuery}
                      initialFurnishedFilter={furnishedFilter}
                      onPreviewFilters={previewEditorAiFilters}
                      onSubmitSearch={submitGuidedEditorAiSearch}
                      onOpenInfo={() => setShowEditorAiInfo(true)}
                    onResetSearch={() => {
                      void handleResetSearchResults();
                    }}
                      resultCount={visibleListings.length}
                      defaultResultCount={sortedListings.length}
                      requestedStepRequest={aiGuideStepRequest}
                      forceStepId={forceAiGuideCoreStep ? "core" : null}
                      onShowMatches={() => {
                        resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      submitLabel={isAvailableListingsView ? "Visa träffar" : "Uppdatera sökning"}
                  />
                  ) : (
                    <>
                      {showAdvancedSearchEditor ? (
                        <div className="space-y-5">
                          <div className="grid gap-5 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.55fr)]">
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Sök</span>
                              <div className="relative">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                                <input
                                  value={filters.query}
                                  onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                                  className={`${heroInputClass} pl-10`}
                                  placeholder="Gata, adress eller fritext"
                                />
                              </div>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Område</span>
                              <select
                                value={filters.district}
                                onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))}
                                className={heroSelectClass}
                              >
                                <option value="Alla" className="text-black">Alla områden</option>
                                {districtOptions.map((district) => <option key={district} value={district} className="text-black">{district}</option>)}
                              </select>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Typ</span>
                              <select
                                value={Array.isArray(filters.type) && filters.type.length > 0 ? filters.type[0] : "Alla"}
                                onChange={(event) => {
                                  const nextType = event.target.value;
                                  setFilters((prev) => ({ ...prev, type: nextType === "Alla" ? [] : [nextType] }));
                                }}
                                className={heroSelectClass}
                              >
                                <option value="Alla" className="text-black">Alla typer</option>
                                {listingTypes.map((type) => <option key={type} value={type} className="text-black">{type}</option>)}
                              </select>
                            </label>
                          </div>
                          <div className="grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)] sm:items-start">
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Team</span>
                              <input
                                value={filters.teamSize}
                                onChange={(event) => setFilters((prev) => ({ ...prev, teamSize: event.target.value }))}
                                className={heroInputClass}
                                placeholder="Platser"
                                type="number"
                                min="1"
                              />
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Min yta</span>
                              <input value={filters.minSize} onChange={(event) => setFilters((prev) => ({ ...prev, minSize: event.target.value }))} className={heroInputClass} placeholder="Min kvm" type="number" min="0" />
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Max yta</span>
                              <input value={filters.maxSize} onChange={(event) => setFilters((prev) => ({ ...prev, maxSize: event.target.value }))} className={heroInputClass} placeholder="Max kvm" type="number" min="0" />
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Inflyttning</span>
                              <input
                                value={filters.moveInDate || ""}
                                onChange={(event) => setFilters((prev) => ({ ...prev, moveInDate: event.target.value }))}
                                className={`${heroInputClass} h-[48px] py-0`}
                                type="date"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div className="grid gap-5 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.55fr)]">
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Sök</span>
                              <div className="relative">
                                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                                <input
                                  value={filters.query}
                                  onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                                  className={`${heroInputClass} pl-10`}
                                  placeholder="Gata, adress eller fritext"
                                />
                              </div>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Område</span>
                              <select
                                value={filters.district}
                                onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))}
                                className={heroSelectClass}
                              >
                                <option value="Alla" className="text-black">Alla områden</option>
                                {districtOptions.map((district) => <option key={district} value={district} className="text-black">{district}</option>)}
                              </select>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Typ</span>
                              <select
                                value={Array.isArray(filters.type) && filters.type.length > 0 ? filters.type[0] : "Alla"}
                                onChange={(event) => {
                                  const nextType = event.target.value;
                                  setFilters((prev) => ({ ...prev, type: nextType === "Alla" ? [] : [nextType] }));
                                }}
                                className={heroSelectClass}
                              >
                                <option value="Alla" className="text-black">Alla typer</option>
                                {listingTypes.map((type) => <option key={type} value={type} className="text-black">{type}</option>)}
                              </select>
                            </label>
                          </div>
                          <div className="grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)] sm:items-start">
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Team</span>
                              <input
                                value={filters.teamSize}
                                onChange={(event) => setFilters((prev) => ({ ...prev, teamSize: event.target.value }))}
                                className={heroInputClass}
                                placeholder="Platser"
                                type="number"
                                min="1"
                              />
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Min yta</span>
                              <input value={filters.minSize} onChange={(event) => setFilters((prev) => ({ ...prev, minSize: event.target.value }))} className={heroInputClass} placeholder="Min kvm" type="number" min="0" />
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Max yta</span>
                              <input value={filters.maxSize} onChange={(event) => setFilters((prev) => ({ ...prev, maxSize: event.target.value }))} className={heroInputClass} placeholder="Max kvm" type="number" min="0" />
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Inflyttning</span>
                              <input
                                value={filters.moveInDate || ""}
                                onChange={(event) => setFilters((prev) => ({ ...prev, moveInDate: event.target.value }))}
                                className={`${heroInputClass} h-[48px] py-0`}
                                type="date"
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      <div
                        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          showAdvancedSearchEditor ? "mt-5 opacity-100" : "mt-0 opacity-0"
                        }`}
                        style={{ gridTemplateRows: showAdvancedSearchEditor ? "1fr" : "0fr" }}
                      >
                        <div className="min-h-0 space-y-5">
                          <div className="grid gap-5 sm:grid-cols-[minmax(0,320px)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] sm:items-start">
                            <div>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Möblering</span>
                              <FurnishingToggle
                                options={furnishedOptions}
                                value={furnishedFilter}
                                onChange={setFurnishedFilter}
                              />
                            </div>
                            <div>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Budget / månad</span>
                              <div className="grid gap-5 sm:grid-cols-2">
                                <label>
                                  <input
                                    value={String(filters.minBudget ?? "")}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, minBudget: event.target.value }))}
                                    className={`${heroInputClass} h-[48px] py-0`}
                                    placeholder="Min (ex. 25 000)"
                                    type="number"
                                    min="0"
                                  />
                                </label>
                                <label>
                                  <input
                                    value={String(filters.maxBudget ?? "").trim() === "250000" ? "" : filters.maxBudget}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, maxBudget: event.target.value }))}
                                    className={`${heroInputClass} h-[48px] py-0`}
                                    placeholder="Max (ex. 250000)"
                                    type="number"
                                    min="0"
                                  />
                                </label>
                              </div>
                            </div>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Access</span>
                              <select
                                value={filters.accessHours || "Alla"}
                                onChange={(event) => setFilters((prev) => ({ ...prev, accessHours: event.target.value === "Alla" ? "" : event.target.value }))}
                                className={`${heroSelectClass} h-[48px] py-0`}
                              >
                                {accessHoursOptions.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}
                              </select>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Hyresvärd</span>
                              <select
                                value={filters.advertiser || "Alla"}
                                onChange={(event) => setFilters((prev) => ({ ...prev, advertiser: event.target.value }))}
                                className={`${heroSelectClass} h-[48px] py-0`}
                              >
                                {advertiserOptions.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}
                              </select>
                            </label>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto] sm:items-end">
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Kommunaltrafik</span>
                              <select
                                value={filters.transitDistance || "Alla"}
                                onChange={(event) => setFilters((prev) => ({ ...prev, transitDistance: event.target.value === "Alla" ? "" : event.target.value }))}
                                className={`${heroSelectClass} h-[48px] py-0`}
                              >
                                {transitDistanceOptions.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}
                              </select>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Avtalsflex</span>
                              <select
                                value={filters.contractFlex || "Alla"}
                                onChange={(event) => setFilters((prev) => ({ ...prev, contractFlex: event.target.value === "Alla" ? "" : event.target.value }))}
                                className={`${heroSelectClass} h-[48px] py-0`}
                              >
                                {contractFlexOptions.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}
                              </select>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Parkering</span>
                              <select
                                value={filters.parkingType || "Alla"}
                                onChange={(event) => setFilters((prev) => ({ ...prev, parkingType: event.target.value === "Alla" ? "" : event.target.value }))}
                                className={`${heroSelectClass} h-[48px] py-0`}
                              >
                                {parkingTypeOptions.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}
                              </select>
                            </label>
                            <label>
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Planlösning</span>
                              <select
                                value={filters.layoutType || "Alla"}
                                onChange={(event) => setFilters((prev) => ({ ...prev, layoutType: event.target.value === "Alla" ? "" : event.target.value }))}
                                className={`${heroSelectClass} h-[48px] py-0`}
                              >
                                {layoutTypeOptions.map((option) => <option key={option} value={option} className="text-black">{option}</option>)}
                              </select>
                            </label>
                            <label className="inline-flex h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700">
                              <input
                                type="checkbox"
                                className="search-flag-checkbox"
                                checked={Boolean(filters.includeOperatingCosts)}
                                onChange={(event) => setFilters((prev) => ({ ...prev, includeOperatingCosts: event.target.checked }))}
                              />
                              Driftkostn. ingår
                            </label>
                            <label className="inline-flex h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700">
                              <input
                                type="checkbox"
                                className="search-flag-checkbox"
                                checked={Boolean(filters.accessibilityAdapted)}
                                onChange={(event) => setFilters((prev) => ({ ...prev, accessibilityAdapted: event.target.checked }))}
                              />
                              Tillgänglighetsanp.
                            </label>
                            <label className="inline-flex h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700">
                              <input
                                type="checkbox"
                                className="search-flag-checkbox"
                                checked={Boolean(filters.ecoCertified)}
                                onChange={(event) => setFilters((prev) => ({ ...prev, ecoCertified: event.target.checked }))}
                              />
                              Miljöcertifierad
                            </label>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Bekvämligheter</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {editorAmenityOptions.map((option) => {
                                const Icon = option.icon;
                                const active = isAmenitySelected(option.value);
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                      active ? "border-[#0b0a0e] bg-[#0b0a0e] text-white" : "border-black/10 bg-[#ffffff] text-ink-700 hover:bg-[#ffffff]"
                                    }`}
                                    onClick={() => toggleAmenity(option.value)}
                                  >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isAvailableListingsView ? (
                        <div className="mt-5 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]"
                            onClick={() => {
                              setShowAdvancedSearchEditor((value) => !value);
                            }}
                          >
                            <span>{showAdvancedSearchEditor ? "Visa färre filter" : "Visa alla filter"}</span>
                            <span aria-hidden="true" className="text-sm leading-none">{showAdvancedSearchEditor ? "−" : "+"}</span>
                          </button>
                          <button type="submit" className="inline-flex items-center gap-1.5 rounded-2xl border border-[#0b0a0e] bg-[#0b0a0e] px-5 py-3 text-sm font-semibold text-white">
                            <SearchIcon className="h-4 w-4" />
                            Sök lokaler
                          </button>
                        </div>
                      ) : (
                        <div className="mt-5 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-2xl border border-black/10 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-[#ffffff]"
                            onClick={closeSearchEditorSmooth}
                          >
                            Avbryt
                          </button>
                          <button type="submit" className="rounded-2xl border border-[#0b0a0e] bg-[#0b0a0e] px-5 py-3 text-sm font-semibold text-white">
                            Uppdatera sökning
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  </div>
                </form>
                </article>
            ) : null}

            <div className="min-h-0 flex-1">
              {showInlineAiGuide ? (
                <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden xl:grid xl:grid-cols-[minmax(0,1.02fr)_minmax(540px,0.98fr)] xl:gap-6">
                  <div data-scroll-top-scope="results" className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pb-8 xl:pr-2 xl:pb-16">
                    <div className="px-1 py-1">
                      <Breadcrumbs
                        className="mb-2"
                        items={[
                          { label: "Startsida", to: "/" },
                          { label: displayedShowingSearchResults ? "Sökresultat" : "Lediga lokaler" }
                        ]}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                        <div className="min-w-0 flex-1">
                          <h1 className="truncate text-2xl font-semibold leading-10">{displayedShowingSearchResults ? "Sökresultat" : "Lediga lokaler"}</h1>
                        </div>
                        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 self-center sm:w-auto sm:flex-nowrap">
                          {primaryHeaderAction}
                          {secondaryHeaderActions}
                          {aiGuideToggleControl}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      {showEditorAiPanel ? (
                        <AiGuidedAssistant
                          key={`inline-ai-${aiGuideResetKey}`}
                          initialFilters={filters}
                          districtOptions={districtOptions}
                          listingTypes={listingTypes}
                          amenityOptions={editorAmenityOptions}
                          transitDistanceOptions={transitDistanceOptions}
                          contractFlexOptions={contractFlexOptions}
                          accessHoursOptions={accessHoursOptions}
                          parkingTypeOptions={parkingTypeOptions}
                          layoutTypeOptions={layoutTypeOptions}
                          advertiserOptions={advertiserOptions}
                          initialAmenityQuery={amenityQuery}
                          initialFurnishedFilter={furnishedFilter}
                          onPreviewFilters={previewEditorAiFilters}
                          onSubmitSearch={submitInlineGuidedAiSearch}
                          onOpenInfo={() => setShowEditorAiInfo(true)}
                          onResetSearch={() => {
                            void handleResetSearchResults();
                          }}
                          resultCount={displayedVisibleListings.length}
                          defaultResultCount={sortedListings.length}
                          requestedStepRequest={aiGuideStepRequest}
                          forceStepId={forceAiGuideCoreStep ? "core" : null}
                          onShowMatches={() => {
                            resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          submitLabel="Uppdatera sökning"
                          showHeader={false}
                          bare
                        />
                      ) : (
                        sideFilterPanel
                      )}
                    </div>

                    <div className="space-y-3">
                      {displayedShowPreferencesSummaryCard ? (
                        <div className="bg-[#ffffff]">
                          <div className="relative">
                            {preferencesSummaryCard}
                          </div>
                        </div>
                      ) : (
                        <div className="hidden items-center justify-between md:flex md:flex-nowrap xl:flex">
                          <p className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-black/10 bg-[#ffffff] px-3 py-1 text-sm font-semibold text-ink-800">
                            {displayedVisibleListings.length} lediga lokaler
                          </p>
                          <div className="flex flex-nowrap items-center justify-end gap-2">
                            {summaryControls}
                          </div>
                        </div>
                      )}

                      <div ref={resultsTopRef} />
                      <div>
                        {mobileResultsContent}
                        <div className="hidden xl:block">
                          {desktopListContent}
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className={`hidden min-h-0 xl:flex xl:flex-col ${animateLocalProgramResultsIn ? "localprogram-section-enter" : ""}`}>
                    <GoogleListingsMap
                      listings={displayedVisibleListings}
                      onMarkerClick={handleMapMarkerClick}
                      onOpenListing={openListingDetail}
                      onBookViewing={(item) => setBookingListing(item)}
                      onToggleShortlist={handleToggleShortlist}
                      shortlistedIds={favoriteIds}
                      selectedListing={displayedSelectedMapListing}
                      hoveredListingId={hoveredListingId}
                      focusedDistrict={focusedDistrict}
                      onCloseSelectedListing={() => setSelectedMapListing(null)}
                      showMatchChip={hasTeamSizeForMatchChip}
                      className="h-full min-h-0 flex-1"
                    />
                  </aside>
                </div>
              ) : (
                <div className="min-h-0 h-full overflow-y-auto overscroll-contain pb-8">
                    <div className="px-1 py-1">
                      <Breadcrumbs
                        className="mb-2"
                        items={[
                          { label: "Startsida", to: "/" },
                          { label: displayedShowingSearchResults ? "Sökresultat" : "Lediga lokaler" }
                        ]}
                      />
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                      <div className="min-w-0 flex-1">
                        <h1 className="truncate text-2xl font-semibold leading-10">{displayedShowingSearchResults ? "Sökresultat" : "Lediga lokaler"}</h1>
                      </div>
                      <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 self-center sm:w-auto sm:flex-nowrap">
                        {primaryHeaderAction}
                        {secondaryHeaderActions}
                        {aiGuideToggleControl}
                      </div>
                    </div>
                  </div>

                  {preferencesSummaryCard ? (
                    <div className="bg-[#ffffff] pb-4">
                      <div className="relative">
                        {preferencesSummaryCard}
                      </div>
                    </div>
                  ) : null}
                  <div ref={resultsTopRef} />
                  {mobileResultsContent}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAdvancedSearchOverlay ? (
        <div
          className={`fixed inset-0 z-[72] flex items-center justify-center p-4 backdrop-blur-[2px] transition-all duration-200 ${
            isAdvancedSearchOverlayActive ? "bg-[#ffffff]/0 opacity-100" : "bg-[#ffffff]/0 opacity-0"
          }`}
          onClick={closeAdvancedSearchOverlay}
        >
          <div
            className={`relative w-full max-w-4xl rounded-[32px] border border-black/10 bg-[#ffffff] shadow-[0_16px_40px_rgba(15,25,48,0.12)] transition-all duration-200 ${
              isAdvancedSearchOverlayActive
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-2 scale-[0.985] opacity-0"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/10 px-6 py-4">
              <h3 className="text-lg font-semibold text-ink-900">Alla filter</h3>
              <button
                type="button"
                className="close-circle-button inline-flex items-center justify-center rounded-full border border-black/10 text-lg font-semibold leading-none text-ink-700 hover:bg-[#ffffff]"
                onClick={closeAdvancedSearchOverlay}
                aria-label="Stäng filter"
              >
                ×
              </button>
            </div>

            <form
              className="max-h-[min(78vh,860px)] overflow-y-auto px-6 py-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitSideFilterSearch(event);
                closeAdvancedSearchOverlay();
              }}
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Typ</span>
                    <select
                      value={Array.isArray(filters.type) && filters.type.length > 0 ? filters.type[0] : "Alla"}
                      onChange={(event) => {
                        const nextType = event.target.value;
                        setFilters((prev) => ({ ...prev, type: nextType === "Alla" ? [] : [nextType] }));
                      }}
                      className={heroSelectClass}
                    >
                      <option value="Alla" className="text-black">Alla typer</option>
                      {listingTypes.map((type) => <option key={type} value={type} className="text-black">{type}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Min yta</span>
                    <input
                      value={filters.minSize}
                      onChange={(event) => setFilters((prev) => ({ ...prev, minSize: event.target.value }))}
                      className={heroInputClass}
                      placeholder="Min kvm"
                      type="number"
                      min="0"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Max yta</span>
                    <input
                      value={filters.maxSize}
                      onChange={(event) => setFilters((prev) => ({ ...prev, maxSize: event.target.value }))}
                      className={heroInputClass}
                      placeholder="Max kvm"
                      type="number"
                      min="0"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Inflyttning</span>
                    <input
                      value={filters.moveInDate || ""}
                      onChange={(event) => setFilters((prev) => ({ ...prev, moveInDate: event.target.value }))}
                      className={`${heroInputClass} h-[48px] py-0`}
                      type="date"
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Möblering</span>
                    <FurnishingToggle
                      value={furnishedFilter}
                      onChange={setFurnishedFilter}
                      options={furnishedOptions}
                    />
                  </div>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Hyresvärd</span>
                    <select
                      value={filters.advertiser || "Alla"}
                      onChange={(event) => setFilters((prev) => ({ ...prev, advertiser: event.target.value }))}
                      className={heroSelectClass}
                    >
                      <option value="Alla" className="text-black">Alla</option>
                      {advertiserOptions.map((option) => (
                        <option key={option} value={option} className="text-black">{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Min budget</span>
                    <input
                      value={filters.minBudget}
                      onChange={(event) => setFilters((prev) => ({ ...prev, minBudget: event.target.value }))}
                      className={heroInputClass}
                      placeholder="0 kr"
                      type="number"
                      min="0"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Max budget</span>
                    <input
                      value={filters.maxBudget}
                      onChange={(event) => setFilters((prev) => ({ ...prev, maxBudget: event.target.value }))}
                      className={heroInputClass}
                      placeholder="250000 kr"
                      type="number"
                      min="0"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Avtal</span>
                    <select
                      value={filters.contractFlex || ""}
                      onChange={(event) => setFilters((prev) => ({ ...prev, contractFlex: event.target.value }))}
                      className={heroSelectClass}
                    >
                      {contractFlexOptions.map((option) => (
                        <option key={option} value={option === "Alla" ? "" : option} className="text-black">{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Kommunaltrafik</span>
                    <select
                      value={filters.transitDistance || ""}
                      onChange={(event) => setFilters((prev) => ({ ...prev, transitDistance: event.target.value }))}
                      className={heroSelectClass}
                    >
                      {transitDistanceOptions.map((option) => (
                        <option key={option} value={option === "Alla" ? "" : option} className="text-black">{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Planlösning</span>
                    <select
                      value={filters.layoutType || ""}
                      onChange={(event) => setFilters((prev) => ({ ...prev, layoutType: event.target.value }))}
                      className={heroSelectClass}
                    >
                      {layoutTypeOptions.map((option) => (
                        <option key={option} value={option === "Alla" ? "" : option} className="text-black">{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#ffffff] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Särskilda krav</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.includeOperatingCosts)}
                        onChange={(event) => setFilters((prev) => ({ ...prev, includeOperatingCosts: event.target.checked }))}
                        className="h-4 w-4 rounded border-black/20"
                      />
                      Driftkostnad ingår
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.accessibilityAdapted)}
                        onChange={(event) => setFilters((prev) => ({ ...prev, accessibilityAdapted: event.target.checked }))}
                        className="h-4 w-4 rounded border-black/20"
                      />
                      Tillgänglighetsanpassad
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                      <input
                        type="checkbox"
                        checked={Boolean(filters.ecoCertified)}
                        onChange={(event) => setFilters((prev) => ({ ...prev, ecoCertified: event.target.checked }))}
                        className="h-4 w-4 rounded border-black/20"
                      />
                      Miljöcertifierad
                    </label>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-700">Bekvämligheter</p>
                  <div className="flex flex-wrap gap-2">
                    {editorAmenityOptions.map((option) => {
                      const Icon = option.icon;
                      const active = isAmenitySelected(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            active ? "border-[#0b0a0e] bg-[#0b0a0e] text-white" : "border-black/10 bg-[#ffffff] text-ink-700 hover:bg-[#ffffff]"
                          }`}
                          onClick={() => toggleAmenity(option.value)}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/10 pt-4">
                <button
                  type="button"
                  className="rounded-2xl border border-black/10 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-[#ffffff]"
                  onClick={() => {
                    setFilters(savedFilters);
                    setAmenityQuery("");
                    setFurnishedFilter("all");
                    setShowAdvancedSearchEditor(false);
                  }}
                >
                  Återställ
                </button>
                <button type="submit" className="rounded-2xl border border-[#0b0a0e] bg-[#0b0a0e] px-5 py-3 text-sm font-semibold text-white">
                  Visa {visibleListings.length} resultat
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ViewingRequestModal
        listing={bookingListing}
        onClose={() => setBookingListing(null)}
        onSubmit={async (payload) => {
          await requestViewing(payload);
          setBookingListing(null);
        }}
      />

      <LocalProgramPickerModal
        programs={showProgramPicker ? renterPrograms : null}
        onClose={() => setShowProgramPicker(false)}
        onSelect={(program) => {
          setShowProgramPicker(false);
          void handleApplyLocalProgramFromQuickCard(program);
        }}
      />

      <AuthPromptModal mode={authPromptMode} onClose={() => setAuthPromptMode("")} onRequireAuth={onRequireAuth} />

      {showEditorAiInfo ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-transparent p-4" onClick={() => setShowEditorAiInfo(false)}>
          <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-[#ffffff] p-5 shadow-[0_24px_64px_rgba(15,25,48,0.28)]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="close-circle-button absolute right-3 top-3 inline-flex items-center justify-center rounded-full border border-black/10 text-lg font-semibold leading-none text-ink-700 hover:bg-[#ffffff]"
              onClick={() => setShowEditorAiInfo(false)}
              aria-label="Stäng"
            >
              ×
            </button>
            <h3 className="pr-10 text-lg font-semibold text-ink-900">Om AI-sök</h3>
            <p className="mt-2 text-sm text-ink-700">
              AI-sök analyserar din text och fyller relevanta filter automatiskt, som område, lokaltyp, teamstorlek,
              budget och bekvämligheter.
            </p>
            <p className="mt-2 text-sm text-ink-700">
              Skriv gärna tydliga önskemål för bättre resultat, till exempel: <span className="font-semibold">"Möblerat kontor för 10 personer nära tunnelbana med budget under 70 000 kr."</span>
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default RentPage;
