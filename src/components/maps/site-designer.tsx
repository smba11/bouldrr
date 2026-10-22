"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Check,
  Layers3,
  MousePointer2,
  Plus,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import { MapPanel } from "@/components/maps/map-panel";
import { SourceBadge } from "@/components/workspace/primitives";
import {
  featureTypes,
  defaultConcept,
  mapGeometry,
  toCanvas,
  toGeographic,
  type MapFeature,
  type DisplayMapFeature,
  type FeatureType,
  type Geometry,
  type Anchor,
  type ConceptConfiguration,
} from "@/lib/site-design";
import { saveSiteDesignAction } from "@/lib/actions/site-design";
type Tool = "select" | "polygon" | "rectangle" | "line" | "marker";
type Props = {
  projectId: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  initialFeatures: MapFeature[];
  sourceFeatures: DisplayMapFeature[];
  initialRevision: number;
  initialConfiguration: ConceptConfiguration;
  initialMode?: "view" | "design" | "analyze";
};
type Point = [number, number];
export function SiteDesigner({
  projectId,
  address,
  latitude,
  longitude,
  initialFeatures,
  sourceFeatures,
  initialRevision,
  initialConfiguration,
  initialMode = "view",
}: Props) {
  const [features, setFeatures] = useState(initialFeatures);
  const [revision, setRevision] = useState(initialRevision);
  const [configuration, setConfiguration] = useState(
    initialConfiguration ?? defaultConcept,
  );
  const [mode, setMode] = useState(initialMode);
  const [previousMode, setPreviousMode] = useState(initialMode);
  if (previousMode !== initialMode) {
    setPreviousMode(initialMode);
    setMode(initialMode);
  }
  const [tool, setTool] = useState<Tool>("select");
  const [semantic, setSemantic] = useState<FeatureType>("building");
  const [selectedId, setSelected] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<MapFeature[][]>([]);
  const [sketch, setSketch] = useState(false);
  const [hidden, setHidden] = useState<FeatureType[]>([]);
  const [keyboardPoint, setKeyboardPoint] = useState<Point>([50, 31.25]);
  const svg = useRef<SVGSVGElement>(null);
  const latestFeatures = useRef(features);
  useEffect(() => {
    latestFeatures.current = features;
  }, [features]);
  const drag = useRef<{
    id: string;
    start: Point;
    original: Geometry;
    moved?: boolean;
  } | null>(null);
  const anchor: Anchor =
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : null;

  const selected = features.find((f) => f.id === selectedId);
  const live = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && !!anchor;
  useEffect(() => {
    if (!dirty) return;
    function unload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [dirty]);
  function remember() {
    setHistory((h) => [...h.slice(-19), features]);
    setDirty(true);
    setMessage("");
  }
  function addFeature(geometry: Geometry, name?: string, type = semantic) {
    remember();
    const f: MapFeature = {
      id: crypto.randomUUID(),
      name: name ?? featureTypes[type].label,
      feature_type: type,
      geometry: mapGeometry(geometry, (p) => toGeographic(p, anchor)),
      coordinate_space: anchor ? "wgs84" : "local_meters",
      provenance: "user",
    };
    setFeatures((current) => [...current.filter((x) => x.id !== f.id), f]);
    setSelected(f.id);
    setTool("select");
    setPoints([]);
  }
  function place(p: Point) {
    if (saving || mode !== "design" || tool === "select") return;
    if (tool === "marker") {
      addFeature({ type: "Point", coordinates: p });
      return;
    }
    if (tool === "rectangle" && points.length) {
      const [a, b] = points[0];
      const [c, d] = p;
      if (Math.abs(a - c) < 1 || Math.abs(b - d) < 1) return;
      addFeature({
        type: "Polygon",
        coordinates: [
          [
            [a, b],
            [c, b],
            [c, d],
            [a, d],
            [a, b],
          ],
        ],
      });
      return;
    }
    setPoints((old) => [...old, p]);
  }
  function finish() {
    if (tool === "polygon" && points.length >= 3)
      addFeature({ type: "Polygon", coordinates: [[...points, points[0]]] });
    else if (tool === "line" && points.length >= 2)
      addFeature({ type: "LineString", coordinates: points });
  }
  const mapChange = useCallback((id: string, geometry: Geometry) => {
    setFeatures((current) =>
      current.map((f) => (f.id === id ? { ...f, geometry } : f)),
    );
    setDirty(true);
    setMessage("");
  }, []);
  const commitMapChange = useCallback((id: string, geometry: Geometry) => {
    const current = latestFeatures.current;
    const feature = current.find((f) => f.id === id);
    if (!feature || JSON.stringify(feature.geometry) === JSON.stringify(geometry))
      return;
    const next = current.map((f) => (f.id === id ? { ...f, geometry } : f));
    latestFeatures.current = next;
    setHistory((h) => [...h.slice(-19), current]);
    setFeatures(next);
    setDirty(true);
    setMessage("");
  }, []);
  const selectFeature = useCallback((id: string) => {
    setSelected(id);
  }, []);
  function moveSelected(dx: number, dy: number, scale = 1) {
    if (!selected) return;
    remember();
    const g = mapGeometry(selected.geometry, (p) =>
      toCanvas(p, anchor, selected.coordinate_space),
    );
    const list =
      g.type === "Point"
        ? [g.coordinates]
        : g.type === "LineString"
          ? g.coordinates
          : g.coordinates[0].slice(0, -1);
    const cx = list.reduce((s, p) => s + p[0], 0) / list.length;
    const cy = list.reduce((s, p) => s + p[1], 0) / list.length;
    const adjusted = mapGeometry(g, ([x, y]) => [
      cx + (x - cx) * scale + dx,
      cy + (y - cy) * scale + dy,
    ]);
    setFeatures((current) =>
      current.map((f) =>
        f.id === selected.id
          ? {
              ...f,
              geometry: mapGeometry(adjusted, (p) => toGeographic(p, anchor)),
              coordinate_space: anchor ? "wgs84" : "local_meters",
            }
          : f,
      ),
    );
  }
  function pointer(e: ReactPointerEvent<SVGSVGElement>): Point {
    const r = svg.current!.getBoundingClientRect();
    return [
      ((e.clientX - r.left) / r.width) * 800,
      ((e.clientY - r.top) / r.height) * 500,
    ];
  }
  function generate() {
    const w = Math.min(450, Math.sqrt(configuration.footprint * 2.4) * 8),
      h = (configuration.footprint * 64) / w;
    const left = 400 - w / 2,
      top = 220 - h / 2;
    const structure: MapFeature = {
      id: crypto.randomUUID(),
      name:
        configuration.buildingType +
        " · " +
        configuration.units +
        " units · " +
        configuration.floors +
        " floors",
      feature_type: "building",
      coordinate_space: anchor ? "wgs84" : "local_meters",
      provenance: "user",
      geometry: mapGeometry(
        {
          type: "Polygon",
          coordinates: [
            [
              [left, top],
              [left + w, top],
              [left + w, top + h],
              [left, top + h],
              [left, top],
            ],
          ],
        },
        (p) => toGeographic(p, anchor),
      ),
    };
    const additions = [structure];
    if (configuration.parking > 0) {
      const pw = Math.min(600, configuration.parking * 20);
      additions.push({
        id: crypto.randomUUID(),
        name: configuration.parking + " parking spaces · concept",
        feature_type: "parking",
        coordinate_space: anchor ? "wgs84" : "local_meters",
        provenance: "user",
        geometry: mapGeometry(
          {
            type: "Polygon",
            coordinates: [
              [
                [400 - pw / 2, top + h + 25],
                [400 + pw / 2, top + h + 25],
                [400 + pw / 2, top + h + 65],
                [400 - pw / 2, top + h + 65],
                [400 - pw / 2, top + h + 25],
              ],
            ],
          },
          (p) => toGeographic(p, anchor),
        ),
      });
    }
    remember();
    setFeatures((f) => [...f, ...additions]);
    setSelected(structure.id);
    setTool("select");
    setPoints([]);
    setMessage("Concept placed. Select it to move, resize, or rename.");
  }
  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await saveSiteDesignAction({
        projectId,
        revision,
        configuration,
        features,
      });
      if (result.error) setError(result.error);
      else {
        setRevision(result.revision!);
        setDirty(false);
        setMessage("Site concept saved.");
      }
    } catch {
      setError(
        "We couldn’t connect. Your changes are still here; try saving again.",
      );
    } finally {
      setSaving(false);
    }
  }
  const allFeatures: DisplayMapFeature[] = [...sourceFeatures, ...features];
  const visible = allFeatures.filter((f) => !hidden.includes(f.feature_type));
  const draft: MapFeature | undefined =
    points.length >= 2
      ? {
          id: "draft",
          name: "Drawing",
          feature_type: semantic,
          provenance: "user",
          coordinate_space: anchor ? "wgs84" : "local_meters",
          geometry: mapGeometry(
            { type: "LineString", coordinates: points },
            (p) => toGeographic(p, anchor),
          ),
        }
      : undefined;
  return (
    <fieldset
      disabled={saving}
      aria-busy={saving}
      aria-label="Property workspace"
      className="min-w-0 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-lg border bg-white p-1"
          role="group"
          aria-label="Property workspace mode"
        >
          {(["view", "design", "analyze"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setTool("select");
                setPoints([]);
              }}
              aria-pressed={mode === m}
              className="map-tool capitalize"
            >
              {m === "view"
                ? "Property"
                : m === "design"
                  ? "Site concept"
                  : "Analyze"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {mode === "design" && live && (
            <button
              className="button-secondary"
              onClick={() => setSketch((v) => !v)}
            >
              {sketch ? "Map canvas" : "Sketch canvas"}
            </button>
          )}
          {mode === "design" && (
            <button
              className="button-primary"
              disabled={saving || !dirty}
              onClick={save}
            >
              <Save className="size-3.5" />
              {saving ? "Saving…" : dirty ? "Save concept" : "Saved"}
            </button>
          )}
        </div>
      </div>
      {mode !== "design" ? (
        <MapPanel
          address={address}
          latitude={latitude}
          longitude={longitude}
          features={visible}
        />
      ) : (
        <div className="designer-grid">
          <div className="min-w-0 space-y-3">
            <div
              className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-white p-2"
              role="group"
              aria-label="Drawing tools"
            >
              {(
                ["select", "polygon", "rectangle", "line", "marker"] as Tool[]
              ).map((t) => (
                <button
                  className="map-tool capitalize"
                  key={t}
                  aria-pressed={tool === t}
                  disabled={saving}
                  onClick={() => {
                    setTool(t);
                    setPoints([]);
                  }}
                >
                  {t === "select" && (
                    <MousePointer2 className="mr-1 inline size-3" />
                  )}
                  {t}
                </button>
              ))}
              <button
                className="map-tool"
                disabled={!history.length || saving}
                onClick={() => {
                  const prior = history.at(-1);
                  if (prior) {
                    setFeatures(prior);
                    setHistory((h) => h.slice(0, -1));
                    setSelected(null);
                    setDirty(true);
                  }
                }}
              >
                <Undo2 className="mr-1 inline size-3" />
                Undo
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-primary">
                Conceptual Site Plan
              </span>
              <SourceBadge type="user" />
            </div>
            {live && !sketch ? (
              <MapPanel
                address={address}
                latitude={latitude}
                longitude={longitude}
                features={draft ? [...visible, draft] : visible}
                selectedId={selectedId}
                drawing={tool !== "select"}
                onMapClick={(p) => place(toCanvas(p, anchor, "wgs84"))}
                onSelect={selectFeature}
                onFeatureChange={saving ? undefined : commitMapChange}
              />
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <svg
                  ref={svg}
                  viewBox="0 0 800 500"
                  preserveAspectRatio="none"
                  className={
                    "concept-canvas" + (saving ? " pointer-events-none" : "")
                  }
                  role="group"
                  aria-label="Concept sketch canvas"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    const movements: Record<string, Point> = {
                      ArrowUp: [0, -8],
                      ArrowDown: [0, 8],
                      ArrowLeft: [-8, 0],
                      ArrowRight: [8, 0],
                    };
                    if (selected && movements[e.key]) {
                      e.preventDefault();
                      moveSelected(...movements[e.key]);
                    }
                    if (e.key === "Escape") {
                      setPoints([]);
                      setTool("select");
                    }
                  }}
                  onPointerDown={(e) => {
                    if (e.target === e.currentTarget) place(pointer(e));
                  }}
                  onPointerMove={(e) => {
                    if (!drag.current) return;
                    const p = pointer(e);
                    const d = drag.current;
                    if (!d.moved) {
                      remember();
                      d.moved = true;
                    }
                    const g = mapGeometry(d.original, ([x, y]) => [
                      x + p[0] - d.start[0],
                      y + p[1] - d.start[1],
                    ]);
                    mapChange(
                      d.id,
                      mapGeometry(g, (p) => toGeographic(p, anchor)),
                    );
                  }}
                  onPointerUp={() => {
                    drag.current = null;
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                  }}
                >
                  {visible.map((f) => {
                    const g = mapGeometry(f.geometry, (p) =>
                      toCanvas(p, anchor, f.coordinate_space),
                    );
                    const color = featureTypes[f.feature_type].color;
                    return (
                      <g
                        key={f.id}
                        role="button"
                        tabIndex={0}
                        aria-label={"Select " + f.name}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(f.id);
                          }
                        }}
                        onPointerDown={(e) => {
                          if (f.provenance !== "user" && tool === "select") {
                            setMessage(
                              f.name +
                                " · " +
                                f.provenance +
                                " source · read only",
                            );
                            return;
                          }
                          if (tool !== "select") {
                            place(
                              pointer(
                                e as unknown as ReactPointerEvent<SVGSVGElement>,
                              ),
                            );
                            return;
                          }
                          e.stopPropagation();
                          setSelected(f.id);
                          const r = svg.current!.getBoundingClientRect();
                          const start: Point = [
                            ((e.clientX - r.left) / r.width) * 800,
                            ((e.clientY - r.top) / r.height) * 500,
                          ];
                          drag.current = { id: f.id, start, original: g };
                          svg.current?.setPointerCapture(e.pointerId);
                        }}
                        style={{
                          cursor: tool === "select" ? "move" : "crosshair",
                        }}
                      >
                        {g.type === "Point" ? (
                          <circle
                            cx={g.coordinates[0]}
                            cy={g.coordinates[1]}
                            r="7"
                            fill={color}
                            stroke="white"
                            strokeWidth="2"
                          />
                        ) : g.type === "Polygon" ? (
                          <polygon
                            points={g.coordinates[0]
                              .map((p) => p.join(","))
                              .join(" ")}
                            fill={color}
                            fillOpacity=".25"
                            stroke={color}
                            strokeWidth={f.id === selectedId ? 3 : 1.5}
                            strokeDasharray={
                              f.feature_type === "setback" ? "6 4" : undefined
                            }
                          />
                        ) : (
                          <polyline
                            points={g.coordinates
                              .map((p) => p.join(","))
                              .join(" ")}
                            fill="none"
                            stroke={color}
                            strokeWidth={f.id === selectedId ? 4 : 2}
                          />
                        )}
                        <title>
                          {f.name} · {f.provenance} source
                        </title>
                      </g>
                    );
                  })}
                  {points.length > 0 && (
                    <g pointerEvents="none">
                      <polyline
                        points={points.map((p) => p.join(",")).join(" ")}
                        fill="none"
                        stroke={featureTypes[semantic].color}
                        strokeWidth="2"
                        strokeDasharray="5 4"
                      />
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p[0]}
                          cy={p[1]}
                          r="4"
                          fill={featureTypes[semantic].color}
                        />
                      ))}
                    </g>
                  )}
                  <text
                    x="20"
                    y="477"
                    fill="#748268"
                    fontSize="11"
                    pointerEvents="none"
                  >
                    {anchor
                      ? "Concept sketch · anchored to saved coordinates"
                      : "Local concept sketch · not georeferenced"}
                  </text>
                  <text
                    x="650"
                    y="477"
                    fill="#748268"
                    fontSize="11"
                    pointerEvents="none"
                  >
                    Canvas width: 100 m
                  </text>
                </svg>
              </div>
            )}
            <p className="text-[11px] leading-6 text-muted-foreground">
              {tool === "select"
                ? "Select a shape to move it. On the map, drag vertex handles to resize. In the sketch, drag shapes or use arrow keys."
                : tool === "rectangle"
                  ? "Click two opposite corners."
                  : tool === "marker"
                    ? "Click once to place a marker."
                    : `Click to add points, then finish the ${tool}.`}
            </p>
            {(tool === "polygon" || tool === "line") && (
              <button
                className="button-secondary"
                onClick={finish}
                disabled={points.length < (tool === "polygon" ? 3 : 2)}
              >
                Finish {tool} <Check className="size-3.5" />
              </button>
            )}
            {tool !== "select" && (
              <details className="rounded-lg border p-3">
                <summary className="text-xs">
                  Place points with the keyboard
                </summary>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  {(["X", "Y"] as const).map((label, i) => (
                    <label key={label} className="text-xs">
                      {label} (m)
                      <input
                        className="field mt-1 max-w-24"
                        type="number"
                        step=".1"
                        value={keyboardPoint[i]}
                        onChange={(e) =>
                          setKeyboardPoint((p) =>
                            i === 0
                              ? [Number(e.target.value), p[1]]
                              : [p[0], Number(e.target.value)],
                          )
                        }
                      />
                    </label>
                  ))}
                  <button
                    className="button-secondary"
                    onClick={() =>
                      place([keyboardPoint[0] * 8, keyboardPoint[1] * 8])
                    }
                  >
                    Place point
                  </button>
                </div>
              </details>
            )}
            <p className="text-[10px] leading-5 text-muted-foreground">
              Sketches are concepts, not architectural plans or surveyed
              boundaries. Dimensions are approximate and do not establish
              compliance.
            </p>
          </div>
          <aside className="space-y-4">
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-4 text-xs font-semibold">Drawing type</h3>
              <label htmlFor="semantic-type" className="sr-only">
                New object type
              </label>
              <select
                id="semantic-type"
                className="field text-xs"
                value={semantic}
                onChange={(e) => setSemantic(e.target.value as FeatureType)}
              >
                {Object.entries(featureTypes).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
                Manually drawn setbacks and buildable areas remain user
                concepts, never verified rules.
              </p>
            </div>
            {selected && (
              <div className="space-y-3 rounded-xl border bg-white p-4">
                <h3 className="text-xs font-semibold">Selected object</h3>
                <label className="block text-xs">
                  Name
                  <input
                    className="field mt-2 text-xs"
                    maxLength={120}
                    value={selected.name}
                    onChange={(e) => {
                      setFeatures((f) =>
                        f.map((x) =>
                          x.id === selected.id
                            ? { ...x, name: e.target.value }
                            : x,
                        ),
                      );
                      setDirty(true);
                    }}
                  />
                </label>
                <label className="block text-xs">
                  Type
                  <select
                    className="field mt-2 text-xs"
                    value={selected.feature_type}
                    onChange={(e) => {
                      remember();
                      setFeatures((f) =>
                        f.map((x) =>
                          x.id === selected.id
                            ? {
                                ...x,
                                feature_type: e.target.value as FeatureType,
                              }
                            : x,
                        ),
                      );
                    }}
                  >
                    {Object.entries(featureTypes).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ["↑", 0, -8],
                      ["↓", 0, 8],
                      ["←", -8, 0],
                      ["→", 8, 0],
                    ] as const
                  ).map(([label, x, y]) => (
                    <button
                      key={label}
                      aria-label={
                        "Move selected object " +
                        {
                          "↑": "north",
                          "↓": "south",
                          "←": "west",
                          "→": "east",
                        }[label]
                      }
                      className="button-secondary px-3"
                      onClick={() => moveSelected(x, y)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    className="button-secondary flex-1 px-2 text-[10px]"
                    disabled={selected.geometry.type === "Point"}
                    onClick={() => moveSelected(0, 0, 0.9)}
                  >
                    Smaller
                  </button>
                  <button
                    className="button-secondary flex-1 px-2 text-[10px]"
                    disabled={selected.geometry.type === "Point"}
                    onClick={() => moveSelected(0, 0, 1.1)}
                  >
                    Larger
                  </button>
                </div>
                <button
                  className="flex min-h-10 items-center gap-2 text-xs text-destructive"
                  onClick={() => {
                    remember();
                    setFeatures((f) => f.filter((x) => x.id !== selected.id));
                    setSelected(null);
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete object
                </button>
              </div>
            )}
            <details
              className="rounded-xl border bg-white p-4"
              open={!features.length}
            >
              <summary className="text-xs font-semibold">
                Site Concept Designer
              </summary>
              <div className="mt-4 space-y-3">
                <label className="block text-xs">
                  Building type
                  <select
                    className="field mt-1 text-xs"
                    value={configuration.buildingType}
                    onChange={(e) => {
                      setConfiguration((c) => ({
                        ...c,
                        buildingType: e.target.value,
                      }));
                      setDirty(true);
                    }}
                  >
                    {[
                      "Townhomes",
                      "Single-family",
                      "ADU",
                      "Multifamily",
                      "Commercial",
                      "Other",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                {(
                  [
                    ["units", "Units", 1, 200],
                    ["floors", "Floors", 1, 60],
                    ["footprint", "Total footprint (m²)", 10, 100000],
                    ["parking", "Parking spaces", 0, 1000],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <label key={key} className="block text-xs">
                    {label}
                    <input
                      className="field mt-1 text-xs"
                      type="number"
                      min={min}
                      max={max}
                      value={configuration[key]}
                      onChange={(e) => {
                        setConfiguration((c) => ({
                          ...c,
                          [key]: Number(e.target.value),
                        }));
                        setDirty(true);
                      }}
                    />
                  </label>
                ))}
                <button
                  className="button-secondary w-full"
                  onClick={generate}
                  disabled={
                    configuration.units < 1 ||
                    configuration.floors < 1 ||
                    configuration.footprint < 10 ||
                    configuration.parking < 0 ||
                    configuration.units > 200 ||
                    configuration.floors > 60 ||
                    configuration.footprint > 100000 ||
                    configuration.parking > 1000
                  }
                >
                  <Plus className="size-3.5" />
                  Place concept
                </button>
                <p className="text-[10px] leading-5 text-muted-foreground">
                  A manual configuration, not a feasibility result. No AI is
                  required.
                </p>
              </div>
            </details>
          </aside>
        </div>
      )}
      {mode === "analyze" && (
        <div className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Parcel",
            "Zoning",
            "Flood",
            "Wetlands",
            "Terrain",
            "Utilities",
            "Nearby permits",
            "Development activity",
          ].map((layer) => (
            <div className="flex items-start gap-3" key={layer}>
              <input
                type="checkbox"
                disabled
                checked={false}
                readOnly
                aria-label={layer + " layer unavailable"}
              />
              <div>
                <p className="text-xs font-medium">{layer}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {layer === "Terrain" && live
                    ? "Available through map type control"
                    : "Data source not connected"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-medium">
            <Layers3 className="size-3.5" />
            Map legend
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {features.length} user objects · {sourceFeatures.length} sourced
            overlays
          </span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {(
            [
              "parcel_boundary",
              "setback",
              "restricted_area",
              "buildable_area",
              "building",
            ] as FeatureType[]
          ).map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 text-[10px] text-muted-foreground"
            >
              <input
                type="checkbox"
                disabled={!allFeatures.some((f) => f.feature_type === type)}
                checked={
                  !hidden.includes(type) &&
                  allFeatures.some((f) => f.feature_type === type)
                }
                onChange={() =>
                  setHidden((h) =>
                    h.includes(type)
                      ? h.filter((t) => t !== type)
                      : [...h, type],
                  )
                }
                aria-label={"Show " + featureTypes[type].label}
              />
              <span
                className="size-2 rounded-sm"
                style={{ background: featureTypes[type].color }}
              />
              {featureTypes[type].label}
              {!allFeatures.some((f) => f.feature_type === type) && (
                <span className="text-[9px]">· unavailable</span>
              )}
            </label>
          ))}
        </div>
      </div>
      {sourceFeatures.length > 0 && (
        <div className="space-y-3 rounded-xl border bg-white p-4">
          <h3 className="text-xs font-semibold">Connected source geometry</h3>
          {sourceFeatures.map((feature) => (
            <div
              key={feature.id}
              className="flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <span>{feature.name}</span>
              <SourceBadge type={feature.provenance} />
              {feature.source_url &&
                /^https?:\/\//.test(feature.source_url) && (
                  <a
                    href={feature.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Open geometry source
                  </a>
                )}
            </div>
          ))}
        </div>
      )}
      {features.length > 0 && mode === "design" && (
        <div className="flex flex-wrap gap-2" aria-label="Site objects">
          {features.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelected(f.id)}
              aria-pressed={selectedId === f.id}
              className="map-tool border bg-white"
            >
              <span
                className="mr-2 inline-block size-2 rounded-sm"
                style={{ background: featureTypes[f.feature_type].color }}
              />
              {f.name}
            </button>
          ))}
        </div>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </fieldset>
  );
}
