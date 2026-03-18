import { useEffect, useMemo, useRef, useState } from "react";
import ListingVisualCard from "../../components/app/ListingVisualCard";
import ViewingRequestModal from "../../components/app/ViewingRequestModal";
import FurnishingToggle from "../../components/app/FurnishingToggle";
import AiGuidedAssistant from "../../components/app/AiGuidedAssistant";
import Breadcrumbs from "../../components/layout/Breadcrumbs";
import {
  BalconyIcon,
  BikeIcon,
  BuildingIcon,
  CarIcon,
  DumbbellIcon,
  EyeIcon,
  FilterIcon,
  ListIcon,
  LockerIcon,
  LoungeIcon,
  MapIcon,
  PenthouseIcon,
  ResetIcon,
  RooftopIcon,
  SaveIcon,
  SearchIcon,
  ShieldIcon,
  SnowflakeIcon,
  SparklesIcon,
  UploadIcon,
  UserIcon,
  UtensilsIcon,
  WifiIcon
} from "../../components/icons/UiIcons";
import { listingApi } from "../../api";
import { districtOptions, listingTypes } from "../../data/mockData";
import { navigateTo } from "../../lib/router";

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
const editorAmenityOptions = [
  { value: "Cykelförråd", label: "Cykelförråd", icon: BikeIcon },
  { value: "Garage", label: "Garage", icon: CarIcon },
  { value: "Kök", label: "Kök", icon: UtensilsIcon },
  { value: "Mötesrum", label: "Mötesrum", icon: BuildingIcon },
  { value: "Fiber", label: "Fiber", icon: WifiIcon },
  { value: "Reception", label: "Reception", icon: UserIcon },
  { value: "Balkong", label: "Balkong", icon: BalconyIcon },
  { value: "Takterrass", label: "Takterrass", icon: RooftopIcon },
  { value: "Takvåning", label: "Takvåning", icon: PenthouseIcon },
  { value: "Gym", label: "Gym", icon: DumbbellIcon },
  { value: "Omklädningsrum", label: "Omklädningsrum", icon: LockerIcon },
  { value: "Air condition", label: "Air condition", icon: SnowflakeIcon },
  { value: "Lounge", label: "Lounge", icon: LoungeIcon },
  { value: "Förråd", label: "Förråd", icon: LockerIcon },
  { value: "Lastzon", label: "Lastzon", icon: CarIcon },
  { value: "Telefonbås", label: "Telefonbås", icon: BuildingIcon },
  { value: "Väntrum", label: "Väntrum", icon: UserIcon },
  { value: "Pentry", label: "Pentry", icon: UtensilsIcon },
  { value: "Skyltfönster", label: "Skyltfönster", icon: BuildingIcon },
  { value: "Säkerhetsdörr", label: "Säkerhetsdörr", icon: ShieldIcon }
];

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
  "cykelförråd": ["cykelförråd", "cykelrum"],
  garage: ["garage", "parkering"],
  kök: ["kök", "kitchen"],
  mötesrum: ["mötesrum", "konferensrum"],
  fiber: ["fiber", "wifi"],
  reception: ["reception"],
  balkong: ["balkong", "balcony"],
  takterrass: ["takterrass", "roof terrace", "terrace"],
  takvåning: ["takvåning", "penthouse"],
  gym: ["gym", "träning", "fitness"],
  omklädningsrum: ["omklädningsrum", "locker room", "omklädning"],
  "air condition": ["air condition", "ac", "a/c", "luftkonditionering"],
  lounge: ["lounge", "social yta", "sociala ytor"],
  förråd: ["förråd", "förrad", "storage"],
  lastzon: ["lastzon", "loading zone", "lastkaj"],
  telefonbås: ["telefonbås", "telefonrum", "phone booth"],
  väntrum: ["väntrum", "waiting room"],
  pentry: ["pentry", "pantry"],
  skyltfönster: ["skyltfönster", "storefront"],
  säkerhetsdörr: ["säkerhetsdörr", "säkerhet", "secure", "security", "säker entré", "säker entre"]
};

const heroInputClass = "w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0f1930] focus:outline-none";
const heroSelectClass = "select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none";

function parseAmenityTerms(value) {
  return String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
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
  onToggleShortlist,
  shortlistedIds,
  selectedListing,
  onCloseSelectedListing,
  showMatchChip = false,
  dense = false
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
  const [status, setStatus] = useState("loading");
  const [retryToken, setRetryToken] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    markerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    closeSelectedListingRef.current = onCloseSelectedListing;
  }, [onCloseSelectedListing]);

  function isMapInFullscreen() {
    if (typeof document === "undefined") return false;
    const fullscreenEl = document.fullscreenElement;
    if (!fullscreenEl || !containerRef.current) return false;
    return fullscreenEl === containerRef.current || containerRef.current.contains(fullscreenEl) || fullscreenEl.contains(containerRef.current);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

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
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
            fullscreenControl: true,
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
              title: listing.title
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
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map) return;

    if (!selectedListing || !isMapInFullscreen()) {
      infoWindowRef.current?.close();
      return;
    }

    const marker = markersByIdRef.current.get(String(selectedListing.id));
    if (!marker) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow({
        maxWidth: 460,
        disableAutoPan: false,
        disableCloseButton: true
      });
    }

    const title = escapeHtml(selectedListing.title);
    const district = escapeHtml(selectedListing.district);
    const address = escapeHtml(selectedListing.address);
    const image = escapeHtml(selectedListing.image);
    const type = escapeHtml(selectedListing.type || "Lokal");
    const size = escapeHtml(selectedListing.sizeSqm);
    const listingHref = `/app/listings/${encodeURIComponent(selectedListing.id)}`;

    infoWindowRef.current.setContent(`
      <a href="${listingHref}" style="display:block;width:320px;max-width:calc(100vw - 80px);font-family:inherit;color:#182338;text-decoration:none;background:#fff;border-radius:22px;overflow:hidden;">
        <img src="${image}" alt="${title}" style="width:100%;height:132px;object-fit:cover;border-bottom-left-radius:16px;border-bottom-right-radius:16px;" />
        <div style="padding:12px 14px 14px 14px;">
          <div style="font-weight:700;font-size:18px;line-height:1.25;color:#111827;">${title}</div>
          <div style="margin-top:4px;font-size:12px;line-height:1.4;color:#6b7280;">${district} • ${address}</div>
          <div style="margin-top:6px;font-size:14px;font-weight:500;line-height:1.4;color:#1f2937;">${type} • ${size} kvm</div>
        </div>
      </a>
    `);
    infoWindowRef.current.open({
      map,
      anchor: marker
    });
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
    <div className={`relative overflow-hidden rounded-2xl border border-[#c6d1df] bg-white ${dense ? "h-[340px] sm:h-[460px]" : "h-[480px]"}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-white/55 text-xs font-semibold text-ink-700">Laddar karta...</div>
      ) : null}
      {status === "missing_key" ? (
        <div className="absolute inset-0 grid place-items-center bg-white/70 p-4 text-center text-xs font-semibold text-rose-700">
          Google Maps API-nyckel saknas. Lägg till `VITE_GOOGLE_MAPS_API_KEY` i `.env` och starta om `npm run dev`.
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center bg-white/75 p-4 text-center text-xs font-semibold text-rose-700">
          <div className="space-y-2">
            <p>{errorMessage || "Google Maps kunde inte laddas."}</p>
            <p>
              Kontrollera att `Maps JavaScript API` + billing är aktiverat och att referrer tillåter
              `http://localhost:5173/*` samt `http://127.0.0.1:5173/*`.
            </p>
            <button
              type="button"
              className="mx-auto rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              Försök igen
            </button>
          </div>
        </div>
      ) : null}
      {selectedListing && onOpenListing && onToggleShortlist && !isMapInFullscreen() ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 sm:inset-x-4 sm:bottom-4">
          <div className="pointer-events-auto relative mx-auto w-full max-w-[440px]">
            <ListingVisualCard
              listing={selectedListing}
              shortlisted={Boolean(
                shortlistedIds?.has(selectedListing.id) ||
                shortlistedIds?.has(String(selectedListing.id))
              )}
              onOpenListing={onOpenListing}
              onToggleShortlist={onToggleShortlist}
              showMatchChip={showMatchChip}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MapCanvas({ listings, onMarkerClick, dense = false }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#c6d1df] bg-white ${dense ? "h-64 sm:h-72" : "h-[420px]"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,#e9f2fb_0%,transparent_35%),radial-gradient(circle_at_75%_65%,#d2e3f5_0%,transparent_40%),linear-gradient(135deg,#cfdfef_0%,#e9f2fb_100%)]" />
      <div className="absolute inset-x-0 top-[32%] h-px bg-white/60" />
      <div className="absolute inset-x-0 top-[58%] h-px bg-white/50" />
      <div className="absolute left-[36%] top-0 h-full w-px bg-white/50" />
      <div className="absolute left-[62%] top-0 h-full w-px bg-white/45" />

      {listings.map((listing) => {
        const point = markerPointForListing(listing);
        return (
          <button
            key={listing.id}
            type="button"
            onClick={() => onMarkerClick?.(listing)}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0f1930]/25 bg-white px-2 py-1 text-[10px] font-semibold text-[#0f1930] hover:border-[#0f1930] hover:bg-[#0f1930] hover:text-white"
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

function PillToggle({ checked, onToggle, ariaLabel, className = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? "bg-[#0f1930]" : "bg-[#a8adb3]"
      } ${checked ? "justify-end" : "justify-start"} ${className}`}
      onClick={onToggle}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,25,48,0.35)]"
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
    : "Logga in eller skapa konto för att boka visning och skicka förfrågan till annonsör.";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 p-4 sm:items-center" onClick={onClose}>
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
        <button type="button" className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink-700" onClick={onClose}>
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
  if (activeFilters.advertiser && activeFilters.advertiser !== "Alla") chips.push({ key: "advertiser", label: `Annonsör: ${activeFilters.advertiser}` });
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

function buildDisplayedSearchChipEntries(searchMeta, defaultMaxBudget) {
  const baseEntries = buildSearchChipEntries(searchMeta, defaultMaxBudget);
  return mergeAiChangedChipEntries(baseEntries, searchMeta?.aiChangedChipEntries || []);
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
    else if (item.startsWith("Annonsör:")) key = "advertiser";
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
    parts.push(`Annonsör: ${nextFilters.advertiser || "Alla"}`);
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
          detail: `De här bekvämlighetskraven begränsar resultaten just nu. Om du gör dem valfria kan fler lokaler visas.`,
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
          detail: `Det här områdeskravet begränsar resultaten just nu. Om du breddar till alla områden kan fler lokaler visas.`,
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
          detail: `Det här typkravet begränsar resultaten just nu. Om du öppnar upp till fler lokaltyper kan fler lokaler visas.`,
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
          detail: `Det här planlösningskravet begränsar resultaten just nu. Om du gör planlösning valfri kan fler lokaler visas.`,
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
          detail: `Det här platskravet begränsar resultaten just nu. Om du sänker eller tar bort minimikravet kan fler lokaler visas.`,
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
          detail: `Det här ytkravet begränsar resultaten just nu. Om du gör ytan mer flexibel kan fler lokaler visas.`,
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
          detail: `Det här budgetkravet begränsar resultaten just nu. Om du gör budgeten mer flexibel kan fler lokaler visas.`,
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
          detail: `Det fasta inflyttningsdatumet begränsar resultaten just nu. Om du gör datumet flexibelt kan fler lokaler visas.`,
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
          detail: `Det här avtalskravet begränsar resultaten just nu. Om du gör avtalet mer flexibelt kan fler lokaler visas.`,
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
          detail: `Det här avståndskravet till kommunaltrafik begränsar resultaten just nu. Om du öppnar upp till alla avstånd kan fler lokaler visas.`,
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
          detail: `Det här parkeringskravet begränsar resultaten just nu. Om du gör parkering valfri kan fler lokaler visas.`,
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
          detail: `Det här accesskravet begränsar resultaten just nu. Om du gör access mer flexibel kan fler lokaler visas.`,
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
          title: `Annonsör är satt till ${baseFilters.advertiser}`,
          detail: `Det här annonsörskravet begränsar resultaten just nu. Om du öppnar upp till alla annonsörer kan fler lokaler visas.`,
          suggestedChange: "Annonsör: Alla",
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
          detail: "Det här kravet begränsar resultaten just nu. Om du gör driftkostnader valfria kan fler lokaler visas.",
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
          detail: "Det här kravet begränsar resultaten just nu. Om du gör tillgänglighetskravet valfritt kan fler lokaler visas.",
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
          detail: "Det här kravet begränsar resultaten just nu. Om du gör miljöcertifiering valfri kan fler lokaler visas.",
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
          detail: `Kombinationen av ${baseFilters.district && baseFilters.district !== "Alla" ? `område ${baseFilters.district}` : "nuvarande område"}${amenityTerms.length > 0 ? ` och bekvämligheterna ${joinSuggestionLabels(amenityTerms)}` : ""} ger för få träffar. Om du öppnar upp båda samtidigt kan fler lokaler visas.`,
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
          detail: "Kombinationen av nuvarande yta och budget ger för få träffar. Om du gör båda mer flexibla kan fler lokaler visas.",
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
      detail: "Flera aktiva krav samverkar och ger för få träffar. Om du gör sökningen bredare kan fler lokaler visas direkt.",
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
    listings,
    favorites,
    savedFilters,
    searchListings,
    saveCurrentFilters,
    saveAiSearch,
    toggleFavorite,
    requestViewing,
    runAiSearch
  } = app;

  const [filters, setFilters] = useState(savedFilters);
  const [isHydratingLandingSearch, setIsHydratingLandingSearch] = useState(() => hasRunSearchInUrl());
  const [showSearchEditor, setShowSearchEditor] = useState(false);
  const [isClosingSearchEditor, setIsClosingSearchEditor] = useState(false);
  const [showAdvancedSearchEditor, setShowAdvancedSearchEditor] = useState(false);
  const [showEditorAiPanel, setShowEditorAiPanel] = useState(true);
  const [sidePanelMode, setSidePanelMode] = useState("ai");
  const [isSwitchingSidePanel, setIsSwitchingSidePanel] = useState(false);
  const [showAdvancedFiltersContent, setShowAdvancedFiltersContent] = useState(false);
  const [isCollapsingAdvancedFilters, setIsCollapsingAdvancedFilters] = useState(false);
  const [showEditorAiInfo, setShowEditorAiInfo] = useState(false);
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
  const [selectedMapListing, setSelectedMapListing] = useState(null);
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
  const noMatchSuggestionRequestRef = useRef(0);
  const filterExpandedBeforeAiRef = useRef(false);
  const headerUploadInputRef = useRef(null);
  const resultsTopRef = useRef(null);
  const searchChipRenderOrderRef = useRef([]);

  const favoriteIds = useMemo(() => new Set(favorites.map((entry) => entry.listingId)), [favorites]);
  const hasTeamSizeForMatchChip = useMemo(() => {
    const parsed = Number(String(filters.teamSize || "").trim());
    return Number.isFinite(parsed) && parsed > 0;
  }, [filters.teamSize]);
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
    setShowEditorAiPanel(true);
    setSidePanelMode("ai");
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
    };
  }, []);

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

  function transitionFromAvailableToResults() {
    if (availableTransitionTimerRef.current) {
      clearTimeout(availableTransitionTimerRef.current);
    }
    setShowSearchSummaryCard(false);
    setAnimateSearchSummaryIn(false);
    setIsLeavingAvailableView(true);
    setShowAdvancedSearchEditor(false);
    setShowEditorAiPanel(true);
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

  function transitionFromResultsToAvailable() {
    if (resetToAvailableTimerRef.current) {
      clearTimeout(resetToAvailableTimerRef.current);
    }
    if (availableEnterTimerRef.current) {
      clearTimeout(availableEnterTimerRef.current);
    }
    setAnimateSearchSummaryIn(false);
    setIsResettingToAvailable(true);
    resetToAvailableTimerRef.current = setTimeout(() => {
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
      aiChangedChipKeys: [],
      aiChangedChipEntries: []
    }));
    const listingData = await searchListings(nextFilters);
    const narrowed = applyAmenityAndFurnishedFilters(listingData, nextAmenityTerms, nextFurnishedFilter);
    setAiLivePreview(() => ({
      filters: nextFilters,
      amenityQuery: nextAmenityTerms,
      furnishedFilter: nextFurnishedFilter,
      aiPrompt: nextPrompt,
      matchCount: narrowed.length,
      aiChangedChipKeys: [],
      aiChangedChipEntries: []
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
        setShowAdvancedSearchEditor(true);
        setShowEditorAiPanel(true);
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
    setShowEditorAiPanel(true);
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

  async function handleAiSuggestedFilters(payload) {
    const nextFilters = payload?.suggestedFilters || filters;
    const aiPrompt = String(payload?.prompt || "").trim();
    setFilters(nextFilters);
    await executeSearch(nextFilters, { aiPrompt });
  }

  async function handleResetSearchResults() {
    const resetFilters = { ...app.defaultFilters };
    setFilters(resetFilters);
    setAmenityQuery("");
    setFurnishedFilter("all");
    await executeSearch(resetFilters, {
      amenityQuery: "",
      furnishedFilter: "all",
      aiPrompt: ""
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
    transitionFromResultsToAvailable();
  }

  useEffect(() => {
    if (landingSearchAppliedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("run") !== "1") {
      setIsHydratingLandingSearch(false);
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
    return buildDisplayedSearchChipEntries(chipMeta, app.defaultFilters?.maxBudget);
  }, [appliedSearchMeta, app.defaultFilters?.maxBudget, showInlineAiGuide, showEditorAiPanel, filters, amenityQuery, furnishedFilter]);

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
      app.defaultFilters?.maxBudget
    );
  }, [
    useLiveAiSearchMeta,
    effectiveFilters,
    effectiveAmenityQuery,
    effectiveFurnishedFilter,
    effectiveAiPrompt,
    aiLivePreview.aiChangedChipEntries,
    appliedSearchMeta.aiChangedChipEntries,
    app.defaultFilters?.maxBudget
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
    const activeKeys = useLiveAiSearchMeta
      ? (hasLiveAiPreview
        ? (aiLivePreview.aiChangedChipKeys || [])
        : (appliedSearchMeta.aiChangedChipKeys || []))
      : (appliedSearchMeta.aiChangedChipKeys || []);
    const activeEntries = useLiveAiSearchMeta
      ? (hasLiveAiPreview
        ? (aiLivePreview.aiChangedChipEntries || [])
        : (appliedSearchMeta.aiChangedChipEntries || []))
      : (appliedSearchMeta.aiChangedChipEntries || []);
    return Array.from(new Set([
      ...activeKeys,
      ...activeEntries.map((entry) => entry.key).filter(Boolean)
    ]));
  }, [
    useLiveAiSearchMeta,
    aiLivePreview.aiChangedChipKeys,
    aiLivePreview.aiChangedChipEntries,
    appliedSearchMeta.aiChangedChipKeys,
    appliedSearchMeta.aiChangedChipEntries
  ]);
  const hasBegunSearch = Boolean(String(displayedAiPrompt || "").trim()) || displayedSearchChips.length > 0;
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
            label: "Minska annonsörskrav",
            preview: "Annonsör: alla",
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

  function handleUploadProgramFile(file) {
    if (file) {
      app.pushToast(`Lokalprogram uppladdat: ${file.name}`, "info");
    }
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
    if (summaryPrompt) {
      saveAiSearch({
        prompt: summaryPrompt,
        filters: summaryBaseFilters
      });
      return;
    }
    void saveCurrentFilters(summaryBaseFilters);
  }

  function handleWatchSearchAction() {
    if (isGuest) {
      openAuthPrompt("save");
      return;
    }
    if (summaryPrompt) {
      saveAiSearch({
        prompt: summaryPrompt,
        filters: summaryBaseFilters
      });
    } else {
      void saveCurrentFilters(summaryBaseFilters);
    }
    app.pushToast("Bevakning aktiverad för sökningen.", "success");
  }

  const showPreferencesSummaryCard = !showSearchEditor
    && !isResettingToAvailable
    && !isLeavingAvailableView
    && hasBegunSearch
    && (showInlineAiGuide || showSearchSummaryCard);

  const summaryBaseFilters = showInlineAiGuide ? (effectiveFilters || filters) : (appliedSearchMeta.filters || filters);
  const summaryPrompt = showInlineAiGuide ? String(effectiveAiPrompt || "").trim() : String(appliedSearchMeta.aiPrompt || "").trim();
  const summaryResultCount = aiLivePreview.matchCount ?? visibleListings.length;
  const visibleResultsSuggestion = resultsSuggestion && resultsSuggestion.key !== dismissedResultsSuggestionKey
    ? resultsSuggestion
    : null;

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

  const preferencesSummaryCard = showPreferencesSummaryCard ? (
    <div
      className={`rounded-3xl border border-black/10 bg-white p-4 sm:p-5 ${
        animateSearchSummaryIn ? "search-summary-dissolve-in" : ""
      } ${isResettingToAvailable ? "search-summary-dissolve-out" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-800">
            <SparklesIcon className="h-4 w-4 text-[#4f46e5]" />
            {summaryResultCount} lokaler matchar dina preferenser
          </p>
          {orderedDisplayedSearchChips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {orderedDisplayedSearchChips.map((chip) => (
                displayedAiChangedChipKeys.includes(chip.key) ? (
                  <span key={chip.key} className="inline-flex items-center gap-1 rounded-full border border-[#4f46e5]/35 bg-[#eef0ff] px-2.5 py-1 text-xs font-semibold text-[#312e81]">
                    <SparklesIcon className="h-3.5 w-3.5 text-[#4f46e5]" />
                    {chip.label}
                  </span>
                ) : (
                  <span key={chip.key} className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700">
                    {chip.label}
                  </span>
                )
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {summaryResultCount <= 3 ? (
        resultsSuggestionLoading ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-[#f8f8f6] px-3 py-3 text-sm text-ink-700">
            AI granskar vilken inställning som begränsar träffarna mest.
          </div>
        ) : visibleResultsSuggestion ? (
          <div className="mt-4 rounded-2xl border border-[#4f46e5]/20 bg-[#eef0ff] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#312e81]">
                  <SparklesIcon className="h-4 w-4 text-[#4f46e5]" />
                  AI-förslag
                </p>
                <p className="text-sm font-semibold text-ink-900">
                  {getSuggestionProblemText(visibleResultsSuggestion)}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 aspect-square items-center justify-center rounded-full border border-[#4f46e5]/20 bg-white p-0 text-sm font-semibold leading-none text-[#312e81]"
                aria-label="Stäng AI-förslag"
                onClick={() => setDismissedResultsSuggestionKey(visibleResultsSuggestion.key)}
              >
                ×
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#4f46e5]/20 bg-white px-2.5 py-1 text-xs font-semibold text-[#312e81]">
                Föreslagen ändring: {visibleResultsSuggestion.suggestedChange}
              </span>
              <span className="rounded-full border border-[#4f46e5]/20 bg-white px-2.5 py-1 text-xs font-semibold text-[#312e81]">
                {visibleResultsSuggestion.count} träffar efter ändring
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex h-[40px] items-center gap-1.5 rounded-xl bg-[#0f1930] px-3 text-xs font-semibold text-white"
                onClick={() => void applyResultsSuggestion(visibleResultsSuggestion)}
              >
                <SparklesIcon className="h-3.5 w-3.5" />
                Redigera med AI
              </button>
            </div>
          </div>
        ) : null
      ) : null}
    </div>
  ) : null;

  const useScrollableFilterPanel = showAdvancedFiltersContent || isCollapsingAdvancedFilters;

  const sideFilterPanel = (
    <article className={`flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-4 ${
      useScrollableFilterPanel ? "lg:h-[calc(100dvh-15rem)] lg:max-h-[calc(100dvh-15rem)]" : ""
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-700">
          <FilterIcon className="h-3.5 w-3.5 text-[#0f1930]" />
          Filter-sök
        </div>
        <div className="inline-flex h-10 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink-700">
          <span className="inline-flex items-center gap-1">
            <FilterIcon className="h-3.5 w-3.5 text-[#0f1930]" />
            <span>Filter-sök</span>
          </span>
          <PillToggle
            checked={!showEditorAiPanel}
            onToggle={handleFilterSearchToggle}
            ariaLabel="Filter-sök i sidopanel"
            className="h-6 w-10"
          />
        </div>
      </div>

      <form className={`mt-3 flex flex-col ${useScrollableFilterPanel ? "min-h-0 flex-1 overflow-hidden" : ""}`} onSubmit={submitSideFilterSearch}>
        <div className={`space-y-3 ${useScrollableFilterPanel ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pb-3" : ""}`}>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div className="max-w-[18rem]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Möblering</span>
            <FurnishingToggle
              value={furnishedFilter}
              onChange={setFurnishedFilter}
              options={furnishedOptions}
            />
          </div>

          {showAdvancedFiltersContent ? (
            <div className={`space-y-3 ${isCollapsingAdvancedFilters ? "search-editor-collapse-out" : "search-editor-expand-in"}`}>
              <div className="grid grid-cols-2 gap-3">
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
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Annonsör</span>
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

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Inflyttning</span>
                  <input
                    value={filters.moveInDate || ""}
                    onChange={(event) => setFilters((prev) => ({ ...prev, moveInDate: event.target.value }))}
                    className={`${heroInputClass} h-[48px] py-0`}
                    type="date"
                  />
                </label>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="rounded-2xl border border-black/10 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Särskilda krav</p>
                <div className="mt-2 grid grid-cols-1 gap-2">
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
                          active ? "border-[#0f1930] bg-[#0f1930] text-white" : "border-black/10 bg-white text-ink-700 hover:bg-white"
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
          ) : null}
        </div>

        <div className={`${useScrollableFilterPanel ? "sticky bottom-0 z-10 mt-1 shrink-0 border-t border-black/10 bg-white pt-3" : "mt-3"} flex flex-wrap items-center justify-end gap-2`}>
          <button
            type="button"
            className="inline-flex h-[40px] items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink-700 hover:bg-white"
            onClick={() => setShowAdvancedSearchEditor((value) => !value)}
          >
            <span>{showAdvancedSearchEditor ? "Visa färre filter" : "Visa alla filter"}</span>
            <span aria-hidden="true" className="text-sm leading-none">{showAdvancedSearchEditor ? "−" : "+"}</span>
          </button>
        </div>
      </form>
    </article>
  );

  const resultsContent = (
    <>
      <div ref={resultsTopRef} className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink-700">
          <BuildingIcon className="h-3.5 w-3.5 text-ink-600" />
          {visibleListings.length} träffar
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white p-1">
            <button
              type="button"
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                resultViewMode === "list"
                  ? "bg-[#0f1930] text-white"
                  : "text-ink-700 hover:bg-white"
              }`}
              onClick={() => setResultViewMode("list")}
              aria-pressed={resultViewMode === "list"}
            >
              <ListIcon className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                resultViewMode === "map"
                  ? "bg-[#0f1930] text-white"
                  : "text-ink-700 hover:bg-white"
              }`}
              onClick={() => setResultViewMode("map")}
              aria-pressed={resultViewMode === "map"}
            >
              <MapIcon className="h-3.5 w-3.5" />
              Karta
            </button>
          </div>
          <div className="inline-flex items-center gap-2">
            <label className="text-xs font-semibold text-ink-700">Sortera</label>
            <select
              className="select-chevron min-h-[40px] min-w-[132px] rounded-xl border border-black/10 bg-white px-4 text-xs font-semibold text-ink-800 focus:border-[#0f1930] focus:outline-none"
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
      </div>

      {resultViewMode === "map" ? (
        <div className="space-y-2">
          <GoogleListingsMap
            listings={visibleListings}
            onMarkerClick={handleMapMarkerClick}
            onOpenListing={openListingDetail}
            onToggleShortlist={handleToggleShortlist}
            shortlistedIds={favoriteIds}
            selectedListing={selectedMapListing}
            onCloseSelectedListing={() => setSelectedMapListing(null)}
            showMatchChip={hasTeamSizeForMatchChip}
            dense
          />
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-600"><MapIcon className="h-3.5 w-3.5" />Klicka på en markör för att visa objektkort direkt på kartan.</p>
        </div>
      ) : null}

      {resultViewMode === "list" ? (visibleListings.length === 0 ? (
        visibleResultsSuggestion ? null : (
        <div className="rounded-3xl border border-black/10 bg-white p-5">
          <p className="text-xl font-semibold text-ink-900">Ingen matchning just nu</p>
          <p className="mt-1 text-[1.05rem] text-ink-700">
            Prova en snabb justering så kan jag hitta närliggande träffar direkt.
          </p>
          {noMatchSuggestionsLoading ? (
            <p className="mt-3 text-sm text-ink-700">Tar fram justeringar som ger träffar...</p>
          ) : noMatchSuggestions.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                    className="group rounded-2xl border border-black/10 bg-white p-3 text-left transition hover:border-[#0f1930]/35 hover:bg-white"
                    onClick={() => void applyNoMatchSuggestion(suggestion)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-ink-900">{suggestion.label}</span>
                      <span className="shrink-0 rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-semibold text-ink-700">
                        {suggestion.count} träffar
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-600">Ändrar</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {visibleChanges.map((item) => (
                        <span key={`${suggestion.id}-${item}`} className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-ink-700">
                          {item}
                        </span>
                      ))}
                      {extraChanges > 0 ? (
                        <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-ink-700">
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
        )
      ) : (
        <div className={`grid items-stretch gap-4 ${showInlineAiGuide ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          {visibleListings.map((listing) => (
            <ListingVisualCard
              key={listing.id}
              listing={listing}
              shortlisted={favoriteIds.has(listing.id)}
              onOpenListing={openListingDetail}
              onToggleShortlist={handleToggleShortlist}
              showMatchChip={hasTeamSizeForMatchChip}
            />
          ))}
        </div>
      )) : null}
    </>
  );

  return (
    <section className="relative h-full overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
      <div className="relative mx-auto w-full max-w-[1540px]">
        {isHydratingLandingSearch ? (
          <div className="grid min-h-[58vh] place-items-center">
            <div className="rounded-2xl border border-[#c8d1de] bg-white px-5 py-4 text-sm font-semibold text-ink-700">
              Laddar sökresultat...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="px-1 py-1">
              <Breadcrumbs
                className="mb-2"
                items={[
                  { label: "Startsida", to: "/" },
                  { label: isAvailableListingsView ? "Lediga lokaler" : "Sökresultat" }
                ]}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-2xl font-semibold">{isAvailableListingsView ? "Lediga lokaler" : "Sökresultat"}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={headerUploadInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => handleUploadProgramFile(event.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink-700 hover:bg-white"
                    onClick={() => headerUploadInputRef.current?.click()}
                  >
                    <UploadIcon className="h-4 w-4 text-[#0f1930]" />
                    Ladda upp lokalprogram
                  </button>
                  {showPreferencesSummaryCard ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-xs font-semibold text-ink-700 hover:bg-white"
                        onClick={handleSaveSearchAction}
                      >
                        <SaveIcon className="h-4 w-4" />
                        {summaryPrompt ? "Spara AI-sökning" : "Spara sökfilter"}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-xs font-semibold text-ink-700 hover:bg-white"
                        onClick={handleWatchSearchAction}
                      >
                        <EyeIcon className="h-4 w-4" />
                        Bevaka sökning
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 text-xs font-semibold text-ink-700 hover:bg-white"
                        onClick={() => {
                          void handleResetSearchResults();
                        }}
                      >
                        <ResetIcon className="h-4 w-4" />
                        Nollställ
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

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
                      onPreviewFilters={previewEditorAiFilters}
                      onSubmitSearch={submitGuidedEditorAiSearch}
                      onOpenInfo={() => setShowEditorAiInfo(true)}
                    onResetSearch={() => {
                      void handleResetSearchResults();
                    }}
                      resultCount={visibleListings.length}
                      defaultResultCount={sortedListings.length}
                      requestedStepRequest={aiGuideStepRequest}
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
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-700">Annonsör</span>
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
                            <label className="inline-flex h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink-700">
                              <input
                                type="checkbox"
                                className="search-flag-checkbox"
                                checked={Boolean(filters.includeOperatingCosts)}
                                onChange={(event) => setFilters((prev) => ({ ...prev, includeOperatingCosts: event.target.checked }))}
                              />
                              Driftkostn. ingår
                            </label>
                            <label className="inline-flex h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink-700">
                              <input
                                type="checkbox"
                                className="search-flag-checkbox"
                                checked={Boolean(filters.accessibilityAdapted)}
                                onChange={(event) => setFilters((prev) => ({ ...prev, accessibilityAdapted: event.target.checked }))}
                              />
                              Tillgänglighetsanp.
                            </label>
                            <label className="inline-flex h-[48px] items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-ink-700">
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
                                      active ? "border-[#0f1930] bg-[#0f1930] text-white" : "border-black/10 bg-white text-ink-700 hover:bg-white"
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
                            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-white"
                            onClick={() => {
                              setShowAdvancedSearchEditor((value) => !value);
                            }}
                          >
                            <span>{showAdvancedSearchEditor ? "Visa färre filter" : "Visa alla filter"}</span>
                            <span aria-hidden="true" className="text-sm leading-none">{showAdvancedSearchEditor ? "−" : "+"}</span>
                          </button>
                          <button type="submit" className="inline-flex items-center gap-1.5 rounded-2xl border border-[#0f1930] bg-[#0f1930] px-5 py-3 text-sm font-semibold text-white hover:bg-[#16233f]">
                            <SearchIcon className="h-4 w-4" />
                            Sök lokaler
                          </button>
                        </div>
                      ) : (
                        <div className="mt-5 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-white"
                            onClick={closeSearchEditorSmooth}
                          >
                            Avbryt
                          </button>
                          <button type="submit" className="rounded-2xl border border-[#0f1930] bg-[#0f1930] px-5 py-3 text-sm font-semibold text-white hover:bg-[#16233f]">
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

            <div className="space-y-4">
              {showInlineAiGuide ? (
                <div className="grid gap-5 lg:h-[calc(100vh-12.5rem)] lg:grid-cols-[minmax(400px,460px)_minmax(0,1fr)] lg:items-start lg:overflow-hidden">
                  <aside className="lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                    <div className={`${isSwitchingSidePanel ? "search-editor-collapse-out" : "search-editor-expand-in"} lg:min-h-full`}>
                      {sidePanelMode === "ai" ? (
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
                          onPreviewFilters={previewEditorAiFilters}
                          onSubmitSearch={submitInlineGuidedAiSearch}
                          onOpenInfo={() => setShowEditorAiInfo(true)}
                          onResetSearch={() => {
                            void handleResetSearchResults();
                          }}
                          resultCount={visibleListings.length}
                          defaultResultCount={sortedListings.length}
                          requestedStepRequest={aiGuideStepRequest}
                        onShowMatches={() => {
                          resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        submitLabel="Uppdatera sökning"
                        showHeader={false}
                        showModeSwitch
                        filterModeActive={!showEditorAiPanel}
                        onToggleFilterMode={handleFilterSearchToggle}
                        />
                      ) : (
                        sideFilterPanel
                      )}
                    </div>
                  </aside>

                  <div className="space-y-4 pb-8 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-16">
                    {preferencesSummaryCard}
                    {resultsContent}
                  </div>
                </div>
              ) : (
                <>
                  {preferencesSummaryCard}
                  {resultsContent}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ViewingRequestModal
        listing={bookingListing}
        onClose={() => setBookingListing(null)}
        onSubmit={async (payload) => {
          await requestViewing(payload);
          setBookingListing(null);
        }}
      />

      <AuthPromptModal mode={authPromptMode} onClose={() => setAuthPromptMode("")} onRequireAuth={onRequireAuth} />

      {showEditorAiInfo ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]" onClick={() => setShowEditorAiInfo(false)}>
          <div className="relative w-full max-w-lg rounded-2xl border border-black/10 bg-white p-5 shadow-[0_24px_64px_rgba(15,25,48,0.28)]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex h-9 w-9 min-h-9 min-w-9 aspect-square items-center justify-center rounded-full border border-black/10 p-0 text-lg font-semibold leading-none text-ink-700 hover:bg-white"
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
