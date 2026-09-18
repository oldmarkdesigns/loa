import { useEffect, useMemo, useState } from "react";
import { navigateTo, normalizeAppRole } from "../lib/router";
import AuthFlowNav from "../components/layout/AuthFlowNav";
import infoPictogram from "../../Assets/Pictograms/info.png";
import { propertyAmenityOptions } from "../lib/propertyAmenityIcons";
import {
  ArrowUpIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  ClockIcon,
  CoinsIcon,
  LightbulbIcon,
  MapIcon,
  PinIcon,
  RulerIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
} from "../components/icons/UiIcons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const RENTER_STEPS = ["program-core", "review"];
const BROKER_WITH_PROGRAM_STEPS = ["program-core", "publisher-profile", "review"];
const PUBLISHER_STEPS = ["publisher-profile", "review"];
const COMPANY_ADMIN_STEPS = ["company-admin-profile"];
const MAX_INLINE_LOGO_BYTES = 300_000;

function isOversizedDataUrl(value, maxBytes = MAX_INLINE_LOGO_BYTES) {
  return typeof value === "string" && value.startsWith("data:") && value.length > maxBytes;
}

function sanitizeCompanyAdminProfile(profile = {}) {
  return {
    ...profile,
    ...(isOversizedDataUrl(profile.logoUrl) ? { logoUrl: "" } : {})
  };
}

function normalizeOrganizationNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 10);
}

function formatOrganizationNumber(value) {
  const digits = normalizeOrganizationNumber(value);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function companyProfileFromLookup(company, fallbackOrganizationNumber) {
  if (!company) return {};
  return {
    companyId: company.id || "",
    companyName: company.name,
    legalEntity: company.name,
    organizationNumber: company.organizationNumber || fallbackOrganizationNumber,
    companyOrganizationNumber: company.organizationNumber || fallbackOrganizationNumber,
    companyProfileLocked: true,
    companyProfileSource: "registered_company",
    companyType: company.companyType || "",
    companyPhone: company.phone || "",
    streetAddress: company.streetAddress || "",
    postalCode: company.postalCode || "",
    city: company.city || "",
    parentCompany: company.parentCompany || "",
    websiteUrl: company.websiteUrl || ""
  };
}

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
  "Vasakronan Fastigheter AB",
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
const amenityOptions = propertyAmenityOptions;
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

const inputWithUnitClass = "flex w-full items-center rounded-2xl border border-ink-200 bg-[#ffffff] px-3.5 text-[15px] text-ink-900 transition focus-within:border-brand-400";

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

function OnboardingPage({ user, onComplete, onCheckCompanyByOrganizationNumber, onSwitchRole, onLogout, pathname = "/onboarding" }) {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const searchParams = new URLSearchParams(search);
  const requestedRole = searchParams.get("role");
  const requestedOnboardingFlow = searchParams.get("onboardingFlow");
  const hasExplicitRoleRequest = requestedRole === "broker" || requestedRole === "company_admin" || requestedRole === "renter";
  const profileRoleIntent = user?.profile?.signupRoleIntent || user?.profile?.requestedRole;
  const isBrokerWithProgramFlow = requestedOnboardingFlow === "broker-with-program";
  const isAddRoleIntent = searchParams.get("intent") === "add-role";
  const normalizedInitialRole = requestedRole === "broker" || requestedRole === "company_admin" || requestedRole === "renter"
    ? requestedRole
    : profileRoleIntent === "broker" || profileRoleIntent === "company_admin" || profileRoleIntent === "renter"
      ? profileRoleIntent
    : normalizeAppRole(user?.role);
  const [primaryRole, setPrimaryRole] = useState(
    normalizedInitialRole === "broker" || normalizedInitialRole === "company_admin" ? normalizedInitialRole : "renter"
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
    organizationNumber: user?.profile?.organizationNumber || user?.profile?.companyOrganizationNumber || "",
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
  const [brokerVerificationSubmitted, setBrokerVerificationSubmitted] = useState(false);
  const [companyAdminProfile, setCompanyAdminProfile] = useState({
    legalEntity: user?.profile?.legalEntity || "",
    organizationNumber: user?.profile?.organizationNumber || "",
    contactFirstName: user?.profile?.contactFirstName || user?.profile?.firstName || "",
    contactLastName: user?.profile?.contactLastName || user?.profile?.lastName || "",
    contactPhone: user?.profile?.contactPhone || user?.phone || "",
    streetAddress: user?.profile?.streetAddress || "",
    postalCode: user?.profile?.postalCode || "",
    city: user?.profile?.city || "",
    companyType: user?.profile?.companyType || "",
    portfolioSize: user?.profile?.portfolioSize || "",
    logoUrl: user?.profile?.logoUrl || "",
    companyDescription: user?.profile?.companyDescription || "",
    websiteUrl: user?.profile?.websiteUrl || "",
    contactEmail: user?.profile?.contactEmail || user?.email || "",
    hasSeparateBillingAddress: Boolean(user?.profile?.hasSeparateBillingAddress),
    wantsNewsletter: Boolean(user?.profile?.wantsNewsletter),
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
  const [resolvedCompanyProfile, setResolvedCompanyProfile] = useState(null);
  const [showPublisherCompanyMenu, setShowPublisherCompanyMenu] = useState(false);
  const [isPublisherCompanyEditing, setIsPublisherCompanyEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [logoUploadError, setLogoUploadError] = useState("");
  const [companySetupOfferOpen, setCompanySetupOfferOpen] = useState(false);
  const [pendingPostOnboardingRoute, setPendingPostOnboardingRoute] = useState(null);
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
      if (draft?.primaryRole && !hasExplicitRoleRequest && !profileRoleIntent) setPrimaryRole(draft.primaryRole);
      if (draft?.account) setAccount((previous) => ({ ...previous, ...draft.account }));
      if (draft?.renterProgram) setRenterProgram((previous) => ({ ...previous, ...draft.renterProgram }));
      if (draft?.publisherProfile) setPublisherProfile((previous) => ({ ...previous, ...draft.publisherProfile }));
      if (draft?.companyAdminProfile) {
        const nextCompanyAdminProfile = sanitizeCompanyAdminProfile(draft.companyAdminProfile);
        if (draft.companyAdminProfile.logoUrl && !nextCompanyAdminProfile.logoUrl) {
          setLogoUploadError("En tidigare uppladdad logotyp var för stor och har tagits bort. Ladda upp en bild under 300 KB.");
        }
        setCompanyAdminProfile((previous) => ({ ...previous, ...nextCompanyAdminProfile }));
      }
    } catch (_error) {
      // ignore invalid local draft
    }
  }, [draftStorageKey, hasExplicitRoleRequest, profileRoleIntent]);

  useEffect(() => {
    const payload = {
      primaryRole,
      account,
      renterProgram,
      publisherProfile,
      companyAdminProfile: sanitizeCompanyAdminProfile(companyAdminProfile)
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
    const organizationNumber = String(user?.profile?.organizationNumber || user?.profile?.companyOrganizationNumber || "").trim();
    if (!organizationNumber || user?.profile?.companyProfileLocked || !onCheckCompanyByOrganizationNumber) return undefined;
    if (primaryRole !== "broker" && primaryRole !== "company_admin") return undefined;

    let cancelled = false;
    onCheckCompanyByOrganizationNumber(organizationNumber, user?.id)
      .then((lookup) => {
        if (cancelled || !lookup?.exists || !lookup?.company) return;

        const companyProfile = {
          companyId: lookup.company.id || "",
          companyName: lookup.company.name,
          legalEntity: lookup.company.name,
          organizationNumber: lookup.company.organizationNumber || organizationNumber,
          companyOrganizationNumber: lookup.company.organizationNumber || organizationNumber,
          companyProfileLocked: true,
          companyProfileSource: "registered_company",
          companyType: lookup.company.companyType || "",
          companyPhone: lookup.company.phone || "",
          streetAddress: lookup.company.streetAddress || "",
          postalCode: lookup.company.postalCode || "",
          city: lookup.company.city || "",
          parentCompany: lookup.company.parentCompany || "",
          websiteUrl: lookup.company.websiteUrl || ""
        };

        setResolvedCompanyProfile(companyProfile);
        setPublisherCompanyQuery(companyProfile.legalEntity);
        setPublisherProfile((previous) => ({
          ...previous,
          legalEntity: companyProfile.legalEntity,
          organizationNumber: companyProfile.organizationNumber
        }));
        setCompanyAdminProfile((previous) => ({
          ...previous,
          legalEntity: companyProfile.legalEntity,
          organizationNumber: companyProfile.organizationNumber,
          companyType: companyProfile.companyType,
          streetAddress: companyProfile.streetAddress,
          postalCode: companyProfile.postalCode,
          city: companyProfile.city,
          websiteUrl: companyProfile.websiteUrl
        }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [
    onCheckCompanyByOrganizationNumber,
    primaryRole,
    user?.id,
    user?.profile?.companyOrganizationNumber,
    user?.profile?.companyProfileLocked,
    user?.profile?.organizationNumber
  ]);

  useEffect(() => {
    if (!user?.profile?.companyProfileLocked) return;

    setPublisherProfile((previous) => ({
      ...previous,
      legalEntity: user?.profile?.legalEntity || previous.legalEntity
    }));
    setCompanyAdminProfile((previous) => ({
      ...previous,
      legalEntity: user?.profile?.legalEntity || previous.legalEntity,
      organizationNumber: user?.profile?.organizationNumber || previous.organizationNumber,
      companyType: user?.profile?.companyType || previous.companyType,
      streetAddress: user?.profile?.streetAddress || previous.streetAddress,
      postalCode: user?.profile?.postalCode || previous.postalCode,
      city: user?.profile?.city || previous.city,
      websiteUrl: user?.profile?.websiteUrl || previous.websiteUrl
    }));
  }, [
    user?.profile?.city,
    user?.profile?.companyProfileLocked,
    user?.profile?.companyType,
    user?.profile?.legalEntity,
    user?.profile?.organizationNumber,
    user?.profile?.postalCode,
    user?.profile?.streetAddress,
    user?.profile?.websiteUrl
  ]);

  useEffect(() => {
    setCompanyAdminProfile((previous) => ({
      ...previous,
      contactFirstName: previous.contactFirstName || user?.profile?.contactFirstName || user?.profile?.firstName || account.name.split(" ")[0] || "",
      contactLastName: previous.contactLastName || user?.profile?.contactLastName || user?.profile?.lastName || account.name.split(" ").slice(1).join(" ") || "",
      contactPhone: previous.contactPhone || user?.profile?.contactPhone || account.phone || ""
    }));
  }, [account.name, account.phone, user?.profile?.contactFirstName, user?.profile?.contactLastName, user?.profile?.contactPhone, user?.profile?.firstName, user?.profile?.lastName]);

  useEffect(() => {
    if (pathname === "/onboarding") {
      const firstStep = primaryRole === "broker"
        ? isBrokerWithProgramFlow ? "program-core" : "publisher-profile"
        : primaryRole === "company_admin" ? "company-admin-profile" : "program-core";
      gotoStep(firstStep, { replace: true });
    }
  }, [isBrokerWithProgramFlow, pathname, primaryRole]);

  const routeStep = useMemo(() => {
    const parts = String(pathname || "").split("/").filter(Boolean);
    return parts[1] || (primaryRole === "broker"
      ? isBrokerWithProgramFlow ? "program-core" : "publisher-profile"
      : primaryRole === "company_admin" ? "company-admin-profile" : "program-core");
  }, [isBrokerWithProgramFlow, pathname, primaryRole]);

  const activeSteps = primaryRole === "broker"
    ? isBrokerWithProgramFlow ? BROKER_WITH_PROGRAM_STEPS : PUBLISHER_STEPS
    : primaryRole === "company_admin" ? COMPANY_ADMIN_STEPS : RENTER_STEPS;
  const stepIndex = Math.max(0, activeSteps.indexOf(routeStep));
  const currentStep = activeSteps[stepIndex] || activeSteps[0];

  useEffect(() => {
    if (!activeSteps.includes(routeStep)) {
      gotoStep(activeSteps[0], { replace: true });
    }
  }, [routeStep, activeSteps]);

  function onboardingStepUrl(step) {
    const base = `/onboarding/${step}`;
    const params = new URLSearchParams(searchParams);
    if (isAddRoleIntent) {
      params.set("intent", "add-role");
    } else {
      params.delete("intent");
    }
    params.set("role", primaryRole === "company_admin" ? "company_admin" : primaryRole === "broker" ? "broker" : "renter");
    if (primaryRole === "broker" && isBrokerWithProgramFlow) {
      params.set("onboardingFlow", "broker-with-program");
    } else {
      params.delete("onboardingFlow");
    }
    const nextQuery = params.toString();
    return nextQuery ? `${base}?${nextQuery}` : base;
  }

  function gotoStep(step, options = {}) {
    navigateTo(onboardingStepUrl(step), options);
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
      if (isAddRoleIntent) {
        navigateTo("/app/profile");
        return;
      }
      navigateTo("/signup?step=details");
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
      const brokerOrganizationNumber = formatOrganizationNumber(publisherProfile.organizationNumber);
      const currentResolvedBrokerCompanyProfile =
        normalizeOrganizationNumber(resolvedCompanyProfile?.organizationNumber || resolvedCompanyProfile?.companyOrganizationNumber) === normalizeOrganizationNumber(brokerOrganizationNumber)
          ? resolvedCompanyProfile
          : {};
      let brokerCompanyProfile = {};

      if (primaryRole === "broker") {
        if (normalizeOrganizationNumber(brokerOrganizationNumber).length !== 10) {
          setError("Ange ett giltigt organisationsnummer.");
          return;
        }
        if (!onCheckCompanyByOrganizationNumber) {
          setError("Kunde inte kontrollera organisationsnumret. Försök igen.");
          return;
        }
        const lookup = await onCheckCompanyByOrganizationNumber(brokerOrganizationNumber, user?.id);
        if (!lookup?.exists || !lookup?.company) {
          setPendingPostOnboardingRoute("/app/profile");
          setCompanySetupOfferOpen(true);
          return;
        }
        brokerCompanyProfile = companyProfileFromLookup(lookup.company, brokerOrganizationNumber);
        setResolvedCompanyProfile(brokerCompanyProfile);
        setPublisherProfile((previous) => ({
          ...previous,
          legalEntity: brokerCompanyProfile.legalEntity,
          organizationNumber: brokerCompanyProfile.organizationNumber
        }));
      }

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
                ...sanitizeCompanyAdminProfile(companyAdminProfile),
                ...(resolvedCompanyProfile || {}),
                inviteEmail: "",
                inviteRole: "Mäklare"
              }
          : {
              ...publisherProfile,
              ...(brokerOrganizationNumber ? { organizationNumber: brokerOrganizationNumber } : {}),
              verificationMethod: "company_admin_approval",
              ...(currentResolvedBrokerCompanyProfile || {}),
              ...brokerCompanyProfile,
              ...(isBrokerWithProgramFlow
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
                    }
                  }
                : {})
            };

      if (primaryRole === "company_admin" || primaryRole === "broker") {
        window.sessionStorage.setItem("office_onboarding_completion_screen", primaryRole);
      }

      const nextUser = await onComplete({
        primaryRole,
        account,
        profile: profilePayload
      });

      const organizationNumberToCheck = String(nextUser?.profile?.organizationNumber || companyAdminProfile.organizationNumber || "").trim();
      const shouldOfferCompanySetup =
        !isAddRoleIntent
        && primaryRole !== "company_admin"
        && Boolean(organizationNumberToCheck)
        && !userGrantedCompanyAdminAccess(nextUser)
        && !(nextUser?.profile?.requestedRole === "company_admin");

      if (shouldOfferCompanySetup && onCheckCompanyByOrganizationNumber) {
        const lookup = await onCheckCompanyByOrganizationNumber(organizationNumberToCheck, nextUser?.id);
        if (!lookup?.exists) {
          window.localStorage.removeItem(draftStorageKey);
          setPendingPostOnboardingRoute(primaryRole === "broker" ? "/app/broker" : "/app/profile");
          setCompanySetupOfferOpen(true);
          return;
        }
      }

      window.localStorage.removeItem(draftStorageKey);
      if (primaryRole === "company_admin") {
        window.sessionStorage.removeItem("office_onboarding_completion_screen");
        navigateTo("/app/admin");
      } else if (primaryRole === "broker") {
        setBrokerVerificationSubmitted(true);
        gotoStep("publisher-profile", { replace: true });
      } else {
        navigateTo("/app/profile");
      }
    } catch (submitError) {
      if (primaryRole === "company_admin" || primaryRole === "broker") {
        window.sessionStorage.removeItem("office_onboarding_completion_screen");
      }
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
      ? Boolean(publisherProfile.propertyType && normalizeOrganizationNumber(publisherProfile.organizationNumber).length === 10 && publisherProfile.portfolioSize)
      : publisherFlowStep === 1
        ? true
        : Boolean(
          publisherProfile.termsEmployerAuthority &&
          publisherProfile.termsPublishingRules &&
          publisherProfile.termsSuspensionAware
        );
  const canAdvanceCompanyAdminFlow =
    companyAdminFlowStep === 0
      ? Boolean(
        companyAdminProfile.legalEntity
        && companyAdminProfile.organizationNumber
        && companyAdminProfile.contactFirstName
        && companyAdminProfile.contactLastName
        && companyAdminProfile.contactPhone
        && companyAdminProfile.streetAddress
        && companyAdminProfile.postalCode
        && companyAdminProfile.city
        && companyAdminProfile.contactEmail
      )
      : companyAdminFlowStep === 1
        ? Boolean(companyAdminProfile.companyDescription && companyAdminProfile.termsPlatformRules)
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
  const companyProfileLocked = Boolean(user?.profile?.companyProfileLocked || resolvedCompanyProfile?.companyProfileLocked);
  const lockPublisherCompanyField = companyProfileLocked || (hasSelectedPublisherCompany && !isPublisherCompanyEditing);
  const companyAdminStepDots = [0, 1, 2, 3];

  function userGrantedCompanyAdminAccess(nextUser) {
    const roles = Array.isArray(nextUser?.roles) ? nextUser.roles : [nextUser?.role || "renter"];
    return roles.includes("company_admin");
  }

  function startCompanyProfileSetup() {
    setCompanySetupOfferOpen(false);
    navigateTo("/onboarding/company-admin-profile?role=company_admin&intent=add-role");
  }

  function skipCompanyProfileSetup() {
    setCompanySetupOfferOpen(false);
    navigateTo(pendingPostOnboardingRoute || "/app/profile");
  }

  const isBrokerVerificationStep = currentStep === "publisher-profile" && primaryRole === "broker";
  const hasPendingBrokerVerification =
    brokerVerificationSubmitted ||
    (isBrokerVerificationStep && user?.profile?.requestedRole === "broker" && user?.profile?.roleRequestStatus === "pending");
  const brokerVerificationCompanyName =
    resolvedCompanyProfile?.legalEntity ||
    publisherProfile.legalEntity ||
    user?.profile?.companyName ||
    user?.profile?.legalEntity ||
    "";
  const brokerVerificationOrganizationNumber =
    publisherProfile.organizationNumber ||
    user?.profile?.organizationNumber ||
    user?.profile?.companyOrganizationNumber ||
    "";

  return (
    <main className="grid min-h-screen content-start justify-items-center bg-[#ffffff] px-4 pb-8 pt-28">
      <AuthFlowNav user={user} onSwitchRole={onSwitchRole} onLogout={onLogout} />
      <div className="w-full max-w-[760px]">
        <section className="rounded-[30px] border border-black/10 bg-[#ffffff] px-6 py-7 sm:px-7 sm:py-8">
          {companySetupOfferOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0a0e]/50 px-4">
              <div className="w-full max-w-[560px] rounded-[28px] border border-black/10 bg-[#ffffff] p-6 shadow-[0_24px_60px_rgba(15,25,48,0.24)]">
                <h2 className="text-[1.6rem] font-semibold leading-tight text-[#0b0a0e]">Organisationsnumret finns inte på plattformen</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Vill du sätta upp en ny företagsprofil nu? Då öppnar vi bolagsadmin-onboardingen direkt.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto rounded-full px-5 py-3 text-sm font-semibold text-ink-800"
                    onClick={skipCompanyProfileSetup}
                  >
                    Inte nu
                  </Button>
                  <Button
                    type="button"
                    className="h-auto rounded-full px-5 py-3 text-sm font-semibold"
                    onClick={startCompanyProfileSetup}
                  >
                    Sätt upp företagsprofil
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {!(currentStep === "publisher-profile" || currentStep === "company-admin-profile") ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {stepIndex + 1} av {activeSteps.length}</p>
              <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-[#0b0a0e]">{currentMeta.title}</h1>
              <p className="mt-1 text-sm text-ink-600">{currentMeta.subtitle}</p>
            </>
          ) : null}

          <div className="mt-5 space-y-3">
            {currentStep === "program-core" ? (
              <div>
                <section className="space-y-8 pb-1">
                  {showProgramInfoCard ? (
                    <div className="relative rounded-2xl border border-[#0b0a0e]/15 bg-[#f8fafc] px-4 py-4 sm:px-5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Stäng information om lokalprogram"
                        className="absolute right-3 top-3 h-8 w-8 rounded-full text-lg leading-none text-ink-700"
                        onClick={() => setShowProgramInfoCard(false)}
                      >
                        ×
                      </Button>
                      <div className="pr-10">
                        <p className="text-[1.65rem] font-semibold leading-tight text-[#0b0a0e]">Hitta rätt lokal snabbare</p>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-600">Fyll i era behov så matchar vi lokaler med högre precision.</p>
                      <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                        <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0b0a0e]" />Ni får relevanta förslag baserat på era krav.</li>
                        <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0b0a0e]" />Matchningar prioriterar läge, storlek och budget.</li>
                        <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0b0a0e]" />Ni kan alltid ändra lokalprogrammet senare i Profil.</li>
                      </ul>
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto rounded-full px-4 py-2 text-xs font-semibold text-ink-700"
                          onClick={goNext}
                        >
                          Hoppa över lokalprogram
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <section>
                    <h3 className="text-[1.4rem] font-semibold text-[#0b0a0e]">Vad söker ni för lokaltyp?</h3>
                    <p className="mt-1 text-sm text-ink-600">Välj en eller flera typer som passar ert behov.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {typeOptions.map((type) => {
                        const active = Array.isArray(renterProgram.type) && renterProgram.type.includes(type);
                        return (
                          <Button
                            key={type}
                            type="button"
                            variant="outline"
                            className={`h-auto justify-center gap-2 !rounded-2xl px-3 py-3 text-sm font-semibold ${
                              active ? "border-[#0b0a0e] bg-[#0b0a0e] text-white hover:bg-[#0b0a0e] hover:text-white" : "border-black/15 text-ink-700 hover:bg-black/5"
                            }`}
                            onClick={() => toggleProgramType(type)}
                          >
                            {type}
                          </Button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="border-t border-black/10 pt-6">
                    <h3 className="text-[1.4rem] font-semibold text-[#0b0a0e]">Var söker ni lokal?</h3>
                    <p className="mt-1 text-sm text-ink-600">Välj område och använd snabba förslag.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {districtOptions.map((district) => {
                        const selectedDistricts = parseDistrictSelection(renterProgram.district);
                        const active = district === "Alla"
                          ? selectedDistricts.length === 1 && selectedDistricts[0] === "Alla"
                          : selectedDistricts.includes(district);
                        return (
                          <Button
                            key={district}
                            type="button"
                            variant="outline"
                            className={`h-auto !rounded-2xl px-3 py-1.5 text-xs font-semibold ${
                              active ? "border-[#0b0a0e] bg-[#0b0a0e] text-white hover:bg-[#0b0a0e] hover:text-white" : "border-black/10 text-ink-700 hover:bg-black/5"
                            }`}
                            onClick={() => toggleProgramDistrict(district)}
                          >
                            {district}
                          </Button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="border-t border-black/10 pt-6">
                    <h3 className="text-[1.4rem] font-semibold text-[#0b0a0e]">Hur stor lokal söker ni?</h3>
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
                        <div className="rounded-2xl border border-[#4f46e5]/35 bg-[#ffffff] px-3 py-2.5">
                          {recommendedSizeRange ? (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm text-ink-700">
                                Rekommenderad yta: {recommendedSizeRange.min}-{recommendedSizeRange.max} kvm
                                {" "}({recommendedSizeRange.sqmPerPerson} kvm/person).
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-auto gap-1.5 !rounded-2xl border-[#4f46e5]/35 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-black/5"
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
                              </Button>
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
                    <h3 className="text-[1.4rem] font-semibold text-[#0b0a0e]">Vad är er flyttstatus?</h3>
                    <p className="mt-1 text-sm text-ink-600">Inflyttning, avtalstid och budgetnivå.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Önskad inflyttning</span>
                        <Input type="date" value={renterProgram.moveInDate} onChange={(event) => setRenterProgram((prev) => ({ ...prev, moveInDate: event.target.value }))} />
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
                        <Select value={renterProgram.contractFlex || "Alla"} onValueChange={(value) => setRenterProgram((prev) => ({ ...prev, contractFlex: value === "Alla" ? "" : value }))}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {contractOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
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
                    <h3 className="text-[1.4rem] font-semibold text-[#0b0a0e]">Övriga krav och preferenser</h3>
                    <p className="mt-1 text-sm text-ink-600">Fyll i tillgänglighet, parkering, planlösning och bekvämligheter.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Kollektivtrafik</span>
                        <Select value={renterProgram.transitDistance || "Alla"} onValueChange={(value) => setRenterProgram((prev) => ({ ...prev, transitDistance: value === "Alla" ? "" : value }))}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {transitOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Tillgång</span>
                        <Select value={renterProgram.accessHours || "Alla"} onValueChange={(value) => setRenterProgram((prev) => ({ ...prev, accessHours: value === "Alla" ? "" : value }))}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {accessOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Parkering</span>
                        <Select value={renterProgram.parkingType || "Alla"} onValueChange={(value) => setRenterProgram((prev) => ({ ...prev, parkingType: value === "Alla" ? "" : value }))}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {parkingOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-ink-600">Planlösning</span>
                        <Select value={renterProgram.layoutType || "Alla"} onValueChange={(value) => setRenterProgram((prev) => ({ ...prev, layoutType: value === "Alla" ? "" : value }))}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {layoutOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>

                    <div className="mt-4 rounded-2xl border border-black/10 bg-[#ffffff] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Särskilda krav</p>
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                          <Checkbox
                            checked={Boolean(renterProgram.includeOperatingCosts)}
                            onCheckedChange={(checked) => setRenterProgram((prev) => ({ ...prev, includeOperatingCosts: Boolean(checked) }))}
                          />
                          Inkludera driftkostnader
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                          <Checkbox
                            checked={Boolean(renterProgram.accessibilityAdapted)}
                            onCheckedChange={(checked) => setRenterProgram((prev) => ({ ...prev, accessibilityAdapted: Boolean(checked) }))}
                          />
                          Tillgänglighetsanpassat
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                          <Checkbox
                            checked={Boolean(renterProgram.ecoCertified)}
                            onCheckedChange={(checked) => setRenterProgram((prev) => ({ ...prev, ecoCertified: Boolean(checked) }))}
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
                          <Button
                            key={option.value}
                            type="button"
                            variant="outline"
                            className={`h-auto shrink-0 gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-sm font-semibold ${
                              active ? "border-[#0b0a0e] bg-[#0b0a0e] text-white hover:bg-[#0b0a0e] hover:text-white" : "border-black/10 text-ink-700 hover:bg-[#ffffff]"
                            }`}
                            onClick={() => toggleProgramAmenity(option.value)}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            {option.label}
                          </Button>
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
                {hasPendingBrokerVerification ? (
                  <div className="space-y-6 py-6 text-center">
                    <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0b0a0e] text-white">
                      <ShieldIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <h1 className="text-[2.2rem] font-semibold leading-tight text-[#0b0a0e]">
                        Verifieringsförfrågan skickad
                      </h1>
                      <p className="mx-auto mt-3 max-w-[640px] text-[1.05rem] leading-relaxed text-ink-600">
                        Din förfrågan om att bli verifierad som mäklare har skickats till bolagsadmin för{" "}
                        <span className="font-semibold text-[#0b0a0e]">
                          {brokerVerificationCompanyName || "det angivna bolaget"}
                          {brokerVerificationOrganizationNumber ? ` (${brokerVerificationOrganizationNumber})` : ""}
                        </span>
                        .
                      </p>
                      <p className="mx-auto mt-2 max-w-[640px] text-sm leading-relaxed text-ink-600">
                        När bolagsadmin godkänner dig får du behörighet att arbeta som mäklare för bolaget. Du kan fortsätta använda plattformen som hyresgäst medan förfrågan väntar på godkännande.
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="h-auto rounded-full px-6 py-3 text-sm font-semibold"
                      onClick={() => {
                        window.sessionStorage.removeItem("office_onboarding_completion_screen");
                        navigateTo("/app/profile");
                      }}
                    >
                      Gå till profil
                    </Button>
                  </div>
                ) : (
                <>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {publisherFlowStep + 1} av 3</p>
                  <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-[#0b0a0e]">
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
                      <span className="text-sm font-semibold text-ink-700">Organisationsnummer</span>
                      <Input
                        inputMode="numeric"
                        value={publisherProfile.organizationNumber}
                        placeholder="556123-4567"
                        onChange={(event) => {
                          const formatted = formatOrganizationNumber(event.target.value);
                          setPublisherProfile((prev) => ({ ...prev, organizationNumber: formatted }));
                        }}
                      />
                      <p className="text-sm text-ink-500">Vi skickar din verifieringsförfrågan till bolagsadmin för företaget.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 md:items-start">
                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-ink-700">Typ av lokal</span>
                        <Select
                          value={publisherProfile.propertyType}
                          onValueChange={(value) => setPublisherProfile((prev) => ({ ...prev, propertyType: value }))}
                        >
                          <SelectTrigger className="w-full"><SelectValue placeholder="Välj typ" /></SelectTrigger>
                          <SelectContent>
                            {typeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-sm font-semibold text-ink-700">Portföljstorlek</span>
                        <Select
                          value={publisherProfile.portfolioSize}
                          onValueChange={(value) => setPublisherProfile((prev) => ({ ...prev, portfolioSize: value }))}
                        >
                          <SelectTrigger className="w-full"><SelectValue placeholder="Antal objekt du hanterar" /></SelectTrigger>
                          <SelectContent>
                            {publisherPortfolioOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>
                  </div>
                ) : null}

                {publisherFlowStep === 1 ? (
                  <div className="space-y-5">
                    <div className="grid gap-1.5">
                      <span className="text-sm font-semibold text-ink-700">Fastighetsmäklarnummer (FMI)</span>
                      <Input
                        value={publisherProfile.fmiNumber}
                        onChange={(event) => setPublisherProfile((prev) => ({ ...prev, fmiNumber: event.target.value }))}
                        placeholder="t.ex. 20230456"
                      />
                      <p className="text-sm text-ink-500">Kontrolleras mot Fastighetsmäklarinspektionens register.</p>
                    </div>

                    <div className="border-t border-black/10 pt-5">
                      <div className="rounded-2xl border border-[#0b0a0e]/15 bg-[#f8fafc] p-4">
                        <p className="text-sm font-semibold text-[#0b0a0e]">Verifiering via bolagsadmin</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-600">
                          När du skickar in förfrågan går den till admin-kontot för bolaget med organisationsnummer {publisherProfile.organizationNumber || "du angav"}. Du får mäklarbehörighet först när bolagsadmin godkänner dig.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {publisherFlowStep === 2 ? (
                  <div className="space-y-4 pt-1">
                    <label className="flex items-center gap-3">
                      <Checkbox
                        className="h-5 w-5 shrink-0"
                        checked={publisherProfile.termsEmployerAuthority}
                        onCheckedChange={(checked) => setPublisherProfile((prev) => ({ ...prev, termsEmployerAuthority: Boolean(checked) }))}
                      />
                      <span className="text-[0.88rem] leading-snug text-ink-700">Jag intygar att jag arbetar för bolaget jag angivit och att min förfrågan får skickas till bolagsadmin för godkännande.</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <Checkbox
                        className="h-5 w-5 shrink-0"
                        checked={publisherProfile.termsPublishingRules}
                        onCheckedChange={(checked) => setPublisherProfile((prev) => ({ ...prev, termsPublishingRules: Boolean(checked) }))}
                      />
                      <span className="flex-1 text-[0.88rem] leading-snug text-ink-700">Jag har läst och godkänner plattformens <Button type="button" variant="link" className="h-auto p-0 align-baseline font-semibold text-[#0b0a0e] underline underline-offset-2">publiceringsregler</Button> och <Button type="button" variant="link" className="h-auto p-0 align-baseline font-semibold text-[#0b0a0e] underline underline-offset-2">användarvillkor</Button>.</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <Checkbox
                        className="h-5 w-5 shrink-0"
                        checked={publisherProfile.termsSuspensionAware}
                        onCheckedChange={(checked) => setPublisherProfile((prev) => ({ ...prev, termsSuspensionAware: Boolean(checked) }))}
                      />
                      <span className="text-[0.88rem] leading-snug text-ink-700">Jag förstår att mitt konto kan spärras av bolagsadmin eller plattformen om reglerna inte följs.</span>
                    </label>
                  </div>
                ) : null}

                <div className="flex items-center justify-between border-t border-black/10 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-w-[132px] rounded-full px-4 py-2 text-xs font-semibold text-ink-700"
                    onClick={goBack}
                    disabled={pending}
                  >
                    Föregående
                  </Button>

                  <div className="flex items-center gap-2">
                    {publisherStepDots.map((dot) => (
                      <span key={dot} className={`h-2.5 rounded-full transition-all ${dot === publisherFlowStep ? "w-7 bg-[#0b0a0e]" : "w-2.5 bg-black/15"}`} />
                    ))}
                  </div>

                  <Button
                    type="button"
                    className="h-auto min-w-[132px] rounded-full px-4 py-2 text-xs font-semibold"
                    onClick={publisherFlowStep === 2 ? () => gotoStep("review") : goNext}
                    disabled={pending || !canAdvancePublisherFlow}
                  >
                    Nästa
                  </Button>
                </div>
                </>
                )}
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
                      <h1 className="text-[2.2rem] font-semibold leading-tight text-[#0b0a0e]">
                        {companyAdminProfile.legalEntity || "Bolaget"} är aktivt
                      </h1>
                      <p className="mx-auto mt-3 max-w-[640px] text-[1.1rem] leading-relaxed text-ink-600">
                        Ert bolag är nu synligt på plattformen. Mäklare som fått inbjudan kan börja registrera sig.
                      </p>
                    </div>
                    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
                      <Button
                        type="button"
                        className="h-auto w-full py-3 text-base"
                        onClick={() => {
                          window.sessionStorage.removeItem("office_onboarding_completion_screen");
                          navigateTo("/app/admin/profil");
                        }}
                      >
                        Slutför profil
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-auto w-full py-3 text-base"
                        onClick={() => {
                          window.sessionStorage.removeItem("office_onboarding_completion_screen");
                          navigateTo("/app/admin");
                        }}
                      >
                        Gå till admin-panelen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Steg {companyAdminFlowStep + 1} av 4</p>
                          <h1 className="mt-2 text-[1.95rem] font-semibold leading-tight text-[#0b0a0e]">
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
                        {companyAdminFlowStep === 2 ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-auto shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-[#f8fafc]"
                            onClick={() => setCompanyAdminFlowStep(3)}
                          >
                            Hoppa över nu
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {companyAdminFlowStep === 0 ? (
                      <div className="grid gap-4">
                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Företagsnamn</span>
                          <Input
                            className={companyProfileLocked ? "cursor-not-allowed bg-[#f3f4f6] text-ink-700" : ""}
                            value={companyAdminProfile.legalEntity}
                            readOnly={companyProfileLocked}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({
                              ...prev,
                              legalEntity: event.target.value,
                              inviteCode: buildInviteCode(event.target.value)
                            }))}
                            placeholder="t.ex. Rikshem AB"
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Organisations-/personnummer (10 siffror)</span>
                          <Input
                            className={companyProfileLocked ? "cursor-not-allowed bg-[#f3f4f6] text-ink-700" : ""}
                            value={companyAdminProfile.organizationNumber}
                            readOnly={companyProfileLocked}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, organizationNumber: event.target.value }))}
                            placeholder="556xxx-xxxx"
                          />
                        </label>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Kontaktperson förnamn</span>
                            <Input
                              value={companyAdminProfile.contactFirstName}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, contactFirstName: event.target.value }))}
                            />
                          </label>

                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Kontaktperson efternamn</span>
                            <Input
                              value={companyAdminProfile.contactLastName}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, contactLastName: event.target.value }))}
                            />
                          </label>
                        </div>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Telefonnummer</span>
                          <Input
                            value={companyAdminProfile.contactPhone}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, contactPhone: event.target.value }))}
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Gatuadress</span>
                          <Input
                            value={companyAdminProfile.streetAddress}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, streetAddress: event.target.value }))}
                          />
                        </label>

                        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Postnummer</span>
                            <Input
                              value={companyAdminProfile.postalCode}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, postalCode: event.target.value }))}
                            />
                          </label>

                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Postort</span>
                            <Input
                              value={companyAdminProfile.city}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, city: event.target.value }))}
                            />
                          </label>
                        </div>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">E-post</span>
                          <Input
                            type="email"
                            value={companyAdminProfile.contactEmail}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, contactEmail: event.target.value }))}
                            placeholder="kontakt@foretag.se"
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Webbplats</span>
                          <Input
                            value={companyAdminProfile.websiteUrl}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, websiteUrl: event.target.value }))}
                            placeholder="https://foretag.se"
                          />
                        </label>

                        <p className="-mt-1 text-sm text-ink-500">Verifieras mot Bolagsverket för att bekräfta att bolaget existerar.</p>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Typ av fastighetsbolag</span>
                            <Select
                              value={companyAdminProfile.companyType}
                              onValueChange={(value) => setCompanyAdminProfile((prev) => ({ ...prev, companyType: value }))}
                            >
                              <SelectTrigger className="w-full"><SelectValue placeholder="Välj typ" /></SelectTrigger>
                              <SelectContent>
                                {companyAdminCompanyTypeOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </label>

                          <label className="grid gap-1.5">
                            <span className="text-sm font-semibold text-ink-700">Antal fastigheter i portföljen</span>
                            <Select
                              value={companyAdminProfile.portfolioSize}
                              onValueChange={(value) => setCompanyAdminProfile((prev) => ({ ...prev, portfolioSize: value }))}
                            >
                              <SelectTrigger className="w-full"><SelectValue placeholder="Ungefärlig storlek" /></SelectTrigger>
                              <SelectContent>
                                {companyAdminPortfolioOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </label>
                        </div>
                      </div>
                    ) : null}

                    {companyAdminFlowStep === 1 ? (
                      <div className="grid gap-4">
                        <div className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Logotyp</span>
	                          <label className={`flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center transition hover:bg-black/5 ${
	                            logoUploadError ? "border-rose-300 bg-rose-50" : "border-black/15 bg-[#fafafa]"
	                          }`}>
	                            {companyAdminProfile.logoUrl ? (
	                              <img src={companyAdminProfile.logoUrl} alt="Uppladdad logotyp" className="max-h-20 max-w-[180px] object-contain" />
	                            ) : (
	                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-[#ffffff] text-ink-700">
	                                <ArrowUpIcon className="h-4 w-4" />
	                              </span>
	                            )}
	                            <span className="mt-3 text-base font-semibold text-ink-700">
	                              {companyAdminProfile.logoUrl ? "Logotyp uppladdad" : "Dra och släpp eller klicka för att ladda upp"}
	                            </span>
	                            <span className="mt-1 text-sm text-ink-500">PNG, SVG, JPEG eller WebP · max 300 KB · rekommenderat 400 × 400 px</span>
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              className="hidden"
	                              onChange={async (event) => {
	                                const file = event.target.files?.[0];
	                                if (!file) return;
	                                if (file.size > MAX_INLINE_LOGO_BYTES) {
	                                  setLogoUploadError("Bilden är för stor och sparades inte. Ladda upp en logotyp under 300 KB.");
	                                  setCompanyAdminProfile((prev) => ({ ...prev, logoUrl: "" }));
	                                  event.target.value = "";
	                                  return;
	                                }
	                                const reader = new FileReader();
	                                reader.onload = () => {
	                                  const result = String(reader.result || "");
	                                  if (isOversizedDataUrl(result)) {
	                                    setLogoUploadError("Bilden är för stor och sparades inte. Ladda upp en logotyp under 300 KB.");
	                                    setCompanyAdminProfile((prev) => ({ ...prev, logoUrl: "" }));
	                                    event.target.value = "";
	                                    return;
	                                  }
	                                  setLogoUploadError("");
	                                  setCompanyAdminProfile((prev) => ({ ...prev, logoUrl: result }));
	                                };
                                reader.readAsDataURL(file);
                              }}
	                            />
	                          </label>
	                          {logoUploadError ? (
	                            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
	                              {logoUploadError}
	                            </p>
	                          ) : null}
	                          {companyAdminProfile.logoUrl ? (
	                            <Button
	                              type="button"
	                              variant="link"
	                              className="h-auto justify-self-start p-0 text-sm font-semibold text-ink-700 underline decoration-black/20 underline-offset-4"
	                              onClick={() => {
	                                setLogoUploadError("");
	                                setCompanyAdminProfile((prev) => ({ ...prev, logoUrl: "" }));
	                              }}
	                            >
	                              Ta bort logotyp
	                            </Button>
	                          ) : null}
                        </div>

                        <label className="grid gap-1.5">
                          <span className="text-sm font-semibold text-ink-700">Bolagsbeskrivning</span>
                          <Textarea
                            className="min-h-28 resize-none"
                            value={companyAdminProfile.companyDescription}
                            onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, companyDescription: event.target.value }))}
                            placeholder="Kort beskrivning av ert bolag och er verksamhet..."
                          />
                          <p className="text-sm text-ink-500">Visas på er bolagssida för hyresgäster och mäklare.</p>
                        </label>

                        <div className="space-y-4 rounded-2xl border border-black/10 bg-[#f8fafc] p-4">
                          <label className="flex items-center gap-3">
                            <Checkbox
                              className="h-5 w-5 shrink-0"
                              checked={companyAdminProfile.hasSeparateBillingAddress}
                              onCheckedChange={(checked) => setCompanyAdminProfile((prev) => ({ ...prev, hasSeparateBillingAddress: Boolean(checked) }))}
                            />
                            <span className="text-[0.95rem] leading-snug text-ink-700">Annan fakturaadress</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <Checkbox
                              className="h-5 w-5 shrink-0"
                              checked={companyAdminProfile.wantsNewsletter}
                              onCheckedChange={(checked) => setCompanyAdminProfile((prev) => ({ ...prev, wantsNewsletter: Boolean(checked) }))}
                            />
                            <span className="text-[0.95rem] leading-snug text-ink-700">Jag vill ha nyhetsbrev</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <Checkbox
                              className="h-5 w-5 shrink-0"
                              checked={companyAdminProfile.termsPlatformRules}
                              onCheckedChange={(checked) => setCompanyAdminProfile((prev) => ({ ...prev, termsPlatformRules: Boolean(checked) }))}
                            />
                            <span className="text-[0.95rem] leading-snug text-ink-700">Jag godkänner personuppgiftspolicy och allmänna villkor.</span>
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
                          <Input
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
                              <p className="mt-2 text-[1.35rem] font-semibold text-[#0b0a0e]">{companyAdminProfile.inviteCode}</p>
                              <p className="mt-1 text-sm text-ink-500">Dela med era mäklare via e-post eller internt system.</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-auto px-3 py-1.5 text-xs"
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
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-auto px-3 py-1.5 text-xs"
                                onClick={() => setCompanyAdminProfile((prev) => ({ ...prev, inviteCode: buildInviteCode(`${prev.legalEntity}-${Date.now()}`) }))}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <span aria-hidden="true" className="text-sm leading-none">+</span>
                                  Ny kod
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-black/10 pt-5">
                          <p className="text-sm font-semibold text-ink-700">Bjud in direkt via e-post</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
                            <Input
                              type="email"
                              value={companyAdminProfile.inviteEmail}
                              onChange={(event) => setCompanyAdminProfile((prev) => ({ ...prev, inviteEmail: event.target.value }))}
                              placeholder="kollega@rikshem.se"
                            />
                            <Button
                              type="button"
                              className="h-auto w-full rounded-2xl px-4 py-2.5 text-sm font-semibold leading-none"
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
                            </Button>
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
                                    <Avatar className="h-9 w-9">
                                      <AvatarFallback className="bg-[#e6eefc] text-xs font-semibold text-[#2d4f83]">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-semibold text-ink-800">{member.name}</p>
                                      <p className="text-xs text-ink-500">{member.email}</p>
                                    </div>
                                  </div>
                                  <Badge className="h-auto rounded-full bg-[#f9edbe] px-2.5 py-1 text-[11px] font-semibold text-[#8a6b13]">
                                    {member.status}
                                  </Badge>
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
                                <Button
                                  key={option.key}
                                  type="button"
                                  variant="outline"
                                  className={`h-auto w-full justify-start gap-3 !rounded-2xl px-4 py-3 text-left font-normal ${active ? "border-[#0b0a0e] bg-[#f8fafc]" : "border-black/10 hover:bg-black/5"}`}
                                  onClick={() => setCompanyAdminProfile((prev) => ({ ...prev, approvalFlow: option.key }))}
                                >
                                  <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#0b0a0e]" : "border-black/20"}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[#0b0a0e]" : "bg-transparent"}`} />
                                  </span>
                                  <span>
                                    <span className="block text-[0.92rem] font-semibold leading-tight text-[#0b0a0e]">{option.title}</span>
                                    <span className="mt-1 block text-[0.8rem] leading-snug text-ink-600">{option.description}</span>
                                  </span>
                                </Button>
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
                                <Button
                                  key={option.key}
                                  type="button"
                                  variant="outline"
                                  className={`h-auto w-full justify-start gap-3 !rounded-2xl px-4 py-3 text-left font-normal ${active ? "border-[#0b0a0e] bg-[#f8fafc]" : "border-black/10 hover:bg-black/5"}`}
                                  onClick={() => setCompanyAdminProfile((prev) => ({ ...prev, listingModeration: option.key }))}
                                >
                                  <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-[#0b0a0e]" : "border-black/20"}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-[#0b0a0e]" : "bg-transparent"}`} />
                                  </span>
                                  <span>
                                    <span className="block text-[0.92rem] font-semibold leading-tight text-[#0b0a0e]">{option.title}</span>
                                    <span className="mt-1 block text-[0.8rem] leading-snug text-ink-600">{option.description}</span>
                                  </span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="border-t border-black/10 pt-5">
                          <div className="space-y-4">
                            <label className="flex items-center gap-3">
                              <Checkbox
                                className="h-5 w-5 shrink-0"
                                checked={companyAdminProfile.termsAdminAuthority}
                                onCheckedChange={(checked) => setCompanyAdminProfile((prev) => ({ ...prev, termsAdminAuthority: Boolean(checked) }))}
                              />
                              <span className="text-[0.88rem] leading-snug text-ink-700">Jag bekräftar att jag har rätt att representera bolaget på plattformen.</span>
                            </label>
                            <label className="flex items-center gap-3">
                              <Checkbox
                                className="h-5 w-5 shrink-0"
                                checked={companyAdminProfile.termsPlatformRules}
                                onCheckedChange={(checked) => setCompanyAdminProfile((prev) => ({ ...prev, termsPlatformRules: Boolean(checked) }))}
                              />
                              <span className="flex-1 text-[0.88rem] leading-snug text-ink-700">Jag har läst och godkänner <Button type="button" variant="link" className="h-auto p-0 align-baseline font-semibold text-[#0b0a0e] underline underline-offset-2">användarvillkoren</Button> och <Button type="button" variant="link" className="h-auto p-0 align-baseline font-semibold text-[#0b0a0e] underline underline-offset-2">publiceringsreglerna</Button>.</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between border-t border-black/10 pt-5">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-w-[132px] rounded-full px-4 py-2 text-xs font-semibold text-ink-700"
                        onClick={goBack}
                        disabled={pending}
                      >
                        Föregående
                      </Button>

                      <div className="flex items-center gap-2">
                        {companyAdminStepDots.map((dot) => (
                          <span key={dot} className={`h-2.5 rounded-full transition-all ${dot === companyAdminFlowStep ? "w-7 bg-[#0b0a0e]" : "w-2.5 bg-black/15"}`} />
                        ))}
                      </div>

                      <Button
                        type="button"
                        className="h-auto min-w-[132px] rounded-full px-4 py-2 text-xs font-semibold"
                        onClick={companyAdminFlowStep === 3 ? finish : goNext}
                        disabled={pending || !canAdvanceCompanyAdminFlow}
                      >
                        {companyAdminFlowStep === 3 ? (pending ? "Aktiverar..." : "Aktivera konto") : "Nästa"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {currentStep === "review" ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Personlig information</p>
                <div className="flex flex-wrap items-center gap-4 px-1 pb-4">
                  <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#0b0a0e] text-2xl font-semibold text-white">
                    {accountInitial || "A"}
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <p className="text-[1.35rem] font-semibold leading-tight text-[#0b0a0e]">{account.name || "Namn saknas"}</p>
                    <p className="mt-1 text-sm text-ink-600">{account.email || "-"}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{account.phone || "Telefon ej angivet"}</p>
                  </div>
                  <Badge variant="outline" className="h-auto rounded-full bg-[#ffffff] px-3 py-1.5 text-xs font-semibold text-ink-700">
                    {primaryRole === "broker" ? "Mäklare" : primaryRole === "company_admin" ? "Bolagsadmin" : "Hyresgäst"}
                  </Badge>
                </div>
                <div className="my-0 border-t border-black/10" />

                {primaryRole === "renter" || (primaryRole === "broker" && isBrokerWithProgramFlow) ? (
                  <div className="px-1 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Lokalprogram</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {reviewProgramStats.map(({ label, value, Icon }) => (
                        <div key={label} className="flex items-start gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#ffffff] text-ink-700">
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
                              <span key={amenity} className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#ffffff] px-3 py-1.5 text-sm font-semibold text-ink-700">
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

                {primaryRole === "broker" ? (
                  <div className="px-1 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Publiceringsprofil</p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {[
                        { label: "Fastighetstyp", value: publisherProfile.propertyType || "-" },
                        { label: "Organisationsnummer", value: publisherProfile.organizationNumber || "-" },
                        { label: "Portföljstorlek", value: publisherProfile.portfolioSize || "-" },
                        { label: "Verifiering", value: "Skickas till bolagsadmin" },
                        { label: "FMI", value: publisherProfile.fmiNumber || "Ej angivet" },
                        { label: "Godkända villkor", value: publisherProfile.termsEmployerAuthority && publisherProfile.termsPublishingRules && publisherProfile.termsSuspensionAware ? "Ja" : "Nej" }
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-2xl border border-black/10 bg-[#ffffff] px-4 py-3">
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
            <Button
              type="button"
              variant="outline"
              className="h-auto rounded-full px-4 py-2 text-xs font-semibold text-ink-700"
              onClick={goBack}
              disabled={pending}
            >
              Föregående
            </Button>

            {currentStep === "review" ? (
              <Button
                type="button"
                className="h-auto rounded-full px-4 py-2 text-xs font-semibold"
                onClick={finish}
                disabled={pending}
              >
                {pending ? "Sparar..." : "Slutför profil"}
              </Button>
            ) : (
              <Button
                type="button"
                className="h-auto rounded-full px-4 py-2 text-xs font-semibold"
                onClick={goNext}
                disabled={pending}
              >
                Nästa
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default OnboardingPage;
