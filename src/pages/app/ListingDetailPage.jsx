import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ListingVisualCard from "../../components/app/ListingVisualCard";
import ViewingRequestModal from "../../components/app/ViewingRequestModal";
import Breadcrumbs from "../../components/layout/Breadcrumbs";
import { formatSek } from "../../lib/formatters";
import { PLATFORM_GOOGLE_MAP_STYLE } from "../../lib/googleMapStyles";
import { normalizePopularListingFallback, popularListingFallbackKey } from "../../lib/popularListingFallback";
import { listings as baseListingDataset } from "../../data/mockData";
import { navigateTo } from "../../lib/router";
import { trackContactClicked, trackListingViewed } from "../../lib/analytics";
import imagesPictogram from "../../../Assets/Pictograms/images.png";
import locationPictogram from "../../../Assets/Pictograms/location.png";
import trainPictogram from "../../../Assets/Pictograms/train.png";
import { amenityIconFor, propertyAmenityDefinitions } from "../../lib/propertyAmenityIcons";
import {
  BalconyIcon,
  BikeIcon,
  BusIcon,
  BuildingIcon,
  CarIcon,
  CalendarIcon,
  ClockIcon,
  DumbbellIcon,
  ExternalLinkIcon,
  LockerIcon,
  LoungeIcon,
  MessageSquareIcon,
  PenthouseIcon,
  PdfIcon,
  PinIcon,
  RooftopIcon,
  RulerIcon,
  ShareIcon,
  ShieldIcon,
  SnowflakeIcon,
  StarIcon,
  TrainIcon,
  UserIcon,
  UtensilsIcon,
  WifiIcon,
  XIcon
} from "../../components/icons/UiIcons";
import { Button } from "@/components/ui/button";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-listing-detail-script";
const TRANSIT_DISTANCE_LIMIT_METERS = 1000;
const MIN_TRANSIT_OPTIONS = 3;
const MAX_TRANSIT_OPTIONS = 8;
const TRANSIT_PLACE_TYPES = [
  "transit_station",
  "subway_station",
  "train_station",
  "light_rail_station",
  "bus_station"
];

const STOCKHOLM_STATION_LINES = {
  odenplan: ["17", "18", "19", "40", "41", "42", "43", "44"],
  "stockholm odenplan": ["17", "18", "19", "40", "41", "42", "43", "44"],
  "s:t eriksplan": ["17", "18", "19"],
  "st eriksplan": ["17", "18", "19"],
  hötorget: ["17", "18", "19"],
  "medborgarplatsen": ["17", "18", "19"],
  skanstull: ["17", "18", "19"],
  fridhemsplan: ["10", "11", "17", "18", "19"],
  rådhuset: ["10", "11"],
  "östermalmstorg": ["13", "14"],
  stadion: ["14"],
  "tekniska högskolan": ["14"],
  "t-centralen": ["10", "11", "13", "14", "17", "18", "19"],
  "centralstationen": ["40", "41", "42", "43", "44"]
};

const districtInsights = {
  Norrmalm: {
    center: { lat: 59.3346, lng: 18.0628 },
    transit: ["T-Centralen 6 min", "Hötorget 4 min", "Flera innerstadsbussar 2-5 min"],
    services: ["Brett restaurangutbud", "Gym och service i kvarteren", "Många lunchalternativ"],
    profile: "Norrmalm passar företag som prioriterar central tillgänglighet, korta restider och närhet till service."
  },
  Södermalm: {
    center: { lat: 59.3148, lng: 18.0632 },
    transit: ["Skanstull 5 min", "Medborgarplatsen 7 min", "Tvärförbindelser med buss 2-6 min"],
    services: ["Kreativa kvarter", "Caféer och mötesplatser", "Blandning av kontor och handel"],
    profile: "Södermalm erbjuder ett dynamiskt område med stark företagsmix och god kommunikation till city."
  },
  Vasastan: {
    center: { lat: 59.3458, lng: 18.0344 },
    transit: ["Odenplan 6 min", "S:t Eriksplan 6 min", "Pendeltåg via Odenplan"],
    services: ["Kvartersnära service", "Bra utbud av lunchrestauranger", "Nära parker och stråk"],
    profile: "Vasastan kombinerar citynära läge med lugnare kvarter och stabil efterfrågan på kontorsytor."
  },
  Östermalm: {
    center: { lat: 59.3385, lng: 18.0916 },
    transit: ["Östermalmstorg 5 min", "Stadion 7 min", "Busslinjer längs huvudstråk"],
    services: ["Representativa adresser", "Hög servicenivå", "Starkt restaurang- och handelsutbud"],
    profile: "Östermalm är ett representativt läge med premiumkänsla och nära access till city."
  },
  Kungsholmen: {
    center: { lat: 59.3319, lng: 18.0418 },
    transit: ["Fridhemsplan 5 min", "Rådhuset 7 min", "Snabb busskoppling västerut"],
    services: ["Stabil företagsnärvaro", "Bra service längs huvudgator", "Nära vatten och promenadstråk"],
    profile: "Kungsholmen ger en balanserad mix av läge, tillgänglighet och trivsam arbetsmiljö."
  },
  Solna: {
    center: { lat: 59.3608, lng: 18.0003 },
    transit: ["Solna Centrum 8 min", "Pendeltåg mot city", "Tvärbana/buss i flera lägen"],
    services: ["Kostnadseffektiva alternativ", "Närhet till större trafikleder", "Växande företagsområden"],
    profile: "Solna är ett attraktivt val för team som söker bra tillgänglighet och effektiv kostnadsbild."
  }
};

function normalizeMatchValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getDistrictInsight(district) {
  return districtInsights[district] || {
    center: { lat: 59.3293, lng: 18.0686 },
    transit: ["Goda kommunikationer i området", "Flera busslinjer i närheten"],
    services: ["Serviceutbud inom gångavstånd", "Närhet till lunch och vardagsservice"],
    profile: "Området erbjuder en stabil blandning av kontor, service och kollektivtrafik."
  };
}

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__googleMapsListingDetailPromise) {
    return window.__googleMapsListingDetailPromise;
  }

  window.__googleMapsListingDetailPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) existingScript.remove();

    const previousAuthFailure = window.gm_authFailure;
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Google Maps timeout."));
    }, 12000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      window.gm_authFailure = previousAuthFailure;
    }

    window.gm_authFailure = () => {
      cleanup();
      reject(new Error("Google Maps API-nyckeln nekades."));
    };

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      cleanup();
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps SDK kunde inte initieras."));
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Kunde inte ladda Google Maps SDK."));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    window.__googleMapsListingDetailPromise = null;
    throw error;
  });

  return window.__googleMapsListingDetailPromise;
}

function ListingAreaGoogleMap({ lat, lng, title }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!GOOGLE_MAPS_API_KEY) {
        setStatus("missing_key");
        return;
      }
      try {
        const maps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (cancelled || !containerRef.current) return;
        const center = { lat, lng };
        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center,
            zoom: 15,
            styles: PLATFORM_GOOGLE_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
            fullscreenControl: false,
            mapTypeControl: false,
            clickableIcons: false,
            gestureHandling: "greedy"
          });
        } else {
          mapRef.current.setCenter(center);
        }
        if (!markerRef.current) {
          markerRef.current = new maps.Marker({
            map: mapRef.current,
            position: center,
            title
          });
        } else {
          markerRef.current.setPosition(center);
          markerRef.current.setTitle(title);
        }
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, title]);

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-black/10 bg-[#ffffff]">
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/55 text-xs font-semibold text-ink-700">Laddar karta...</div>
      ) : null}
      {status === "missing_key" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/70 px-4 text-center text-xs font-semibold text-rose-700">
          Google Maps API-nyckel saknas.
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/70 px-4 text-center text-xs font-semibold text-rose-700">
          Google Maps kunde inte laddas.
        </div>
      ) : null}
    </div>
  );
}

function ListingStreetView({ lat, lng }) {
  const containerRef = useRef(null);
  const panoramaRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!GOOGLE_MAPS_API_KEY) {
        setStatus("missing_key");
        return;
      }
      try {
        const maps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (cancelled || !containerRef.current) return;
        const center = { lat, lng };
        if (!panoramaRef.current) {
          panoramaRef.current = new maps.StreetViewPanorama(containerRef.current, {
            position: center,
            pov: { heading: 40, pitch: 0 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: false,
            linksControl: true,
            panControl: true
          });
        } else {
          panoramaRef.current.setPosition(center);
        }
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-black/10 bg-[#ffffff]">
      <div ref={containerRef} className="absolute inset-0" />
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/55 text-xs font-semibold text-ink-700">Laddar gatuvy...</div>
      ) : null}
      {status === "missing_key" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/70 px-4 text-center text-xs font-semibold text-rose-700">
          Google Maps API-nyckel saknas.
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/70 px-4 text-center text-xs font-semibold text-rose-700">
          Gatuvy kunde inte laddas här.
        </div>
      ) : null}
    </div>
  );
}

function haversineMeters(from, to) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
}

function formatDistanceMeters(value) {
  const meters = Number(value || 0);
  if (!Number.isFinite(meters) || meters <= 0) return "";
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
  }
  return `${meters} meter`;
}

function parseLineBadges(text) {
  const normalized = String(text || "")
    .replace(/\bca\.?\s*\d+\s*(min|meter|m|km)\b/gi, "")
    .replace(/\b\d+\s*(min|meter|m|km)\b/gi, "");
  const matches = normalized.match(/\b(?:\d{1,3}|[A-Z]\d{1,2})\b/g) || [];
  return Array.from(new Set(matches)).slice(0, 4);
}

function normalizeTransitStopName(name, vicinity = "", lines = []) {
  const knownLineTokens = new Set((Array.isArray(lines) ? lines : []).map((item) => String(item).toUpperCase()));
  const lettersPattern = /[A-Za-zÅÄÖåäö]/;
  const clean = (value) => String(value || "")
    .replace(/\bca\.?\s*\d+\s*(min|meter|m|km)\b/gi, "")
    .replace(/\b\d+\s*(min|meter|m|km)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const primary = clean(name);
  const primaryTokens = primary.split(" ").filter(Boolean);
  const filteredPrimary = primaryTokens.filter((token) => !knownLineTokens.has(token.toUpperCase())).join(" ").trim();
  if (filteredPrimary && lettersPattern.test(filteredPrimary)) return filteredPrimary;

  const fallback = clean(vicinity).split(",")[0]?.trim() || "";
  if (fallback && lettersPattern.test(fallback)) return fallback;
  return primary;
}

function inferStationLinesFromName(name) {
  const normalized = String(name || "").trim().toLowerCase();
  if (!normalized) return [];
  for (const [stationKey, lines] of Object.entries(STOCKHOLM_STATION_LINES)) {
    if (normalized.includes(stationKey)) return lines;
  }
  return [];
}

function transitKindFromTypes(types = []) {
  const list = Array.isArray(types) ? types : [];
  if (list.includes("train_station") || list.includes("subway_station") || list.includes("light_rail_station")) {
    return "train";
  }
  return "bus";
}

function buildFallbackTransitStops(fallbackTransit = []) {
  return (Array.isArray(fallbackTransit) ? fallbackTransit : [])
    .filter(Boolean)
    .map((item, index) => {
      const sourceName = String(item).trim();
      const lines = Array.from(new Set([...parseLineBadges(sourceName), ...inferStationLinesFromName(sourceName)])).slice(0, 4);
      const name = normalizeTransitStopName(sourceName, "", lines);
      return {
        id: `fallback-transit-${index}`,
        name,
        distanceLabel: "",
        lines,
        kind: "bus"
      };
    })
    .filter((item) => Array.isArray(item.lines) && item.lines.length > 0)
    .slice(0, 5);
}

function ListingTransitCard({ lat, lng, fallbackTransit = [] }) {
  const [status, setStatus] = useState("loading");
  const [stops, setStops] = useState(() => buildFallbackTransitStops(fallbackTransit));

  useEffect(() => {
    let cancelled = false;

    async function loadTransit() {
      const fallbackStops = buildFallbackTransitStops(fallbackTransit);

      if (!GOOGLE_MAPS_API_KEY) {
        setStops(fallbackStops);
        setStatus("missing_key");
        return;
      }

      try {
        const maps = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (cancelled) return;

        if (!maps?.places?.PlacesService || !maps?.places?.PlacesServiceStatus) {
          setStops(fallbackStops);
          setStatus("missing_places");
          return;
        }

        const location = new maps.LatLng(lat, lng);
        const service = new maps.places.PlacesService(document.createElement("div"));

        const searchNearbyByType = (type) => new Promise((resolve) => {
          service.nearbySearch(
            { location, rankBy: maps.places.RankBy.DISTANCE, type },
            (results, serviceStatus) => {
              if (serviceStatus === maps.places.PlacesServiceStatus.OK && Array.isArray(results)) {
                resolve(results);
                return;
              }
              resolve([]);
            }
          );
        });

        async function searchAcrossTypes() {
          const byType = await Promise.all(
            TRANSIT_PLACE_TYPES.map((type) => searchNearbyByType(type))
          );
          const deduped = new Map();
          byType.flat().forEach((place, index) => {
            const key = String(place?.place_id || place?.name || `transit-${index}`);
            if (!deduped.has(key)) deduped.set(key, place);
          });
          return Array.from(deduped.values());
        }

        const places = await searchAcrossTypes();

        const parsedStops = places
          .map((place, index) => {
            const placeLocation = place?.geometry?.location;
            const placeLat = typeof placeLocation?.lat === "function" ? placeLocation.lat() : null;
            const placeLng = typeof placeLocation?.lng === "function" ? placeLocation.lng() : null;
            const distance = (Number.isFinite(placeLat) && Number.isFinite(placeLng))
              ? haversineMeters({ lat, lng }, { lat: placeLat, lng: placeLng })
              : null;

            const kind = transitKindFromTypes(place?.types);
            const parsedLines = parseLineBadges(place?.name);
            const inferredLines = kind === "train" ? inferStationLinesFromName(place?.name) : [];
            const lines = Array.from(new Set([...parsedLines, ...inferredLines])).slice(0, 4);
            const displayName = normalizeTransitStopName(place?.name, place?.vicinity, lines);
            return {
              id: String(place?.place_id || place?.name || `transit-${index}`),
              name: String(displayName || "").trim(),
              distanceMeters: distance ?? Number.POSITIVE_INFINITY,
              distanceLabel: distance ? formatDistanceMeters(distance) : "",
              lines,
              kind
            };
          })
          .filter((item) => item.name && Array.isArray(item.lines) && item.lines.length > 0)
          .filter((item) => Number.isFinite(item.distanceMeters) && item.distanceMeters <= TRANSIT_DISTANCE_LIMIT_METERS)
          .sort((a, b) => a.distanceMeters - b.distanceMeters)
          .slice(0, MAX_TRANSIT_OPTIONS);

        const nextStops = parsedStops.length > 0 ? parsedStops : fallbackStops;
        setStops(nextStops);
        setStatus(nextStops.length >= MIN_TRANSIT_OPTIONS ? "ready" : "limited");
      } catch {
        if (cancelled) return;
        setStops(fallbackStops);
        setStatus("error");
      }
    }

    void loadTransit();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, fallbackTransit]);

  return (
    <article className="rounded-2xl border border-black/10 bg-[#ffffff] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-xl font-semibold">
          <img src={trainPictogram} alt="" aria-hidden="true" className="h-[33px] w-[33px] object-contain" />
          Kollektivtrafik
        </h3>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {stops.length > 0 ? (
          stops.map((stop) => (
            <article key={stop.id} className="rounded-xl border border-black/10 bg-[#f6f6f4] px-3 py-3">
              <div className="flex items-start gap-2.5">
                <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-[#ffffff] text-ink-800">
                  {stop.kind === "train" ? <TrainIcon className="h-5 w-5" /> : <BusIcon className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">{stop.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {stop.lines.map((line) => (
                      <span key={`${stop.id}-line-${line}`} className="inline-flex min-h-[24px] min-w-[30px] items-center justify-center rounded-[6px] bg-[#0b0a0e] px-2 py-1 text-xs font-semibold leading-none text-white">
                        {line}
                      </span>
                    ))}
                    {stop.distanceLabel ? <span className="ml-1 text-xs font-medium text-ink-600">{stop.distanceLabel}</span> : null}
                  </div>
                </div>
              </div>
              </article>
          ))
        ) : (
          <p className="text-sm text-ink-600">
            {status === "loading"
              ? "Hämtar kollektivtrafik..."
              : "Inga kollektivtrafiklinjer med linjenummer hittades just nu."}
          </p>
        )}
      </div>
    </article>
  );
}

function inferAmenitiesFromText(text) {
  const normalized = String(text || "").toLowerCase();
  const inferred = [];
  if (/(mötesrum|styrelserum|konferens)/.test(normalized)) inferred.push("Mötesrum");
  if (/(fiber|wifi|internet)/.test(normalized)) inferred.push("Fiber");
  if (/(kök|pentry|kaffe|kaffestation)/.test(normalized)) inferred.push("Kök");
  if (/(parkering|garage|lastzon|laddplats)/.test(normalized)) inferred.push("Parkering");
  if (/(cykel|cykelförråd|cykelrum)/.test(normalized)) inferred.push("Cykelförråd");
  if (/(reception|väntrum)/.test(normalized)) inferred.push("Reception");
  if (/(lounge|telefonbås)/.test(normalized)) inferred.push("Lounge");
  if (/(dusch|omklädningsrum|gym)/.test(normalized)) inferred.push("Omklädningsrum");
  if (/(air condition|ac|klimat)/.test(normalized)) inferred.push("Air condition");
  if (/(balkong|terrass|takterrass)/.test(normalized)) inferred.push("Takterrass");
  return Array.from(new Set(inferred));
}

function normalizeAmenityLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  const definition = propertyAmenityDefinitions.find((item) => item.label.toLowerCase() === normalized
    || item.aliases.some((alias) => normalized.includes(alias)));
  return definition ? definition.label : String(value || "").trim();
}

function buildDisplayAmenities(listing) {
  const blocked = new Set([
    "extern källa",
    "importerad listing",
    "importerad",
    "listing",
    "amf fastigheter",
    "vasakronan",
    "castellum",
    "fabege",
    "skandia fastigheter"
  ]);
  const advertiserName = String(listing?.advertiserName || "").trim().toLowerCase();
  if (advertiserName) blocked.add(advertiserName);

  const sanitized = (Array.isArray(listing?.amenities) ? listing.amenities : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => !blocked.has(item.toLowerCase()));
  const normalizedSanitized = sanitized
    .map((item) => normalizeAmenityLabel(item))
    .filter(Boolean);
  if (normalizedSanitized.length > 0) return Array.from(new Set(normalizedSanitized)).slice(0, 8);

  const inferred = inferAmenitiesFromText(
    [listing?.description, listing?.type, listing?.tags?.join(" "), listing?.title]
      .filter(Boolean)
      .join(" ")
  );
  if (inferred.length > 0) return inferred.slice(0, 8);
  return ["Mötesrum", "Fiber", "Kök"];
}

function buildLongDescription(listing, insight, amenities) {
  const amenityText = Array.isArray(amenities) && amenities.length > 0
    ? amenities.slice(0, 5).join(", ").toLowerCase()
    : "moderna grundfaciliteter";

  const intro = listing.description || `${listing.title} är en ${listing.type.toLowerCase()}lokal i ${listing.district} med genomtänkt planering för team upp till ${listing.capacity} personer. Lokalen omfattar cirka ${listing.sizeSqm} kvm och passar verksamheter som vill kombinera effektiv yta med hög vardagsfunktion.`;
  const layout = `Ytorna är planerade för både fokusarbete och samarbete, med tydliga arbetszoner och flexibla möbleringsmöjligheter. Bekvämligheter som ${amenityText} skapar en arbetsmiljö som fungerar i vardagen och ger bra förutsättningar för tillväxt.`;
  const area = `${insight.profile} Läget vid ${listing.address} gör det enkelt för både medarbetare och besökare att nå lokalen, och området erbjuder en bra balans mellan tillgänglighet, service och representativ känsla.`;
  const transport = `Kommunikationerna är starka med ${insight.transit.join(", ").toLowerCase()}. Det ger korta restider inom Stockholm och underlättar både rekrytering och kundmöten.`;

  return [intro, layout, area, transport];
}

function ListingDetailPage({ app, listingId, isGuest = false, onRequireAuth, initialView = "detail" }) {
  const pageRef = useRef(null);
  const [galleryTab, setGalleryTab] = useState("images");
  const [galleryOverlayOpen, setGalleryOverlayOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [areaViewMode, setAreaViewMode] = useState("map");
  const [aboutOverlayVisible, setAboutOverlayVisible] = useState(false);
  const [aboutOverlayOpen, setAboutOverlayOpen] = useState(false);
  const [isClosingAboutOverlay, setIsClosingAboutOverlay] = useState(false);
  const [bookingListing, setBookingListing] = useState(null);
  const isGalleryView = initialView === "gallery";
  const source = useMemo(() => {
    if (typeof window === "undefined") return "search";
    const params = new URLSearchParams(window.location.search);
    return params.get("source") === "available" ? "available" : "search";
  }, [listingId, isGalleryView]);
  const backHref = source === "available" ? "/app/rent?view=available" : "/app/rent?run=1";
  const backLabel = source === "available" ? "Gå till lediga lokaler" : "Gå till sökresultat";
  const galleryHref = `/app/listings/${encodeURIComponent(listingId)}/gallery?source=${source}`;

  const effectiveListings = useMemo(
    () => (Array.isArray(app.listings) && app.listings.length > 0 ? app.listings : baseListingDataset),
    [app.listings]
  );

  const listing = useMemo(() => {
    const existing = effectiveListings.find((item) => String(item.id) === String(listingId));
    if (existing) return existing;
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(popularListingFallbackKey(listingId));
      if (!raw) return null;
      return normalizePopularListingFallback(JSON.parse(raw));
    } catch {
      return null;
    }
  }, [effectiveListings, listingId]);

  const similarListings = useMemo(() => {
    if (!listing) return [];
    const sameDistrict = effectiveListings.filter((item) => item.id !== listing.id && item.district === listing.district);
    const remaining = effectiveListings.filter((item) => item.id !== listing.id && item.district !== listing.district);
    return [...sameDistrict, ...remaining].slice(0, 6);
  }, [effectiveListings, listing]);

  const insight = useMemo(() => getDistrictInsight(listing?.district), [listing?.district]);
  const displayAmenities = useMemo(() => (listing ? buildDisplayAmenities(listing) : []), [listing]);
  const longDescription = useMemo(() => (listing ? buildLongDescription(listing, insight, displayAmenities) : []), [listing, insight, displayAmenities]);
  const shortDescription = useMemo(() => {
    if (longDescription.length === 0) return [];
    const combined = longDescription.join(" ");
    if (combined.length <= 420) return longDescription.slice(0, 2);
    const firstChunk = combined.slice(0, 420).trim();
    const safeCut = firstChunk.lastIndexOf(".");
    const preview = safeCut > 180 ? firstChunk.slice(0, safeCut + 1) : `${firstChunk}...`;
    return [preview];
  }, [longDescription]);
  const shortDescriptionPreview = useMemo(() => {
    const base = String(shortDescription?.[0] || longDescription?.[0] || "").trim();
    if (!base) return "";
    if (base.length <= 240) return base;
    return `${base.slice(0, 237).trim()}...`;
  }, [shortDescription, longDescription]);
  const aboutOverlayTimerRef = useRef(null);

  const googleMapsHref = useMemo(
    () => `https://www.google.com/maps?q=${encodeURIComponent(`${insight.center.lat},${insight.center.lng}`)}`,
    [insight.center.lat, insight.center.lng]
  );

  const resolvedFavoriteListingId = useMemo(() => {
    if (!listing) return null;
    const ownId = String(listing.id || "").trim();
    const ownAddress = normalizeMatchValue(listing.address);
    const ownTitle = normalizeMatchValue(listing.title);
    const ownDistrict = normalizeMatchValue(listing.district);

    const matched = Array.isArray(effectiveListings)
      ? effectiveListings.find((item) => {
          const itemAddress = normalizeMatchValue(item?.address);
          const itemTitle = normalizeMatchValue(item?.title);
          if ((ownAddress && itemAddress === ownAddress) || (ownTitle && itemTitle === ownTitle)) {
            return true;
          }
          if (ownDistrict && normalizeMatchValue(item?.district) === ownDistrict) {
            return (ownTitle && itemTitle.includes(ownTitle)) || (ownAddress && itemAddress.includes(ownAddress));
          }
          return false;
        })
      : null;

    return matched?.id || ownId || null;
  }, [effectiveListings, listing]);

  const isSaved = useMemo(
    () => Boolean((app.favorites || []).some((entry) => String(entry.listingId) === String(resolvedFavoriteListingId))),
    [app.favorites, resolvedFavoriteListingId]
  );
  const ownerCompanyName = String(listing?.advertiserName || "Mäklarfirma AB").trim() || "Mäklarfirma AB";
  const brokerName = String(listing?.brokerName || "Ansvarig mäklare").trim() || "Ansvarig mäklare";
  const brokerInitials = brokerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "M";

  const images = useMemo(() => {
    if (!listing) return [];
    const source = Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : [listing.image || "/object-images/object-1.jpeg"];
    return source.map((entry) => (typeof entry === "string" ? entry : entry?.url)).filter(Boolean);
  }, [listing]);
  const galleryPreviewImages = useMemo(() => {
    if (images.length === 0) return [];
    const secondaryImages = images.length > 1 ? images.slice(1) : images;
    if (secondaryImages.length >= 2) return secondaryImages.slice(0, 2);
    return Array.from({ length: 2 }, (_, index) => secondaryImages[index % secondaryImages.length]);
  }, [images]);
  useEffect(() => {
    setGalleryTab("images");
    setAreaViewMode("map");
  }, [listingId, isGalleryView]);

  useEffect(() => {
    return () => {
      if (aboutOverlayTimerRef.current) {
        clearTimeout(aboutOverlayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!aboutOverlayVisible || aboutOverlayOpen || isClosingAboutOverlay) return;
    if (aboutOverlayTimerRef.current) {
      clearTimeout(aboutOverlayTimerRef.current);
    }
    aboutOverlayTimerRef.current = setTimeout(() => {
      setAboutOverlayOpen(true);
      aboutOverlayTimerRef.current = null;
    }, 16);
    return () => {
      if (aboutOverlayTimerRef.current) {
        clearTimeout(aboutOverlayTimerRef.current);
        aboutOverlayTimerRef.current = null;
      }
    };
  }, [aboutOverlayVisible, aboutOverlayOpen, isClosingAboutOverlay]);


  useEffect(() => {
    if (!listing?.id || isGalleryView) return;
    trackListingViewed({
      listing_id: String(listing.id),
      source
    });
    app?.recordListingView?.(listing.id, source);
  }, [isGalleryView, listing?.id, source]);

  useEffect(() => {
    const container = pageRef.current;
    if (container) container.scrollTo({ top: 0, behavior: "auto" });
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [listingId, isGalleryView]);

  const actionButtonClass = "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]";
  const saveActionButtonClass = "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/10 bg-[#ffffff] px-3 text-xs font-semibold text-ink-700 transition hover:bg-[#ffffff]";

  function handleToggleSave() {
    if (!resolvedFavoriteListingId) return;
    if (isGuest) {
      onRequireAuth?.("login", "renter");
      return;
    }
    app.toggleFavorite?.(resolvedFavoriteListingId);
  }

  function handleExportPdf() {
    window.print();
  }

  function openGalleryOverlay(startIndex = 0) {
    const safeIndex = Number.isFinite(startIndex) ? Math.max(0, Math.min(images.length - 1, startIndex)) : 0;
    setActiveGalleryIndex(safeIndex);
    setGalleryOverlayOpen(true);
  }

  function closeGalleryOverlay() {
    setGalleryOverlayOpen(false);
  }

  function openAboutOverlay() {
    if (aboutOverlayTimerRef.current) {
      clearTimeout(aboutOverlayTimerRef.current);
      aboutOverlayTimerRef.current = null;
    }
    setAboutOverlayVisible(true);
    setAboutOverlayOpen(false);
    setIsClosingAboutOverlay(false);
  }

  function closeAboutOverlay() {
    if (!aboutOverlayVisible || !aboutOverlayOpen) return;
    setIsClosingAboutOverlay(true);
    setAboutOverlayOpen(false);
    if (aboutOverlayTimerRef.current) {
      clearTimeout(aboutOverlayTimerRef.current);
    }
    aboutOverlayTimerRef.current = setTimeout(() => {
      setAboutOverlayVisible(false);
      setIsClosingAboutOverlay(false);
      aboutOverlayTimerRef.current = null;
    }, 240);
  }


  async function handleShare() {
    if (!listing?.id) return;
    const shareUrl = `${window.location.origin}/app/listings/${encodeURIComponent(listing.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: `${listing.title} • ${listing.district}`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        app.pushToast("Länk kopierad.", "success");
      }
    } catch {
      app.pushToast("Delning avbröts.", "info");
    }
  }

  if (!listing) {
    return (
      <section ref={pageRef} className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl p-6">
          <Button type="button" variant="outline" className={`h-auto ${actionButtonClass}`} onClick={() => navigateTo(backHref)}>
            {backLabel}
          </Button>
          <div className="mt-4 rounded-2xl border border-black/10 bg-[#ffffff] p-6">
            <h1 className="text-2xl font-semibold">Objektet hittades inte</h1>
            <p className="mt-2 text-sm text-ink-600">Det här objektet kan ha tagits bort eller saknar data.</p>
          </div>
        </div>
      </section>
    );
  }

  if (isGalleryView) {
    return (
      <section ref={pageRef} className="h-full overflow-y-auto bg-[#ffffff]">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          <div className="grid grid-cols-1 items-center gap-3 border-b border-black/10 pb-3 sm:grid-cols-[1fr_auto_1fr]">
            <div />

            <div className="inline-flex items-center justify-center gap-6 justify-self-center">
              <button
                type="button"
                className={`tab-underline-button border-b-2 pb-0.5 text-xs font-semibold transition ${
                  galleryTab === "images"
                    ? "border-[#0b0a0e] text-[#0b0a0e]"
                    : "border-transparent text-ink-600 hover:text-black"
                }`}
                onClick={() => setGalleryTab("images")}
              >
                Bilder
              </button>
              <button
                type="button"
                className={`tab-underline-button border-b-2 pb-0.5 text-xs font-semibold transition ${
                  galleryTab === "street"
                    ? "border-[#0b0a0e] text-[#0b0a0e]"
                    : "border-transparent text-ink-600 hover:text-black"
                }`}
                onClick={() => setGalleryTab("street")}
              >
                Gatuvy
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
              <Button type="button" variant="outline" className={`h-auto ${actionButtonClass}`} onClick={handleExportPdf}>
                <PdfIcon className="h-3.5 w-3.5" />
                PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`h-auto ${saveActionButtonClass}`}
                onClick={handleToggleSave}
                title={isSaved ? "Sparad" : "Spara"}
                aria-label={isSaved ? "Sparad" : "Spara"}
              >
                <StarIcon className={`h-3.5 w-3.5 ${isSaved ? "fill-current text-[#0b0a0e]" : ""}`} />
                {isSaved ? "Sparad" : "Spara"}
              </Button>
              <Button type="button" variant="outline" className={`h-auto ${actionButtonClass}`} onClick={handleShare}>
                <ShareIcon className="h-3.5 w-3.5" />
                Dela
              </Button>
            </div>
          </div>

          <div className="mt-4">
            {galleryTab === "images" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((image, index) => (
                  <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-black/10 bg-[#ffffff]">
                    <img src={image} alt={`${listing.title} ${index + 1}`} className="h-48 w-full object-cover sm:h-52" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <ListingStreetView lat={insight.center.lat} lng={insight.center.lng} />
                <a
                  href={googleMapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]"
                >
                  Öppna i Google Maps
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

        </div>
      </section>
    );
  }

  return (
    <section ref={pageRef} className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl p-4 pb-8 sm:p-6">
        <Breadcrumbs
          className="mb-2"
          items={[
            { label: "Startsida", to: "/" },
            { label: source === "available" ? "Lediga lokaler" : "Sökresultat", to: backHref },
            { label: listing.title }
          ]}
        />

        <div className="mt-4 space-y-4">
          <div className="grid gap-6">
            <div className="relative h-72 overflow-hidden rounded-3xl border border-black/10 bg-[#ffffff] sm:h-[420px]">
              <div className="grid h-full grid-cols-2 gap-0.5 bg-[#ffffff]">
                <button
                  type="button"
                  className="gallery-mosaic-tile relative block h-full w-full overflow-hidden text-left"
                  onClick={() => openGalleryOverlay(0)}
                >
                  <img src={images[0]} alt={listing.title} className="h-full w-full object-cover" />
                  <div className="pointer-events-auto absolute right-4 top-4 z-20 flex flex-wrap items-center justify-end gap-2">
                    <Button type="button" variant="outline" className={`h-auto ${actionButtonClass}`} onClick={(event) => { event.stopPropagation(); handleExportPdf(); }}>
                      <PdfIcon className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`h-auto ${saveActionButtonClass}`}
                      onClick={(event) => { event.stopPropagation(); handleToggleSave(); }}
                      title={isSaved ? "Sparad" : "Spara"}
                      aria-label={isSaved ? "Sparad" : "Spara"}
                    >
                      <StarIcon className={`h-3.5 w-3.5 ${isSaved ? "fill-current text-[#0b0a0e]" : ""}`} />
                      {isSaved ? "Sparad" : "Spara"}
                    </Button>
                    <Button type="button" variant="outline" className={`h-auto ${actionButtonClass}`} onClick={(event) => { event.stopPropagation(); handleShare(); }}>
                      <ShareIcon className="h-3.5 w-3.5" />
                      Dela
                    </Button>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/45 via-black/10 to-transparent px-4 pb-4 pt-16">
                    <span
                      className="pointer-events-auto inline-flex items-center justify-center gap-3 rounded-full border border-black/10 bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#0b0a0e] transition hover:border-[#0b0a0e]"
                      onClick={(event) => {
                        event.stopPropagation();
                        openGalleryOverlay(0);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          openGalleryOverlay(0);
                        }
                      }}
                    >
                      <img src={imagesPictogram} alt="" aria-hidden="true" className="h-[26px] w-[26px] object-contain" />
                      Se alla bilder
                    </span>
                  </div>
                </button>

                <div className="grid h-full min-h-0 grid-cols-2 gap-0.5">
                  {galleryPreviewImages.map((image, index) => (
                    <button
                      key={`gallery-side-${image}-${index}`}
                      type="button"
                      className="gallery-mosaic-tile relative block h-full w-full min-h-0 overflow-hidden bg-[#ffffff] p-0 text-left"
                      onClick={() => openGalleryOverlay(index + 1)}
                    >
                      <img src={image} alt={`${listing.title} forhandsbild ${index + 2}`} className="absolute inset-0 h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <article className="flex h-full flex-col rounded-3xl border border-black/10 bg-[#ffffff] p-5">
                <h2 className="text-2xl font-semibold leading-tight text-ink-900">{listing.title}</h2>
                <div className="mt-2 space-y-3">
                  <p className="flex items-center gap-1.5 text-sm text-ink-500">
                    <PinIcon className="h-4 w-4" />
                    {listing.district} • {listing.address}
                  </p>
                  <div className="inline-flex flex-wrap items-center overflow-hidden rounded-full border border-black/10 bg-[#ffffff] text-base font-semibold text-ink-700">
                    <div className="inline-flex items-center gap-2.5 px-4 py-2.5">
                      <RulerIcon className="h-5 w-5 text-ink-600" />
                      {listing.sizeSqm} kvm
                    </div>
                    <span className="h-5 w-px bg-black/10" />
                    <div className="inline-flex items-center gap-2.5 px-4 py-2.5">
                      <UserIcon className="h-5 w-5 text-ink-600" />
                      {listing.capacity} platser
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm leading-relaxed text-ink-700">
                  <p>{shortDescriptionPreview}</p>
                </div>
                <div className="mt-5">
                  <h3 className="text-base font-semibold">Bekvämligheter</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {displayAmenities.map((amenity) => {
                      const Icon = amenityIconFor(amenity);
                      return (
                        <li
                          key={`about-${amenity}`}
                          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-black/10 bg-[#ffffff] px-3 py-1.5 text-[0.875rem] font-semibold leading-5 text-ink-700"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                          {amenity}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="mt-auto border-t border-black/10 pt-4">
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto rounded-full px-4 py-2.5 text-sm font-semibold text-ink-700 hover:border-[#0b0a0e]/25 hover:text-[#0b0a0e]"
                      onClick={openAboutOverlay}
                    >
                      Läs mer
                    </Button>
                  </div>
                </div>
              </article>

              <div className="relative h-80 overflow-hidden rounded-3xl border border-black/10 bg-[#ffffff] sm:h-[440px]">
                <iframe 
                  src="https://app.archilogic.com/viewer?sceneId=d47471f6-f59c-4efe-8bf9-fe0239f143a9&s=m3s1p0fhslt0xfstumrbrjrhrd" 
                  height="100%" 
                  width="100%"
                  frameborder="0" 
                  onmousewheel="false" 
                  allowfullscreen>
                </iframe>
              </div>
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <ListingTransitCard lat={insight.center.lat} lng={insight.center.lng} fallbackTransit={insight.transit} />

              <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 pr-2">
                    <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                      <img src={locationPictogram} alt="" aria-hidden="true" className="h-[33px] w-[33px] object-contain" />
                      Området
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#ffffff] p-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      className={`h-auto min-h-[34px] gap-1 rounded-full px-3.5 text-xs font-semibold ${
                        areaViewMode === "map"
                          ? "bg-[#0b0a0e] text-white hover:bg-[#0b0a0e] hover:text-white"
                          : "text-ink-700 hover:bg-[#ffffff]"
                      }`}
                      onClick={() => setAreaViewMode("map")}
                      aria-pressed={areaViewMode === "map"}
                    >
                      Karta
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className={`h-auto min-h-[34px] gap-1 rounded-full px-3.5 text-xs font-semibold ${
                        areaViewMode === "street"
                          ? "bg-[#0b0a0e] text-white hover:bg-[#0b0a0e] hover:text-white"
                          : "text-ink-700 hover:bg-[#ffffff]"
                      }`}
                      onClick={() => setAreaViewMode("street")}
                      aria-pressed={areaViewMode === "street"}
                    >
                      Gatuvy
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  {areaViewMode === "map" ? (
                    <ListingAreaGoogleMap lat={insight.center.lat} lng={insight.center.lng} title={listing.title} />
                  ) : (
                    <ListingStreetView lat={insight.center.lat} lng={insight.center.lng} />
                  )}
                </div>
                <a
                  href={googleMapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]"
                >
                  Öppna i Google Maps
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </article>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Tillgänglighet</p>
                    <p className="mt-1 text-sm font-semibold text-ink-900">{listing.availability || "Efter överenskommelse"}</p>
                  </div>
                  <span className="rounded-full border border-black/10 bg-[#ffffff] px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                    {listing.term || "Flexibelt avtal"}
                  </span>
                </div>

                <div className="mt-4 border-t border-black/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Hyra per månad</p>
                  <p className="mt-1 text-[28px] font-semibold leading-none text-[#0b0a0e]">{formatSek(listing.priceMonthly)}</p>
                </div>

                <div className="mt-4 border-t border-black/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Mäklare</p>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-black/10 bg-[#f8f8f7] p-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-sm font-semibold text-white">
                      {brokerInitials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink-900">{brokerName}</p>
                      <p className="truncate text-xs text-ink-600">{ownerCompanyName}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Button
                    type="button"
                    className="h-auto w-full gap-1.5 rounded-full px-4 py-3 text-sm font-semibold"
                    onClick={() => setBookingListing(listing)}
                  >
                    <CalendarIcon className="h-4 w-4 text-white" />
                    Boka visning
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full gap-1.5 rounded-full px-4 py-3 text-sm font-semibold"
                    onClick={() => {
                      trackContactClicked({
                        listing_id: String(listing.id),
                        source
                      });
                      setBookingListing(listing);
                    }}
                  >
                    <MessageSquareIcon className="h-4 w-4" />
                    Kontakta uthyrare
                  </Button>
                </div>

              </article>

            </aside>
          </div>
        </div>


        {aboutOverlayVisible ? (
          <div
            className={`fixed inset-0 z-[72] flex items-center justify-center p-4 backdrop-blur-[2px] transition-all duration-200 sm:p-5 ${
              aboutOverlayOpen ? "bg-[#ffffff]/0 opacity-100" : "bg-[#ffffff]/0 opacity-0"
            }`}
            onClick={closeAboutOverlay}
          >
            <div
              className={`flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#ffffff] shadow-[0_16px_40px_rgba(15,25,48,0.12)] transition-all duration-200 sm:max-h-[calc(100vh-2.5rem)] ${
                aboutOverlayOpen
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-2 scale-[0.985] opacity-0"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-6 pb-0 pt-6 sm:px-7 sm:pt-7">
                <div>
                  <h3 className="text-2xl font-semibold text-ink-900">{listing.title}</h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500">
                    <PinIcon className="h-4 w-4" />
                    {listing.district} • {listing.address}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="close-circle-button rounded-full text-xl leading-none text-ink-700 hover:border-[#0b0a0e]/25 hover:text-[#0b0a0e]"
                  onClick={closeAboutOverlay}
                  aria-label="Stäng"
                >
                  ×
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-5 sm:px-7 sm:pb-10">
                <div className="space-y-3 text-sm leading-relaxed text-ink-700">
                  {longDescription.map((paragraph) => (
                    <p key={`overlay-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>

                <div className="mt-6 border-t border-black/10 pt-5">
                  <h4 className="text-base font-semibold text-ink-900">Bekvämligheter</h4>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {displayAmenities.map((amenity) => {
                      const Icon = amenityIconFor(amenity);
                      return (
                        <li
                          key={`overlay-amenity-${amenity}`}
                          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-black/10 bg-[#ffffff] px-3 py-1.5 text-[0.875rem] font-semibold leading-5 text-ink-700"
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                          {amenity}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-6 border-t border-black/10 pt-5">
                  <h4 className="text-base font-semibold text-ink-900">Service i området</h4>
                  <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                    {insight.services.map((item) => (
                      <li key={`overlay-service-${item}`} className="leading-relaxed">• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex justify-center border-t border-black/10 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto rounded-full px-4 py-2.5 text-sm font-semibold text-ink-700 hover:border-[#0b0a0e]/25 hover:text-[#0b0a0e]"
                    onClick={closeAboutOverlay}
                  >
                    Stäng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {galleryOverlayOpen && typeof document !== "undefined"
          ? createPortal(
            <div className="fixed inset-0 z-[90] h-dvh overflow-hidden bg-[#ffffff]">
              <div className="h-full overflow-y-auto overscroll-none bg-[#ffffff] pb-24">
                <div className="sticky top-0 z-10 border-b border-black/10 bg-[#ffffff]/95 backdrop-blur-md">
                  <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-4 px-4 py-4 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto w-auto justify-self-start gap-1.5 rounded-full border-black/20 px-3 py-2 text-xs font-semibold text-ink-700 hover:border-[#0b0a0e] hover:text-[#0b0a0e]"
                      onClick={closeGalleryOverlay}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                      Stäng
                    </Button>

                    <div className="inline-flex items-center justify-center gap-6 justify-self-center">
                      <button
                        type="button"
                        className={`tab-underline-button border-b-2 pb-0.5 text-sm font-semibold transition ${
                          galleryTab === "images"
                            ? "border-[#0b0a0e] text-[#0b0a0e]"
                            : "border-transparent text-ink-600 hover:text-black"
                        }`}
                        onClick={() => setGalleryTab("images")}
                      >
                        Galleri
                      </button>
                      <button
                        type="button"
                        className={`tab-underline-button border-b-2 pb-0.5 text-sm font-semibold transition ${
                          galleryTab === "street"
                            ? "border-[#0b0a0e] text-[#0b0a0e]"
                            : "border-transparent text-ink-600 hover:text-black"
                        }`}
                        onClick={() => setGalleryTab("street")}
                      >
                        Gatuvy
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                      <Button type="button" variant="outline" className={`h-auto ${actionButtonClass}`} onClick={handleExportPdf}>
                        <PdfIcon className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={`h-auto ${saveActionButtonClass}`}
                        onClick={handleToggleSave}
                        title={isSaved ? "Sparad" : "Spara"}
                        aria-label={isSaved ? "Sparad" : "Spara"}
                      >
                        <StarIcon className={`h-3.5 w-3.5 ${isSaved ? "fill-current text-[#0b0a0e]" : ""}`} />
                        {isSaved ? "Sparad" : "Spara"}
                      </Button>
                      <Button type="button" variant="outline" className={`h-auto ${actionButtonClass}`} onClick={handleShare}>
                        <ShareIcon className="h-3.5 w-3.5" />
                        Dela
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6">
                  {galleryTab === "images" ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {images.map((image, index) => (
                        <Button
                          key={`gallery-full-${image}-${index}`}
                          type="button"
                          variant="outline"
                          className="gallery-thumb-button h-auto justify-start overflow-hidden p-0 text-left"
                          onClick={() => setActiveGalleryIndex(index)}
                        >
                          <img
                            src={image}
                            alt={`${listing.title} bild ${index + 1}`}
                            className="h-[360px] w-full object-cover sm:h-[460px] xl:h-[560px]"
                          />
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-black/10 bg-[#ffffff] p-3 sm:p-4">
                      <ListingStreetView lat={insight.center.lat} lng={insight.center.lng} />
                      <a
                        href={googleMapsHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-[#ffffff]"
                      >
                        Öppna i Google Maps
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-[#ffffff]/95 backdrop-blur-md">
                  <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#ffffff] px-3 py-2">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#84c4be] text-xs font-semibold text-white">
                          {brokerInitials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink-900">{brokerName}</span>
                          <span className="block truncate text-xs text-ink-600">{ownerCompanyName || "Mäklarfirma AB"}</span>
                        </span>
                      </div>
                      <div className="inline-flex min-h-[42px] items-center overflow-hidden rounded-full border border-black/10 bg-[#ffffff] text-[0.875rem] font-semibold leading-5 text-ink-700">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5">
                          <RulerIcon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                          {listing.sizeSqm || "-"} kvm
                        </span>
                        <span className="h-5 w-px bg-black/10" />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5">
                          <UserIcon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                          {listing.capacity || "-"} platser
                        </span>
                        <span className="h-5 w-px bg-black/10" />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5">
                          <BuildingIcon className="h-3.5 w-3.5 shrink-0 text-ink-700" />
                          {formatSek(listing.priceMonthly)}/månad
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                      <Button
                        type="button"
                        className="h-auto gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold"
                        onClick={() => setBookingListing(listing)}
                      >
                        <CalendarIcon className="h-4 w-4 text-white" />
                        Boka visning
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold"
                        onClick={() => {
                          trackContactClicked({
                            listing_id: String(listing.id),
                            source
                          });
                          setBookingListing(listing);
                        }}
                      >
                        <MessageSquareIcon className="h-4 w-4" />
                        Kontakta uthyrare
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
          : null}

        {similarListings.length > 0 ? (
          <section className="pt-16 pb-8">
            <h2 className="text-2xl font-semibold">Liknande objekt</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {similarListings.map((item) => (
                <ListingVisualCard
                  key={item.id}
                  listing={item}
                  shortlisted={Boolean((app.favorites || []).some((entry) => String(entry.listingId) === String(item.id)))}
                  onOpenListing={(selected) => navigateTo(`/app/listings/${encodeURIComponent(selected.id)}?source=${source}`)}
                  onBookViewing={(selected) => setBookingListing(selected)}
                  onToggleShortlist={(targetId) => app.toggleFavorite?.(targetId)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <ViewingRequestModal
        listing={bookingListing}
        onClose={() => setBookingListing(null)}
        onSubmit={async (payload) => {
          if (typeof app.requestViewing === "function") {
            await app.requestViewing(payload);
          }
          setBookingListing(null);
        }}
      />
      </div>
    </section>
  );
}

export default ListingDetailPage;
