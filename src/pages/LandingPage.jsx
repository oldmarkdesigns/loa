import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo } from "../lib/router";
import MarketingNavLinks from "../components/layout/MarketingNavLinks";
import ListingVisualCard from "../components/app/ListingVisualCard";
import MapListingPreviewCard from "../components/app/MapListingPreviewCard";
import { popularListingFallbackKey } from "../lib/popularListingFallback";
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
import featureImageA from "../../Assets/Object Images/Inspiration.jpeg";
import featureImageB from "../../Assets/Object Images/_ (1).jpeg";
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
    body: "Starta som hyresgäst, annonsör eller båda roller i samma konto.",
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
    q: "Kan samma konto vara både hyresgäst och annonsör?",
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

function heroMarkerIcon(featured) {
  const fill = featured ? "%23d7c086" : "%230f1930";
  const stroke = featured ? "%23b08a2e" : "%23ffffff";
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path fill="${fill}" stroke="${stroke}" stroke-width="1.5" d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12c0 7.71 8.58 16.56 9.57 17.55a.97.97 0 0 0 1.36 0c.99-.99 9.57-9.84 9.57-17.55 0-5.66-4.59-10.25-10.25-10.25Z"/><circle cx="12" cy="12" r="4.1" fill="${featured ? "%23fff8e2" : "%23ffffff"}"/></svg>`
    )}`,
    scaledSize: new window.google.maps.Size(featured ? 24 : 20, featured ? 32 : 28),
    anchor: new window.google.maps.Point(featured ? 12 : 10, featured ? 32 : 28)
  };
}

function HeroMapWidget({ compact = false, expandOnHover = true, className = "", listings = null }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const markersRef = useRef([]);
  const boundsRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("loading");
  const [selectedListing, setSelectedListing] = useState(null);

  const featuredListings = useMemo(() => {
    if (Array.isArray(listings) && listings.length > 0) {
      return listings.slice(0, 8);
    }
    return [...baseListingDataset]
      .sort((left, right) => (right.verified - left.verified) || (right.score - left.score))
      .slice(0, 4);
  }, [listings]);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      if (!GOOGLE_MAPS_API_KEY || !mapContainerRef.current) {
        setMapStatus("fallback");
        return;
      }

      try {
        const maps = await loadHeroGoogleMaps(GOOGLE_MAPS_API_KEY);
        if (cancelled || !mapContainerRef.current) return;
        mapsRef.current = maps;

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapContainerRef.current, {
            center: { lat: 59.3293, lng: 18.0686 },
            zoom: 11,
            disableDefaultUI: false,
            clickableIcons: false,
            keyboardShortcuts: false,
            zoomControl: true,
            streetViewControl: compact,
            fullscreenControl: false,
            mapTypeControl: false,
            gestureHandling: "greedy",
            styles: undefined
          });
          mapRef.current.addListener("click", () => {
            setSelectedListing(null);
          });
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = featuredListings.map((listing) => {
          const marker = new maps.Marker({
            map: mapRef.current,
            position: heroMarkerGeoForListing(listing),
            title: listing.title
          });
          marker.addListener("click", () => {
            setSelectedListing(listing);
          });
          return marker;
        });

        const bounds = new maps.LatLngBounds();
        featuredListings.forEach((listing) => {
          bounds.extend(heroMarkerGeoForListing(listing));
        });
        boundsRef.current = bounds;

        window.requestAnimationFrame(() => {
          if (!mapRef.current || !mapsRef.current || cancelled) return;
          mapsRef.current.event.trigger(mapRef.current, "resize");
          mapRef.current.fitBounds(bounds, compact ? 40 : 54);
          mapsRef.current.event.addListenerOnce(mapRef.current, "idle", () => {
            if (!cancelled) {
              setMapStatus("ready");
            }
          });
        });
      } catch {
        if (!cancelled) {
          setMapStatus("fallback");
        }
      }
    }

    setupMap();

    return () => {
      cancelled = true;
    };
  }, [featuredListings]);

  useEffect(() => {
    if (!mapRef.current || !mapsRef.current || !boundsRef.current) return undefined;

    function handleWindowResize() {
      if (!mapRef.current || !mapsRef.current || !boundsRef.current) return;
      mapsRef.current.event.trigger(mapRef.current, "resize");
      mapRef.current.fitBounds(boundsRef.current, compact ? 40 : 54);
    }

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [compact]);

  const wrapperClassName = compact
    ? `group relative flex h-full w-full flex-col text-left ${className}`.trim()
    : `group relative flex w-full flex-col overflow-visible text-left ${className}`.trim();

  const mapShellClassName = compact
    ? "relative flex-1 overflow-hidden"
    : "relative mt-3 overflow-hidden";

  const mapViewportClassName = compact
    ? "relative h-full overflow-hidden bg-[#edf2f6]"
    : "relative h-[clamp(180px,calc(100vh-33rem),240px)] overflow-hidden rounded-[20px] bg-[#edf2f6]";

  return (
    <div className={`relative ${compact ? "h-full overflow-hidden" : "w-full overflow-visible"}`.trim()}>
      <div className={wrapperClassName}>
        <div
          className={
            compact
              ? "flex h-full min-h-[24.5rem] flex-col overflow-hidden rounded-[30px] border border-black/10 bg-white p-0"
              : "overflow-hidden rounded-[28px] border border-black/10 bg-white p-4"
          }
        >
          {!compact ? (
            <div>
              <span className="inline-flex h-8 items-center gap-1 rounded-full border border-[#0f1930]/8 bg-[#eef2f6] px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5c6778]">
                Utvalda objekt
              </span>
            </div>
          ) : null}

          <div className={mapShellClassName}>
          <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(238,242,246,0.3)_42%,_transparent_70%)] ${compact ? "" : ""}`} />
          <div className={mapViewportClassName}>
            <div ref={mapContainerRef} className="h-full w-full" />

            {mapStatus !== "ready" ? (
              <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.9),rgba(243,246,249,0.68))]">
                <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(15,25,48,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(15,25,48,0.06)_1px,transparent_1px)] [background-position:center_center] [background-size:36px_36px]" />
                <div className="absolute left-[18%] top-[10%] h-[2px] w-[55%] rotate-[18deg] rounded-full bg-[#bfd0de]" />
                <div className="absolute left-[15%] top-[44%] h-[2px] w-[68%] -rotate-[12deg] rounded-full bg-[#bfd0de]" />
                <div className="absolute left-[42%] top-[18%] h-[56%] w-[2px] rotate-[9deg] rounded-full bg-[#cddae5]" />
                <div className="absolute left-[60%] top-[22%] h-[48%] w-[2px] -rotate-[16deg] rounded-full bg-[#cddae5]" />
                {featuredListings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{
                      left: `${44 + (index % 2) * 14}%`,
                      top: `${28 + index * 14}%`,
                      backgroundColor: index < 2 ? "#d7c086" : "#0f1930",
                      borderColor: index < 2 ? "#b08a2e" : "#ffffff",
                      boxShadow: index < 2 ? "0 0 0 6px rgba(215,192,134,0.18)" : "0 0 0 6px rgba(15,25,48,0.08)"
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {selectedListing ? (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 sm:inset-x-4 sm:bottom-4">
              <div className="pointer-events-auto mx-auto w-full max-w-[320px]">
                <MapListingPreviewCard listing={selectedListing} onOpen={(listing) => navigateTo(`/app/listings/${encodeURIComponent(listing.id)}`)} />
              </div>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}

const guideCards = [
  {
    title: "Jämför olika lokaler",
    body: "Var förberedd när ni utvärderar alternativ och besöker objekt. Här är våra bästa tips inför valet av ny lokal.",
    image: "/object-images/object-9.jpeg"
  },
  {
    title: "Vilket läge behöver verksamheten?",
    body: "Vilka lägen är mest relevanta för din verksamhet? Vi listar fem viktiga faktorer innan ni skriver avtal.",
    image: "/object-images/object-10.jpeg"
  },
  {
    title: "Hyreskontraktet",
    body: "Nu är det dags att skriva kontrakt. Vad bör ni tänka på och när är det läge att ta extern hjälp?",
    image: "/object-images/object-6.jpeg"
  }
];

const heroAmenityOptions = [
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
      <span aria-hidden="true" className="h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,25,48,0.35)]" />
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

function LandingPage({ user, favorites = [], onToggleFavorite, onOpenAuthOverlay, onLogout, listings = [] }) {
  const headerRef = useRef(null);
  const heroSectionRef = useRef(null);
  const processLeftRef = useRef(null);
  const processCardRef = useRef(null);
  const faqQuestionsRef = useRef(null);
  const faqCardRef = useRef(null);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [showHeroScrollCue, setShowHeroScrollCue] = useState(true);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [heroFilters, setHeroFilters] = useState({
    district: "Alla",
    teamSize: ""
  });

  const openAuth = (mode, preferredRole = "renter") => {
    onOpenAuthOverlay?.(mode, preferredRole);
  };

  const userInitials = useMemo(() => {
    const source = String(user?.name || "").trim();
    if (!source) return "AA";
    const words = source.split(" ").filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
  }, [user?.name]);
  const activeRole = user?.role === "publisher" ? "publisher" : "renter";
  const rawRoles = Array.isArray(user?.roles) ? user.roles : [activeRole];
  const roleSet = new Set(rawRoles.filter((item) => item === "renter" || item === "publisher"));
  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((entry) => String(entry.listingId))),
    [favorites]
  );
  useEffect(() => {
    function onPointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

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
      setShowHeroScrollCue(window.scrollY <= 4);
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

  function scrollToPopularListings() {
    if (typeof document === "undefined") return;
    setShowHeroScrollCue(false);
    if (!heroSectionRef.current) return;
    const navHeight = headerRef.current?.getBoundingClientRect().height ?? 72;
    const heroBottom = heroSectionRef.current.getBoundingClientRect().bottom + window.scrollY;
    const top = heroBottom - navHeight;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
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
    <main className="min-h-screen bg-white text-black">
      <header
        ref={headerRef}
        className={`navbar-enter fixed inset-x-0 top-0 z-40 border-b will-change-[background-color,border-color,backdrop-filter] transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isNavScrolled ? "border-black/10 bg-white/95 backdrop-blur-md" : "border-black/0 bg-white/0 backdrop-blur-0"
        }`}
      >
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6">
          <button type="button" className="justify-self-start text-left" onClick={handleHomeBrandClick}>
            <span className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-2.5 py-1.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-black/30 bg-white text-[9px] font-semibold uppercase tracking-wide text-ink-500">
                LOGGA
              </span>
              <span className="text-sm font-semibold text-ink-800">Företagsnamn</span>
            </span>
          </button>

          <nav className="hidden items-center justify-self-center gap-5 lg:flex">
            <MarketingNavLinks
              onSectionLinkClick={handleSectionLinkClick}
              onPublish={() => navigateTo("/app/publish")}
            />
          </nav>

          <div className="flex items-center justify-self-end gap-2">
            {user ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/20 bg-white text-sm font-semibold text-ink-700"
                  onClick={() => setMenuOpen((value) => !value)}
                  aria-label="Öppna profilmeny"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  title="Profil"
                >
                  {userInitials}
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-2xl border border-black/10 bg-white p-3">
                    <div className="rounded-xl border border-black/10 bg-white px-3 py-2">
                      <p className="text-sm font-semibold text-black">{user?.name || "Användare"}</p>
                      <p className="text-xs text-ink-600">{user?.email || "-"}</p>
                      <p className="mt-1 text-xs text-ink-500">Roll: {user?.role === "publisher" ? "Annonsör" : "Hyresgäst"}</p>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm">
                      <button
                        type="button"
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-left font-semibold text-ink-700"
                        onClick={() => {
                          setMenuOpen(false);
                          navigateTo("/app/profile");
                        }}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <UserIcon className="h-4 w-4" />
                          Profil
                        </span>
                      </button>
                      {roleSet.has("publisher") ? (
                        <button
                          type="button"
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-left font-semibold text-ink-700"
                          onClick={() => {
                            setMenuOpen(false);
                            navigateTo("/app/my-listings");
                          }}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <BuildingIcon className="h-4 w-4" />
                            Dina objekt
                          </span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-left font-semibold text-ink-700"
                        onClick={async () => {
                          setMenuOpen(false);
                          await onLogout?.();
                          navigateTo("/", { replace: true });
                        }}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <HistoryIcon className="h-4 w-4" />
                          Logga ut
                        </span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-white"
                  onClick={() => navigateTo("/app/rent")}
                >
                  Logga in
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section ref={heroSectionRef} className="relative overflow-visible">
        <img
          src={heroImage}
          alt="Stockholm kontorsmarknad"
          className="h-[760px] w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-white/92 via-white/74 to-white/38" />
        <div className="absolute inset-0 z-20">
          <div className="mx-auto flex h-full w-full max-w-[86rem] items-start px-4 pt-20 pb-10 sm:px-6 sm:pt-24 sm:pb-10">
            <div className="mx-auto flex w-full max-w-[44rem] flex-col items-center text-center">
              <div>
                <h2 className="whitespace-nowrap text-[1.7rem] font-semibold text-ink-900 sm:text-[2.25rem]">Sök lokaler i hela Stockholm</h2>
                <p className="mt-1 text-sm text-ink-700 sm:text-base">Vi hjälper dig att hitta din nästa lokal i storstaden.</p>
              </div>

              <form className="mx-auto mt-6 w-full max-w-[30rem]" onSubmit={submitHeroSearch}>
                <div className="inline-flex w-full items-stretch rounded-2xl border border-black/10 bg-white p-1.5">
                  <label className="flex min-w-0 flex-[0.6] items-center border-r border-black/10 px-3">
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

                  <label className="min-w-0 flex-[1] px-3">
                    <select
                      value={heroFilters.district}
                      onChange={(event) => setHeroFilters((prev) => ({ ...prev, district: event.target.value }))}
                      className="select-chevron h-full w-full bg-transparent pr-9 text-sm text-ink-900 focus:outline-none"
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
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#0f1930] bg-[#0f1930] text-white hover:bg-[#16233f]"
                  >
                    <SearchIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>

              <div className="relative z-30 mt-8 mb-[-132px] flex w-full max-w-[40rem] flex-col items-center">
                <HeroMapWidget />

                <button
                  type="button"
                  aria-label="Utforska mer"
                  onClick={scrollToPopularListings}
                  className={`hero-scroll-cue mt-14 inline-flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-full border border-black/20 bg-white/75 p-3 text-[#0f1930] backdrop-blur-md transition-all duration-250 hover:bg-white/90 ${
                    showHeroScrollCue
                      ? "pointer-events-auto opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                >
                  <MouseScrollIcon className="h-4 w-4" />
                  <ArrowUpIcon className="hero-scroll-chevron h-4 w-4 rotate-180" />
                </button>
              </div>
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
                <p className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink-600">
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
                      expandOnHover={false}
                      listings={canonicalPopularMapListings}
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
                      onToggleShortlist={() => handleTogglePopularShortlist(favoriteListingId)}
                    />
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="funktioner" className="mx-auto w-full max-w-[86rem] scroll-mt-28 px-4 py-16 sm:px-6">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Funktioner</p>
          <h2 className="mt-2 text-3xl font-semibold">Allt som behövs för en fungerande lokalmarknadsplats</h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <article className="overflow-hidden rounded-3xl border border-black/10 bg-white">
            <div className="relative h-72">
              <img src={featureImageA} alt="Hyresgästfunktioner" className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                  <SearchIcon className="h-3.5 w-3.5" />
                  Hyresgäst
                </p>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <h3 className="text-3xl font-semibold">Sök, jämför och boka snabbare</h3>
              <p className="text-sm text-ink-600">
                Bygg en sökprofil med filter, AI och sparade objekt. Se relevanta objekt direkt i karta + kortvy och boka visning med få klick.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/10 p-2.5">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <span>AI-sök</span>
                    <SparklesIcon className="h-3.5 w-3.5" />
                  </p>
                  <p className="mt-1 text-sm text-ink-700">Förslag på objekt och smart filterjustering.</p>
                </div>
                <div className="rounded-2xl border border-black/10 p-2.5">
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <span>Sparade objekt</span>
                    <StarIcon className="h-3.5 w-3.5" />
                  </p>
                  <p className="mt-1 text-sm text-ink-700">Spara objekt till dina sparade objekt.</p>
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-6">
            <article className="overflow-hidden rounded-3xl border border-black/10 bg-white">
              <div className="relative h-44">
                <img src={featureImageB} alt="Annonsörsfunktioner" className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              </div>
              <div className="space-y-3 p-5">
                <p className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                  <BuildingIcon className="h-3.5 w-3.5" />
                  Annonsör
                </p>
                <h3 className="text-2xl font-semibold">Publicera med minimal friktion</h3>
                <p className="text-sm text-ink-600">
                  Stegvis publicering, tydlig intressevy och snabb uppföljning i samma arbetsyta.
                </p>
              </div>
            </article>

            <article className="rounded-3xl border border-black/10 bg-[#0f1930] p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Vad gör skillnad</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="inline-flex items-start gap-2">
                  <CalendarIcon className="mt-0.5 h-4 w-4 text-white/80" />
                  Visningsförfrågan och intressestatus synkade i realtid
                </li>
                <li className="inline-flex items-start gap-2">
                  <CoinsIcon className="mt-0.5 h-4 w-4 text-white/80" />
                  Gratis för volym, synlighetslyft för extra exponering
                </li>
                <li className="inline-flex items-start gap-2">
                  <UserIcon className="mt-0.5 h-4 w-4 text-white/80" />
                  Rollväxling mellan hyresgäst och annonsör
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="sa-fungerar-det" className="relative overflow-hidden border-y border-black/10 bg-white">
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
                  <article key={step.title} className="rounded-2xl border border-black/10 bg-white p-5">
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
                  className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-white"
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

            <article ref={processCardRef} className="self-start flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white">
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
            <article className="rounded-3xl border border-black/10 bg-white p-6">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                <CoinsIcon className="h-3.5 w-3.5" />
                Synlighetslyft
              </p>
              <p className="mt-2 text-2xl font-semibold">Topplacering</p>
              <p className="mt-1 text-sm text-ink-600">Lyft utvalda annonser i listning och sökresultat för mer exponering.</p>
            </article>
            <article className="rounded-3xl border border-black/10 bg-white p-6">
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

      <section className="relative my-4 overflow-hidden">
        <img src={heroImage} alt="Stockholm stadsvy" className="h-[430px] w-full object-cover sm:h-[500px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/72 to-white/28" />
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full w-full max-w-[86rem] items-start justify-center px-4 pt-14 text-center sm:px-6">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-semibold leading-tight text-[#12375a] sm:text-6xl">
                Över 55 000 unika besökare i veckan. Vill du annonsera här?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm text-[#12375a] sm:text-xl">
                Hos oss är det enkelt att till ett bra pris annonsera lokaler, fastigheter, företag eller mark.
                Vi erbjuder olika annonspaket beroende på dina behov.
              </p>
              <button
                type="button"
                className="mt-7 rounded-full border border-[#0f1930] bg-[#0f1930] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#16233f]"
                onClick={() => navigateTo("/app/publish")}
              >
                Läs mer
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Kunskapsbank</p>
            <h2 className="mt-2 text-3xl font-semibold">Guider och tips</h2>
          </div>
          <button type="button" className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-black">
            Se fler guider
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>

        <article className="grid overflow-hidden rounded-3xl border border-black/10 bg-white lg:grid-cols-[1fr_1fr]">
          <img src="/object-images/object-5.jpeg" alt="Guide: välja rätt lokal" className="h-64 w-full object-cover lg:h-full" />
          <div className="flex items-center p-6 sm:p-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Utvald guide</p>
              <h3 className="mt-2 text-3xl font-semibold text-[#0f1930]">Välja rätt lokal</h3>
              <p className="mt-3 text-sm text-ink-700 sm:text-base">
                För dig som letar lokal till ditt företag finns mycket att tänka på. Vilka regler gäller?
                Vilka krav ska ställas på nya lokaler? Här får du stöd inför nästa steg i verksamhetens utveckling.
              </p>
            </div>
          </div>
        </article>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {guideCards.map((guide) => (
            <article key={guide.title} className="overflow-hidden rounded-3xl border border-black/10 bg-white">
              <img src={guide.image} alt={guide.title} className="h-48 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-xl font-semibold leading-tight text-[#0f1930]">{guide.title}</h3>
                <p className="mt-2 text-sm text-ink-700">{guide.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="border-t border-black/10 bg-white">
        <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">FAQ</p>
            <h2 className="mt-2 text-3xl font-semibold">Vanliga frågor</h2>
          </div>

          <div className="grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <article ref={faqCardRef} className="self-start flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white">
              <img src={faqImage} alt="FAQ och support" className="min-h-0 w-full flex-1 object-cover" />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Kundservice</p>
                <p className="mt-1 text-2xl font-semibold">Tydliga svar för snabbare beslut</p>
                <p className="mt-1 text-sm text-ink-600">Vanliga frågor samlade för att du ska komma igång utan friktion.</p>
              </div>
            </article>

            <div ref={faqQuestionsRef} className="self-start space-y-5">
              {faqItems.map((item) => (
                <article key={item.q} className="rounded-2xl border border-black/10 bg-white p-5">
                  <p className="text-xl font-semibold">{item.q}</p>
                  <p className="mt-2 text-sm text-ink-600">{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        aria-label="Scrolla till toppen"
        className={`fixed bottom-6 right-6 z-30 inline-flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-full border border-black/20 bg-white/25 p-3 text-[#0f1930] shadow-[0_8px_24px_rgba(15,25,48,0.18)] backdrop-blur-md transition-all duration-250 ${
          showScrollToTopButton
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
            : "translate-y-2 scale-95 opacity-0 pointer-events-none"
        } hover:bg-white/35`}
        onClick={handleScrollToTop}
      >
        <ArrowUpIcon className="h-4 w-4" />
        <MouseScrollIcon className="h-4 w-4" />
      </button>

      <footer id="kontakt" className="scroll-mt-24 border-t border-black/10 bg-white">
        <div className="mx-auto w-full max-w-[86rem] px-4 py-10 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-black/30 bg-white text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  LOGGA
                </span>
                <div>
                  <p className="text-sm font-semibold">Företagsnamn</p>
                  <p className="text-xs text-ink-600">Plats för företagslogga</p>
                </div>
              </div>
              <p className="max-w-sm text-sm text-ink-600">
                Lokalflöde Stockholm samlar hyresgäst och annonsör i ett gemensamt flöde för snabbare matchning, visningar och affärer.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="rounded-xl border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-ink-700" onClick={() => navigateTo("/app/rent?view=available")}>
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
                <a className="text-sm text-ink-600 hover:text-black" href="#funktioner" onClick={(event) => handleSectionLinkClick(event, "#funktioner")}>Funktioner</a>
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
