import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { cn } from "cn";
import { useIsDark } from "../../lib/theme";

// thinking-orbs ships exactly two size presets (64 and 20). Any other `size` has no preset and
// throws on mount, which unmounts the whole app. So the canvas always renders the 64 preset and
// is scaled to the requested pixel size with CSS instead.
const ORB_PRESET = 64;
const CROSSFADE_MS = 240;

/**
 * Bare orb (no avatar chrome). Changing `state` crossfades the old animation
 * out under the new one, so switching reads as one gesture instead of a hard cut.
 * `engaged` swells the orb slightly to signal that input was received.
 * `size` is the rendered width and height in CSS pixels.
 */
export default function AssistantOrb({ state = "breathing", speed = 1, engaged = false, size = 64, className }) {
  const [layers, setLayers] = useState(() => [{ id: 0, state, speed }]);
  const nextId = useRef(1);
  // Dark dots on a light page, light dots on a dark one.
  const dark = useIsDark();

  useEffect(() => {
    setLayers((prev) => {
      const current = prev[prev.length - 1];
      if (current.state === state) return prev;
      return [current, { id: nextId.current++, state, speed }];
    });
    // Speed is captured per layer when its state starts; speed alone never restarts an animation.
  }, [state]);

  useEffect(() => {
    if (layers.length < 2) return undefined;
    const timer = window.setTimeout(() => setLayers((prev) => prev.slice(-1)), CROSSFADE_MS);
    return () => window.clearTimeout(timer);
  }, [layers]);

  return (
    <div
      aria-hidden="true"
      data-orb-state={state}
      style={{ width: size, height: size }}
      className={cn("relative shrink-0 transition-transform duration-300 ease-out", engaged && "scale-[1.18]", className)}
    >
      {layers.map((layer, index) => (
        <ThinkingOrb
          key={layer.id}
          state={layer.state}
          size={ORB_PRESET}
          theme={dark ? "dark" : "light"}
          speed={layer.speed}
          style={{ width: size, height: size }}
          className={cn(
            "absolute inset-0 duration-200",
            index < layers.length - 1
              ? "animate-out fade-out-0 fill-mode-forwards"
              : "animate-in fade-in-0 fill-mode-backwards"
          )}
        />
      ))}
    </div>
  );
}
