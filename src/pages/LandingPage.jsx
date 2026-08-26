import { useEffect, useMemo, useRef, useState } from "react";
import { navigateTo, normalizeAppRole } from "../lib/router";
import { propertyAmenityOptions } from "../lib/propertyAmenityIcons";
import MarketingHeader from "../components/layout/MarketingHeader";
import ListingVisualCard from "../components/app/ListingVisualCard";
import MapListingPreviewCard from "../components/app/MapListingPreviewCard";
import ViewingRequestModal from "../components/app/ViewingRequestModal";
import { PLATFORM_GOOGLE_MAP_STYLE } from "../lib/googleMapStyles";
import heroOwnerPanelImage from "../../Assets/Hero Images/How To Design A Moody Navy Blue Study Room.jpeg";
import stockholmLandingImage from "../../Assets/Hero Images/stockholm-landing.jpg";
import {
  BalconyIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BikeIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
  CrownIcon,
  DumbbellIcon,
  FilterIcon,
  HistoryIcon,
  LockerIcon,
  LockIcon,
  LoungeIcon,
  MouseScrollIcon,
  PencilIcon,
  PenthouseIcon,
  PinIcon,
  PlusIcon,
  ResetIcon,
  RooftopIcon,
  RulerIcon,
  SearchIcon,
  SnowflakeIcon,
  StarIcon,
  TrophyIcon,
  UserIcon,
  UtensilsIcon,
  WifiIcon
} from "../components/icons/UiIcons";
import { districtOptions, listingTypes, listings as baseListingDataset } from "../data/mockData";

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
    body: "Starta som hyresgäst, hyresvärd eller båda roller i samma konto."
  },
  {
    title: "Sök eller publicera",
    body: "Använd filter och AI-sök, eller publicera nya objekt steg för steg."
  },
  {
    title: "Boka och följ upp",
    body: "Visningsförfrågan, intressestatus och snabb dialog samlas i en vy."
  }
];

const heroOwnerTestimonials = [
  {
    quote: "Vi fick rätt typ av förfrågningar direkt, utan att lägga tid på fel matchningar.",
    company: "Nordic Workspace Group"
  },
  {
    quote: "Lokalprogrammen gör dialogen skarpare. Teamen vet vad de söker innan första visningen.",
    company: "Sthlm Fastighetspartner"
  },
  {
    quote: "Publiceringen går snabbt och objekten känns bättre presenterade än i våra gamla flöden.",
    company: "Atrium Offices"
  }
];

const heroSpaceTypes = ["kontor", "coworking", "studio", "butik", "klinik", "lager"];

function ProcessStepAccountMockup() {
  return (
    <div className="relative h-36 w-36">
      <div className="absolute inset-x-3 top-2 h-28 -rotate-2 rounded-2xl border border-black/10 bg-white shadow-sm" />
      <div className="absolute inset-x-1 top-0 flex h-28 rotate-1 flex-col items-center justify-center gap-2.5 rounded-2xl border border-black/10 bg-white shadow-md">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">Välj roll</span>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b0a0e] text-white ring-4 ring-[#0b0a0e]/10">
            <UserIcon className="h-4 w-4" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-ink-400">
            <BuildingIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
      <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#4f46e5] text-white shadow-md">
        <CheckBadgeIcon className="h-4 w-4" />
      </span>
    </div>
  );
}

function ProcessStepSearchMockup() {
  return (
    <div className="relative w-full max-w-[190px]">
      <div className="space-y-2 rounded-2xl border border-black/10 bg-white p-3.5 shadow-sm">
        <div className="h-2 w-3/4 rounded-full bg-black/10" />
        <div className="h-2 w-1/2 rounded-full bg-black/10" />
      </div>
      <div className="mt-2.5 space-y-2 rounded-2xl border border-black/10 bg-white p-3.5 shadow-sm">
        <div className="h-2 w-full rounded-full bg-black/10" />
        <div className="h-2 w-2/3 rounded-full bg-black/10" />
      </div>
      <span className="absolute -top-3 right-1 inline-flex items-center gap-1.5 rounded-full border border-[#4f46e5]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#4f46e5] shadow-md">
        <SearchIcon className="h-3 w-3" /> AI-sök
      </span>
    </div>
  );
}

function ProcessStepBookingMockup() {
  return (
    <div className="relative flex w-full max-w-[210px] items-end gap-2 pt-6">
      <div className="flex-1 space-y-2 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
        <div className="h-2 w-full rounded-full bg-black/10" />
        <div className="h-2 w-2/3 rounded-full bg-black/10" />
        <div className="h-2 w-1/2 rounded-full bg-black/10" />
      </div>
      <div className="flex-1 space-y-2 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
        <div className="h-2 w-full rounded-full bg-black/10" />
        <div className="h-2 w-1/2 rounded-full bg-black/10" />
      </div>
      <div className="absolute -top-1 left-1/2 w-[92%] -translate-x-1/2 -rotate-1 rounded-2xl border border-[#4f46e5]/20 bg-white p-3 text-left shadow-lg">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#4f46e5]">Nästa steg</p>
        <p className="mt-1 text-xs font-medium text-ink-800">Visning bokad – svar inom 2h.</p>
      </div>
    </div>
  );
}

const processStepMockups = [ProcessStepAccountMockup, ProcessStepSearchMockup, ProcessStepBookingMockup];

const localProgramBenefits = [
  {
    title: "Skapa ert lokalprogram",
    body: "Fyll i lokaltyp, storlek, budget och läge – vi använder det direkt i matchningen."
  },
  {
    title: "Sparat i er profil",
    body: "Programmet finns alltid kvar i profilen och går att uppdatera när behoven ändras."
  },
  {
    title: "Sök direkt med programmet",
    body: "Aktivera lokalprogrammet på Lediga lokaler och se matchningar i ett klick."
  }
];

const mockupSlideClass = (isActive) =>
  `transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
    isActive ? "scale-100 opacity-100" : "scale-[0.985] opacity-60"
  }`;

function LokalprogramCreateMockup({ isActive }) {
  const primaryListing = baseListingDataset[0];
  const numberFields = [
    { label: "Min yta", value: `${primaryListing.sizeSqm - 40} kvm` },
    { label: "Max yta", value: `${primaryListing.sizeSqm + 40} kvm` },
    { label: "Max budget / mån", value: `${primaryListing.priceMonthly.toLocaleString("sv-SE")} kr` }
  ];
  const selectFields = [
    { label: "Område", value: primaryListing.district },
    { label: "Lokaltyp", value: primaryListing.type },
    { label: "Avtal", value: primaryListing.term }
  ];
  const amenityIcons = [BuildingIcon, WifiIcon, UtensilsIcon, BikeIcon];
  const amenities = primaryListing.amenities.map((label, index) => ({
    icon: amenityIcons[index] ?? BuildingIcon,
    label
  }));
  const pricePerSqm = Math.round(primaryListing.priceMonthly / primaryListing.sizeSqm);
  const summaryItems = [
    `${primaryListing.capacity} platser`,
    `${primaryListing.availability}`,
    `${pricePerSqm} kr/kvm`
  ];
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-[#141417] p-4 pb-8 sm:p-6 sm:pb-10 ${mockupSlideClass(isActive)}`}>
      <div className="rounded-xl bg-white p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Lokalprogram</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{primaryListing.title}</p>
            <p className="mt-1 text-xs font-medium text-ink-500">{primaryListing.address}, {primaryListing.district}</p>
          </div>
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/10">
            <img src={primaryListing.image} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {numberFields.map((field) => (
            <div key={field.label}>
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-ink-400">{field.label}</span>
              <div className="mt-1 flex h-8 items-center rounded-xl border border-black/10 bg-white px-2.5 text-[10px] font-semibold text-ink-800">
                {field.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {selectFields.map((field) => (
            <div key={field.label}>
              <span className="block text-[9px] font-semibold uppercase tracking-wide text-ink-400">{field.label}</span>
              <div className="mt-1 flex h-8 items-center justify-between rounded-xl border border-black/10 bg-white px-2.5">
                <span className="truncate text-[10px] font-semibold text-ink-800">{field.value}</span>
                <ChevronRightIcon className="h-3 w-3 rotate-90 text-ink-300" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {summaryItems.map((item) => (
            <span key={item} className="rounded-xl border border-black/10 bg-[#f8fafc] px-2.5 py-2 text-[10px] font-semibold text-ink-600">
              {item}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-black/10 pt-3.5">
          {amenities.map((amenity) => (
            <span
              key={amenity.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1.5 text-[10px] font-semibold text-ink-600"
            >
              <amenity.icon className="h-3 w-3" /> {amenity.label}
            </span>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2 border-t border-black/10 pt-3.5">
          <span className="rounded-full border border-black/10 px-3 py-1.5 text-[10px] font-semibold text-ink-600">Avbryt</span>
          <span className="rounded-full bg-[#0b0a0e] px-3 py-1.5 text-[10px] font-semibold text-white">Spara ändringar</span>
        </div>
      </div>
    </div>
  );
}

function LokalprogramProfileMockup({ isActive }) {
  const primaryListing = baseListingDataset[0];
  const secondaryListing = baseListingDataset[1];
  const elevateClass = `transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
    isActive
      ? "relative z-10 scale-[1.07] shadow-[0_18px_40px_-12px_rgba(79,70,229,0.52)] ring-2 ring-[#4f46e5]/20"
      : "scale-100 shadow-none ring-0"
  }`;
  return (
    <div className={`h-[342px] overflow-hidden rounded-2xl border border-white/10 bg-[#141417] p-3 pb-8 sm:p-4 sm:pb-10 ${mockupSlideClass(isActive)}`}>
      <div className="w-[178.57%] origin-top-left scale-[0.56] rounded-xl bg-white p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-black/10 bg-ink-100">
              <img src="/object-images/object-6.jpeg" alt="" className="h-full w-full object-cover" />
              <span className="absolute right-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-ink-400">
                <PencilIcon className="h-4 w-4" />
              </span>
            </div>
            <div>
              <span className="block h-8 w-64 rounded-full bg-[#edf1f1]" aria-label="Namn maskerat" />
              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-ink-500">
                <CheckBadgeIcon className="h-4 w-4 text-ink-400" />
                ID verifierad
              </span>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-ink-500">
            <PencilIcon className="h-4 w-4" />
            Hantera profil
          </span>
        </div>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_0.38fr] gap-6">
          <div>
            <div className="rounded-3xl border border-black/10 bg-white p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold text-[#0b0a0e]">Lokalprogram</p>
                  <p className="mt-2 text-sm font-medium text-ink-500">
                    Flera behov kan sparas separat för olika team, lägen eller tidslinjer.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#0b0a0e] px-5 py-3 text-sm font-semibold text-white">
                  <PlusIcon className="h-4 w-4" />
                  Lägg till
                </span>
              </div>

              <div className={`mt-6 origin-left rounded-2xl border border-[#4f46e5]/20 bg-white p-5 ${elevateClass}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-base font-semibold text-ink-900">Lokalprogram 1</p>
                      <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-ink-500">
                        Aktivt i sök
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-ink-500">
                      {primaryListing.district} · {primaryListing.type} · max {primaryListing.priceMonthly.toLocaleString("sv-SE")} kr
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-ink-500">{primaryListing.score - 8}%</span>
                    <ChevronRightIcon className="h-5 w-5 text-ink-300" />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-black/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink-900">Lokalprogram 2</p>
                    <p className="mt-3 text-sm font-medium text-ink-500">
                      {secondaryListing.district} · {secondaryListing.type} · {secondaryListing.term}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-ink-500">43%</span>
                    <ChevronRightIcon className="h-5 w-5 text-ink-300" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-black/10 bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <CheckBadgeIcon className="h-5 w-5" />
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-ink-400">
                  <PlusIcon className="h-4 w-4 rotate-45" />
                </span>
              </div>
              <p className="mt-5 text-xl font-semibold text-[#0b0a0e]">Verifiering godkänd</p>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Du är verifierad som mäklare för{" "}
                <span className="inline-block h-3 w-28 rounded-full bg-[#edf1f1] align-middle" aria-label="Företag maskerat" />.
              </p>
              <p className="mt-5 text-sm font-medium text-ink-500">Godkänd 14 juli 12:02</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LokalprogramSearchMockup({ isActive }) {
  const primaryListing = baseListingDataset[0];
  const primaryPricePerSqm = Math.round(primaryListing.priceMonthly / primaryListing.sizeSqm);
  const pins = [
    { left: 26, top: 9 },
    { left: 53, top: 12 },
    { left: 77, top: 9 },
    { left: 47, top: 22 },
    { left: 55, top: 27 },
    { left: 38, top: 34 },
    { left: 50, top: 43 },
    { left: 34, top: 52 },
    { left: 48, top: 58 },
    { left: 51, top: 62 },
    { left: 45, top: 68 },
    { left: 52, top: 75 },
    { left: 74, top: 28 },
    { left: 78, top: 27 }
  ];
  const elevateClass = `transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
    isActive
      ? "relative z-10 -translate-y-0.5 scale-[1.14] text-[#4f46e5] shadow-[0_18px_34px_-10px_rgba(79,70,229,0.52)] ring-2 ring-[#4f46e5]/25"
      : "translate-y-0 scale-100 shadow-none ring-0"
  }`;
  return (
    <div className={`h-[442px] overflow-hidden rounded-2xl border border-white/10 bg-[#141417] p-3 pb-8 sm:p-4 sm:pb-10 ${mockupSlideClass(isActive)}`}>
      <div className="w-[208.33%] origin-top-left scale-[0.48] rounded-xl bg-white p-6">
        <div className="grid grid-cols-[1.02fr_0.98fr] items-stretch gap-6">
          <div className="flex min-w-0 flex-col">
            <p className="text-[13px] font-semibold text-ink-500">Startsida / Lediga lokaler</p>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-2xl font-semibold text-[#0b0a0e]">Lediga lokaler</p>
              <div className="flex items-center gap-3">
                <span className={`inline-flex origin-center items-center gap-2 rounded-full border border-black/10 bg-white py-2 pl-2 pr-4 text-sm font-semibold text-ink-900 ${elevateClass}`}>
                  <span className="h-7 w-7 overflow-hidden rounded-full">
                    <img src="/object-images/object-6.jpeg" alt="" className="h-full w-full object-cover" />
                  </span>
                  Sök med lokalprogram
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_1fr_0.52fr] gap-4">
              <label>
                <span className="block text-xs font-semibold uppercase tracking-wide text-ink-500">Antal platser</span>
                <div className="mt-2 flex h-12 items-center justify-between rounded-2xl border border-black/10 px-4 text-sm font-medium text-ink-500">
                  Platser
                  <span className="text-ink-700">st</span>
                </div>
              </label>
              <label>
                <span className="block text-xs font-semibold uppercase tracking-wide text-ink-500">Område</span>
                <div className="mt-2 flex h-12 items-center justify-between rounded-2xl border border-black/10 px-4 text-sm font-medium text-ink-700">
                  Alla områden
                  <ChevronRightIcon className="h-4 w-4 rotate-90 text-ink-400" />
                </div>
              </label>
              <div className="flex items-end">
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-black/10 text-sm font-semibold text-ink-700">
                  <FilterIcon className="h-4 w-4" />
                  Visa alla filter
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="inline-flex h-11 items-center rounded-full border border-black/10 px-4 text-sm font-semibold text-ink-800">
                26 lediga lokaler
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink-600">Sortera</span>
                <span className="inline-flex h-11 items-center gap-8 rounded-2xl border border-black/10 px-4 text-sm font-semibold text-ink-700">
                  Relevans
                  <ChevronRightIcon className="h-4 w-4 rotate-90 text-ink-400" />
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[0.98fr_1fr] overflow-hidden rounded-3xl border border-black/10 bg-white">
              <div className="min-w-0">
                <div className="relative">
                  <img src="/object-images/object-1.jpeg" alt="" className="aspect-[5/3] w-full object-cover" />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink-500 shadow-sm">
                    <BuildingIcon className="h-4 w-4 text-ink-400" />
                    {primaryListing.type}
                  </span>
                  <span className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-500 shadow-sm">
                    <StarIcon className="h-5 w-5" />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-0.5">
                  <img src="/object-images/object-1.jpeg" alt="" className="aspect-[5/3] w-full object-cover" />
                  <img src="/object-images/object-1.jpeg" alt="" className="aspect-[5/3] w-full object-cover" />
                </div>
              </div>

              <div className="flex min-w-0 flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-tight text-ink-900">{primaryListing.title}</p>
                    <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink-500">
                      <PinIcon className="h-4 w-4" />
                      {primaryListing.address}, {primaryListing.district}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-ink-700">
                    <CrownIcon className="h-4 w-4" />
                    UTVALD
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-base font-semibold text-ink-900">
                  <span className="inline-flex items-center gap-2">
                    <RulerIcon className="h-5 w-5" />
                    {primaryListing.sizeSqm} kvm
                  </span>
                  <span className="h-6 w-px bg-black/10" />
                  <span className="inline-flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    {primaryListing.capacity} platser
                  </span>
                </div>

                <p className="mt-3 max-w-[32ch] text-sm leading-6 text-ink-600">
                  Flexibelt kontor i centralt läge, utformat för hybridarbete och med direkt närhet till kommunikationer.
                </p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-[#0b0a0e]">från {primaryPricePerSqm} kr</span>
                  <span className="text-base text-ink-500">/ kvm</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {primaryListing.availability}
                </div>
                <p className="mt-4 text-sm font-medium text-ink-600">Fastighetsägare: Demo Hyresvärd</p>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-ink-800">
                    <CalendarIcon className="h-4 w-4" />
                    Boka visning
                  </span>
                  <span className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-ink-500">
                    HYRESVÄRD
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-full min-h-full self-stretch overflow-hidden rounded-[28px] border border-black/10 bg-[#eef0f2]">
            <div className="absolute inset-0 bg-[#edf0f2]" />
            <div className="absolute inset-x-0 top-[44%] h-[22%] -rotate-3 bg-[#d6dce1]/70" />
            <div className="absolute left-[62%] top-0 h-full w-[18%] rotate-12 bg-[#cfd6dc]/60" />
            <div className="absolute left-[8%] top-[12%] h-24 w-44 rotate-12 rounded-[40%] bg-[#d7dce1]/70" />
            <div className="absolute right-[10%] top-[8%] h-28 w-56 -rotate-6 rounded-[40%] bg-[#d7dce1]/65" />
            <div className="absolute bottom-[10%] left-[24%] h-28 w-72 rotate-3 rounded-[45%] bg-[#d7dce1]/60" />
            <div className="absolute left-0 top-[30%] h-2 w-full rotate-6 bg-[#aeb7c0]/45" />
            <div className="absolute left-0 top-[70%] h-2 w-full -rotate-2 bg-[#aeb7c0]/45" />
            <div className="absolute left-[44%] top-0 h-full w-2 rotate-12 bg-[#8f9aa5]/45" />
            <div className="absolute left-[68%] top-0 h-full w-2 -rotate-6 bg-[#8f9aa5]/45" />
            <div className="absolute inset-0 bg-black/12" />

            <span className="absolute left-[38%] top-[21%] text-3xl font-semibold text-black/65">Stockholm</span>
            <span className="absolute left-[25%] top-[4%] text-base font-semibold uppercase tracking-wide text-black/55">Vasastan</span>
            <span className="absolute right-[18%] top-[14%] text-base font-semibold uppercase tracking-wide text-black/55">Östermalm</span>
            <span className="absolute left-[44%] top-[57%] text-base font-semibold text-black/55">Södermalm</span>
            <span className="absolute bottom-3 left-4 rounded bg-white/80 px-2 py-1 text-sm font-semibold text-ink-600">Google</span>

            {pins.map((pin, index) => (
              <PinIcon
                key={index}
                className="absolute h-7 w-7 -translate-x-1/2 -translate-y-full text-[#ef3f36] drop-shadow-md"
                style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
                fill="currentColor"
                stroke="white"
                strokeWidth={1.5}
              />
            ))}

            <div className="absolute bottom-6 right-6 flex flex-col overflow-hidden rounded-xl bg-white text-ink-700 shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center border-b border-black/10 text-3xl leading-none">+</span>
              <span className="flex h-11 w-11 items-center justify-center text-3xl leading-none">-</span>
            </div>
            <div className="absolute right-6 top-[58%] flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-500 shadow-lg">
              <span className="relative h-5 w-5">
                <span className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-current" />
                <span className="absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-current" />
                <span className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-current" />
                <span className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-current" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const lokalprogramMockups = [LokalprogramCreateMockup, LokalprogramProfileMockup, LokalprogramSearchMockup];

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
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path fill="#0b0a0e" stroke="#0b1428" stroke-width="1.4" d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12c0 7.71 8.58 16.56 9.57 17.55a.97.97 0 0 0 1.36 0c.99-.99 9.57-9.84 9.57-17.55 0-5.66-4.59-10.25-10.25-10.25Z"/><circle cx="12" cy="12" r="4.1" fill="#ffffff"/></svg>`
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
              ? "flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-black/10 bg-[#ffffff] p-0"
              : "flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/45 bg-[#ffffff]/22 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_rgba(15,25,48,0.12)] backdrop-blur-md"
          }
        >
          <div className={mapShellClassName}>
          <div className={mapViewportClassName}>
            <div ref={mapContainerRef} className="h-full w-full" />

            {mapStatus === "loading" ? (
              <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/55 text-xs font-semibold text-ink-700">Laddar karta...</div>
            ) : null}

            {mapStatus === "missing_key" ? (
              <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/70 p-4 text-center text-xs font-semibold text-rose-700">
                Google Maps API-nyckel saknas. Lägg till `VITE_GOOGLE_MAPS_API_KEY` i `.env` och starta om `npm run dev`.
              </div>
            ) : null}

            {mapStatus === "error" ? (
              <div className="absolute inset-0 grid place-items-center bg-[#ffffff]/75 p-4 text-center text-xs font-semibold text-rose-700">
                <div className="space-y-2">
                  <p>{errorMessage || "Google Maps kunde inte laddas."}</p>
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
                    className="close-circle-button inline-flex items-center justify-center rounded-full border border-black/10 bg-[#ffffff] text-lg font-semibold leading-none text-ink-700 hover:bg-[#eef3fa]"
                    onClick={() => setSelectedListing(null)}
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

const heroInputClass = "w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-[#0b0a0e] focus:outline-none";
const heroSelectClass = "select-chevron w-full rounded-2xl border border-black/10 bg-transparent px-3 py-3 pr-10 text-sm text-ink-900 focus:border-[#0b0a0e] focus:outline-none";

function HeroPillToggle({ checked, onToggle, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`relative inline-flex h-6 w-10 min-h-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? "justify-end bg-[#0b0a0e]" : "justify-start bg-[#a8adb3]"
      }`}
      onClick={onToggle}
    >
      <span aria-hidden="true" className="h-5 w-5 rounded-full bg-[#ffffff] shadow-[0_1px_2px_rgba(15,25,48,0.35)]" />
    </button>
  );
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
  const footerActiveRole = normalizeAppRole(user?.role);
  const footerProfilePath = footerActiveRole === "company_admin"
    ? "/app/admin/profil"
    : footerActiveRole === "broker"
      ? "/app/broker/profil"
      : "/app/profile";
  const headerRef = useRef(null);
  const heroSectionRef = useRef(null);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);
  const [bookingListing, setBookingListing] = useState(null);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [heroFilters, setHeroFilters] = useState({
    district: "Alla",
    teamSize: ""
  });
  const [heroShowcaseIndex, setHeroShowcaseIndex] = useState(0);
  const [heroSpaceTypeIndex, setHeroSpaceTypeIndex] = useState(0);
  const [heroTypedSpaceType, setHeroTypedSpaceType] = useState(heroSpaceTypes[0]);
  const [activeOwnerTestimonialIndex, setActiveOwnerTestimonialIndex] = useState(0);
  const [demoRequestOpen, setDemoRequestOpen] = useState(false);
  const [demoRequestSubmitted, setDemoRequestSubmitted] = useState(false);
  const [demoRequestForm, setDemoRequestForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: ""
  });
  const heroShowcaseListings = useMemo(() => baseListingDataset.slice(0, 4), []);
  const currentHeroListing = heroShowcaseListings[heroShowcaseIndex] ?? heroShowcaseListings[0] ?? baseListingDataset[0];
  const heroBannerRef = useRef(null);
  const heroBannerImageRef = useRef(null);
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const programStepRefs = useRef([]);

  useEffect(() => {
    if (heroShowcaseListings.length < 2) return undefined;
    const interval = setInterval(() => {
      setHeroShowcaseIndex((index) => (index + 1) % heroShowcaseListings.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [heroShowcaseListings.length]);

  useEffect(() => {
    if (heroOwnerTestimonials.length < 2) return undefined;
    const interval = setInterval(() => {
      setActiveOwnerTestimonialIndex((index) => (index + 1) % heroOwnerTestimonials.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentWord = `${heroSpaceTypes[heroSpaceTypeIndex] || heroSpaceTypes[0]}.`;
    const nextIndex = (heroSpaceTypeIndex + 1) % heroSpaceTypes.length;
    const timeouts = [];
    setHeroTypedSpaceType("");
    for (let index = 0; index < currentWord.length; index += 1) {
      timeouts.push(
        window.setTimeout(() => {
          setHeroTypedSpaceType(currentWord.slice(0, index + 1));
        }, 90 * (index + 1))
      );
    }

    for (let index = currentWord.length - 1; index >= 0; index -= 1) {
      timeouts.push(
        window.setTimeout(() => {
          setHeroTypedSpaceType(currentWord.slice(0, index));
        }, 4000 + (currentWord.length - index) * 55)
      );
    }

    timeouts.push(
      window.setTimeout(() => {
        setHeroSpaceTypeIndex(nextIndex);
      }, 4000 + currentWord.length * 55 + 140)
    );

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [heroSpaceTypeIndex]);

  const openAuth = (mode, preferredRole = "renter") => {
    onOpenAuthOverlay?.(mode, preferredRole);
  };

  function updateDemoRequestField(field, value) {
    setDemoRequestForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  function closeDemoRequestOverlay() {
    setDemoRequestOpen(false);
    setDemoRequestSubmitted(false);
  }

  function submitDemoRequest(event) {
    event.preventDefault();
    setDemoRequestSubmitted(true);
  }

  useEffect(() => {
    const container = heroBannerRef.current;
    const image = heroBannerImageRef.current;
    if (!container || !image) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;

    const parallaxRange = 72;
    let frameId = null;

    function applyParallax() {
      frameId = null;
      const rect = container.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const clamped = Math.min(Math.max(progress, 0), 1);
      image.style.transform = `translateY(${(clamped - 0.5) * parallaxRange}px)`;
    }

    function onScroll() {
      if (frameId) return;
      frameId = requestAnimationFrame(applyParallax);
    }

    applyParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    function updateActiveProgramStep() {
      const referenceLine = window.innerHeight * 0.35;
      let nextIndex = 0;
      programStepRefs.current.forEach((el, index) => {
        if (el && el.getBoundingClientRect().top <= referenceLine) {
          nextIndex = index;
        }
      });
      setActiveProgramIndex(nextIndex);
    }

    updateActiveProgramStep();
    window.addEventListener("scroll", updateActiveProgramStep, { passive: true });
    window.addEventListener("resize", updateActiveProgramStep);
    return () => {
      window.removeEventListener("scroll", updateActiveProgramStep);
      window.removeEventListener("resize", updateActiveProgramStep);
    };
  }, []);

  function scrollToProgramStep(index) {
    programStepRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handlePopularBookViewing(listing) {
    setBookingListing(listing);
  }

  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((entry) => String(entry.listingId))),
    [favorites]
  );
  const totalAvailableListings = Array.isArray(listings) && listings.length > 0 ? listings.length : baseListingDataset.length;
  const featuredGridListings = (Array.isArray(listings) && listings.length > 0 ? listings : baseListingDataset).slice(0, 8);

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

  function handleTogglePopularShortlist(listingId) {
    if (!listingId) return;
    if (!user) {
      openAuth("login", "renter");
      return;
    }
    onToggleFavorite?.(listingId);
  }

  return (
    <main className="min-h-screen bg-[#ffffff] text-black">
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

      <section ref={heroSectionRef} className="relative px-8 pb-2 pt-6 sm:px-12 sm:pb-4 sm:pt-10 lg:px-16" data-no-reveal>
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)] lg:gap-10">
            <div className="flex flex-col justify-center py-2 lg:py-4">
              <h1 className="hero-load-title font-display-serif max-w-[11ch] text-[3.4rem] font-semibold leading-[0.9] text-[#0b0a0e] sm:text-[5.2rem] lg:text-[6.1rem]">
                Hitta rätt{" "}
                <span className="inline-block min-w-[4.8ch]">
                  {heroTypedSpaceType}
                </span>
              </h1>
              <p className="hero-load-copy mt-4 max-w-xl text-base font-medium leading-7 text-ink-600">
                Matcha teamstorlek, område och budget mot aktuella kontor, studios och coworkingytor i Stockholm.
              </p>

              <form className="hero-load-search mt-6 w-full" onSubmit={submitHeroSearch}>
                <div className="grid w-full gap-3 sm:inline-grid sm:w-auto sm:grid-cols-[170px_220px_56px] sm:gap-0 sm:overflow-hidden sm:rounded-full sm:border sm:border-black/10 sm:bg-white sm:p-1 sm:shadow-[0_18px_50px_-30px_rgba(11,10,14,0.35)]">
                  <div className="grid grid-cols-2 overflow-hidden rounded-full border border-black/10 bg-white shadow-[0_18px_50px_-30px_rgba(11,10,14,0.35)] sm:contents">
                    <label className="flex min-w-0 items-center border-r border-black/10 px-4 py-3 sm:border-b-0 sm:py-0">
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

                    <label className="min-w-0 px-4 py-3 sm:border-b-0 sm:py-0">
                      <select
                        value={heroFilters.district}
                        onChange={(event) => setHeroFilters((prev) => ({ ...prev, district: event.target.value }))}
                        className="select-chevron h-full w-full min-w-0 bg-transparent text-sm text-ink-900 focus:outline-none"
                        style={{ paddingRight: "28px", backgroundPosition: "right 0.5rem center" }}
                      >
                        <option value="Alla" className="text-black">Alla områden</option>
                        {districtOptions.map((district) => (
                          <option key={district} value={district} className="text-black">
                            {district}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <button
                    type="submit"
                    aria-label="Sök lokaler"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0b0a0e] text-sm font-semibold text-white sm:h-[48px] sm:w-[48px] sm:place-self-center"
                  >
                    <SearchIcon className="h-5 w-5" />
                    <span className="sm:hidden">Sök lokaler</span>
                  </button>
                </div>
              </form>

              <div className="hero-load-actions mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setDemoRequestOpen(true)}
                  className="rounded-full bg-[#0b0a0e] px-7 py-4 text-sm font-semibold text-white hover:bg-[#191919]"
                >
                  Boka en demo
                </button>
                <button
                  type="button"
                  onClick={() => scrollToHashSection("#lokaler-just-nu", true)}
                  className="rounded-full border border-black/10 bg-white px-7 py-4 text-sm font-semibold text-ink-900 hover:border-black/25"
                >
                  Utforska lokaler
                </button>
              </div>
            </div>

            <aside className="hero-load-panel relative min-h-[310px] overflow-hidden rounded-3xl border border-black/10 bg-[#0b0a0e] p-5 text-white shadow-[0_24px_70px_-45px_rgba(11,10,14,0.8)] sm:min-h-[340px] sm:p-6">
              <img
                src={heroOwnerPanelImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/48" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/28 to-black/88" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/34 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-black via-black/80 to-transparent" />

              <div className="relative flex h-full min-h-[270px] flex-col justify-between sm:min-h-[292px]">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Användare om LOA</p>

                <div className="relative mt-8 min-h-[180px]">
                  {heroOwnerTestimonials.map((testimonial) => (
                    <figure
                      key={testimonial.company}
                      className={`absolute inset-x-0 bottom-0 transition-all duration-1000 ease-out ${
                        testimonial === heroOwnerTestimonials[activeOwnerTestimonialIndex]
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0"
                      }`}
                      aria-hidden={testimonial !== heroOwnerTestimonials[activeOwnerTestimonialIndex]}
                    >
                      <blockquote className="font-display-serif text-[1.38rem] font-semibold leading-[1.08] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.95)] sm:text-[1.75rem]">
                        "{testimonial.quote}"
                      </blockquote>
                      <figcaption className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/70 [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
                        - {testimonial.company}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <div ref={heroBannerRef} className="hero-load-featured relative mt-8 h-56 overflow-hidden rounded-3xl sm:h-72 lg:h-80">
            <img
              ref={heroBannerImageRef}
              src={stockholmLandingImage}
              alt="Stockholm"
              className="absolute inset-x-0 -top-[44px] h-[calc(100%+88px)] w-full object-cover will-change-transform"
            />
          </div>
        </div>
      </section>

      <section id="sa-fungerar-det" className="relative px-6 pb-6 pt-20 sm:px-14 sm:pb-8 sm:pt-24 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">Så fungerar det</p>
          <h2 className="font-display-serif mt-4 text-4xl font-semibold leading-[0.95] text-[#0b0a0e] sm:text-5xl">
            Tre steg till en snabbare uthyrningsprocess
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-600">
            Vi samlar hela flödet på ett ställe, från konto till bokad visning, så inget faller mellan stolarna.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-3">
          {processSteps.map((step, index) => {
            const Mockup = processStepMockups[index];
            return (
              <div key={step.title} className="rounded-3xl bg-[#F3F7F7] p-8 text-center">
                <div className="flex h-44 items-center justify-center">
                  <Mockup />
                </div>
                <p className="mt-6 text-lg font-semibold text-ink-900">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink-600">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative px-6 pb-16 pt-3 text-center sm:px-14 sm:pb-20 sm:pt-5 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-sm font-normal leading-snug sm:text-base lg:whitespace-nowrap">
            <span className="text-ink-400">Vill du få ut det mesta av våra funktioner? </span>
            <span className="text-[#0b0a0e]">Skapa ditt konto idag.</span>
          </h2>
          <button
            type="button"
            onClick={() => openAuth("signup", "renter")}
            className="mt-8 inline-flex h-6 items-center gap-2 rounded-full bg-[#0b0a0e] px-5 text-xs font-semibold text-white transition"
          >
            Skapa konto
            <UserIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <section id="lokalprogram" className="relative scroll-mt-28 bg-[#0b0a0e] py-4 sm:py-6">
        <div className="relative bg-[#0b0a0e]">
          <div className="relative px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Lokalprogram</p>
            <h2 className="font-display-serif mt-4 max-w-xl text-4xl font-semibold leading-[0.95] text-white sm:text-5xl">
              Sätt upp ert lokalprogram innan ni börjar leta brett
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
              Tydliga behov från start ger bättre matchningar och en snabbare väg till rätt lokal.
            </p>

            <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] lg:gap-16">
              <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
                <div className="flex flex-col">
                  {localProgramBenefits.map((item, index) => {
                    const isActive = index === activeProgramIndex;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => scrollToProgramStep(index)}
                        className={`!rounded-none border-b border-white/10 py-5 text-left transition-colors duration-300 ${
                          isActive ? "text-white" : "text-white/40"
                        }`}
                      >
                        <span className="block text-xl font-semibold leading-tight">{item.title}</span>
                        <span
                          className="grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          style={{
                            gridTemplateRows: isActive ? "1fr" : "0fr",
                            opacity: isActive ? 1 : 0,
                            marginTop: isActive ? "0.75rem" : "0"
                          }}
                        >
                          <span className="max-w-[28ch] overflow-hidden text-sm font-medium text-white/60">{item.body}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="space-y-10 lg:space-y-16">
                {localProgramBenefits.map((item, index) => {
                  const Mockup = lokalprogramMockups[index];
                  const isActive = index === activeProgramIndex;
                  return (
                    <article
                      key={item.title}
                      ref={(el) => {
                        programStepRefs.current[index] = el;
                      }}
                      className="scroll-mt-32"
                    >
                      <Mockup isActive={isActive} />
                      <div className="mt-4 lg:hidden">
                        <p className="text-lg font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-white/70">{item.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="priser" className="relative scroll-mt-28 px-6 py-20 sm:px-14 sm:py-24 lg:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Priser</p>
          <h2 className="font-display-serif mt-4 text-4xl font-semibold leading-[0.95] text-[#0b0a0e] sm:text-5xl">
            Gratis att komma igång, betala bara för extra synlighet
          </h2>
          <span className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Gratis under hela lanseringsperioden
          </span>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
          <article className="rounded-3xl bg-[#080d18] p-6 text-white sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Gratis</p>
            <p className="mt-3 text-5xl font-semibold">0 kr</p>
            <p className="mt-3 text-sm text-white/75">
              Publicera obegränsat antal annonser och testa hela plattformen kostnadsfritt under lanseringsperioden.
            </p>
            <button
              type="button"
              onClick={() => openAuth("signup", "broker")}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-white px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#080d18]"
            >
              Börja publicera
            </button>
          </article>

          <article className="rounded-3xl border border-black/10 bg-[#ffffff] p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Synlighetslyft</p>
            <p className="mt-1 text-sm text-ink-600">Lägg till extra räckvidd när ni vill sticka ut i sökresultaten.</p>

            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-white ring-4 ring-[#0b0a0e]/10">
                  <TrophyIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-semibold">Topplacering</p>
                  <p className="text-sm text-ink-600">Lyft annonsen högst upp i listning och sökresultat.</p>
                </div>
              </div>
              <div className="h-px bg-black/10" />
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-white ring-4 ring-[#0b0a0e]/10">
                  <ResetIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-semibold">Förnya annons</p>
                  <p className="text-sm text-ink-600">Pusha upp den igen när tempot i intresset sjunker.</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="lokaler-just-nu" className="relative scroll-mt-28 px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Utvalda objekt</p>
              <h2 className="font-display-serif mt-3 text-3xl font-semibold leading-[0.95] text-[#0b0a0e] sm:text-4xl">
                Lediga lokaler just nu
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 text-xs font-semibold text-ink-700 hover:text-black"
              onClick={() => navigateTo("/app/rent?view=available")}
            >
              Se alla lediga objekt
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredGridListings.map((listing) => (
              <ListingVisualCard
                key={listing.id}
                listing={listing}
                compact
                shortlisted={favoriteIds.has(String(listing.id))}
                onOpenListing={(selected) => navigateTo(`/app/listings/${encodeURIComponent(selected.id)}`)}
                onBookViewing={handlePopularBookViewing}
                onToggleShortlist={() => handleTogglePopularShortlist(listing.id)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-[56rem] scroll-mt-28 px-8 pb-24 pt-16 sm:px-10 sm:pb-32 sm:pt-20">
        <h2 className="font-display-serif text-[2.35rem] font-semibold leading-none text-[#0b0a0e] sm:text-[3rem]">
          Vanliga frågor
        </h2>

        <div className="mt-8 border-y border-black/10">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <article key={item.q} className="border-b border-black/10 last:border-b-0">
                <button
                  type="button"
                  className={`flex w-full items-center justify-between gap-6 pt-5 text-left sm:pt-6 ${
                    isOpen ? "pb-2 sm:pb-2.5" : "pb-5 sm:pb-6"
                  }`}
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                >
                  <span className="text-base font-semibold leading-tight text-[#0b0a0e] sm:text-[1.08rem]">{item.q}</span>
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center text-ink-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronRightIcon className="h-4 w-4 rotate-90" />
                  </span>
                </button>
                <div
                  className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
                >
                  <p
                    className={`max-w-3xl overflow-hidden text-sm leading-6 text-[#0b0a0e] ${
                      isOpen ? "pb-4 sm:pb-5" : "pb-0"
                    }`}
                  >
                    {item.a}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <article className="mt-14 overflow-hidden rounded-2xl bg-[#F3F7F7]">
          <div className="grid gap-8 px-8 py-9 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h3 className="text-xl font-semibold leading-tight text-[#0b0a0e] sm:text-2xl">
                Vill du se hur LOA fungerar?
              </h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-ink-600 sm:text-base sm:leading-7">
                Boka en kort demo så visar vi hur ni kan publicera objekt, få bättre förfrågningar och följa upp intresse.
              </p>
            </div>

            <div className="grid gap-3 justify-self-stretch sm:max-w-md lg:justify-self-end">
              <div className="justify-self-end rounded-2xl bg-white px-5 py-4 text-sm font-semibold leading-5 text-[#0b0a0e]">
                Vi vill se hur LOA kan hjälpa oss med uthyrningen.
              </div>
              <div className="flex items-end gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b0a0e] text-xs font-semibold text-white">
                  L
                </span>
                <div className="rounded-2xl bg-white px-5 py-4 text-sm font-semibold leading-5 text-[#0b0a0e]">
                  Absolut. Lämna dina uppgifter så bokar vi in 20 minuter.
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDemoRequestOpen(true)}
            className="flex w-full items-center justify-between !rounded-none border-t border-black/10 bg-transparent px-8 py-4 text-left text-base font-semibold text-[#080d18] transition hover:bg-white/35 sm:px-10"
          >
            Boka en demo
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </article>
      </section>

      {demoRequestOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-request-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Stäng demoformulär"
            onClick={closeDemoRequestOverlay}
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Boka en demo</p>
                <h2
                  id="demo-request-title"
                  className="font-display-serif mt-2 text-[2.15rem] font-semibold leading-[0.95] text-[#0b0a0e] sm:text-[2.65rem]"
                >
                  Berätta hur vi når dig
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 min-h-10 min-w-10 aspect-square shrink-0 items-center justify-center !rounded-full border border-black/10 p-0 text-[#0b0a0e] hover:border-black/25"
                aria-label="Stäng"
                onClick={closeDemoRequestOverlay}
              >
                <PlusIcon className="h-4 w-4 rotate-45" />
              </button>
            </div>

            {demoRequestSubmitted ? (
              <div className="mt-7 rounded-2xl bg-[#F3F7F7] p-5">
                <p className="text-lg font-semibold text-[#0b0a0e]">Tack, vi hör av oss.</p>
                <p className="mt-2 text-sm leading-6 text-ink-600">
                  Vi återkommer med en tid för en kort genomgång av hur LOA kan användas för era objekt.
                </p>
                <button
                  type="button"
                  className="mt-5 rounded-full bg-[#0b0a0e] px-6 py-3 text-sm font-semibold text-white"
                  onClick={closeDemoRequestOverlay}
                >
                  Stäng
                </button>
              </div>
            ) : (
              <form className="mt-7 grid gap-4" onSubmit={submitDemoRequest}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Namn
                    <input
                      required
                      type="text"
                      value={demoRequestForm.name}
                      onChange={(event) => updateDemoRequestField("name", event.target.value)}
                      className={heroInputClass}
                      placeholder="För- och efternamn"
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Företag
                    <input
                      type="text"
                      value={demoRequestForm.company}
                      onChange={(event) => updateDemoRequestField("company", event.target.value)}
                      className={heroInputClass}
                      placeholder="Bolagsnamn"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    E-post
                    <input
                      required
                      type="email"
                      value={demoRequestForm.email}
                      onChange={(event) => updateDemoRequestField("email", event.target.value)}
                      className={heroInputClass}
                      placeholder="namn@foretag.se"
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Telefon
                    <input
                      type="tel"
                      value={demoRequestForm.phone}
                      onChange={(event) => updateDemoRequestField("phone", event.target.value)}
                      className={heroInputClass}
                      placeholder="+46 70 000 00 00"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Vad vill ni se?
                  <textarea
                    rows={4}
                    value={demoRequestForm.message}
                    onChange={(event) => updateDemoRequestField("message", event.target.value)}
                    className={`${heroInputClass} resize-none`}
                    placeholder="Till exempel publicering, matchning eller lokalprogram."
                  />
                </label>
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-[#0b0a0e] px-7 py-4 text-sm font-semibold text-white hover:bg-[#191919]"
                >
                  Skicka förfrågan
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

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
        className={`fixed bottom-6 right-6 z-30 inline-flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-full border border-black/20 bg-[#ffffff]/25 p-3 text-[#0b0a0e] shadow-[0_8px_24px_rgba(15,25,48,0.18)] backdrop-blur-md transition-all duration-250 ${
          showScrollToTopButton
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
            : "translate-y-2 scale-95 opacity-0 pointer-events-none"
        } hover:bg-[#ffffff]/35`}
        onClick={handleScrollToTop}
      >
        <ArrowUpIcon className="h-4 w-4" />
        <MouseScrollIcon className="h-4 w-4" />
      </button>

      <footer id="kontakt" className="scroll-mt-24 bg-[#0b0a0e] pt-2">
        <div className="overflow-hidden bg-[#0b0a0e] px-6 py-12 text-white sm:px-10 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                  LOGGA
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">LOA</p>
                  <p className="text-xs text-white/60">Plats för företagslogga</p>
                </div>
              </div>
              <p className="max-w-sm text-sm text-white/70">
                LOA samlar hyresgäst och hyresvärd i ett gemensamt flöde för snabbare matchning, visningar och affärer.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#0b0a0e] transition hover:bg-white/90"
                  onClick={() => navigateTo("/signup?step=role")}
                >
                  Skapa konto
                  <UserIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
                  onClick={() => openAuth("login", "renter")}
                >
                  Logga in
                  <LockIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Utforska</p>
              <div className="mt-4 grid gap-2.5">
                <a className="text-sm text-white/65 hover:text-white" href="#sa-fungerar-det" onClick={(event) => handleSectionLinkClick(event, "#sa-fungerar-det")}>Så fungerar det</a>
                <a className="text-sm text-white/65 hover:text-white" href="#priser" onClick={(event) => handleSectionLinkClick(event, "#priser")}>Priser</a>
                <a className="text-sm text-white/65 hover:text-white" href="#faq" onClick={(event) => handleSectionLinkClick(event, "#faq")}>FAQ</a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Snabbnavigering</p>
              <div className="mt-4 grid gap-2.5">
                <a className="text-sm text-white/65 hover:text-white" href="#" onClick={(event) => { event.preventDefault(); navigateTo("/app/rent"); }}>Hyr lokal</a>
                <a className="text-sm text-white/65 hover:text-white" href="#" onClick={(event) => { event.preventDefault(); navigateTo("/app/publish"); }}>Publicera lokal</a>
                <a className="text-sm text-white/65 hover:text-white" href="#" onClick={(event) => { event.preventDefault(); navigateTo("/app/broker/objekt"); }}>Dina objekt</a>
                <a className="text-sm text-white/65 hover:text-white" href="#" onClick={(event) => { event.preventDefault(); navigateTo(footerProfilePath); }}>Profil</a>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Kundservice</p>
              <div className="mt-4 grid gap-2.5 text-sm text-white/65">
                <p>support@foretag.se</p>
                <p>08-123 45 67</p>
                <p>Vardagar 08:00-17:00</p>
                <button type="button" className="text-left text-sm text-white/65 hover:text-white" onClick={() => navigateTo("/forgot-password")}>
                  Glömt lösenord
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} LOA. Alla rättigheter förbehållna.</p>
            <div className="flex items-center gap-3 text-xs text-white/50">
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
