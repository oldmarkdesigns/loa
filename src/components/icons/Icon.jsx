import { forwardRef } from "react";
import {
  AirVent,
  Archive,
  Armchair,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpToLine,
  BadgeCheck,
  BadgeInfo,
  Bell,
  Bike,
  Building,
  BusFront,
  CalendarDays,
  CarFront,
  Castle,
  ChartColumn,
  CircleDot,
  CircleParking,
  Clock,
  Coffee,
  ConciergeBell,
  CookingPot,
  Crown,
  Download,
  Droplets,
  Dumbbell,
  Ellipsis,
  ExternalLink,
  Eye,
  Fence,
  FileText,
  Forklift,
  Gauge,
  GalleryThumbnails,
  Grid2x2Check,
  HandCoins,
  Headset,
  History,
  ImageUp,
  LayoutDashboard,
  LayoutList,
  Lightbulb,
  Lamp,
  LogOut,
  Map,
  MapPin,
  MessageSquare,
  MoveLeft,
  MoveRight,
  MoveUp,
  MirrorRectangular,
  PanelRight,
  Paperclip,
  Phone,
  Package,
  Ratio,
  RotateCcw,
  RulerDimensionLine,
  Search,
  SendHorizontal,
  Server,
  Settings,
  ShowerHead,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  SquarePen,
  Star,
  Tag,
  TrainFront,
  Trash2,
  Upload,
  UserRound,
  UserPlus,
  UsersRound,
  Utensils,
  Wifi,
  X
} from "lucide-react";
import { ICONS } from "../../lib/iconSystem";

const LUCIDE_ICON_COMPONENTS = {
  AirVent,
  Archive,
  Armchair,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpToLine,
  BadgeCheck,
  BadgeInfo,
  Bell,
  Bike,
  Building,
  BusFront,
  CalendarDays,
  CarFront,
  Castle,
  ChartColumn,
  CircleDot,
  CircleParking,
  Clock,
  Coffee,
  ConciergeBell,
  CookingPot,
  Crown,
  Download,
  Droplets,
  Dumbbell,
  Ellipsis,
  ExternalLink,
  Eye,
  Fence,
  FileText,
  Forklift,
  Gauge,
  GalleryThumbnails,
  Grid2x2Check,
  HandCoins,
  Headset,
  History,
  ImageUp,
  LayoutDashboard,
  LayoutList,
  Lightbulb,
  Lamp,
  LogOut,
  Map,
  MapPin,
  MessageSquare,
  MoveLeft,
  MoveRight,
  MoveUp,
  MirrorRectangular,
  PanelRight,
  Paperclip,
  Package,
  Phone,
  Ratio,
  RotateCcw,
  RulerDimensionLine,
  Search,
  SendHorizontal,
  Server,
  Settings,
  ShowerHead,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sofa,
  Sparkles,
  SquarePen,
  Star,
  Tag,
  TrainFront,
  Trash2,
  Upload,
  UserRound,
  UserPlus,
  UsersRound,
  Utensils,
  Wifi,
  X
};

export function kebabToPascalCase(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

export const Icon = forwardRef(function Icon(
  { name, strokeWidth = 1.8, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, ...props },
  ref
) {
  const lucideName = ICONS[name];
  const componentName = kebabToPascalCase(lucideName);
  const LucideIcon = LUCIDE_ICON_COMPONENTS[componentName];

  if (!LucideIcon) {
    if (import.meta.env.DEV) {
      console.warn(`Missing Lucide icon for key "${name}" (${lucideName}).`);
    }
    return null;
  }

  return (
    <LucideIcon
      ref={ref}
      strokeWidth={strokeWidth}
      aria-hidden={ariaLabel || ariaLabelledBy ? undefined : props["aria-hidden"] ?? true}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      {...props}
    />
  );
});
