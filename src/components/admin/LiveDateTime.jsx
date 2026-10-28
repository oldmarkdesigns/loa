import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

/** The current time, updated on every full second (not merely once a second, so the digits change when the clock does). */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, 1000 - (Date.now() % 1000));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

const pad = (value) => String(value).padStart(2, "0");

/**
 * Today's date and a live clock (hours, minutes and seconds) in one pill, with a divider between them. The digits have a
 * fixed width, so the pill does not twitch as they change, and the clock is not announced by screen readers on every tick.
 */
export default function LiveDateTime({ className }) {
  const now = useNow();
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return (
    <Badge variant="outline" className={cn("h-auto gap-3 rounded-md bg-control px-3 py-2 font-normal text-ink-600", className)}>
      <span className="flex items-center gap-2">
        <CalendarDays aria-hidden="true" className="h-4 w-4" />
        <time dateTime={day}>{now.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}</time>
      </span>
      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-veil/15" />
      <time dateTime={time} className="font-medium tabular-nums text-ink-800">{time}</time>
    </Badge>
  );
}
