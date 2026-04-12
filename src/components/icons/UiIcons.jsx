function IconBase({ className = "h-4 w-4", children, viewBox = "0 0 24 24" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </IconBase>
  );
}

export function FilterIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </IconBase>
  );
}

export function SparklesIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
      <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" />
    </IconBase>
  );
}

export function HistoryIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 5v4h4" />
      <path d="M12 7v6l4 2" />
    </IconBase>
  );
}

export function SaveIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h8V4" />
      <path d="M9 20v-6h6v6" />
    </IconBase>
  );
}

export function ResetIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 5v4h4" />
    </IconBase>
  );
}

export function MapIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </IconBase>
  );
}

export function CardsIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </IconBase>
  );
}

export function ListIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M8 6.5h12" />
      <path d="M8 12h12" />
      <path d="M8 17.5h12" />
      <circle cx="4.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function BuildingIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 21V5l8-2v18" />
      <path d="M12 8h8v13h-8" />
      <path d="M7 8h2" />
      <path d="M7 12h2" />
      <path d="M7 16h2" />
      <path d="M15 12h2" />
      <path d="M15 16h2" />
    </IconBase>
  );
}

export function CalendarIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
    </IconBase>
  );
}

export function StarIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9z" />
    </IconBase>
  );
}

export function EyeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.5" />
    </IconBase>
  );
}

export function UserIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" />
    </IconBase>
  );
}

export function HomeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </IconBase>
  );
}

export function CoinsIcon({ className }) {
  return (
    <IconBase className={className}>
      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.5" />
      <path d="M5.5 6.5v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4" />
      <path d="M5.5 10.5v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4" />
    </IconBase>
  );
}

export function RulerIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 16L16 4l4 4-12 12H4z" />
      <path d="M10 6l2 2" />
      <path d="M8 8l2 2" />
      <path d="M6 10l2 2" />
    </IconBase>
  );
}

export function ClockIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3.5 2" />
    </IconBase>
  );
}

export function PencilIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 20l4.1-1 9.5-9.5a1.8 1.8 0 0 0 0-2.6l-.5-.5a1.8 1.8 0 0 0-2.6 0L5 15.9 4 20z" />
      <path d="M13.7 7.3l3 3" />
    </IconBase>
  );
}

export function BikeIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="6.5" cy="16.5" r="3.5" />
      <circle cx="17.5" cy="16.5" r="3.5" />
      <path d="M10 16.5l2.5-6h3l2 6" />
      <path d="M9 10h3" />
      <path d="M12.5 10l-1.5 3.5H8.5" />
    </IconBase>
  );
}

export function CarIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 15l1.5-4.5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1.5L20 15" />
      <rect x="3" y="15" width="18" height="4" rx="1.5" />
      <circle cx="7" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </IconBase>
  );
}

export function BusIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="5" y="4.5" width="14" height="13" rx="2.5" />
      <path d="M5 10h14" />
      <path d="M8 8h2" />
      <path d="M14 8h2" />
      <path d="M7.5 17.5v2.5" />
      <path d="M16.5 17.5v2.5" />
      <circle cx="8.5" cy="20" r="1.1" />
      <circle cx="15.5" cy="20" r="1.1" />
    </IconBase>
  );
}

export function TrainIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="6" y="4.5" width="12" height="11.5" rx="2.2" />
      <path d="M6 10h12" />
      <path d="M10 13h4" />
      <path d="M9 16.2l-3 3.3" />
      <path d="M15 16.2l3 3.3" />
    </IconBase>
  );
}

export function UtensilsIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M6 4v7" />
      <path d="M8 4v7" />
      <path d="M10 4v7" />
      <path d="M8 11v9" />
      <path d="M16 4c-1.4 1.4-1.4 3.6 0 5v11" />
      <path d="M16 4v16" />
    </IconBase>
  );
}

export function WifiIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4.5 10.5a11 11 0 0 1 15 0" />
      <path d="M7.5 13.5a7 7 0 0 1 9 0" />
      <path d="M10.5 16.5a3 3 0 0 1 3 0" />
      <circle cx="12" cy="19.2" r="0.8" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function PinIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 21s6-6.2 6-11a6 6 0 1 0-12 0c0 4.8 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </IconBase>
  );
}

export function UploadIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 4v10" />
      <path d="M8.5 7.5L12 4l3.5 3.5" />
      <path d="M4 15.5v3a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </IconBase>
  );
}

export function CameraIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3.5" y="7.5" width="17" height="11" rx="2.5" />
      <path d="M8 7.5l1.2-2h5.6l1.2 2" />
      <circle cx="12" cy="13" r="3.1" />
    </IconBase>
  );
}

export function LightbulbIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3.5a5.5 5.5 0 0 0-3.8 9.5c.8.7 1.3 1.5 1.5 2.5h4.6c.2-1 .7-1.8 1.5-2.5A5.5 5.5 0 0 0 12 3.5z" />
      <path d="M9.5 18h5" />
      <path d="M10.2 20h3.6" />
    </IconBase>
  );
}

export function ArrowUpIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 20V6" />
      <path d="M7.5 10.5L12 6l4.5 4.5" />
    </IconBase>
  );
}

export function MouseScrollIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="7" y="3.5" width="10" height="17" rx="5" />
      <path d="M12 7.5v3.5" />
    </IconBase>
  );
}

export function BalconyIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 20h16" />
      <path d="M5.5 20v-5.5a2.5 2.5 0 0 1 2.5-2.5h8a2.5 2.5 0 0 1 2.5 2.5V20" />
      <path d="M8 12V6h8v6" />
      <path d="M10 16v4" />
      <path d="M14 16v4" />
    </IconBase>
  );
}

export function RooftopIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v9h14v-9" />
      <path d="M8 14h8" />
      <path d="M10 17h4" />
    </IconBase>
  );
}

export function PenthouseIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 20V10h16v10" />
      <path d="M8 10V5h8v5" />
      <path d="M10 14h4" />
      <path d="M12 5V3" />
    </IconBase>
  );
}

export function DumbbellIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 10v4" />
      <path d="M6 9v6" />
      <path d="M18 9v6" />
      <path d="M21 10v4" />
      <path d="M6 12h12" />
    </IconBase>
  );
}

export function LockerIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M12 4v16" />
      <path d="M10 10h1" />
      <path d="M13 14h1" />
    </IconBase>
  );
}

export function SnowflakeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3v18" />
      <path d="M4.8 7.2l14.4 9.6" />
      <path d="M19.2 7.2L4.8 16.8" />
      <path d="M12 3l-2 2" />
      <path d="M12 3l2 2" />
      <path d="M12 21l-2-2" />
      <path d="M12 21l2-2" />
    </IconBase>
  );
}

export function LoungeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 14h14a2 2 0 0 1 2 2v2H3v-2a2 2 0 0 1 2-2z" />
      <path d="M6 14v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" />
      <path d="M14 14v-2.5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 19 11.5V14" />
    </IconBase>
  );
}

export function ShieldIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3l7 3v5c0 4.6-2.8 8.3-7 10-4.2-1.7-7-5.4-7-10V6l7-3z" />
      <path d="M9.5 12.5l1.8 1.8 3.2-3.2" />
    </IconBase>
  );
}

export function ExternalLinkIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M14 5h5v5" />
      <path d="M10 14L19 5" />
      <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </IconBase>
  );
}

export function PdfIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v5h4" />
      <path d="M8.5 15h1.8a1.7 1.7 0 0 0 0-3.4H8.5V17" />
      <path d="M13 11.6h1.2a1.7 1.7 0 0 1 0 3.4H13z" />
      <path d="M16.8 11.6h2.7" />
      <path d="M16.8 13.3h2.2" />
    </IconBase>
  );
}

export function ShareIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 11l8-4" />
      <path d="M8 13l8 4" />
    </IconBase>
  );
}

export function ArrowLeftIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M19 12H5" />
      <path d="M10 7l-5 5 5 5" />
    </IconBase>
  );
}

export function ArrowRightIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 12h14" />
      <path d="M14 7l5 5-5 5" />
    </IconBase>
  );
}

export function SwitchHorizontalIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 8h13" />
      <path d="M14 5l3 3-3 3" />
      <path d="M20 16H7" />
      <path d="M10 13l-3 3 3 3" />
    </IconBase>
  );
}

export function TrashIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </IconBase>
  );
}
