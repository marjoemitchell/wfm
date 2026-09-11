"use client";

import { useState } from "react";
import { MAP_VIEWBOX } from "@/lib/montana-geo";
import { money } from "@/lib/format";
import type { MapBubble, MapLabel } from "@/lib/map-layout";

export default function MontanaMapView({
  pathD,
  labeled,
  unlabeledBubbles,
}: {
  pathD: string;
  labeled: MapLabel[];
  unlabeledBubbles: MapBubble[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Labeled cities already show their name/amount permanently, so the
  // hover tooltip only applies to the unlabeled ones, otherwise it'd
  // just duplicate what's already on screen.
  const hoveredBubble = hovered ? unlabeledBubbles.find((b) => b.city === hovered) : undefined;

  function toggle(city: string) {
    setHovered((h) => (h === city ? null : city));
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`} width="100%">
        <path d={pathD} fill="var(--color-ground-panel)" stroke="var(--color-border)" strokeWidth={1} />
        {unlabeledBubbles.map((b) => (
          <circle
            key={b.city}
            cx={b.x}
            cy={b.y}
            r={b.radius}
            fill="var(--color-accent)"
            fillOpacity={hovered === b.city ? 0.4 : 0.18}
            stroke="var(--color-accent)"
            strokeWidth={1}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(b.city)}
            onMouseLeave={() => setHovered((h) => (h === b.city ? null : h))}
            onClick={() => toggle(b.city)}
          />
        ))}
        {labeled.map((b) => (
          <g key={b.city}>
            {b.labelY !== b.y && (
              <line
                x1={b.x}
                y1={b.y}
                x2={b.x}
                y2={b.labelY}
                stroke="var(--color-lead-line)"
                strokeWidth={0.75}
              />
            )}
            <circle cx={b.x} cy={b.y} r={b.radius} fill="var(--color-accent)" fillOpacity={0.18} stroke="var(--color-accent)" strokeWidth={1} />
            <circle cx={b.x} cy={b.y} r={2} fill="var(--color-accent)" />
          </g>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0">
        {labeled.map((b) => (
          <div
            key={b.city}
            className="absolute whitespace-nowrap"
            style={{
              left: `${(b.x / MAP_VIEWBOX.width) * 100}%`,
              top: `${(b.labelY / MAP_VIEWBOX.height) * 100}%`,
              transform: "translateY(-50%)",
            }}
          >
            <div className="text-[15.6px] text-ink">{b.city}</div>
            <div className="text-[15px] tabular-nums text-ink-secondary">{money(b.amount)}</div>
          </div>
        ))}
        {hoveredBubble && (
          <div
            className="absolute whitespace-nowrap bg-ground-panel px-2 py-1"
            style={{
              left: `${(hoveredBubble.x / MAP_VIEWBOX.width) * 100}%`,
              top: `${(hoveredBubble.y / MAP_VIEWBOX.height) * 100}%`,
              transform: `translate(-50%, calc(-100% - ${hoveredBubble.radius + 6}px))`,
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="text-[15.6px] text-ink">{hoveredBubble.city}</div>
            <div className="text-[15px] tabular-nums text-ink-secondary">{money(hoveredBubble.amount)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
