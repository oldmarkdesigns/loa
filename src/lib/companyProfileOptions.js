/** The choices of the company profile (the company admin's page in the account window). */

export const COMPANY_TYPE_OPTIONS = [
  "Privat fastighetsbolag",
  "Kommunalt bostadsbolag",
  "Kommersiell förvaltare",
  "Bostadsutvecklare",
  "Blandad portfölj"
];

export const PORTFOLIO_SIZE_OPTIONS = [
  "1-10 fastigheter",
  "11-50 fastigheter",
  "51-200 fastigheter",
  "200+ fastigheter"
];

export const APPROVAL_FLOW_OPTIONS = [
  {
    key: "admin_approves_broker",
    title: "Admin godkänner varje mäklare",
    description: "Ni behåller full kontroll över vem som publicerar"
  },
  {
    key: "broker_auto_approved",
    title: "Mäklare aktiveras automatiskt",
    description: "Godkänd roll aktiveras direkt utan manuell granskning"
  }
];

export const LISTING_MODERATION_OPTIONS = [
  {
    key: "broker_publishes_direct",
    title: "Mäklare publicerar direkt",
    description: "Automatisk granskning flaggar avvikelser"
  },
  {
    key: "admin_reviews_before_publish",
    title: "Bolagsadmin granskar innan publicering",
    description: "Mer kontroll, kräver aktiv admin-närvaro"
  }
];

