import { useEffect, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "./siteUtils";

// Stockholm drawn in small graphite dots, the public site's counterpart to the
// studio's dot globe: land is a field of dots, the water between the islands is
// left open, and a slow wave of light runs across it. Dots near the pointer
// swell a little and settle back. The areas with lediga lokaler are buttons
// laid over the canvas (real, focusable HTML), each with its count.
//
// The water is approximate on purpose: a handful of soft capsules for
// Riddarfjärden, Saltsjön, Hammarby sjö, Karlbergssjön, Brunnsviken and the
// Mälaren and Värtan edges. Enough to read as the city, not a survey map.

const VIEW = { west: 17.955, east: 18.135, north: 59.372, south: 59.293 };
const LAT0 = 59.33;
const KX = Math.cos((LAT0 * Math.PI) / 180);
// Map width and height in "lat-degree" units, so circles stay circles.
const MAP_W = (VIEW.east - VIEW.west) * KX;
const MAP_H = VIEW.north - VIEW.south;

// Labels sit right of their dot unless listed here.
const LEFT_LABELS = new Set(["Kungsholmen"]);

export const DISTRICT_GEO = {
  Solna: { lat: 59.3608, lng: 18.0003 },
  Norrmalm: { lat: 59.3332, lng: 18.0605 },
  Vasastan: { lat: 59.3458, lng: 18.0444 },
  Östermalm: { lat: 59.3414, lng: 18.0878 },
  Kungsholmen: { lat: 59.3318, lng: 18.0335 },
  Södermalm: { lat: 59.3148, lng: 18.0632 }
};

// Polylines of [lat, lng] with a half-width in latitude degrees.
const WATER = [
  { r: 0.007, pts: [[59.3125, 17.955], [59.3205, 17.982]] },
  { r: 0.0026, pts: [[59.3215, 17.982], [59.3218, 18.01], [59.3232, 18.04], [59.3238, 18.061]] },
  // Around Gamla stan: Strömmen to the north, Söderström by Slussen to the south.
  { r: 0.0016, pts: [[59.3238, 18.061], [59.3284, 18.0655], [59.3294, 18.0735], [59.3272, 18.0815]] },
  { r: 0.0014, pts: [[59.3238, 18.061], [59.3211, 18.0665], [59.3212, 18.0755], [59.3236, 18.0825]] },
  { r: 0.004, pts: [[59.3255, 18.0845], [59.3222, 18.094], [59.3205, 18.112], [59.318, 18.135]] },
  { r: 0.0014, pts: [[59.3286, 18.078], [59.3318, 18.0795]] },
  { r: 0.0017, pts: [[59.3285, 18.09], [59.3328, 18.101], [59.3335, 18.118], [59.333, 18.135]] },
  { r: 0.0022, pts: [[59.3035, 18.012], [59.3055, 18.04], [59.3045, 18.07], [59.3062, 18.094], [59.3125, 18.105], [59.318, 18.106]] },
  { r: 0.0015, pts: [[59.3345, 17.997], [59.3385, 18.012], [59.3378, 18.034], [59.3348, 18.05]] },
  { r: 0.003, pts: [[59.3345, 17.992], [59.346, 17.975], [59.358, 17.962], [59.372, 17.958]] },
  { r: 0.0026, pts: [[59.3475, 18.038], [59.357, 18.044], [59.372, 18.048]] },
  { r: 0.0075, pts: [[59.343, 18.135], [59.372, 18.137]] }
];

// Names of the water, so that the open spaces between the dots read as the lakes and bays of the city,
// each placed on the water itself.
const WATER_LABELS = [
  { name: "Mälaren", lat: 59.3168, lng: 17.968 },
  { name: "Riddarfjärden", lat: 59.3224, lng: 18.022 },
  { name: "Saltsjön", lat: 59.3213, lng: 18.104 },
  { name: "Hammarby sjö", lat: 59.3052, lng: 18.052 },
  { name: "Brunnsviken", lat: 59.3655, lng: 18.0465 },
  { name: "Värtan", lat: 59.3525, lng: 18.1255 }
];

// And the two islands everyone knows.
const LAND_LABELS = [
  { name: "Gamla stan", lat: 59.3249, lng: 18.0712 },
  { name: "Djurgården", lat: 59.3263, lng: 18.113 }
];

// One kilometre in map units (degrees of latitude), for the scale bar.
const KM = 1 / 111.32;

const project = (lat, lng) => [(lng - VIEW.west) * KX, VIEW.north - lat];
const unproject = (x, y) => ({ lat: VIEW.north - y, lng: VIEW.west + x / KX });

const WATER_XY = WATER.map((w) => ({ r: w.r, pts: w.pts.map(([lat, lng]) => project(lat, lng)) }));

function distToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// 0 deep in the water, 1 on land, soft at the shore.
function landness(x, y) {
  let edge = Infinity;
  for (const w of WATER_XY) {
    for (let i = 0; i < w.pts.length - 1; i += 1) {
      edge = Math.min(edge, distToSegment(x, y, w.pts[i], w.pts[i + 1]) - w.r);
    }
  }
  return Math.max(0, Math.min(1, (edge + 0.0006) / 0.0016));
}

// Precomputed once: the grid in map units with each dot's landness.
const STEP = 0.00112;
const WATER_GRID = [];
const GRID = (() => {
  const dots = [];
  for (let y = STEP / 2; y < MAP_H; y += STEP) {
    for (let x = STEP / 2; x < MAP_W; x += STEP) {
      // The map dissolves into the paper toward its edges, like the globe's rim.
      const d = Math.hypot((x / MAP_W - 0.5) * 2, (y / MAP_H - 0.5) * 2);
      const fade = Math.max(0, Math.min(1, (1.12 - d) / 0.42));
      const land = landness(x, y) * fade;
      if (land > 0.04) dots.push([x, y, land]);
      // Every other water dot only, so the water stays open next to the land.
      else if (fade > 0.25 && Math.round(x / STEP + y / STEP) % 2 === 0) WATER_GRID.push([x, y, fade]);
    }
  }
  return dots;
})();

// Listings carry no coordinates yet, so each one is placed in its district: a
// spot picked from its id (the same every time), tried until it lands on land.
function hashSeed(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function listingGeo(listing) {
  if (Number.isFinite(listing?.lat) && Number.isFinite(listing?.lng)) return { lat: listing.lat, lng: listing.lng };
  const base = DISTRICT_GEO[listing?.district] || { lat: 59.3293, lng: 18.0686 };
  const [bx, by] = project(base.lat, base.lng);
  let seed = hashSeed(String(listing?.id ?? listing?.title ?? "lokal"));
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const angle = ((seed % 360) * Math.PI) / 180;
    const radius = 0.0012 + ((seed >>> 9) % 100) / 100 * 0.0042;
    const x = bx + Math.cos(angle) * radius;
    const y = by + Math.sin(angle) * radius * 0.8;
    if (landness(x, y) > 0.85) return unproject(x, y);
    seed = hashSeed(String(seed));
  }
  return base;
}

// `points` ({ id, lat, lng, label, title }) are lokaler drawn as dots of their own;
// `districts` is how the six areas show: "pins" (labelled, with counts), "quiet"
// (small grey names) or "none".
export default function DotMap({
  counts = {},
  active,
  onSelect,
  compact = false,
  districts: districtMode = "pins",
  points = [],
  selectedId,
  hoverId,
  onPointSelect,
  onPointHover,
  className = ""
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(null);

  const districts = useMemo(
    () =>
      Object.entries(DISTRICT_GEO).map(([name, geo]) => {
        const [x, y] = project(geo.lat, geo.lng);
        return { name, x, y, count: counts[name] ?? 0 };
      }),
    [counts]
  );

  const projected = useMemo(
    () =>
      points.map((point) => {
        const [x, y] = project(point.lat, point.lng);
        return { ...point, x, y };
      }),
    [points]
  );
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !ctx) return undefined;

    const reduce = prefersReducedMotion();
    const pointer = { x: -1, y: -1, energy: 0, inside: false };
    let w = 0;
    let h = 0;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    // The dots take the page's ink (light on the app's dark theme).
    let dotColor = "rgb(20, 26, 43)";
    const start = performance.now();
    const focus = active ? DISTRICT_GEO[active] : null;
    const focusXY = focus ? project(focus.lat, focus.lng) : null;

    function resize() {
      const rect = wrap.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dotColor = getComputedStyle(wrap).getPropertyValue("--ink").trim() || dotColor;
      scale = Math.min(w / MAP_W, h / MAP_H);
      ox = (w - MAP_W * scale) / 2;
      oy = (h - MAP_H * scale) / 2;
      setFrame({ scale, ox, oy });
      draw(performance.now());
    }

    function draw(now) {
      const t = (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const base = Math.max(0.8, Math.min(1.6, scale * STEP * 0.27));
      pointer.energy += ((pointer.inside ? 1 : 0) - pointer.energy) * 0.08;

      for (const [mx, my, land] of GRID) {
        const x = ox + mx * scale;
        const y = oy + my * scale;
        // A slow diagonal wave of light.
        const wave = reduce ? 0 : 0.5 + 0.5 * Math.sin(mx * 95 + my * 70 - t * 0.9);
        let r = base * (0.75 + 0.25 * land);
        let a = (0.2 + 0.24 * wave) * land;
        if (focusXY) {
          const d = Math.hypot(mx - focusXY[0], my - focusXY[1]);
          const near = Math.max(0, 1 - d / 0.012);
          a += near * 0.45;
          r += near * base * 0.5;
        }
        if (pointer.energy > 0.01) {
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          const lift = Math.max(0, 1 - d / 90) * pointer.energy;
          r += lift * base * 1.1;
          a += lift * 0.45;
        }
        ctx.globalAlpha = Math.min(0.95, a);
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // The water: smaller, fainter dots in a cool grey-blue.
      ctx.fillStyle = "rgb(74, 112, 158)";
      for (const [mx, my, fade] of WATER_GRID) {
        const wave = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(mx * 60 - my * 40 + t * 0.6);
        ctx.globalAlpha = (0.05 + 0.05 * wave) * fade;
        ctx.beginPath();
        ctx.arc(ox + mx * scale, oy + my * scale, base * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (visible) draw(now);
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(wrap);

    const onMove = (event) => {
      const rect = wrap.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    if (!reduce) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [active]);

  const place = (x, y) => ({ left: frame.ox + x * frame.scale, top: frame.oy + y * frame.scale });
  const quiet = districtMode === "quiet" || !onSelect;

  return (
    <div ref={wrapRef} className={`lo-map${compact ? " lo-map--compact" : ""}${projected.length ? " has-points" : ""} ${className}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
      {frame ? (
        <>
          {WATER_LABELS.map((water) => {
            const [x, y] = project(water.lat, water.lng);
            return (
              <span key={water.name} className="lo-water" style={place(x, y)} aria-hidden="true">
                {water.name}
              </span>
            );
          })}
          {LAND_LABELS.map((land) => {
            const [x, y] = project(land.lat, land.lng);
            return (
              <span key={land.name} className="lo-land" style={place(x, y)} aria-hidden="true">
                {land.name}
              </span>
            );
          })}
          <p className="lo-map-title">
            <strong>Stockholm</strong>
            <span>59°20′ N · 18°04′ E</span>
          </p>
          <span className="lo-map-north" aria-hidden="true">
            N
          </span>
          <span className="lo-map-scale" aria-hidden="true">
            <span className="lo-map-scale-bar" style={{ width: Math.round(KM * frame.scale) }} />
            1 km
          </span>
        </>
      ) : null}
      {frame && districtMode !== "none"
        ? districts.map((d) => {
            const style = place(d.x, d.y);
            const isActive = active === d.name;
            const side = LEFT_LABELS.has(d.name) ? " is-left" : "";
            const label = (
              <>
                <span className="lo-pin-dot" aria-hidden="true" />
                <span className="lo-pin-text">
                  {d.name}
                  {compact || quiet ? null : <span className="lo-pin-count">{d.count}</span>}
                </span>
              </>
            );
            return onSelect ? (
              <button
                key={d.name}
                type="button"
                className={`lo-pin${side}${isActive ? " is-active" : ""}${quiet ? " is-quiet" : ""}${d.count ? "" : " is-empty"}`}
                style={style}
                onClick={() => onSelect(d.name)}
                aria-pressed={isActive}
                aria-label={`${d.name}, ${d.count} ${d.count === 1 ? "lokal" : "lokaler"}`}
              >
                {label}
              </button>
            ) : (
              <span key={d.name} className={`lo-pin${side}${isActive ? " is-active" : " is-quiet"}`} style={style}>
                {label}
              </span>
            );
          })
        : null}
      {frame
        ? projected.map((point) => {
            const isSelected = point.id === selectedId;
            const isHover = point.id === hoverId;
            return (
              <button
                key={point.id}
                type="button"
                className={`lo-spot${isSelected ? " is-selected" : ""}${isHover ? " is-hover" : ""}`}
                style={place(point.x, point.y)}
                onClick={() => onPointSelect?.(point.id)}
                onMouseEnter={() => onPointHover?.(point.id)}
                onMouseLeave={() => onPointHover?.(null)}
                onFocus={() => onPointHover?.(point.id)}
                onBlur={() => onPointHover?.(null)}
                aria-pressed={isSelected}
                aria-label={`${point.title}, ${point.label}`}
              >
                <span className="lo-spot-dot" aria-hidden="true" />
                <span className="lo-spot-label" aria-hidden="true">
                  {point.label}
                </span>
              </button>
            );
          })
        : null}
    </div>
  );
}
