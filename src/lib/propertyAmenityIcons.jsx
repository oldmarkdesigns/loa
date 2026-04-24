import { forwardRef } from "react";
import { Icon } from "../components/icons/Icon";
import {
  BalconyIcon,
  BikeIcon,
  BuildingIcon,
  CarIcon,
  DumbbellIcon,
  LockerIcon,
  LoungeIcon,
  PenthouseIcon,
  RooftopIcon,
  ShieldIcon,
  SnowflakeIcon,
  UtensilsIcon,
  WifiIcon
} from "../components/icons/UiIcons";

function createAmenityIcon(name, displayName) {
  const AmenityIcon = forwardRef(function AmenityIcon(props, ref) {
    return <Icon ref={ref} name={name} {...props} />;
  });
  AmenityIcon.displayName = displayName;
  return AmenityIcon;
}

const TelefonbasIcon = createAmenityIcon("telefonbas", "TelefonbasIcon");
const MotesrumIcon = createAmenityIcon("motesrum", "MotesrumIcon");
const MotesytaIcon = createAmenityIcon("motesyta", "MotesytaIcon");
const ReceptionIcon = createAmenityIcon("reception", "ReceptionIcon");
const SkyltfonsterIcon = createAmenityIcon("skyltfonster", "SkyltfonsterIcon");
const VantrumIcon = createAmenityIcon("vantrum", "VantrumIcon");
const LastzonIcon = createAmenityIcon("lastzon", "LastzonIcon");
const PentryIcon = createAmenityIcon("pentry", "PentryIcon");
const ParkeringIcon = createAmenityIcon("parkering", "ParkeringIcon");
const KaffezonIcon = createAmenityIcon("kaffezon", "KaffezonIcon");
const DuschIcon = createAmenityIcon("dusch", "DuschIcon");
const VattenstationIcon = createAmenityIcon("vattenstation", "VattenstationIcon");
const LjusskenorIcon = createAmenityIcon("ljusskenor", "LjusskenorIcon");
const HogtITakIcon = createAmenityIcon("hogtITak", "HogtITakIcon");
const BackOfficeIcon = createAmenityIcon("backOffice", "BackOfficeIcon");
const OppenYtaIcon = createAmenityIcon("oppenYta", "OppenYtaIcon");

export const propertyAmenityOptions = [
  { value: "Cykelförråd", label: "Cykelförråd", icon: BikeIcon },
  { value: "Garage", label: "Garage", icon: CarIcon },
  { value: "Parkering", label: "Parkering", icon: ParkeringIcon },
  { value: "Kök", label: "Kök", icon: PentryIcon },
  { value: "Mötesrum", label: "Mötesrum", icon: MotesrumIcon },
  { value: "Mötesyta", label: "Mötesyta", icon: MotesytaIcon },
  { value: "Fiber", label: "Fiber", icon: WifiIcon },
  { value: "Reception", label: "Reception", icon: ReceptionIcon },
  { value: "Balkong", label: "Balkong", icon: BalconyIcon },
  { value: "Takterrass", label: "Takterrass", icon: RooftopIcon },
  { value: "Takvåning", label: "Takvåning", icon: PenthouseIcon },
  { value: "Gym", label: "Gym", icon: DumbbellIcon },
  { value: "Omklädningsrum", label: "Omklädningsrum", icon: LockerIcon },
  { value: "Air condition", label: "Air condition", icon: SnowflakeIcon },
  { value: "Lounge", label: "Lounge", icon: LoungeIcon },
  { value: "Förråd", label: "Förråd", icon: LockerIcon },
  { value: "Lastzon", label: "Lastzon", icon: LastzonIcon },
  { value: "Telefonbås", label: "Telefonbås", icon: TelefonbasIcon },
  { value: "Väntrum", label: "Väntrum", icon: VantrumIcon },
  { value: "Pentry", label: "Pentry", icon: PentryIcon },
  { value: "Skyltfönster", label: "Skyltfönster", icon: SkyltfonsterIcon },
  { value: "Säkerhetsdörr", label: "Säkerhetsdörr", icon: ShieldIcon },
  { value: "Kaffezon", label: "Kaffezon", icon: KaffezonIcon },
  { value: "Dusch", label: "Dusch", icon: DuschIcon },
  { value: "Vattenstation", label: "Vattenstation", icon: VattenstationIcon },
  { value: "Ljusskenor", label: "Ljusskenor", icon: LjusskenorIcon },
  { value: "Högt i tak", label: "Högt i tak", icon: HogtITakIcon },
  { value: "Backoffice", label: "Backoffice", icon: BackOfficeIcon },
  { value: "Öppen yta", label: "Öppen yta", icon: OppenYtaIcon }
];

export const propertyAmenityDefinitions = [
  { label: "Cykelförråd", icon: BikeIcon, aliases: ["cykelförråd", "cykelrum", "cykel", "bike"] },
  { label: "Garage", icon: CarIcon, aliases: ["garage"] },
  { label: "Parkering", icon: ParkeringIcon, aliases: ["parkering", "laddplats", "laddplatser"] },
  { label: "Kök", icon: PentryIcon, aliases: ["kök", "kitchen", "delat kök", "pentry", "pantry"] },
  { label: "Mötesrum", icon: MotesrumIcon, aliases: ["mötesrum", "konferensrum", "styrelserum"] },
  { label: "Mötesyta", icon: MotesytaIcon, aliases: ["mötesyta"] },
  { label: "Fiber", icon: WifiIcon, aliases: ["fiber", "wifi", "internet"] },
  { label: "Reception", icon: ReceptionIcon, aliases: ["reception"] },
  { label: "Balkong", icon: BalconyIcon, aliases: ["balkong", "balcony"] },
  { label: "Takterrass", icon: RooftopIcon, aliases: ["takterrass", "terrass", "roof terrace", "terrace"] },
  { label: "Takvåning", icon: PenthouseIcon, aliases: ["takvåning", "penthouse"] },
  { label: "Gym", icon: DumbbellIcon, aliases: ["gym", "fitness", "träning"] },
  { label: "Omklädningsrum", icon: LockerIcon, aliases: ["omklädningsrum", "omklädning", "locker room"] },
  { label: "Air condition", icon: SnowflakeIcon, aliases: ["air condition", "ac", "a/c", "luftkonditionering"] },
  { label: "Lounge", icon: LoungeIcon, aliases: ["lounge", "sociala ytor", "social yta"] },
  { label: "Förråd", icon: LockerIcon, aliases: ["förråd", "förrad", "storage", "lager"] },
  { label: "Lastzon", icon: LastzonIcon, aliases: ["lastzon", "lastkaj", "loading zone"] },
  { label: "Telefonbås", icon: TelefonbasIcon, aliases: ["telefonbås", "telefonrum", "phone booth"] },
  { label: "Väntrum", icon: VantrumIcon, aliases: ["väntrum", "waiting room"] },
  { label: "Pentry", icon: PentryIcon, aliases: ["pentry", "pantry"] },
  { label: "Skyltfönster", icon: SkyltfonsterIcon, aliases: ["skyltfönster", "storefront"] },
  { label: "Säkerhetsdörr", icon: ShieldIcon, aliases: ["säkerhetsdörr", "säkerhet", "security", "secure"] },
  { label: "Kaffezon", icon: KaffezonIcon, aliases: ["kaffezon", "kaffe", "kaffestation", "kaffebar", "coffee", "coffee zone"] },
  { label: "Dusch", icon: DuschIcon, aliases: ["dusch", "shower"] },
  { label: "Vattenstation", icon: VattenstationIcon, aliases: ["vattenstation", "vattenpunkt", "vattenpunkter"] },
  { label: "Ljusskenor", icon: LjusskenorIcon, aliases: ["ljusskenor"] },
  { label: "Högt i tak", icon: HogtITakIcon, aliases: ["högt i tak", "hogt i tak"] },
  { label: "Backoffice", icon: BackOfficeIcon, aliases: ["backoffice", "back office", "bakutrymme"] },
  { label: "Öppen yta", icon: OppenYtaIcon, aliases: ["öppen yta", "oppen yta", "öppen plan", "oppen plan"] }
];

export function amenityIconFor(amenity) {
  const normalized = String(amenity || "").trim().toLowerCase();
  const definition = propertyAmenityDefinitions.find((item) => item.label.toLowerCase() === normalized
    || item.aliases.some((alias) => normalized.includes(alias)));
  return definition?.icon || BuildingIcon;
}

export function buildAmenityAliasMap() {
  return Object.fromEntries(
    propertyAmenityDefinitions.map((item) => [item.label.toLowerCase(), item.aliases])
  );
}
