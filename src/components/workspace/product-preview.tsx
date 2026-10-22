import { Check, Layers3, MapPin } from "lucide-react";

export function ParcelIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 820 540"
      fill="none"
      role="img"
      aria-label="Illustrative concept showing a selected parcel, proposed buildings, and setbacks. Not a real property."
    >
      <defs>
        <pattern
          id="contour"
          width="90"
          height="90"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M-10 75C15 15 60 110 100 20M-20 50C15-10 75 90 110-5"
            stroke="#bbc6ad"
            strokeWidth=".7"
            opacity=".6"
          />
        </pattern>
        <pattern id="roof" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0V6" stroke="#f5f3dc" strokeOpacity=".22" />
        </pattern>
      </defs>
      <path fill="#cdd3bf" d="M0 0h820v540H0z" />
      <path fill="url(#contour)" d="M0 0h820v540H0z" />
      <g fill="#aebda1" opacity=".65">
        <path d="m0 40 186-40 65 123L0 186Z" />
        <path d="m611 0 209 0v169l-165-43Z" />
        <path d="m0 387 171-44 88 197H0Z" />
        <path d="m621 354 199-52v238H690Z" />
      </g>
      <g stroke="#f6f3e9" strokeWidth="33">
        <path d="m-25 297 870-227" />
        <path d="m193-30 242 600" />
        <path d="m-10 510 870-220" />
      </g>
      <g stroke="#bdbfb4" strokeWidth="1">
        <path d="m-25 297 870-227" />
        <path d="m193-30 242 600" />
        <path d="m-10 510 870-220" />
      </g>
      <g fill="#e4e2d5" stroke="#afb3a3" strokeWidth="1.5">
        <path d="m20 140 80-21 19 49-81 23Z" />
        <path d="m121 104 64-17 21 50-64 17Z" />
        <path d="m462 20 63-16 26 62-64 17Z" />
        <path d="m591 147 66-17 24 58-69 17Z" />
        <path d="m708 173 70-18 25 60-70 18Z" />
        <path d="m80 332 70-18 25 57-71 18Z" />
        <path d="m490 399 76-20 27 64-76 20Z" />
        <path d="m634 411 77-21 27 62-79 20Z" />
        <path d="m452 470 64-17 19 46-66 17Z" />
      </g>
      <g fill="#899e7c" opacity=".65">
        {[
          [76, 55],
          [152, 227],
          [65, 425],
          [517, 99],
          [729, 46],
          [768, 267],
          [587, 488],
          [750, 480],
          [293, 88],
          [566, 294],
          [278, 468],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="17" />
            <circle cx={cx + 9} cy={cy - 7} r="13" />
          </g>
        ))}
      </g>
      <path
        d="m321 209 216-57 68 163-216 57Z"
        fill="#e1e8bb"
        fillOpacity=".5"
        stroke="#49654b"
        strokeWidth="2.5"
      />
      <path
        d="m341 223 185-49 53 127-185 49Z"
        stroke="#75814e"
        strokeWidth="1.5"
        strokeDasharray="6 5"
      />
      <path d="m371 234 146-39 31 75-146 39Z" fill="#315647" />
      <path d="m371 234 146-39 31 75-146 39Z" fill="url(#roof)" />
      <path
        d="m409 224 31 75m5-84 31 75m4-84 31 75"
        stroke="#e8ecd5"
        strokeWidth="1.4"
      />
      <path d="m410 321 143-38 13 31-143 38Z" fill="#d5d3bf" />
      <g stroke="#f8f6e9" strokeWidth="1.5">
        <path d="m429 316 10 25m8-30 10 25m8-30 10 25m8-30 10 25m8-30 10 25m8-30 10 25" />
      </g>
      <g fill="#f6f4ec" stroke="#315647" strokeWidth="2">
        {[
          [321, 209],
          [537, 152],
          [605, 315],
          [389, 372],
        ].map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="4" />
        ))}
      </g>
      <g fontFamily="system-ui" fontSize="10" fill="#71776b" letterSpacing="3">
        <text transform="translate(42 286) rotate(-15)">GROVE STREET</text>
        <text transform="translate(408 503) rotate(-15)">NORTH AVENUE</text>
      </g>
      <g transform="translate(748 398)">
        <circle r="25" fill="#f6f4ec" fillOpacity=".95" />
        <path d="m0-14-6 19 6-4 6 4-6-19Z" fill="#315647" />
        <text y="43" x="-3" fontFamily="system-ui" fontSize="10" fill="#315647">
          N
        </text>
      </g>
    </svg>
  );
}

export function ProductPreview() {
  return (
    <div className="product-preview">
      <div className="flex items-center justify-between border-b bg-white/90 px-5 py-3">
        <span className="flex items-center gap-2 text-xs font-medium">
          <span className="size-2 rounded-full bg-primary" />A little land. A
          lot of possibility.
        </span>
        <span className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">
          Product illustration
        </span>
      </div>
      <div className="relative overflow-hidden">
        <ParcelIllustration className="h-full min-h-80 w-full object-cover" />
        <div className="absolute left-4 top-4 rounded-xl border border-white/70 bg-white/95 p-3 shadow-sm sm:left-6 sm:top-6">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <MapPin className="size-3.5 text-primary" />
            Your next possibility
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Townhome concept · 4 homes
          </p>
        </div>
        <div className="absolute bottom-5 left-5 rounded-xl bg-white/95 px-3 py-2 shadow-sm">
          <p className="flex items-center gap-2 text-[11px] font-medium">
            <Layers3 className="size-3.5" />
            Conceptual Site Plan
          </p>
          <div className="mt-2 flex gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <i className="size-2 rounded-sm border border-primary" />
              Parcel
            </span>
            <span className="flex items-center gap-1">
              <i className="size-2 rounded-sm bg-primary" />
              Proposed structure
            </span>
          </div>
        </div>
        <span className="absolute right-4 top-4 rounded-lg bg-white/90 px-3 py-2 text-[9px] tracking-wider text-muted-foreground">
          CONCEPT VIEW
        </span>
      </div>
      <div className="flex items-center gap-4 bg-white px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-medium">
            From big idea to clear next step.
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Property → local rules → concept → development plan
          </p>
        </div>
        <div className="hidden w-24 sm:block">
          <div className="h-1 rounded-full bg-muted">
            <div className="h-1 w-2/3 rounded-full bg-primary" />
          </div>
          <p className="mt-1 text-right text-[9px] text-muted-foreground">
            Illustrative progress
          </p>
        </div>
      </div>
    </div>
  );
}
