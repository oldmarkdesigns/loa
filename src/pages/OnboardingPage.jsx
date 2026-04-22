import { useEffect, useMemo, useState } from "react";
import { navigateTo } from "../lib/router";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import infoPictogram from "../../Assets/Pictograms/info.png";
import {
  ArrowUpIcon,
  BalconyIcon,
  BikeIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  ClockIcon,
  CoinsIcon,
  DumbbellIcon,
  LightbulbIcon,
  LockerIcon,
  LoungeIcon,
  MapIcon,
  PenthouseIcon,
  PinIcon,
  RulerIcon,
  RooftopIcon,
  ShieldIcon,
  SnowflakeIcon,
  SparklesIcon,
  UserIcon,
  UtensilsIcon,
  WifiIcon
} from "../components/icons/UiIcons";

const RENTER_STEPS = ["program-core", "review"];
const PUBLISHER_STEPS = ["publisher-profile", "review"];
const COMPANY_ADMIN_STEPS = ["company-admin-profile"];

const districtOptions = ["Alla", "Norrmalm", "Södermalm", "Vasastan", "Östermalm", "Kungsholmen", "Solna", "Sundbyberg"];
const typeOptions = [
  "Kontor",
  "Coworking",
  "Kontorshotell",
  "Butik",
  "Butikslokal",
  "Lager",
  "Lagerlokal",
  "Showroom",
  "Ateljé",
  "Studio / ateljé",
  "Klinik",
  "Restaurang",
  "Produktionslokal",
  "Övrig lokal",
  "Verkstad",
  "Träningslokal / gym",
  "Utbildningslokal",
  "Livsmedelslokal",
  "Kontor / Lager",
  "Nyproduktion",
  "Vårdlokal",
  "Logistiklokal"
];
const contractOptions = ["Alla", "Kort (0-6 mån)", "Mellan (6-12 mån)", "Lång (12+ mån)"];
const publisherCompanyOptions = [
  "Familjebostäder",
  "Stadsholmen",
  "Stockholmshem",
  "Svenska Bostäder",
  "SKB",
  "Arbetarebostadsfonden",
  "Drottninghuset",
  "Bo Bra",
  "Derbo Förvaltning",
  "Franklin Fastigheter",
  "Godsfinkan Hammarby",
  "Hässelby Hem",
  "Liljeroth Fastigheter",
  "Liljeroth Fastighets AB",
  "Magnussons Fastigheter",
  "Pemox",
  "Primula",
  "Sigillet",
  "Genesta",
  "Hufvudstaden",
  "Slussgården",
  "Vasakronan",
  "Einar Mattsson",
  "Gyllenforsen Fastigheter",
  "Holmström Gruppen",
  "Malmegårds Fastigheter",
  "MOFAB",
  "Nordemo",
  "Olov Lindgren",
  "SM Fastigheter",
  "Stockholms Studentbostäder (SSSB)",
  "Micasa Fastigheter",
  "SHIS Bostäder",
  "Botkyrkabyggen",
  "Ekerö Bostäder",
  "Förvaltaren",
  "Haninge Bostäder",
  "Huge Bostäder",
  "Järfällahus",
  "Signalisten",
  "SigtunaHem",
  "Sollentunahem",
  "Telge Bostäder",
  "Tyresö Bostäder",
  "Upplands-Brohus",
  "Värmdöbostäder",
  "Väsbyhem",
  "Össebyhus",
  "HSB Arlanda",
  "HSB Stockholm",
  "Riksbyggen",
  "AB Flink & Partners",
  "AB Karby Backa Fastigheter",
  "Ankarbulten AB",
  "Aspholmen Fastigheter",
  "Backman",
  "Baldersro AB",
  "Bimery Fastigheter AB",
  "Björn Isberg",
  "Bladh Familjeinvest",
  "Blom & Co",
  "Bo i Väsby",
  "Boetten AB",
  "Bouwvei Vitnos AB",
  "Bovisalhuset i Södertälje AB",
  "Br A Fastigheter KB",
  "Bro Byggnads AB",
  "Bsf Förvaltning KB",
  "ByggVesta",
  "Byggvesta Bo Kajutan AB",
  "Capicon Fastighets AB",
  "Catalina Fastigheter",
  "CJ Hall & Co",
  "Claes Trollestad Förvaltning",
  "Colive",
  "Creantum Fastigheter AB",
  "Develop Fastigheter AB",
  "Ekhart Motor AB",
  "Eric F. Ericson",
  "Facasea AB",
  "Faccita Förvaltnings AB",
  "Fahlin Förvaltning",
  "Fanerkompaniets Fastighets AB",
  "Fastighets AB Blåtunga",
  "Fastighets AB Thojan",
  "Fastighets AB Varubalen",
  "Fastighetsaktiebolaget Kvasten 8",
  "Fastighetsaktiebolaget Poppeln",
  "Fastighetsaktiebolaget Sycorax",
  "Fastighetsförvaltnings AB Heimdall",
  "Flodin",
  "Framnäs Förvaltning i Lidingö/Stockholm",
  "Fransbo HB",
  "Frestahuset AB",
  "Fundamentia",
  "Förvaltningsaktiebolaget Kanalen",
  "Gastir Fastigheter",
  "GMS Sverige",
  "Graflunds",
  "Grannstalten AB",
  "Gunnar Bystedt",
  "Harry Berglund Förvaltning",
  "HEBA",
  "Heimstaden",
  "HMCA Investment",
  "Holmborn",
  "Ikano Bostad",
  "Inari AB",
  "Intor Holding",
  "Iverot",
  "J. Ringborg AB",
  "JCP Fastigheter KB",
  "John Mattson",
  "K2A",
  "Kaptensvillan KB",
  "Kommanditbolaget Bussningen",
  "Kopparhus",
  "Lindahl Görling",
  "Linfast AB",
  "Lunda Gård Förvaltnings AB",
  "Lunden Care And Tech HB",
  "Mandel Fastigheter",
  "Markarydsbostäder i Södertälje AB",
  "Marums Gård AB",
  "Midano AB",
  "Minifast",
  "Mor Jacob Förvaltning AB",
  "Månsbro Nr Fyra AB",
  "Möller & Partner",
  "Neidemans AB Fastigheter",
  "Ove & Christina Ahlström AB",
  "Parc De Chateau AB",
  "Per Hans Fastigheter AB",
  "Pertre AB",
  "Ramsmora Investment AB",
  "Råsunda Förstadsaktiebolag",
  "Sjödin Fastigheter",
  "Skäludden AB",
  "Skålpundet Fastigheter AB",
  "Slaghöken Fastighets AB",
  "Slättö Bostad",
  "Solnabostäder AB",
  "Stånghammaren AB",
  "Sveafastigheter",
  "Svensk Villaförsäljning AB",
  "Svenska Kulturhus",
  "Swedinside Group",
  "Tallquist Fastighets AB",
  "Togust Fastigheter i Vaxholm AB",
  "Torekälla Fastighets AB",
  "Tornet",
  "Tälleby Fastighet AB",
  "Utvecklingspedagogik Förvaltning Sverige",
  "Victoriahem",
  "Viggbyholms Gård Fastighets AB",
  "Vipra Tech",
  "Värmdö-Ösby Fastighets AB",
  "Wallfast",
  "Weimer Fastighets AB",
  "Wennerström",
  "Wermelns Fastighets AB",
  "Willhem",
  "Åx Fastigheter HB",
  "Telge Hovsjö",
  "Svenska Hus",
  "Fabege",
  "Fastighetsägarna Service Stockholm",
  "Humlegården",
  "Skandia Fastigheter",
  "Alecta Fastigheter",
  "AMF Fastigheter",
  "Atrium Ljungberg",
  "Märsta Centrum AB",
  "Lagerfastigheter Stockholm AB",
  "Areim",
  "Castellum",
  "Catena",
  "Corem",
  "Fastpartner",
  "Stendörren",
  "Armada Fastighets AB",
  "Värmdö Kommun Fastigheter",
  "Akelius",
  "Balder",
  "Botrygg",
  "Ekerö Mark & Fastighetsservice",
  "Erstaviken Fastigheter",
  "Företagssupport i Åkersberga AB",
  "Gotlands Country Club AB",
  "KF Fastigheter",
  "L E Lundberg",
  "Nordic Vicinity Group",
  "Podium Fastigheter",
  "Proventum",
  "Rescado Fastigheter AB",
  "Riflex",
  "Solporten Fastighets AB",
  "Stena Fastigheter",
  "Vallentuna Rickeby 1:40 KB (BFBER Sweden/Savills)",
  "Wallenstam",
  "Wåhlin Fastigheter",
  "Bonnier Fastigheter",
  "Fastighetsägarna Stockholm AB",
  "SBB",
  "Telge Företags Invest",
  "HGF Förvaltning i Åkersberga AB",
  "Manzang Fastighetsförvaltning AB",
  "Skellefteå Fastighetsförvaltning Komman",
  "Stuckteknik Fastighetsförvaltning AB",
  "Svealands Förvaltning AB",
  "Nykvarnsbostäder",
  "Roslagsbostäder",
  "Edsbro Hyresfastigheter AB",
  "Herräng i Norrtälje Fastighets AB",
  "Häveröhus AB",
  "KJ Förvaltning AB",
  "MälarBo",
  "Skebobruk Hyresfastigheter AB",
  "Tre Rospiggar AB",
  "Norrtälje Roslagsmark AB",
  "Millny Förvaltning AB",
];
const publisherPortfolioOptions = ["1-10 objekt", "11-50 objekt", "51-200 objekt", "200+ objekt"];
const companyAdminCompanyTypeOptions = ["Privat fastighetsbolag", "Kommunalt bostadsbolag", "Kommersiell förvaltare", "Bostadsutvecklare", "Blandad portfölj"];
const companyAdminPortfolioOptions = ["1-10 fastigheter", "11-50 fastigheter", "51-200 fastigheter", "200+ fastigheter"];
const transitOptions = ["Alla", "0-300 meter", "0-600 meter", "0-1000 meter", "0-1100 meter"];
const parkingOptions = ["Alla", "Ingen preferens", "Bilparkering", "Laddplats", "Garage"];
const layoutOptions = ["Alla", "Öppet landskap", "Mixat", "Cellkontor", "Flexibelt"];
const accessOptions = ["Alla", "Kontorstid", "Utökad access", "24/7"];
const amenityOptions = [
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
const sqmPerPersonByType = {
  Kontor: 12,
  Coworking: 8,
  "Kontorshotell": 10,
  Butik: 18,
  Lager: 25,
  Klinik: 22,
  Restaurang: 20
};

function listFromDelimitedValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAmenity(value) {
  return String(value || "").trim().toLowerCase();
}

function parseInitialTypes(rawTypes) {
  if (Array.isArray(rawTypes)) return rawTypes.filter(Boolean);
  if (typeof rawTypes === "string" && rawTypes.trim()) {
    return rawTypes.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

const inputWithUnitClass = "flex w-full items-center rounded-2xl border border-ink-200 bg-white px-3.5 text-[15px] text-ink-900 transition focus-within:border-brand-400";

function roundToNearestFive(value) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function buildRecommendedSizeRange(type, teamSize) {
  const people = Number(teamSize || 0);
  if (!Number.isFinite(people) || people <= 0) return null;
  const sqmPerPerson = sqmPerPersonByType[type] || 12;
  const base = people * sqmPerPerson;
  const min = roundToNearestFive(base * 0.9);
  const max = roundToNearestFive(base * 1.15);
  return { min, max, sqmPerPerson };
}

function parseDistrictSelection(rawDistrict) {
  const raw = String(rawDistrict || "").trim();
  if (!raw || raw.toLowerCase() === "alla") return ["Alla"];
  const values = raw.split(",").map((item) => item.trim()).filter(Boolean);
  return values.length > 0 ? values : ["Alla"];
}

function buildInviteCode(companyName = "") {
  const normalized = String(companyName || "")
    .trim()
    .toUpperCase()
    .replace(/AB$|AKTIEBOLAG$/g, "")
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12) || "BOLAG";
  return `${normalized}-2026-XK9`;
}

function OnboardingPage({ user, onComplete, pathname = "/onboarding" }) {
  const [primaryRole, setPrimaryRole] = useState(
    user?.role === "publisher" || user?.role === "company_admin" ? user.role : "renter"
  );
  const [account, setAccount] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || ""
  });
  const [renterProgram, setRenterProgram] = useState({
    district: user?.profile?.renterProgram?.district || user?.profile?.preferredAreas || "Alla",
    type: parseInitialTypes(user?.profile?.renterProgram?.type),
    teamSize: user?.profile?.renterProgram?.teamSize || "",
    minSize: user?.profile?.renterProgram?.minSize || "",
    maxSize: user?.profile?.renterProgram?.maxSize || "",
    minBudget: user?.profile?.renterProgram?.minBudget || "",
    maxBudget: user?.profile?.renterProgram?.maxBudget || "",
    maxBudgetPerSqm: user?.profile?.renterProgram?.maxBudgetPerSqm || "",
    moveInDate: user?.profile?.renterProgram?.moveInDate || "",
    moveWithinMonths: user?.profile?.renterProgram?.moveWithinMonths || "",
    contractFlex: user?.profile?.renterProgram?.contractFlex || "",
    transitDistance: user?.profile?.renterProgram?.transitDistance || "",
    accessHours: user?.profile?.renterProgram?.accessHours || "",
    parkingType: user?.profile?.renterProgram?.parkingType || "",
    layoutType: user?.profile?.renterProgram?.layoutType || "",
    includeOperatingCosts: Boolean(user?.profile?.renterProgram?.includeOperatingCosts),
    accessibilityAdapted: Boolean(user?.profile?.renterProgram?.accessibilityAdapted),
    ecoCertified: Boolean(user?.profile?.renterProgram?.ecoCertified),
    amenities: user?.profile?.renterProgram?.amenities || ""
  });
  const [publisherProfile, setPublisherProfile] = useState({
    propertyType: user?.profile?.propertyType || "",
    legalEntity: user?.profile?.legalEntity || "",
    contactRole: user?.profile?.contactRole || "",
    portfolioSize: user?.profile?.portfolioSize || "",
    fmiNumber: user?.profile?.fmiNumber || "",
    verificationMethod: user?.profile?.verificationMethod || "invite_code",
    inviteCode: user?.profile?.inviteCode || "",
    workEmailDomain: user?.profile?.workEmailDomain || "",
    termsEmployerAuthority: Boolean(user?.profile?.termsEmployerAuthority),
    termsPublishingRules: Boolean(user?.profile?.termsPublishingRules),
    termsSuspensionAware: Boolean(user?.profile?.termsSuspensionAware)
  });
  const [publisherFlowStep, setPublisherFlowStep] = useState(0);
  const [companyAdminProfile, setCompanyAdminProfile] = useState({
    legalEntity: user?.profile?.legalEntity || "",
    organizationNumber: user?.profile?.organizationNumber || "",
    companyType: user?.profile?.companyType || "",
    portfolioSize: user?.profile?.portfolioSize || "",
    logoUrl: user?.profile?.logoUrl || "",
    companyDescription: user?.profile?.companyDescription || "",
    websiteUrl: user?.profile?.websiteUrl || "",
    contactEmail: user?.profile?.contactEmail || user?.email || "",
    approvedEmailDomain: user?.profile?.approvedEmailDomain || "",
    inviteCode: user?.profile?.inviteCode || buildInviteCode(user?.profile?.legalEntity || ""),
    inviteEmail: "",
    inviteRole: user?.profile?.inviteRole || "Mäklare",
    invitedMembers: Array.isArray(user?.profile?.invitedMembers) ? user.profile.invitedMembers : [
      { name: "Anna Lindqvist", email: "anna.lindqvist@rikshem.se", status: "Väntar" },
      { name: "Erik Holm", email: "erik.holm@rikshem.se", status: "Väntar" }
    ],
    approvalFlow: user?.profile?.approvalFlow || "admin_approves_broker",
    listingModeration: user?.profile?.listingModeration || "broker_publishes_direct",
    termsAdminAuthority: Boolean(user?.profile?.termsAdminAuthority),
    termsPlatformRules: Boolean(user?.profile?.termsPlatformRules)
  });
  const [companyAdminFlowStep, setCompanyAdminFlowStep] = useState(0);
  const [companyAdminActivationComplete, setCompanyAdminActivationComplete] = useState(false);
  const [companyAdminInviteCodeCopied, setCompanyAdminInviteCodeCopied] = useState(false);
  const [publisherCompanyQuery, setPublisherCompanyQuery] = useState(user?.profile?.legalEntity || "");
  const [showPublisherCompanyMenu, setShowPublisherCompanyMenu] = useState(false);
  const [isPublisherCompanyEditing, setIsPublisherCompanyEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [showProgramInfoCard, setShowProgramInfoCard] = useState(true);
  const [showSizeRecommendationCard, setShowSizeRecommendationCard] = useState(true);
  const selectedProgramAmenities = useMemo(() => listFromDelimitedValue(renterProgram.amenities), [renterProgram.amenities]);
  const selectedProgramType = Array.isArray(renterProgram.type) && renterProgram.type.length ? renterProgram.type[0] : "Kontor";
  const recommendedSizeRange = useMemo(
    () => buildRecommendedSizeRange(selectedProgramType, renterProgram.teamSize),
    [selectedProgramType, renterProgram.teamSize]
  );

  const draftStorageKey = useMemo(() => `office_rental_onboarding_draft_${user?.id || "guest"}`, [user?.id]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.primaryRole) setPrimaryRole(draft.primaryRole);
      if (draft?.account) setAccount((previous) => ({ ...previous, ...draft.account }));
      if (draft?.renterProgram) setRenterProgram((previous) => ({ ...previous, ...draft.renterProgram }));
      if (draft?.publisherProfile) setPublisherProfile((previous) => ({ ...previous, ...draft.publisherProfile }));
      if (draft?.companyAdminProfile) setCompanyAdminProfile((previous) => ({ ...previous, ...draft.companyAdminProfile }));
    } catch (_error) {
      // ignore invalid local draft
    }
  }, [draftStorageKey]);

  useEffect(() => {
    const payload = {
      primaryRole,
      account,
      renterProgram,
      publisherProfile,
      companyAdminProfile
    };
    window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
  }, [draftStorageKey, primaryRole, account, renterProgram, publisherProfile, companyAdminProfile]);

  useEffect(() => {
    setShowSizeRecommendationCard(true);
  }, [selectedProgramType, renterProgram.teamSize]);

  useEffect(() => {
    setPublisherCompanyQuery(user?.profile?.legalEntity || "");
  }, [user?.profile?.legalEntity]);

  useEffect(() => {
    if (pathname === "/onboarding") {
      const firstStep = primaryRole === "publisher" ? "publisher-profile" : primaryRole === "company_admin" ? "company-admin-profile" : "program-core";
      navigateTo(`/onboarding/${firstStep}`, { replace: true });
    }
  }, [pathname, primaryRole]);

  const routeStep = useMemo(() => {
    const parts = String(pathname || "").split("/").filter(Boolean);
    return parts[1] || (primaryRole === "publisher" ? "publisher-profile" : primaryRole === "company_admin" ? "company-admin-profile" : "program-core");
  }, [pathname, primaryRole]);

  const activeSteps = primaryRole === "publisher" ? PUBLISHER_STEPS : primaryRole === "company_admin" ? COMPANY_ADMIN_STEPS : RENTER_STEPS;
  const stepIndex = Math.max(0, activeSteps.indexOf(routeStep));
  const currentStep = activeSteps[stepIndex] || activeSteps[0];

  useEffect(() => {
    if (!activeSteps.includes(routeStep)) {
      navigateTo(`/onboarding/${activeSteps[0]}`, { replace: true });
    }
  }, [routeStep, activeSteps]);

  function gotoStep(step) {
    navigateTo(`/onboarding/${step}`);
  }

  function goNext() {
    if (currentStep === "publisher-profile") {
      setPublisherFlowStep((current) => Math.min(2, current + 1));
      return;
    }
    if (currentStep === "company-admin-profile") {
      setCompanyAdminFlowStep((current) => Math.min(3, current + 1));
      return;
    }
    const nextIndex = Math.min(activeSteps.length - 1, stepIndex + 1);
    gotoStep(activeSteps[nextIndex]);
  }

  function goBack() {
    if (currentStep === "publisher-profile" && publisherFlowStep > 0) {
      setPublisherFlowStep((current) => Math.max(0, current - 1));
      return;
    }
    if (currentStep === "company-admin-profile" && companyAdminFlowStep > 0) {
      setCompanyAdminFlowStep((current) => Math.max(0, current - 1));
      return;
    }
    if (stepIndex === 0) {
      navigateTo(`/signup?step=details&role=${primaryRole}`);
      return;
    }
    const prevIndex = Math.max(0, stepIndex - 1);
    gotoStep(activeSteps[prevIndex]);
  }

  const publisherCompanySuggestions = useMemo(() => {
    const query = String(publisherCompanyQuery || "").trim().toLowerCase();
    if (!query) return publisherCompanyOptions;
    return publisherCompanyOptions.filter((company) => company.toLowerCase().includes(query));
  }, [publisherCompanyQuery]);

  function toggleProgramAmenity(amenityValue) {
    setRenterProgram((prev) => {
      const currentList = listFromDelimitedValue(prev.amenities);
      const normalizedTarget = normalizeAmenity(amenityValue);
      const hasAmenity = currentList.some((item) => normalizeAmenity(item) === normalizedTarget);
      const nextList = hasAmenity
        ? currentList.filter((item) => normalizeAmenity(item) !== normalizedTarget)
        : [...currentList, amenityValue];

      return {
        ...prev,
        amenities: nextList.join(", ")
      };
    });
  }

  function toggleProgramType(typeValue) {
    setRenterProgram((prev) => {
      const current = Array.isArray(prev.type) ? prev.type : [];
      const exists = current.includes(typeValue);
      return {
        ...prev,
        type: exists ? current.filter((item) => item !== typeValue) : [...current, typeValue]
      };
    });
  }

  function toggleProgramDistrict(districtValue) {
    setRenterProgram((prev) => {
      const current = parseDistrictSelection(prev.district);

      if (districtValue === "Alla") {
        return { ...prev, district: "Alla" };
      }

      const withoutAll = current.filter((item) => item !== "Alla");
      const exists = withoutAll.includes(districtValue);
      const next = exists
        ? withoutAll.filter((item) => item !== districtValue)
        : [...withoutAll, districtValue];

      return {
        ...prev,
        district: next.length ? next.join(", ") : "Alla"
      };
    });
  }

  async function finish() {
    setPending(true);
    setError("");

    try {
      const profilePayload =
        primaryRole === "renter"
          ? {
              renterProgram: {
                ...renterProgram,
                district: renterProgram.district || "Alla",
                type: renterProgram.type,
                teamSize: String(renterProgram.teamSize || "").trim(),
                minSize: String(renterProgram.minSize || "").trim(),
                maxSize: String(renterProgram.maxSize || "").trim(),
                minBudget: String(renterProgram.minBudget || "").trim(),
                maxBudget: String(renterProgram.maxBudget || "").trim(),
                maxBudgetPerSqm: String(renterProgram.maxBudgetPerSqm || "").trim(),
                moveInDate: renterProgram.moveInDate || "",
                moveWithinMonths: String(renterProgram.moveWithinMonths || "").trim(),
                contractFlex: renterProgram.contractFlex || "",
                transitDistance: renterProgram.transitDistance || "",
                accessHours: renterProgram.accessHours || "",
                parkingType: renterProgram.parkingType || "",
                layoutType: renterProgram.layoutType || "",
                amenities: renterProgram.amenities || ""
              },
              companySize: String(renterProgram.teamSize || "").trim(),
              budgetRange: `${renterProgram.minBudget || 0}-${renterProgram.maxBudget || ""}`,
              preferredAreas: renterProgram.district || "Alla",
              moveInTimeline: renterProgram.moveInDate || ""
            }
          : primaryRole === "company_admin"
            ? {
                ...companyAdminProfile,
                inviteEmail: "",
                inviteRole: "Mäklare"
              }
          : {
              ...publisherProfile
            };

      const nextUser = await onComplete({
        primaryRole,
        account,
        profile: profilePayload
      });

      window.localStorage.removeItem(draftStorageKey);
      if (primaryRole === "company_admin") {
        setCompanyAdminActivationComplete(true);
      } else {
        navigateTo("/app/profile");
      }
    } catch (submitError) {
      setError(submitError.message || "Kunde inte slutföra introduktionen.");
    } finally {
      setPending(false);
    }
  }

  const stepMeta = {
    "program-core": { title: "Lokalprogram", subtitle: "Grundkrav för vad ni söker." },
    "publisher-profile": { title: "Profil", subtitle: "Berätta mer om din publicering." },
    "company-admin-profile": { title: "Bolagsadmin", subtitle: "Ställ in bolag, profil och publicering." },
    review: { title: "Klar", subtitle: "Granska innan du slutför." }
  };

  const currentMeta = stepMeta[currentStep] || stepMeta["program-core"];
  const accountInitial = String(account.name || account.email || "A").trim().charAt(0).toUpperCase();
  const selectedType = Array.isArray(renterProgram.type) && renterProgram.type.length ? renterProgram.type[0] : "Alla typer";
  const sizeLabel = renterProgram.minSize || renterProgram.maxSize ? `${renterProgram.minSize || 0}-${renterProgram.maxSize || "∞"} kvm` : "-";
  const budgetLabel = renterProgram.maxBudget ? `Upp till ${Number(renterProgram.maxBudget || 0).toLocaleString("sv-SE")} kr` : "-";
  const preferenceLabel = [
    renterProgram.includeOperatingCosts ? "Driftkostnad" : null,
    renterProgram.accessibilityAdapted ? "Tillgänglighet" : null,
    renterProgram.ecoCertified ? "Miljöcertifierat" : null
  ].filter(Boolean).join(" · ") || "-";
  const reviewProgramStats = [
    { label: "Område", value: renterProgram.district || "Alla", Icon: PinIcon },
    { label: "Typ av lokal", value: selectedType, Icon: BuildingIcon },
    { label: "Platser", value: renterProgram.teamSize || "-", Icon: UserIcon },
    { label: "Yta", value: sizeLabel, Icon: RulerIcon },
    { label: "Budget", value: budgetLabel, Icon: CoinsIcon },
    { label: "Inflyttning", value: renterProgram.moveInDate || "-", Icon: CalendarIcon },
    { label: "Avtal", value: renterProgram.contractFlex || "Alla", Icon: ClockIcon },
    { label: "Kollektivtrafik", value: renterProgram.transitDistance || "Alla", Icon: MapIcon },
    { label: "Parkering", value: renterProgram.parkingType || "Alla", Icon: CarIcon },
    { label: "Preferenser", value: preferenceLabel, Icon: LightbulbIcon }
  ];
  const publisherStepDots = [0, 1, 2];
  const publisherVerificationMethodCards = [
    {
      key: "invite_code",
      title: "Inbjudningskod",
      description: "Ange koden du fått från din arbetsgivare",
      badge: "Rekommenderat",
      Icon: ShieldIcon
    },
    {
      key: "email_domain",
      title: "E-postdomän",
      description: "Verifiera via din jobbmejladress",
      Icon: BuildingIcon
    },
    {
      key: "manual_review",
      title: "Manuell granskning",
      description: "Vi granskar din ansökan inom 1-2 arbetsdagar",
      Icon: UserIcon
    }
  ];
  const canAdvancePublisherFlow =
    publisherFlowStep === 0
      ? Boolean(publisherProfile.propertyType && publisherProfile.legalEntity && publisherProfile.portfolioSize)
      : publisherFlowStep === 1
        ? Boolean(
          publisherProfile.verificationMethod === "invite_code"
            ? publisherProfile.inviteCode
            : publisherProfile.verificationMethod === "email_domain"
              ? publisherProfile.workEmailDomain
              : true
        )
        : Boolean(
          publisherProfile.termsEmployerAuthority &&
          publisherProfile.termsPublishingRules &&
          publisherProfile.termsSuspensionAware
        );
  const canAdvanceCompanyAdminFlow =
    companyAdminFlowStep === 0
      ? Boolean(companyAdminProfile.legalEntity && companyAdminProfile.organizationNumber && companyAdminProfile.companyType && companyAdminProfile.portfolioSize)
      : companyAdminFlowStep === 1
        ? Boolean(companyAdminProfile.companyDescription && companyAdminProfile.websiteUrl && companyAdminProfile.contactEmail)
        : companyAdminFlowStep === 2
          ? Boolean(companyAdminProfile.inviteCode)
          : Boolean(
            companyAdminProfile.approvalFlow &&
            companyAdminProfile.listingModeration &&
            companyAdminProfile.termsAdminAuthority &&
            companyAdminProfile.termsPlatformRules
          );
  const hasSelectedPublisherCompany = Boolean(
    publisherProfile.legalEntity &&
    publisherCompanyQuery &&
    publisherProfile.legalEntity === publisherCompanyQuery
  );
  const lockPublisherCompanyField = hasSelectedPublisherCompany && !isPublisherCompanyEditing;
  const companyAdminStepDots = [0, 1, 2, 3];

  return (
    <main className="grid min-h-screen content-start justify-items-center bg-white px-4 pb-8 pt-28">
      <AuthFlowNav />
      <div className="w-full max-w-[760px]">
        <section className="rounded-[30px] border border-black/10 bg-white px-6 py-7 sm:px-7 sm:py-8">
          {!(currentStep === "publisher-profile" || currentStep === "company-admin-profile") ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {stepIndex + 1} av {activeSteps.length}</p>
              <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-[#0f1930]">{currentMeta.title}</h1>
              <p className="mt-1 text-sm text-ink-600">{currentMeta.subtitle}</p>
            </>
          ) : null}

          <div className="mt-5 space-y-3">
            {currentStep === "program-core" ? (
              <div>
                <section className="space-y-8 pb-1">
                  {showProgramInfoCard ? (
                    <div className="relative rounded-2xl border border-[#0f1930]/15 bg-[#f8fafc] px-4 py-4 sm:px-5">
                      <button
                        type="button"
                        aria-label="Stäng information om lokalprogram"
                        className="absolute right-3 top-3 inline-flex min-h-0 min-w-0 h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white p-0 text-lg leading-none text-ink-700"
                        onClick={() => setShowProgramInfoCard(false)}
                      >
                        ×
                      </button>
                      <div className="pr-10">
                        <p className="text-[1.65rem] font-semibold leading-tight text-[#0f1930]">Hitta rätt lokal snabbare</p>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-600">Fyll i era behov så matchar vi lokaler med högre precision.</p>
                      <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                        <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0f1930]" />Ni får relevanta förslag baserat på era krav.</li>
                        <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0f1930]" />Matchningar prioriterar läge, storlek och budget.</li>
                        <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0f1930]" />Ni kan alltid ändra lokalprogrammet senare i Profil.</li>
                      </ul>
                      <div className="mt-4">
                        <button
                          type="button"
                          className="inline-flex min-h-0 items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700"
                          onClick={goNext}
                        >
                          Hoppa över lokalprogram
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <section>
                    <h3 className="text-[1.4rem] font-semibold text-[#0f1930]">Vad söker ni för lokaltyp?</h3>
                    <p className="mt-1 text-sm text-ink-600">Välj en eller flera typer som passar ert behov.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {typeOptions.map((type) => {
                        const active = Array.isArray(renterProgram.type) && renterProgram.type.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 !rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                              active ? "border-[#0f1930] bg-[#0f1930] text-white" : "border-black/15 bg-white text-ink-700 hover:bg-black/5"
                            }`}
                            onClick={() => toggleProgramType(type)}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="border-t border-black/10 pt-6">
                    <h3 className="text-[1.4rem] font-semibold text-[#0f1930]">Var söker ni lokal?</h3>
                    <p className="mt-1 text-sm text-ink-600">Välj område och använd snabba förslag.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {districtOptions.map((district) => {
                        const selectedDistricts = parseDistrictSelection(renterProgram.district);
                        const active = district === "Alla"
                          ? selectedDistricts.length === 1 && selectedDistricts[0] === "Alla"
                          : selectedDistricts.includes(district);
                        return (
                          <button
                            key={district}
                            type="button"
                            className={`inline-flex items-center !rounded-2xl border px-3 py-1.5 text-xs font-semibold transition ${
                              active ? "border-[#0f1930] bg-[#0f1930] text-white" : "border-black/10 bg-white text-ink-700 hover:bg-black/5"
                            }`}
                            onClick={() => toggleProgramDistrict(district)}
                          >
                            {district}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="border-t border-black/10 pt-6">
                    <h3 className="text-[1.4rem] font-semibold text-[#0f1930]">Hur stor lokal söker ni?</h3>
                    <p className="mt-1 text-sm text-ink-600">Ange storlek och antal arbetsplatser.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Antal platser</span>
                        <div className={inputWithUnitClass}>
                          <input
                            className="w-full bg-transparent py-2.5 outline-none"
                            type="number"
                            min="0"
                            value={renterProgram.teamSize}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, teamSize: event.target.value }))}
                            placeholder="T.ex. 12"
                          />
                          <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">st</span>
                        </div>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Min yta</span>
                        <div className={inputWithUnitClass}>
                          <input
                            className="w-full bg-transparent py-2.5 outline-none"
                            type="number"
                            min="0"
                            value={renterProgram.minSize}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, minSize: event.target.value }))}
                            placeholder="T.ex. 120"
                          />
                          <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kvm</span>
                        </div>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Max yta</span>
                        <div className={inputWithUnitClass}>
                          <input
                            className="w-full bg-transparent py-2.5 outline-none"
                            type="number"
                            min="0"
                            value={renterProgram.maxSize}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, maxSize: event.target.value }))}
                            placeholder="T.ex. 450"
                          />
                          <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kvm</span>
                        </div>
                      </label>
                    </div>
                    <div
                      className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
                        showSizeRecommendationCard ? "mt-3 opacity-100" : "mt-0 opacity-0"
                      }`}
                      style={{ gridTemplateRows: showSizeRecommendationCard ? "1fr" : "0fr" }}
                    >
                      <div className="min-h-0">
                        <div className="rounded-2xl border border-[#4f46e5]/35 bg-white px-3 py-2.5">
                          {recommendedSizeRange ? (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm text-ink-700">
                                Rekommenderad yta: {recommendedSizeRange.min}-{recommendedSizeRange.max} kvm
                                {" "}({recommendedSizeRange.sqmPerPerson} kvm/person).
                              </p>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 !rounded-2xl border border-[#4f46e5]/35 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-black/5"
                                onClick={() => {
                                  setRenterProgram((prev) => ({
                                    ...prev,
                                    minSize: String(recommendedSizeRange.min),
                                    maxSize: String(recommendedSizeRange.max)
                                  }));
                                  setShowSizeRecommendationCard(false);
                                }}
                              >
                                <SparklesIcon className="h-3.5 w-3.5 text-[#4f46e5]" />
                                Använd rekommenderad yta
                              </button>
                            </div>
                          ) : (
                            <p className="inline-flex min-h-[30px] items-center gap-1.5 text-sm leading-none text-ink-600">
                              <SparklesIcon className="h-3.5 w-3.5 text-[#4f46e5]" />
                              Ange antal platser för att få rekommenderad yta.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-black/10 pt-6">
                    <h3 className="text-[1.4rem] font-semibold text-[#0f1930]">Vad är er flyttstatus?</h3>
                    <p className="mt-1 text-sm text-ink-600">Inflyttning, avtalstid och budgetnivå.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Önskad inflyttning</span>
                        <input className="field" type="date" value={renterProgram.moveInDate} onChange={(event) => setRenterProgram((prev) => ({ ...prev, moveInDate: event.target.value }))} />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Beräknad flytt inom</span>
                        <div className={inputWithUnitClass}>
                          <input
                            className="w-full bg-transparent py-2.5 outline-none"
                            type="number"
                            min="0"
                            value={renterProgram.moveWithinMonths}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, moveWithinMonths: event.target.value }))}
                            placeholder="T.ex. 3"
                          />
                          <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">mån</span>
                        </div>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Avtalsflexibilitet</span>
                        <select className="field select-chevron" value={renterProgram.contractFlex || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, contractFlex: event.target.value === "Alla" ? "" : event.target.value }))}>
                          {contractOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Max budget / mån</span>
                        <div className={inputWithUnitClass}>
                          <input
                            className="w-full bg-transparent py-2.5 outline-none"
                            type="number"
                            min="0"
                            value={renterProgram.maxBudget}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, maxBudget: event.target.value }))}
                            placeholder="T.ex. 90000"
                          />
                          <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kr/mån</span>
                        </div>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Max budget / kvm</span>
                        <div className={inputWithUnitClass}>
                          <input
                            className="w-full bg-transparent py-2.5 outline-none"
                            type="number"
                            min="0"
                            value={renterProgram.maxBudgetPerSqm}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, maxBudgetPerSqm: event.target.value }))}
                            placeholder="T.ex. 2500"
                          />
                          <span className="ml-2 shrink-0 text-sm font-medium text-ink-700">kvm</span>
                        </div>
                      </label>
                      <div className="hidden sm:block" />
                    </div>
                  </section>

                  <section className="border-t border-black/10 pt-6">
                    <h3 className="text-[1.4rem] font-semibold text-[#0f1930]">Övriga krav och preferenser</h3>
                    <p className="mt-1 text-sm text-ink-600">Fyll i tillgänglighet, parkering, planlösning och bekvämligheter.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Kollektivtrafik</span>
                        <select className="field select-chevron" value={renterProgram.transitDistance || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, transitDistance: event.target.value === "Alla" ? "" : event.target.value }))}>
                          {transitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Tillgång</span>
                        <select className="field select-chevron" value={renterProgram.accessHours || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, accessHours: event.target.value === "Alla" ? "" : event.target.value }))}>
                          {accessOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Parkering</span>
                        <select className="field select-chevron" value={renterProgram.parkingType || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, parkingType: event.target.value === "Alla" ? "" : event.target.value }))}>
                          {parkingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Planlösning</span>
                        <select className="field select-chevron" value={renterProgram.layoutType || "Alla"} onChange={(event) => setRenterProgram((prev) => ({ ...prev, layoutType: event.target.value === "Alla" ? "" : event.target.value }))}>
                          {layoutOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Särskilda krav</p>
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                          <input
                            type="checkbox"
                            checked={Boolean(renterProgram.includeOperatingCosts)}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, includeOperatingCosts: event.target.checked }))}
                            className="h-4 w-4 rounded border-black/20"
                          />
                          Inkludera driftkostnader
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                          <input
                            type="checkbox"
                            checked={Boolean(renterProgram.accessibilityAdapted)}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, accessibilityAdapted: event.target.checked }))}
                            className="h-4 w-4 rounded border-black/20"
                          />
                          Tillgänglighetsanpassat
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                          <input
                            type="checkbox"
                            checked={Boolean(renterProgram.ecoCertified)}
                            onChange={(event) => setRenterProgram((prev) => ({ ...prev, ecoCertified: event.target.checked }))}
                            className="h-4 w-4 rounded border-black/20"
                          />
                          Miljöcertifierat
                        </label>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold text-ink-600">Bekvämligheter</p>
                      <div className="flex flex-wrap gap-2">
                      {amenityOptions.map((option) => {
                        const Icon = option.icon;
                        const active = selectedProgramAmenities.some((item) => normalizeAmenity(item) === normalizeAmenity(option.value));
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2.5 text-sm font-semibold transition ${
                              active ? "border-[#0f1930] bg-[#0f1930] text-white" : "border-black/10 bg-white text-ink-700 hover:bg-white"
                            }`}
                            onClick={() => toggleProgramAmenity(option.value)}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            {option.label}
                          </button>
                        );
                      })}
                      </div>
                    </div>
                  </section>
                </section>
              </div>
            ) : null}

            {currentStep === "publisher-profile" ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {publisherFlowStep + 1} av 3</p>
                  <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-[#0f1930]">
                    {publisherFlowStep === 0 ? "Profil" : publisherFlowStep === 1 ? "Verifiering" : "Villkor"}
                  </h1>
                  <p className="mt-1 text-sm text-ink-600">
                    {publisherFlowStep === 0
                      ? "Berätta mer om din publicering."
                      : publisherFlowStep === 1
                        ? "Vi behöver bekräfta att du arbetar på det valda bolaget."
                        : "Granska och godkänn innan du börjar publicera."}
                  </p>
                </div>

                {publisherFlowStep === 0 ? (
                  <div className="grid gap-4">
                    <div className="grid max-w-[75%] gap-1.5">
                      <span className="text-sm font-semibold text-ink-700">Fastighetsbolag</span>
                      <div className="relative">
                        <input
                          className={`field ${lockPublisherCompanyField ? "cursor-pointer text-transparent caret-transparent" : ""}`}
                          value={publisherCompanyQuery}
                          placeholder="Sök bland registrerade bolag"
                          readOnly={lockPublisherCompanyField}
                          onFocus={() => {
                            if (!lockPublisherCompanyField) {
                              setIsPublisherCompanyEditing(true);
                              setShowPublisherCompanyMenu(true);
                            }
                          }}
                          onClick={() => {
                            if (lockPublisherCompanyField) {
                              setIsPublisherCompanyEditing(true);
                              setShowPublisherCompanyMenu(true);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.target.value;
                            setIsPublisherCompanyEditing(true);
                            setPublisherCompanyQuery(value);
                            setPublisherProfile((prev) => ({ ...prev, legalEntity: value }));
                            setShowPublisherCompanyMenu(true);
                          }}
                          onBlur={() => {
                            setIsPublisherCompanyEditing(false);
                            window.setTimeout(() => setShowPublisherCompanyMenu(false), 120);
                          }}
                        />
                        {lockPublisherCompanyField ? (
                          <div className="absolute inset-y-0 left-4 flex items-center">
                            <button
                              type="button"
                              aria-label="Rensa valt fastighetsbolag"
                              className="inline-flex items-center gap-2 text-left"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setPublisherCompanyQuery("");
                                setPublisherProfile((prev) => ({ ...prev, legalEntity: "" }));
                                setIsPublisherCompanyEditing(true);
                                setShowPublisherCompanyMenu(true);
                              }}
                            >
                              <span className="text-[15px] font-medium text-ink-900">{publisherCompanyQuery}</span>
                              <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] p-0 text-[14px] font-medium leading-none text-[#8f949b] transition hover:bg-[#eceef1]">
                                ×
                              </span>
                            </button>
                          </div>
                        ) : null}
                        {showPublisherCompanyMenu && publisherCompanySuggestions.length ? (
                          <div className="absolute z-10 mt-2 max-h-[320px] w-full overflow-y-auto rounded-2xl border border-black/10 bg-white p-3 shadow-[0_16px_40px_rgba(15,25,48,0.12)]">
                            {publisherCompanySuggestions.map((company) => (
                              <button
                                key={company}
                                type="button"
                                className="menu-hover-row flex w-full items-center px-4 py-3 text-left text-sm font-semibold text-ink-700 transition hover:bg-black/5"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setPublisherCompanyQuery(company);
                                  setPublisherProfile((prev) => ({ ...prev, legalEntity: company }));
                                  setIsPublisherCompanyEditing(false);
                                  setShowPublisherCompanyMenu(false);
                                }}
                              >
                                {company}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <p className="text-sm text-ink-500">Hittar du inte ditt bolag? <button type="button" className="font-semibold text-[#0f1930] underline underline-offset-2">Kontakta oss</button> så lägger vi till det.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 md:items-start">
                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-ink-700">Typ av lokal</span>
                        <select
                          className="field select-chevron"
                          value={publisherProfile.propertyType}
                          onChange={(event) => setPublisherProfile((prev) => ({ ...prev, propertyType: event.target.value }))}
                        >
                          <option value="">Välj typ</option>
                          {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-ink-700">Portföljstorlek</span>
                        <select
                          className="field select-chevron"
                          value={publisherProfile.portfolioSize}
                          onChange={(event) => setPublisherProfile((prev) => ({ ...prev, portfolioSize: event.target.value }))}
                        >
                          <option value="">Antal objekt du hanterar</option>
                          {publisherPortfolioOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                ) : null}

                {publisherFlowStep === 1 ? (
                  <div className="space-y-5">
                    <div className="grid gap-1.5">
                      <span className="text-sm font-semibold text-ink-700">Fastighetsmäklarnummer (FMI)</span>
                      <input
                        className="field"
                        value={publisherProfile.fmiNumber}
                        onChange={(event) => setPublisherProfile((prev) => ({ ...prev, fmiNumber: event.target.value }))}
                        placeholder="t.ex. 20230456"
                      />
                      <p className="text-sm text-ink-500">Kontrolleras mot Fastighetsmäklarinspektionens register.</p>
                    </div>

                    <div className="border-t border-black/10 pt-5">
                      <p className="text-sm font-semibold text-ink-700">Hur vill du verifiera din anknytning till bolaget?</p>
                      <div className="mt-3 space-y-3">
                        {publisherVerificationMethodCards.map(({ key, title, description, badge, Icon }) => {
                          const active = publisherProfile.verificationMethod === key;
                          return (
                            <div
                              key={key}
                              className={`rounded-2xl border p-4 transition ${active ? "border-[#0f1930] bg-[#f8fafc]" : "border-black/10 bg-white"}`}
                            >
                              <button
                                type="button"
                                className="flex w-full items-start gap-3 text-left"
                                onClick={() => setPublisherProfile((prev) => ({ ...prev, verificationMethod: key }))}
                              >
                                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#0f1930] bg-white text-[#0f1930]" : "border-black/10 bg-white text-ink-700"}`}>
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="text-base font-semibold text-[#0f1930]">{title}</span>
                                    {badge ? <span className="rounded-full bg-[#dff4d8] px-2 py-0.5 text-[11px] font-semibold text-[#3f7f2d]">{badge}</span> : null}
                                  </span>
                                  <span className="mt-0.5 block text-sm text-ink-600">{description}</span>
                                </span>
                              </button>

                              {active && key === "invite_code" ? (
                                <input
                                  className="field mt-3"
                                  value={publisherProfile.inviteCode}
                                  onChange={(event) => setPublisherProfile((prev) => ({ ...prev, inviteCode: event.target.value }))}
                                  placeholder="t.ex. RIKSHEM-2024-XK9"
                                />
                              ) : null}

                              {active && key === "email_domain" ? (
                                <input
                                  className="field mt-3"
                                  value={publisherProfile.workEmailDomain}
                                  onChange={(event) => setPublisherProfile((prev) => ({ ...prev, workEmailDomain: event.target.value }))}
                                  placeholder="t.ex. @rikshem.se"
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {publisherFlowStep === 2 ? (
                  <div className="space-y-4 pt-1">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border-black/20"
                        checked={publisherProfile.termsEmployerAuthority}
                        onChange={(event) => setPublisherProfile((prev) => ({ ...prev, termsEmployerAuthority: event.target.checked }))}
                      />
                      <span className="text-[0.88rem] leading-snug text-ink-700">Jag intygar att jag är anställd på det valda fastighetsbolaget och har rätt att publicera annonser för bolagets räkning.</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border-black/20"
                        checked={publisherProfile.termsPublishingRules}
                        onChange={(event) => setPublisherProfile((prev) => ({ ...prev, termsPublishingRules: event.target.checked }))}
                      />
                      <span className="flex-1 text-[0.88rem] leading-snug text-ink-700">Jag har läst och godkänner plattformens <button type="button" className="font-semibold text-[#0f1930] underline underline-offset-2">publiceringsregler</button> och <button type="button" className="font-semibold text-[#0f1930] underline underline-offset-2">användarvillkor</button>.</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 shrink-0 rounded border-black/20"
                        checked={publisherProfile.termsSuspensionAware}
                        onChange={(event) => setPublisherProfile((prev) => ({ ...prev, termsSuspensionAware: event.target.checked }))}
                      />
                      <span className="text-[0.88rem] leading-snug text-ink-700">Jag förstår att mitt konto kan spärras av bolagsadmin eller plattformen om reglerna inte följs.</span>
                    </label>
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t border-black/10 pt-5">
                  <button
                    type="button"
                    className="inline-flex min-h-0 min-w-[132px] items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 disabled:opacity-50"
                    onClick={goBack}
                    disabled={pending}
                  >
                    Föregående
                  </button>

                  <div className="flex items-center gap-2">
                    {publisherStepDots.map((dot) => (
                      <span key={dot} className={`h-2.5 rounded-full transition-all ${dot === publisherFlowStep ? "w-7 bg-[#0f1930]" : "w-2.5 bg-black/15"}`} />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="inline-flex min-h-0 min-w-[132px] items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    onClick={publisherFlowStep === 2 ? () => gotoStep("review") : goNext}
                    disabled={pending || !canAdvancePublisherFlow}
                  >
                    Nästa
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep === "company-admin-profile" ? (
              <div className="space-y-6">
                {companyAdminActivationComplete ? (
                  <div className="space-y-6 py-6 text-center">
                    <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#2f6b16] text-white">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
                        <path d="M5.5 12.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-[2.2rem] font-semibold leading-tight text-[#0f1930]">
                        {companyAdminProfile.legalEntity || "Bolaget"} är aktivt
                      </h1>
                      <p className="mx-auto mt-3 max-w-[640px] text-[1.1rem] leading-relaxed text-ink-600">
                        Ert bolag är nu synligt på plattformen. Mäklare som fått inbjudan kan börja registrera sig.
                      </p>
                    </div>
                    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
                      <button
                        type="button"
                        className="btn-primary w-full py-3 text-base"
                        onClick={() => navigateTo("/app/my-listings")}
                      >
                        Gå till admin-panelen
                      </button>
                      <button
                        type="button"
                        className="btn-secondary w-full py-3 text-base"
                        onClick={() => navigateTo("/app/profile")}
                      >
                        Visa admin-panelen
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {companyAdminFlowStep + 1} av 4</p>
                      <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-[#0f1930]">
                        {companyAdminFlowStep === 0
                          ? "Bolagsprofil"
                          : companyAdminFlowStep === 1
                            ? "Profil och varumärke"
                            : companyAdminFlowStep === 2
                              ? "Bjud in mäklare"
                              : "Publiceringsinställningar"}
                      </h1>
                      <p className="mt-1 text-sm text-ink-600">
                        {companyAdminFlowStep === 0
                          ? "Grundläggande information om er organisation."
                          : companyAdminFlowStep === 1
                            ? "Hur ert bolag visas på plattformen."
                            : companyAdminFlowStep === 2
                              ? "Sätt upp hur era mäklare kommer in på plattformen."
                              : "Bestäm hur mäklare publicerar under ert bolag."}
                      </p>
                    </div>

                    {companyAdminFlowStep === 0 ? (
                      <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Organisationsnummer</span>
                            <input
                              className="field"
                              value={companyAdminProfile.organizationNumber}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, organizationNumber: event.target.value }))}
                              placeholder="556xxx-xxxx"
                            />
                          </label>

                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Bolagets namn</span>
                            <input
                              className="field"
                              value={companyAdminProfile.legalEntity}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({
                                ...prev,
                                legalEntity: event.target.value,
                                inviteCode: buildInviteCode(event.target.value)
                              }))}
                              placeholder="t.ex. Rikshem AB"
                            />
                          </label>
                        </div>

                        <p className="-mt-1 text-sm text-ink-500">Verifieras mot Bolagsverket för att bekräfta att bolaget existerar.</p>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Typ av fastighetsbolag</span>
                            <select
                              className="field select-chevron"
                              value={companyAdminProfile.companyType}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, companyType: event.target.value }))}
                            >
                              <option value="">Välj typ</option>
                              {companyAdminCompanyTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                          </label>

                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Antal fastigheter i portföljen</span>
                            <select
                              className="field select-chevron"
                              value={companyAdminProfile.portfolioSize}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, portfolioSize: event.target.value }))}
                            >
                              <option value="">Ungefärlig storlek</option>
                              {companyAdminPortfolioOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                          </label>
                        </div>
                      </div>
                    ) : null}

                    {companyAdminFlowStep === 1 ? (
                      <div className="grid gap-4">
                        <div className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Logotyp</span>
                          <label className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#fafafa] px-5 py-6 text-center transition hover:bg-black/5">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink-700">
                              <ArrowUpIcon className="h-4 w-4" />
                            </span>
                            <span className="mt-3 text-base font-semibold text-ink-700">Dra och släpp eller klicka för att ladda upp</span>
                            <span className="mt-1 text-sm text-ink-500">PNG eller SVG · max 2 MB · rekommenderat 400 × 400 px</span>
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              className="hidden"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setCompanyAdminProfile((prev) => ({ ...prev, logoUrl: String(reader.result || "") }));
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Bolagsbeskrivning</span>
                          <textarea
                            className="field min-h-28 resize-none py-3"
                            value={companyAdminProfile.companyDescription}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, companyDescription: event.target.value }))}
                            placeholder="Kort beskrivning av ert bolag och er verksamhet..."
                          />
                          <p className="text-sm text-ink-500">Visas på er bolagssida för hyresgäster och mäklare.</p>
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Webbplats</span>
                            <input
                              className="field"
                              value={companyAdminProfile.websiteUrl}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, websiteUrl: event.target.value }))}
                              placeholder="https://rikshem.se"
                            />
                          </label>

                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Kontakt-e-post (synlig på plattformen)</span>
                            <input
                              className="field"
                              type="email"
                              value={companyAdminProfile.contactEmail}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, contactEmail: event.target.value }))}
                              placeholder="kontakt@rikshem.se"
                            />
                          </label>
                        </div>
                      </div>
                    ) : null}

                    {companyAdminFlowStep === 2 ? (
                      <div className="space-y-5">
                        <div className="rounded-2xl border border-[#2563eb]/15 bg-[#eff6ff] px-4 py-3 text-sm leading-relaxed text-[#36568a]">
                          Mäklare kan gå med via inbjudningskod eller via er e-postdomän. Ni kan alltid bjuda in fler senare från er admin-panel.
                        </div>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Godkänd e-postdomän</span>
                          <input
                            className="field"
                            value={companyAdminProfile.approvedEmailDomain}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, approvedEmailDomain: event.target.value }))}
                            placeholder="@rikshem.se"
                          />
                          <p className="text-sm text-ink-500">Mäklare med matchande jobbmejl verifieras automatiskt utan kod.</p>
                        </label>

                        <div className="rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Inbjudningskod · giltig i 30 dagar</p>
                              <p className="mt-2 text-[1.35rem] font-semibold text-[#0f1930]">{companyAdminProfile.inviteCode}</p>
                              <p className="mt-1 text-sm text-ink-500">Dela med era mäklare via e-post eller internt system.</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                className="btn-secondary px-3 py-1.5 text-xs"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(companyAdminProfile.inviteCode);
                                    setCompanyAdminInviteCodeCopied(true);
                                    window.setTimeout(() => setCompanyAdminInviteCodeCopied(false), 1800);
                                  } catch (_error) {
                                    // no-op in fallback environments
                                  }
                                }}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  {companyAdminInviteCodeCopied ? (
                                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                                      <path d="M5.5 12.5l4 4 9-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  ) : (
                                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                                      <path d="M9 9.75A2.75 2.75 0 0 1 11.75 7h6.5A2.75 2.75 0 0 1 21 9.75v8.5A2.75 2.75 0 0 1 18.25 21h-6.5A2.75 2.75 0 0 1 9 18.25z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                                      <path d="M15 7V5.75A2.75 2.75 0 0 0 12.25 3h-6.5A2.75 2.75 0 0 0 3 5.75v8.5A2.75 2.75 0 0 0 5.75 17H9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                                    </svg>
                                  )}
                                  {companyAdminInviteCodeCopied ? "Kopierad" : "Kopiera"}
                                </span>
                              </button>
                              <button
                                type="button"
                                className="btn-secondary px-3 py-1.5 text-xs"
                                onClick={() => setCompanyAdminProfile((prev) => ({ ...prev, inviteCode: buildInviteCode(`${prev.legalEntity}-${Date.now()}`) }))}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <span aria-hidden="true" className="text-sm leading-none">+</span>
                                  Ny kod
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-black/10 pt-5">
                          <p className="text-sm font-semibold text-ink-700">Bjud in direkt via e-post</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
                            <input
                              className="field"
                              type="email"
                              value={companyAdminProfile.inviteEmail}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, inviteEmail: event.target.value }))}
                              placeholder="kollega@rikshem.se"
                            />
                            <button
                              type="button"
                              className="btn-primary inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold leading-none"
                              onClick={() => {
                                const email = String(companyAdminProfile.inviteEmail || "").trim();
                                if (!email) return;
                                const name = email.split("@")[0]
                                  .split(/[._-]/)
                                  .filter(Boolean)
                                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                                  .join(" ");
                                setCompanyAdminProfile((prev) => ({
                                  ...prev,
                                  inviteEmail: "",
                                  invitedMembers: [
                                    ...prev.invitedMembers,
                                    {
                                      name: name || "Ny mäklare",
                                      email,
                                      status: "Väntar"
                                    }
                                  ]
                                }));
                              }}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span aria-hidden="true" className="text-base leading-none">+</span>
                                Bjud in
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-black/10 pt-5">
                          <p className="text-sm font-semibold text-ink-700">Inbjudna (väntar på svar)</p>
                          <div className="mt-3 space-y-3">
                            {companyAdminProfile.invitedMembers.map((member) => {
                              const initials = String(member.name || member.email || "AA")
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase();
                              return (
                                <div key={`${member.email}-${member.name}`} className="flex items-center justify-between gap-3 border-b border-black/10 pb-3 last:border-b-0 last:pb-0">
                                  <div className="flex items-center gap-3">
                                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e6eefc] text-xs font-semibold text-[#2d4f83]">
                                      {initials}
                                    </span>
                                    <div>
                                      <p className="text-sm font-semibold text-ink-800">{member.name}</p>
                                      <p className="text-xs text-ink-500">{member.email}</p>
                                    </div>
                                  </div>
                                  <span className="inline-flex items-center rounded-full bg-[#f9edbe] px-2.5 py-1 text-[11px] font-semibold text-[#8a6b13]">
                                    {member.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {companyAdminFlowStep === 3 ? (
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-semibold text-ink-700">Godkännandeflöde för nya mäklare</p>
                          <div className="mt-3 space-y-3">
                            {[
                              {
                                key: "admin_approves_broker",
                                title: "Admin godkänner varje mäklare",
                                description: "Ni behåller full kontroll över vem som publicerar"
                              },
                              {
                                key: "auto_approve_domain",
                                title: "Automatgodkänn vid verifierad domän",
                                description: "Mäklare med rätt e-postdomän kommer in direkt"
                              }
                            ].map((option) => {
                              const active = companyAdminProfile.approvalFlow === option.key;
                              return (
                                <button
                                  key={option.key}
                                  type="button"
                                  className={`flex w-full items-center gap-3 !rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[#0f1930] bg-[#f8fafc]" : "border-black/10 bg-white hover:bg-black/5"}`}
                                  onClick={() => setCompanyAdminProfile((prev) => ({ ...prev, approvalFlow: option.key }))}
                                >
                                  <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#0f1930]" : "border-black/20"}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[#0f1930]" : "bg-transparent"}`} />
                                  </span>
                                  <span>
                                    <span className="block text-[0.92rem] font-semibold leading-tight text-[#0f1930]">{option.title}</span>
                                    <span className="mt-1 block text-[0.8rem] leading-snug text-ink-600">{option.description}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-ink-700">Annonsmoderering</p>
                          <div className="mt-3 space-y-3">
                            {[
                              {
                                key: "broker_publishes_direct",
                                title: "Mäklare publicerar direkt",
                                description: "Automatisk granskning flaggar avvikelser"
                              },
                              {
                                key: "admin_approves_listing",
                                title: "Admin godkänner varje annons",
                                description: "Mer kontroll, kräver aktiv admin-närvaro"
                              }
                            ].map((option) => {
                              const active = companyAdminProfile.listingModeration === option.key;
                              return (
                                <button
                                  key={option.key}
                                  type="button"
                                  className={`flex w-full items-center gap-3 !rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[#0f1930] bg-[#f8fafc]" : "border-black/10 bg-white hover:bg-black/5"}`}
                                  onClick={() => setCompanyAdminProfile((prev) => ({ ...prev, listingModeration: option.key }))}
                                >
                                  <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#0f1930]" : "border-black/20"}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[#0f1930]" : "bg-transparent"}`} />
                                  </span>
                                  <span>
                                    <span className="block text-[0.92rem] font-semibold leading-tight text-[#0f1930]">{option.title}</span>
                                    <span className="mt-1 block text-[0.8rem] leading-snug text-ink-600">{option.description}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="border-t border-black/10 pt-5">
                          <div className="space-y-4">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className="h-5 w-5 shrink-0 rounded border-black/20"
                                checked={companyAdminProfile.termsAdminAuthority}
                                onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, termsAdminAuthority: event.target.checked }))}
                              />
                              <span className="text-[0.88rem] leading-snug text-ink-700">Jag bekräftar att jag har rätt att representera bolaget på plattformen.</span>
                            </label>
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className="h-5 w-5 shrink-0 rounded border-black/20"
                                checked={companyAdminProfile.termsPlatformRules}
                                onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, termsPlatformRules: event.target.checked }))}
                              />
                              <span className="flex-1 text-[0.88rem] leading-snug text-ink-700">Jag har läst och godkänner <button type="button" className="font-semibold text-[#0f1930] underline underline-offset-2">användarvillkoren</button> och <button type="button" className="font-semibold text-[#0f1930] underline underline-offset-2">publiceringsreglerna</button>.</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between border-t border-black/10 pt-5">
                      <button
                        type="button"
                        className="inline-flex min-h-0 min-w-[132px] items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 disabled:opacity-50"
                        onClick={goBack}
                        disabled={pending}
                      >
                        Föregående
                      </button>

                      <div className="flex items-center gap-2">
                        {companyAdminStepDots.map((dot) => (
                          <span key={dot} className={`h-2.5 rounded-full transition-all ${dot === companyAdminFlowStep ? "w-7 bg-[#0f1930]" : "w-2.5 bg-black/15"}`} />
                        ))}
                      </div>

                      <button
                        type="button"
                        className="inline-flex min-h-0 min-w-[132px] items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        onClick={companyAdminFlowStep === 3 ? finish : goNext}
                        disabled={pending || !canAdvanceCompanyAdminFlow}
                      >
                        {companyAdminFlowStep === 3 ? (pending ? "Aktiverar..." : "Aktivera konto") : "Nästa"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {currentStep === "review" ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Personlig information</p>
                <div className="flex flex-wrap items-center gap-4 px-1 pb-4">
                  <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#0f1930] text-2xl font-semibold text-white">
                    {accountInitial || "A"}
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <p className="text-[1.35rem] font-semibold leading-tight text-[#0f1930]">{account.name || "Namn saknas"}</p>
                    <p className="mt-1 text-sm text-ink-600">{account.email || "-"}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{account.phone || "Telefon ej angivet"}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700">
                    {primaryRole === "publisher" ? "Hyresvärd" : primaryRole === "company_admin" ? "Bolagsadmin" : "Hyresgäst"}
                  </span>
                </div>
                <div className="my-0 border-t border-black/10" />

                {primaryRole === "renter" ? (
                  <div className="px-1 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lokalprogram</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {reviewProgramStats.map(({ label, value, Icon }) => (
                        <div key={label} className="flex items-start gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-ink-700">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
                            <p className="mt-0.5 text-[1rem] font-semibold text-ink-800">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedProgramAmenities.length ? (
                      <div className="mt-4 border-t border-black/10 pt-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Bekvämligheter</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProgramAmenities.map((amenity) => {
                            const amenityMatch = amenityOptions.find((option) => normalizeAmenity(option.value) === normalizeAmenity(amenity));
                            const Icon = amenityMatch?.icon || BuildingIcon;
                            return (
                              <span key={amenity} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700">
                                <Icon className="h-4 w-4" />
                                {amenity}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {primaryRole === "publisher" ? (
                  <div className="px-1 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Publiceringsprofil</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {[
                        { label: "Fastighetstyp", value: publisherProfile.propertyType || "-" },
                        { label: "Fastighetsbolag", value: publisherProfile.legalEntity || "-" },
                        { label: "Portföljstorlek", value: publisherProfile.portfolioSize || "-" },
                        { label: "Verifiering", value: publisherProfile.verificationMethod === "invite_code" ? "Inbjudningskod" : publisherProfile.verificationMethod === "email_domain" ? "E-postdomän" : "Manuell granskning" },
                        { label: "FMI", value: publisherProfile.fmiNumber || "Ej angivet" },
                        { label: "Godkända villkor", value: publisherProfile.termsEmployerAuthority && publisherProfile.termsPublishingRules && publisherProfile.termsSuspensionAware ? "Ja" : "Nej" }
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
                          <p className="mt-1 text-[1rem] font-semibold text-ink-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

              </div>
            ) : null}
          </div>

          {error ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

          <div className={`mt-6 flex items-center justify-between ${currentStep === "publisher-profile" || currentStep === "company-admin-profile" ? "hidden" : ""}`}>
            <button
              type="button"
              className="inline-flex min-h-0 items-center justify-center rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-semibold text-ink-700 disabled:opacity-50"
              onClick={goBack}
              disabled={pending}
            >
              Föregående
            </button>

            {currentStep === "review" ? (
              <button
                type="button"
                className="inline-flex min-h-0 items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white"
                onClick={finish}
                disabled={pending}
              >
                {pending ? "Sparar..." : "Gå till din profil"}
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex min-h-0 items-center justify-center rounded-full border border-[#0f1930] bg-[#0f1930] px-4 py-2 text-xs font-semibold text-white"
                onClick={goNext}
                disabled={pending}
              >
                Nästa
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default OnboardingPage;
