import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo } from "../lib/router";
import { propertyAmenityOptions } from "../lib/propertyAmenityIcons";
import MarketingHeader from "../components/layout/MarketingHeader";
import ListingVisualCard from "../components/app/ListingVisualCard";
import MapListingPreviewCard from "../components/app/MapListingPreviewCard";
import ViewingRequestModal from "../components/app/ViewingRequestModal";
import { popularListingFallbackKey } from "../lib/popularListingFallback";
import { PLATFORM_GOOGLE_MAP_STYLE } from "../lib/googleMapStyles";
import {
  BalconyIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BikeIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  CoinsIcon,
  FilterIcon,
  DumbbellIcon,
  HistoryIcon,
  LockerIcon,
  LoungeIcon,
  MouseScrollIcon,
  PenthouseIcon,
  PinIcon,
  RooftopIcon,
  SearchIcon,
  ShieldIcon,
  SnowflakeIcon,
  SparklesIcon,
  StarIcon,
  UserIcon,
  UtensilsIcon,
  WifiIcon
} from "../components/icons/UiIcons";
import { districtOptions, listingTypes, listings as baseListingDataset } from "../data/mockData";
import heroImage from "../../Assets/Hero Images/stockholm-landing.jpg";
import processImage from "../../Assets/Object Images/_ (2).jpeg";
import faqImage from "../../Assets/Object Images/_ (3).jpeg";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const HERO_GOOGLE_MAPS_SCRIPT_ID = "google-maps-hero-sdk-script";
const heroDistrictGeo = {
  Solna: { lat: 59.3608, lng: 18.0003 },
  Norrmalm: { lat: 59.3346, lng: 18.0628 },
  Vasastan: { lat: 59.3458, lng: 18.0344 },
  Östermalm: { lat: 59.3385, lng: 18.0916 },
  Kungsholmen: { lat: 59.3319, lng: 18.0418 },
  Södermalm: { lat: 59.3148, lng: 18.0632 }
};

const processSteps = [
  {
    title: "Skapa konto och välj roll",
    body: "Starta som hyresgäst, hyresvärd eller båda roller i samma konto.",
    icon: UserIcon
  },
  {
    title: "Sök eller publicera",
    body: "Använd filter och AI-sök, eller publicera nya objekt steg för steg.",
    icon: SearchIcon
  },
  {
    title: "Boka och följ upp",
    body: "Visningsförfrågan, intressestatus och snabb dialog samlas i en vy.",
    icon: CalendarIcon
  }
];

const faqItems = [
  {
    q: "Kan jag publicera gratis?",
    a: "Ja, just nu är gratis publicering aktiv med obegränsat antal annonser."
  },
  {
    q: "Kan samma konto vara både hyresgäst och hyresvärd?",
    a: "Ja. Du kan växla roll direkt i plattformen utan att skapa nytt konto."
  },
  {
    q: "Hur snabbt får jag in intresse?",
    a: "Det beror på objekt, pris och efterfrågan, men flödet är byggt för snabb kontakt."
  },
  {
    q: "Finns AI-sök för hyresgäster?",
    a: "Ja, AI-sök hjälper dig hitta relevanta objekt snabbare och justerar filter automatiskt."
  }
];

const popularGroups = [
  {
    city: "Stockholm",
    count: "2 745",
    listings: [
      {
        id: "popular-1",
        title: "Fregattvägen 8",
        district: "Gröndal",
        address: "Fregattvägen 8",
        type: "Kontor",
        priceMonthly: 92000,
        sizeSqm: 159,
        capacity: 18,
        responseHours: 7,
        score: 91,
        verified: true,
        tags: ["Industrier & verkstäder", "Lager & logistik", "Kontor"],
        image: "/object-images/object-1.jpeg"
      },
      {
        id: "popular-2",
        title: "Tomtebogatan 30",
        district: "Vasastan",
        address: "Tomtebogatan 30",
        type: "Kontor",
        priceMonthly: 76000,
        sizeSqm: 90,
        capacity: 10,
        responseHours: 9,
        score: 88,
        verified: false,
        tags: ["Butiker", "Kontor"],
        image: "/object-images/object-2.jpeg"
      },
      {
        id: "popular-3",
        title: "Ringvägen 129",
        district: "Södermalm",
        address: "Ringvägen 129",
        type: "Butik",
        priceMonthly: 68500,
        sizeSqm: 75,
        capacity: 8,
        responseHours: 11,
        score: 84,
        verified: true,
        tags: ["Restauranger & caféer"],
        image: "/object-images/object-3.jpeg"
      },
      {
        id: "popular-4",
        title: "Riddargatan 28",
        district: "Östermalm",
        address: "Riddargatan 28",
        type: "Kontor",
        priceMonthly: 70500,
        sizeSqm: 79,
        capacity: 9,
        responseHours: 8,
        score: 86,
        verified: false,
        tags: ["Butiker", "Kontor"],
        image: "/object-images/object-4.jpeg"
      },
      {
        id: "popular-5",
        title: "Sankt Eriksgatan 44",
        district: "Kungsholmen",
        address: "Sankt Eriksgatan 44",
        type: "Kontor",
        priceMonthly: 81200,
        sizeSqm: 102,
        capacity: 12,
        responseHours: 6,
        score: 89,
        verified: true,
        tags: ["Kontor", "Coworking"],
        image: "/object-images/object-5.jpeg"
      },
      {
        id: "popular-6",
        title: "Götgatan 67",
        district: "Södermalm",
        address: "Götgatan 67",
        type: "Kontor",
        priceMonthly: 73400,
        sizeSqm: 88,
        capacity: 10,
        responseHours: 8,
        score: 87,
        verified: false,
        tags: ["Kontor", "Studio"],
        image: "/object-images/object-6.jpeg"
      }
    ]
  }
];

function hashSeed(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function heroMarkerGeoForListing(listing) {
  const base = heroDistrictGeo[listing.district] || { lat: 59.3293, lng: 18.0686 };
  const seed = hashSeed(String(listing.id || listing.title || "listing"));
  const jitterLat = ((seed % 9) - 4) * 0.001;
  const jitterLng = (((seed >> 4) % 9) - 4) * 0.001;
  return {
    lat: base.lat + jitterLat,
    lng: base.lng + jitterLng
  };
}

function loadHeroGoogleMaps(apiKey) {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__googleMapsHeroPromise) {
    return window.__googleMapsHeroPromise;
  }

  window.__googleMapsHeroPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(HERO_GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

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
    script.id = HERO_GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      cleanup();
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps SDK kunde inte initieras."));
      }
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Kunde inte ladda Google Maps SDK."));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    window.__googleMapsHeroPromise = null;
    throw error;
  });

  return window.__googleMapsHeroPromise;
}

function HeroMapWidget({
  compact = false,
  className = "",
  listings = null,
  large = false,
  shortlistedIds,
  onToggleShortlist,
  requireAuthForShortlist
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const markersByIdRef = useRef(new Map());
  const suppressMapClickCloseRef = useRef(false);
  const [mapStatus, setMapStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [selectedListing, setSelectedListing] = useState(null);

  const featuredListings = useMemo(() => {
    if (Array.isArray(listings) && listings.length > 0) {
      return listings.slice(0, 120);
    }
    return [...baseListingDataset]
      .sort((left, right) => (right.verified - left.verified) || (right.score - left.score))
      .slice(0, 120);
  }, [listings]);

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
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path fill="#0f1930" stroke="#0b1428" stroke-width="1.4" d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12c0 7.71 8.58 16.56 9.57 17.55a.97.97 0 0 0 1.36 0c.99-.99 9.57-9.84 9.57-17.55 0-5.66-4.59-10.25-10.25-10.25Z"/><circle cx="12" cy="12" r="4.1" fill="#ffffff"/></svg>`
      )}`,
      scaledSize: new window.google.maps.Size(30, 42),
      anchor: new window.google.maps.Point(15, 42)
    };
  }

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      if (!GOOGLE_MAPS_API_KEY) {
        setMapStatus("missing_key");
        setErrorMessage("Google Maps API-nyckel saknas.");
        return;
      }
      if (!mapContainerRef.current) {
        return;
      }

      try {
        setMapStatus("loading");
        setErrorMessage("");
        const maps = await loadHeroGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (cancelled || !mapContainerRef.current) return;
        mapsRef.current = maps;

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapContainerRef.current, {
            center: { lat: 59.3293, lng: 18.0686 },
            zoom: 11,
            styles: PLATFORM_GOOGLE_MAP_STYLE,
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: true,
            fullscreenControl: false,
            mapTypeControl: false,
            clickableIcons: false,
            gestureHandling: "greedy",
          });
          mapRef.current.addListener("click", () => {
            if (suppressMapClickCloseRef.current) return;
            setSelectedListing(null);
          });
        }

        const bounds = new maps.LatLngBounds();
        const nextIds = new Set();

        featuredListings.forEach((listing) => {
          const listingId = String(listing.id);
          nextIds.add(listingId);
          const position = heroMarkerGeoForListing(listing);
          let marker = markersByIdRef.current.get(listingId);

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
              setSelectedListing(marker.__listing || listing);
            });
            markersByIdRef.current.set(listingId, marker);
          } else {
            marker.setPosition(position);
            marker.setTitle(listing.title);
          }

          marker.__listing = listing;
          bounds.extend(position);
        });

        markersByIdRef.current.forEach((marker, markerId) => {
          if (!nextIds.has(markerId)) {
            marker.setMap(null);
            markersByIdRef.current.delete(markerId);
          }
        });

        if (featuredListings.length > 0) {
          mapRef.current.fitBounds(bounds, compact ? 40 : 54);
          window.requestAnimationFrame(() => {
            if (!mapRef.current || !mapsRef.current) return;
            mapsRef.current.event.trigger(mapRef.current, "resize");
            mapRef.current.fitBounds(bounds, compact ? 40 : 54);
          });
          window.setTimeout(() => {
            if (!mapRef.current || !mapsRef.current) return;
            mapsRef.current.event.trigger(mapRef.current, "resize");
            mapRef.current.fitBounds(bounds, compact ? 40 : 54);
          }, 180);
        }

        setMapStatus("ready");
      } catch {
        if (!cancelled) {
          setMapStatus("error");
          setErrorMessage("Google Maps kunde inte laddas.");
        }
      }
    }

    setupMap();

    return () => {
      cancelled = true;
    };
  }, [featuredListings, compact, retryToken]);

  useEffect(() => {
    markersByIdRef.current.forEach((marker) => {
      const markerListingId = String(marker?.__listing?.id || "");
      const isActive = Boolean(selectedListing && markerListingId === String(selectedListing.id));
      marker.setIcon(isActive ? activeMarkerIcon() : inactiveMarkerIcon());
      marker.setZIndex(isActive ? 99 : 1);
    });
  }, [selectedListing]);

  useEffect(() => () => {
    markersByIdRef.current.forEach((marker) => marker.setMap(null));
    markersByIdRef.current.clear();
  }, []);

  function handleCycleSelectedListing(direction) {
    if (!Array.isArray(featuredListings) || featuredListings.length === 0) return;
    const currentId = String(selectedListing?.id || "");
    const currentIndex = featuredListings.findIndex((item) => String(item.id) === currentId);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + direction + featuredListings.length) % featuredListings.length;
    const nextListing = featuredListings[nextIndex];
    if (!nextListing) return;
    setSelectedListing(nextListing);
    const marker = markersByIdRef.current.get(String(nextListing.id));
    if (marker && mapRef.current) {
      const markerPosition = marker.getPosition?.();
      if (markerPosition) {
        mapRef.current.panTo(markerPosition);
      }
    }
  }

  const wrapperClassName = compact
    ? `group relative flex h-full w-full flex-col text-left ${className}`.trim()
    : `group relative flex h-full w-full flex-col overflow-visible text-left ${className}`.trim();

  const mapShellClassName = compact
    ? "relative flex-1 overflow-hidden"
    : "relative flex-1 overflow-hidden";

  const mapViewportClassName = compact
    ? "relative h-full overflow-hidden bg-[#edf2f6]"
    : `relative h-full overflow-hidden rounded-[20px] bg-[#edf2f6] ${large ? "min-h-[420px] sm:min-h-[480px]" : "min-h-[clamp(180px,calc(100vh-33rem),240px)]"}`;

  return (
    <div className={`relative ${compact ? "h-full overflow-hidden" : "h-full w-full overflow-visible"}`.trim()}>
      <div className={wrapperClassName}>
        <div
          className={
            compact
              ? "flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-black/10 bg-[#fffffe] p-0"
              : "flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[#fffffe] p-4"
          }
        >
          <div className={mapShellClassName}>
          <div className={mapViewportClassName}>
            <div ref={mapContainerRef} className="h-full w-full" />

            {mapStatus === "loading" ? (
              <div className="absolute inset-0 grid place-items-center bg-[#fffffe]/55 text-xs font-semibold text-ink-700">Laddar karta...</div>
            ) : null}

            {mapStatus === "missing_key" ? (
              <div className="absolute inset-0 grid place-items-center bg-[#fffffe]/70 p-4 text-center text-xs font-semibold text-rose-700">
                Google Maps API-nyckel saknas. Lägg till `VITE_GOOGLE_MAPS_API_KEY` i `.env` och starta om `npm run dev`.
              </div>
            ) : null}

            {mapStatus === "error" ? (
              <div className="absolute inset-0 grid place-items-center bg-[#fffffe]/75 p-4 text-center text-xs font-semibold text-rose-700">
                <div className="space-y-2">
                  <p>{errorMessage || "Google Maps kunde inte laddas."}</p>
                  <button
                    type="button"
                    className="mx-auto rounded-lg border border-rose-300 bg-[#fffffe] px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    onClick={() => setRetryToken((value) => value + 1)}
                  >
                    Försök igen
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {selectedListing ? (
            <div className="pointer-events-none absolute bottom-3 left-3 z-20 sm:bottom-4 sm:left-4">
              <div className="flex items-start gap-2">
                <div className="pointer-events-auto w-[min(320px,calc(100vw-6rem))] sm:w-[min(360px,calc(100vw-6rem))]">
                  <div className="xl:hidden">
                    <MapListingPreviewCard
                      listing={selectedListing}
                      onOpen={(listing) => navigateTo(`/app/listings/${encodeURIComponent(listing.id)}`)}
                    />
                  </div>
                  <div className="hidden xl:block xl:w-[420px]">
                    <ListingVisualCard
                      listing={selectedListing}
                      shortlisted={shortlistedIds?.has?.(String(selectedListing.id))}
                      onOpenListing={(listing) => navigateTo(`/app/listings/${encodeURIComponent(listing.id)}`)}
                      onToggleShortlist={(listingId) => {
                        if (!onToggleShortlist) return;
                        onToggleShortlist(listingId);
                      }}
                      requireAuthForShortlist={() => requireAuthForShortlist?.()}
                      showMatchChip={false}
                    />
                  </div>
                </div>
                <div className="pointer-events-auto flex flex-col gap-2">
                  <button
                    type="button"
                    aria-label="Stäng objekt"
                    className="close-circle-button inline-flex items-center justify-center rounded-full border border-black/10 bg-[#fffffe] text-lg font-semibold leading-none text-ink-700 hover:bg-[#eef3fa]"
                    onClick={() => setSelectedListing(null)}
                  >
                    ×
                  </button>
                  <button
                    type="button"
                    aria-label="Föregående objekt"
                    className="inline-flex h-9 w-9 min-h-9 min-w-9 aspect-square items-center justify-center rounded-full border border-black/10 bg-[#fffffe] p-0 text-base font-semibold leading-none text-ink-700 hover:bg-[#eef3fa]"
                    onClick={() => handleCycleSelectedListing(-1)}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Nästa objekt"
                    className="inline-flex h-9 w-9 min-h-9 min-w-9 aspect-square items-center justify-center rounded-full border border-black/10 bg-[#fffffe] p-0 text-base font-semibold leading-none text-ink-700 hover:bg-[#eef3fa]"
                    onClick={() => handleCycleSelectedListing(1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}

const heroAmenityOptions = propertyAmenityOptions;

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

const heroInputClass = "w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0f1930] focus:outline-none";
const heroSelectClass = "select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0f1930] focus:outline-none";

function HeroPillToggle({ checked, onToggle, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? "justify-end bg-[#0f1930]" : "justify-start bg-[#a8adb3]"
      }`}
      onClick={onToggle}
    >
      <span aria-hidden="true" className="h-5 w-5 rounded-full bg-[#fffffe] shadow-[0_1px_2px_rgba(15,25,48,0.35)]" />
    </button>
  );
}

function normalizeMatchValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseAmenityTerms(value) {
  return String(value || "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function applyAmenityAndFurnishedFilters(listings, amenityQuery, furnishedFilter = "all") {
  const terms = parseAmenityTerms(amenityQuery).map((term) => term.toLowerCase());

  return listings.filter((listing) => {
    const amenityText = Array.isArray(listing.amenities) ? listing.amenities.join(" ").toLowerCase() : "";
    if (terms.length > 0 && !terms.some((term) => amenityText.includes(term))) {
      return false;
    }

    const furnishedSignal = /möbler|furnished|inredd/i.test(amenityText);
    if (furnishedFilter === "yes" && !furnishedSignal) return false;
    if (furnishedFilter === "no" && furnishedSignal) return false;

    return true;
  });
}

function LandingPage({ user, favorites = [], onToggleFavorite, onOpenAuthOverlay, onLogout, onSwitchRole, listings = [] }) {
  const headerRef = useRef(null);
  const heroSectionRef = useRef(null);
  const processLeftRef = useRef(null);
  const processCardRef = useRef(null);
  const faqQuestionsRef = useRef(null);
  const faqCardRef = useRef(null);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [bookingListing, setBookingListing] = useState(null);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [heroFilters, setHeroFilters] = useState({
    district: "Alla",
    teamSize: ""
  });

  const openAuth = (mode, preferredRole = "renter") => {
    onOpenAuthOverlay?.(mode, preferredRole);
  };

  function handlePopularBookViewing(listing) {
    setBookingListing(listing);
  }

  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((entry) => String(entry.listingId))),
    [favorites]
  );
  const totalAvailableListings = Array.isArray(listings) && listings.length > 0 ? listings.length : baseListingDataset.length;
  const trustScore = 4.8;
  const trustReviews = 127;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncSectionCardHeights = () => {
      const isDesktop = window.innerWidth >= 1024;

      if (processCardRef.current) {
        if (isDesktop && processLeftRef.current) {
          processCardRef.current.style.height = `${processLeftRef.current.offsetHeight}px`;
        } else {
          processCardRef.current.style.height = "";
        }
      }

      if (faqCardRef.current) {
        if (isDesktop && faqQuestionsRef.current) {
          faqCardRef.current.style.height = `${faqQuestionsRef.current.offsetHeight}px`;
        } else {
          faqCardRef.current.style.height = "";
        }
      }
    };

    syncSectionCardHeights();

    const resizeObserver = new ResizeObserver(() => {
      syncSectionCardHeights();
    });

    if (processLeftRef.current) resizeObserver.observe(processLeftRef.current);
    if (faqQuestionsRef.current) resizeObserver.observe(faqQuestionsRef.current);

    window.addEventListener("resize", syncSectionCardHeights);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncSectionCardHeights);
    };
  }, []);

  function scrollToHashSection(hash, smooth = true) {
    if (!hash?.startsWith("#")) return false;
    const section = document.querySelector(hash);
    if (!section) return false;
    const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 72;
    const borderSectionAdjustment = hash === "#sa-fungerar-det" || hash === "#faq" ? 1 : 0;
    const topOffset = Math.ceil(headerHeight) - borderSectionAdjustment;
    const top = section.getBoundingClientRect().top + window.scrollY - topOffset;
    window.scrollTo({ top: Math.max(top, 0), behavior: smooth ? "smooth" : "auto" });
    return true;
  }

  function handleSectionLinkClick(event, href) {
    if (!href?.startsWith("#")) return;
    event.preventDefault();
    if (window.location.hash !== href) {
      window.history.replaceState(null, "", href);
    }
    scrollToHashSection(href, true);
  }

  function handleHomeBrandClick() {
    if (window.location.pathname === "/") {
      if (window.location.hash) {
        window.history.replaceState(null, "", "/");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigateTo("/");
  }

  function handleScrollToTop() {
    if (window.location.hash) {
      window.history.replaceState(null, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (window.location.hash) {
      requestAnimationFrame(() => {
        scrollToHashSection(window.location.hash, false);
      });
    }

    const onHashChange = () => {
      scrollToHashSection(window.location.hash, true);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollToTopButton(window.scrollY > 12);
      setIsNavScrolled(window.scrollY > 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function submitHeroSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    const teamSize = heroFilters.teamSize.trim();
    const hasAnySearchInput = Boolean(teamSize || heroFilters.district !== "Alla");

    if (!hasAnySearchInput) {
      navigateTo("/app/rent?view=available");
      return;
    }

    params.set("run", "1");
    if (heroFilters.district !== "Alla") params.set("district", heroFilters.district);
    if (teamSize) params.set("teamSize", teamSize);
    navigateTo(`/app/rent?${params.toString()}`);
  }

  function resolvePopularListing(selected, fallbackIndex = 0) {
    const queryAddress = normalizeMatchValue(selected?.address || selected?.title);
    const queryTitle = normalizeMatchValue(selected?.title);
    const queryDistrict = normalizeMatchValue(selected?.district);
    const sourceListings = Array.isArray(listings) ? listings : [];
    if (sourceListings.length === 0) return null;

    let matchedListing = sourceListings.find((item) => {
      const itemAddress = normalizeMatchValue(item?.address);
      const itemTitle = normalizeMatchValue(item?.title);
      return (queryAddress && itemAddress === queryAddress) || (queryTitle && itemTitle === queryTitle);
    });

    if (!matchedListing) {
      matchedListing = sourceListings.find((item) => {
        const sameDistrict = normalizeMatchValue(item?.district) === queryDistrict;
        if (!sameDistrict) return false;
        const itemTitle = normalizeMatchValue(item?.title);
        const itemAddress = normalizeMatchValue(item?.address);
        return (queryTitle && itemTitle.includes(queryTitle)) || (queryAddress && itemAddress.includes(queryAddress));
      });
    }

    if (!matchedListing) {
      const districtPool = sourceListings.filter(
        (item) => normalizeMatchValue(item?.district) === queryDistrict
      );
      if (districtPool.length > 0) {
        matchedListing = districtPool[fallbackIndex % districtPool.length];
      }
    }

    return matchedListing || sourceListings[fallbackIndex % sourceListings.length] || null;
  }

  function resolvePopularListingId(selected, fallbackIndex = 0) {
    return resolvePopularListing(selected, fallbackIndex)?.id || null;
  }

  function openPopularListingDetail(selected) {
    const targetId = resolvePopularListingId(selected);
    if (!targetId) return;
    const matchedListing = Array.isArray(listings)
      ? listings.find((item) => String(item?.id) === String(targetId))
      : null;

    if (!matchedListing && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(popularListingFallbackKey(targetId), JSON.stringify(selected));
      } catch {
        // no-op: fallback storage is best effort only
      }
    }

    navigateTo(`/app/listings/${encodeURIComponent(targetId)}`);
  }

  function handleTogglePopularShortlist(listingId) {
    if (!listingId) return;
    if (!user) {
      openAuth("login", "renter");
      return;
    }
    onToggleFavorite?.(listingId);
  }

  return (
    <main className="min-h-screen bg-[#fffffe] text-black">
      <div ref={headerRef} className="sticky top-0 z-50">
        <MarketingHeader
          pathname="/"
          user={user}
          isGuest={!user}
          isNavScrolled={isNavScrolled}
          onBrandClick={handleHomeBrandClick}
          onSectionLinkClick={handleSectionLinkClick}
          onSwitchRole={onSwitchRole}
          onLogout={onLogout}
          onRequireAuth={openAuth}
          onHelp={() => scrollToHashSection("#faq", true)}
          onMessagesClick={() => navigateTo("/app/messages")}
        />
      </div>

      <section ref={heroSectionRef} className="relative overflow-visible px-4 pt-0 pb-4 sm:px-6 sm:pb-6 xl:pb-0">
        <div className="pointer-events-none absolute inset-x-4 top-0 bottom-0 z-0 overflow-hidden rounded-[34px] sm:inset-x-6">
          <img
            src={heroImage}
            alt="Stockholm kontorsmarknad"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/62 via-white/34 to-white/18" />
        </div>

        <div className="relative z-20 w-full px-2 pt-4 sm:px-3 sm:pt-4 xl:px-0 xl:pt-0">
          <div className="relative min-h-[620px] xl:h-[620px]">
            <div className="flex h-full flex-col items-center justify-center text-center xl:min-h-[560px] xl:w-[58%] xl:max-w-none">
              <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/45 bg-[#fffffe]/22 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_rgba(15,25,48,0.12)] backdrop-blur-md">
                <BuildingIcon className="h-3.5 w-3.5" />
                {totalAvailableListings} lediga lokaler
              </p>
              <h2 className="mt-4 whitespace-nowrap text-[2.05rem] font-semibold leading-tight text-ink-900 sm:text-[2.45rem]">
                Hitta ert nästa kontor i Stockholm
              </h2>
              <p className="mt-3 max-w-[48ch] text-sm text-ink-700 sm:text-base">
                Vi matchar ert behov med rätt lokaler från verifierade fastighetsägare i Stockholm
              </p>

              <form className="mt-7 w-full max-w-[25rem] sm:max-w-[26rem] md:max-w-[28rem]" onSubmit={submitHeroSearch}>
                <div className="grid w-full grid-cols-[140px_1fr_44px] items-stretch rounded-full border border-black/10 bg-[#fffffe] p-1 sm:grid-cols-[152px_1fr_44px]">
                  <label className="flex min-w-0 items-center border-r border-black/10 px-3">
                    <input
                      type="number"
                      min="1"
                      value={heroFilters.teamSize}
                      onChange={(event) => setHeroFilters((prev) => ({ ...prev, teamSize: event.target.value }))}
                      className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
                      placeholder="Antal platser"
                    />
                    <span className="ml-2 text-sm font-medium text-ink-700">st</span>
                  </label>

                  <label className="min-w-0 px-3">
                    <select
                      value={heroFilters.district}
                      onChange={(event) => setHeroFilters((prev) => ({ ...prev, district: event.target.value }))}
                      className="select-chevron h-full w-full min-w-0 bg-transparent text-[13px] text-ink-900 focus:outline-none sm:text-sm"
                      style={{ paddingRight: "28px", backgroundPosition: "right 0.5rem center" }}
                    >
                      <option value="Alla" className="text-black">Alla områden i Stockholm</option>
                      {districtOptions.map((district) => (
                        <option key={district} value={district} className="text-black">
                          {district}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="submit"
                    aria-label="Sök lokaler"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] text-white hover:bg-[#16233f]"
                  >
                    <SearchIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>

              <div className="mt-7 flex flex-col items-center">
                <p className="text-[1rem] font-semibold text-[#0f1930]">
                  TrustScore: {trustScore.toFixed(1)} <span className="ml-4 font-medium">{trustReviews}+ Reviews</span>
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const fill = Math.max(0, Math.min(1, trustScore - index));
                    return (
                      <span key={`trust-star-${index}`} className="relative inline-flex h-4 w-4">
                        <StarIcon className="h-4 w-4 fill-current text-[#0f1930]/20" />
                        <span
                          className="absolute inset-y-0 left-0 overflow-hidden"
                          style={{ width: `${fill * 100}%` }}
                        >
                          <StarIcon className="h-4 w-4 fill-current text-[#0f1930]" />
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-8 h-[340px] w-full px-2 sm:h-[380px] sm:px-3 lg:h-[430px] lg:px-4 xl:absolute xl:top-6 xl:right-6 xl:bottom-6 xl:mt-0 xl:flex xl:h-auto xl:w-[42%] xl:px-0 xl:items-stretch">
              <HeroMapWidget
                className="h-full w-full"
                large
                shortlistedIds={favoriteIds}
                onToggleShortlist={handleTogglePopularShortlist}
                requireAuthForShortlist={() => openAuth("login", "renter")}
              />
            </div>
          </div>

        </div>
      </section>

      <section id="lokaler-just-nu" className="relative z-10 mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lokaler just nu</p>
            <h2 className="mt-2 text-3xl font-semibold">Populäraste lediga lokaler</h2>
          </div>
          <button
            type="button"
            className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-black"
            onClick={() => navigateTo("/app/rent?view=available")}
          >
            Se alla lediga lokaler
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6">
          {popularGroups.map((group) => (
            <article key={group.city}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-semibold text-[#0f1930]">{group.city}</h3>
                <p className="rounded-full border border-black/10 bg-[#fffffe] px-3 py-1 text-xs font-semibold text-ink-600">
                  {group.count} lediga lokaler
                </p>
              </div>

              <div className="grid items-stretch gap-4 lg:grid-cols-3">
                {(() => {
                  const popularGridListings = group.listings.slice(1, 6);
                  const canonicalPopularMapListings = popularGridListings
                    .map((listing, listingIndex) => resolvePopularListing(listing, listingIndex + 1))
                    .filter(Boolean);

                  return (
                    <HeroMapWidget
                      compact
                      listings={canonicalPopularMapListings}
                      shortlistedIds={favoriteIds}
                      onToggleShortlist={handleTogglePopularShortlist}
                      requireAuthForShortlist={() => openAuth("login", "renter")}
                    />
                  );
                })()}
                {group.listings.slice(1, 6).map((listing, listingIndex) => {
                  const favoriteListingId = resolvePopularListingId(listing, listingIndex + 1);
                  const canonicalListing = resolvePopularListing(listing, listingIndex + 1);
                  const cardListing = canonicalListing
                    ? {
                        ...canonicalListing,
                        image: listing.image || canonicalListing.image
                      }
                    : listing;
                  return (
                    <ListingVisualCard
                      key={listing.id}
                      listing={cardListing}
                      shortlisted={favoriteIds.has(String(favoriteListingId))}
                      onOpenListing={openPopularListingDetail}
                      onBookViewing={handlePopularBookViewing}
                      onToggleShortlist={() => handleTogglePopularShortlist(favoriteListingId)}
                    />
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="sa-fungerar-det" className="relative overflow-hidden border-y border-black/10 bg-[#fffffe]">
        <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Så fungerar det</p>
            <h2 className="mt-2 text-3xl font-semibold">Tre steg till en snabbare uthyrningsprocess</h2>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div ref={processLeftRef} className="self-start space-y-4">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="rounded-2xl border border-black/10 bg-[#fffffe] p-5">
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0f1930] text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {index + 1}</p>
                        <p className="mt-1 text-xl font-semibold">{step.title}</p>
                        <p className="mt-1 text-sm text-ink-600">{step.body}</p>
                      </div>
                    </div>
                  </article>
                );
              })}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-xl border border-black/20 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-[#fffffe]"
                  onClick={() => navigateTo("/app/rent?view=available")}
                >
                  Jag vill hyra lokal
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[#0f1930] bg-[#0f1930] px-3 py-2 text-xs font-semibold text-white hover:bg-[#16233f]"
                  onClick={() => navigateTo("/app/publish")}
                >
                  Jag vill publicera lokal
                </button>
              </div>
            </div>

            <article ref={processCardRef} className="self-start flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#fffffe]">
              <img src={processImage} alt="Processöversikt" className="min-h-0 w-full flex-1 object-cover" />
              <div className="space-y-2 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Resultat</p>
                <p className="text-2xl font-semibold">Kortare väg från intresse till affär</p>
                <p className="text-sm text-ink-600">Samlad process ger snabbare beslut och bättre uppföljning för båda parter.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="priser" className="mx-auto w-full max-w-[86rem] scroll-mt-28 px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Priser</p>
            <h2 className="mt-2 text-3xl font-semibold">Bygg volym med Gratis, skala med synlighetslyft</h2>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            Lanseringsperiod: Gratis publicering aktiv
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-3xl border border-[#0f1930]/15 bg-gradient-to-br from-[#0f1930] via-[#132140] to-[#1b2f55] p-7 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Gratis</p>
            <p className="mt-2 text-5xl font-semibold">0 kr</p>
            <p className="mt-2 text-white/85">Obegränsad publicering och alla grundfunktioner under lanseringsperioden.</p>
            <ul className="mt-5 space-y-2 text-sm text-white/90">
              <li className="inline-flex items-center gap-2">
                <StarIcon className="h-4 w-4 text-white/75" />
                Publicera obegränsat antal annonser
              </li>
              <li className="inline-flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-white/75" />
                Matchning mot hyresgäster i sökflödet
              </li>
              <li className="inline-flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-white/75" />
                Intresseanmälningar och visningsförfrågningar i en vy
              </li>
            </ul>
          </article>

          <div className="grid gap-6">
            <article className="rounded-3xl border border-black/10 bg-[#fffffe] p-6">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <CoinsIcon className="h-3.5 w-3.5" />
                Synlighetslyft
              </p>
              <p className="mt-2 text-2xl font-semibold">Topplacering</p>
              <p className="mt-1 text-sm text-ink-600">Lyft utvalda annonser i listning och sökresultat för mer exponering.</p>
            </article>
            <article className="rounded-3xl border border-black/10 bg-[#fffffe] p-6">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <CoinsIcon className="h-3.5 w-3.5" />
                Synlighetslyft
              </p>
              <p className="mt-2 text-2xl font-semibold">Förnya annons</p>
              <p className="mt-1 text-sm text-ink-600">Pusha upp annonsen igen för ny synlighet när tempot sjunker.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-black/10 bg-[#fffffe]">
        <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold">Vanliga frågor</h2>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <article ref={faqCardRef} className="self-start flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-[#fffffe]">
              <img src={faqImage} alt="FAQ och support" className="min-h-0 w-full flex-1 object-cover" />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Kundservice</p>
                <p className="mt-1 text-2xl font-semibold">Tydliga svar för snabbare beslut</p>
                <p className="mt-1 text-sm text-ink-600">Vanliga frågor samlade för att du ska komma igång utan friktion.</p>
              </div>
            </article>

            <div ref={faqQuestionsRef} className="self-start space-y-5">
              {faqItems.map((item) => (
                <article key={item.q} className="rounded-2xl border border-black/10 bg-[#fffffe] p-5">
                  <p className="text-xl font-semibold">{item.q}</p>
                  <p className="mt-2 text-sm text-ink-600">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ViewingRequestModal
        listing={bookingListing}
        onClose={() => setBookingListing(null)}
        onSubmit={() => {
          setBookingListing(null);
          openAuth("login", "renter");
        }}
      />

      <button
        type="button"
        aria-label="Scrolla till toppen"
        className={`fixed bottom-6 right-6 z-30 inline-flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-full border border-black/20 bg-[#fffffe]/25 p-3 text-[#0f1930] shadow-[0_8px_24px_rgba(15,25,48,0.18)] backdrop-blur-md transition-all duration-250 ${
          showScrollToTopButton
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
            : "translate-y-2 scale-95 opacity-0 pointer-events-none"
        } hover:bg-[#fffffe]/35`}
        onClick={handleScrollToTop}
      >
        <ArrowUpIcon className="h-4 w-4" />
        <MouseScrollIcon className="h-4 w-4" />
      </button>

      <footer id="kontakt" className="scroll-mt-24 border-t border-black/10 bg-[#fffffe]">
        <div className="mx-auto w-full max-w-[86rem] px-4 py-10 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-[#fffffe] px-4 py-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-black/30 bg-[#fffffe] text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  LOGGA
                </span>
                <div>
                  <p className="text-sm font-semibold">Företagsnamn</p>
                  <p className="text-xs text-ink-600">Plats för företagslogga</p>
                </div>
              </div>
              <p className="max-w-sm text-sm text-ink-600">
                Lokalflöde Stockholm samlar hyresgäst och hyresvärd i ett gemensamt flöde för snabbare matchning, visningar och affärer.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-xl border border-black/20 bg-[#fffffe] px-3 py-2 text-xs font-semibold text-ink-700" onClick={() => navigateTo("/app/rent?view=available")}>
                  Jag vill hyra lokal
                </button>
                <button type="button" className="rounded-xl border border-[#0f1930] bg-[#0f1930] px-3 py-2 text-xs font-semibold text-white hover:bg-[#16233f]" onClick={() => navigateTo("/app/publish")}>
                  Jag vill publicera lokal
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Utforska</p>
              <div className="mt-3 grid gap-2">
                <a className="text-sm text-ink-600 hover:text-black" href="#sa-fungerar-det" onClick={(event) => handleSectionLinkClick(event, "#sa-fungerar-det")}>Så fungerar det</a>
                <a className="text-sm text-ink-600 hover:text-black" href="#priser" onClick={(event) => handleSectionLinkClick(event, "#priser")}>Priser</a>
                <a className="text-sm text-ink-600 hover:text-black" href="#faq" onClick={(event) => handleSectionLinkClick(event, "#faq")}>FAQ</a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Snabbnavigering</p>
              <div className="mt-3 grid gap-2">
                <a className="text-sm text-ink-600 hover:text-black" href="#" onClick={(event) => { event.preventDefault(); navigateTo("/app/rent"); }}>Hyr lokal</a>
                <a className="text-sm text-ink-600 hover:text-black" href="#" onClick={(event) => { event.preventDefault(); navigateTo("/app/publish"); }}>Publicera lokal</a>
                <a className="text-sm text-ink-600 hover:text-black" href="#" onClick={(event) => { event.preventDefault(); navigateTo("/app/my-listings"); }}>Dina objekt</a>
                <a className="text-sm text-ink-600 hover:text-black" href="#" onClick={(event) => { event.preventDefault(); navigateTo("/app/profile"); }}>Profil</a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Kundservice</p>
              <div className="mt-3 grid gap-2 text-sm text-ink-600">
                <p>support@foretag.se</p>
                <p>08-123 45 67</p>
                <p>Vardagar 08:00-17:00</p>
                <button type="button" className="text-left text-sm text-ink-600 hover:text-black" onClick={() => navigateTo("/forgot-password")}>
                  Glömt lösenord
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-xs text-ink-500">© {new Date().getFullYear()} Företagsnamn. Alla rättigheter förbehållna.</p>
            <div className="flex items-center gap-3 text-xs text-ink-500">
              <span>Integritet</span>
              <span>Villkor</span>
              <span>Cookie-inställningar</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
