import { forwardRef } from "react";
import { Icon } from "./Icon";

function IconBase({ className = "h-4 w-4", children, viewBox = "0 0 24 24", ...props }) {
  return (
    <svg
      aria-hidden={props["aria-label"] || props["aria-labelledby"] ? undefined : props["aria-hidden"] ?? true}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox={viewBox}
      {...props}
    >
      {children}
    </svg>
  );
}

function createSemanticIcon(name, displayName) {
  const SemanticIcon = forwardRef(function SemanticIcon(props, ref) {
    return <Icon ref={ref} name={name} {...props} />;
  });
  SemanticIcon.displayName = displayName;
  return SemanticIcon;
}

export const SearchIcon = createSemanticIcon("search", "SearchIcon");
export const FilterIcon = createSemanticIcon("filter", "FilterIcon");
export const BellIcon = createSemanticIcon("bell", "BellIcon");
export const LayoutDashboardIcon = createSemanticIcon("layoutDashboard", "LayoutDashboardIcon");
export const UsersGroupIcon = createSemanticIcon("usersGroup", "UsersGroupIcon");
export const MessageSquareIcon = createSemanticIcon("messageSquare", "MessageSquareIcon");
export const PaperclipIcon = createSemanticIcon("paperclip", "PaperclipIcon");
export const SendHorizontalIcon = createSemanticIcon("sendHorizontal", "SendHorizontalIcon");
export const ArchiveIcon = createSemanticIcon("archive", "ArchiveIcon");
export const TagIcon = createSemanticIcon("tag", "TagIcon");
export const UserPlusIcon = createSemanticIcon("userPlus", "UserPlusIcon");
export const CircleDotIcon = createSemanticIcon("circleDot", "CircleDotIcon");
export const PlusIcon = createSemanticIcon("plus", "PlusIcon");
export const BarChart3Icon = createSemanticIcon("barChart3", "BarChart3Icon");
export const MoreHorizontalIcon = createSemanticIcon("moreHorizontal", "MoreHorizontalIcon");
export const DownloadIcon = createSemanticIcon("download", "DownloadIcon");
export const CheckBadgeIcon = createSemanticIcon("checkBadge", "CheckBadgeIcon");
export const PanelLeftIcon = createSemanticIcon("panelLeft", "PanelLeftIcon");
export const XIcon = createSemanticIcon("close", "XIcon");
export const SparklesIcon = createSemanticIcon("sparkles", "SparklesIcon");
export const HistoryIcon = createSemanticIcon("history", "HistoryIcon");
export const SaveIcon = createSemanticIcon("save", "SaveIcon");
export const ResetIcon = createSemanticIcon("reset", "ResetIcon");
export const MapIcon = createSemanticIcon("map", "MapIcon");
export const CardsIcon = createSemanticIcon("cards", "CardsIcon");
export const ListIcon = createSemanticIcon("list", "ListIcon");
export const BuildingIcon = createSemanticIcon("building", "BuildingIcon");
export const CalendarIcon = createSemanticIcon("calendar", "CalendarIcon");
export const StarIcon = createSemanticIcon("star", "StarIcon");
export const EyeIcon = createSemanticIcon("eye", "EyeIcon");
export const UserIcon = createSemanticIcon("user", "UserIcon");

export function HomeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </IconBase>
  );
}

export const CoinsIcon = createSemanticIcon("coins", "CoinsIcon");
export const RulerIcon = createSemanticIcon("ruler", "RulerIcon");
export const ClockIcon = createSemanticIcon("clock", "ClockIcon");
export const PencilIcon = createSemanticIcon("pencil", "PencilIcon");
export const BikeIcon = createSemanticIcon("bike", "BikeIcon");
export const CarIcon = createSemanticIcon("car", "CarIcon");
export const BusIcon = createSemanticIcon("bus", "BusIcon");
export const TrainIcon = createSemanticIcon("train", "TrainIcon");
export const UtensilsIcon = createSemanticIcon("utensils", "UtensilsIcon");
export const WifiIcon = createSemanticIcon("wifi", "WifiIcon");
export const PinIcon = createSemanticIcon("pin", "PinIcon");
export const UploadIcon = createSemanticIcon("upload", "UploadIcon");
export const CameraIcon = createSemanticIcon("camera", "CameraIcon");
export const LightbulbIcon = createSemanticIcon("lightbulb", "LightbulbIcon");
export const ArrowUpIcon = createSemanticIcon("arrowUp", "ArrowUpIcon");

export function MouseScrollIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="7" y="3.5" width="10" height="17" rx="5" />
      <path d="M12 7.5v3.5" />
    </IconBase>
  );
}

export const BalconyIcon = createSemanticIcon("balcony", "BalconyIcon");
export const RooftopIcon = createSemanticIcon("rooftop", "RooftopIcon");
export const PenthouseIcon = createSemanticIcon("penthouse", "PenthouseIcon");
export const DumbbellIcon = createSemanticIcon("dumbbell", "DumbbellIcon");
export const LockerIcon = createSemanticIcon("locker", "LockerIcon");
export const SnowflakeIcon = createSemanticIcon("snowflake", "SnowflakeIcon");
export const LoungeIcon = createSemanticIcon("lounge", "LoungeIcon");
export const ShieldIcon = createSemanticIcon("shield", "ShieldIcon");
export const ExternalLinkIcon = createSemanticIcon("externalLink", "ExternalLinkIcon");
export const PdfIcon = createSemanticIcon("pdf", "PdfIcon");
export const ShareIcon = createSemanticIcon("share", "ShareIcon");
export const ArrowLeftIcon = createSemanticIcon("arrowLeft", "ArrowLeftIcon");
export const ArrowRightIcon = createSemanticIcon("arrowRight", "ArrowRightIcon");
export const SwitchHorizontalIcon = createSemanticIcon("switchHorizontal", "SwitchHorizontalIcon");
export const TrashIcon = createSemanticIcon("trash", "TrashIcon");
export const SettingsGearIcon = createSemanticIcon("settingsGear", "SettingsGearIcon");
export const InfoCircleIcon = createSemanticIcon("infoCircle", "InfoCircleIcon");
export const SupportIcon = createSemanticIcon("support", "SupportIcon");
export const LogoutIcon = createSemanticIcon("logout", "LogoutIcon");
