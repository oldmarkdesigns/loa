import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "cn";
import { useTheme } from "../../lib/theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const OPTIONS = [
  { value: "light", label: "Ljust", Icon: Sun },
  { value: "dark", label: "Mörkt", Icon: Moon },
  { value: "system", label: "Som systemet", Icon: Monitor }
];

/**
 * The theme switch of the workspace: Ljust, Mörkt and Som systemet as three icon buttons in a segmented control, the one in use
 * under the sliding pill. It sits at the top of the profile menu of the side menu (see PanelProfileMenu). Each button is named
 * for a screen reader, and the group keeps one choice at all times.
 */
export function ThemeToggle({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      aria-label="Tema"
      value={[theme]}
      onValueChange={(value) => value[0] && setTheme(value[0])}
      className={cn("rounded-lg bg-tint p-0.5 [&>.menu-selection-indicator]:rounded-md", className)}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="h-7 min-h-0 w-10 !rounded-md px-0 hover:bg-veil/5 focus-visible:ring-veil/20"
        >
          <Icon aria-hidden="true" className="size-[17px]" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export default ThemeToggle;
