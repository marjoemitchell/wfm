export type MapBubble = {
  city: string;
  amount: number;
  x: number;
  y: number;
  radius: number;
};

export type MapLabel = MapBubble & { labelY: number };

/**
 * Pushes labels down when they'd overlap a previously placed one, per the
 * design spec: sort by y ascending, and if |dx| < 120 and dy < 34 (viewBox
 * units), drop the label to previous.labelY + 34. The leader line absorbs
 * the offset.
 */
export function layoutCityLabels(bubbles: MapBubble[], maxY = 300): MapLabel[] {
  const sorted = [...bubbles].sort((a, b) => a.y - b.y);
  const placed: MapLabel[] = [];

  for (const bubble of sorted) {
    let labelY = bubble.y;
    for (const prev of placed) {
      if (Math.abs(bubble.x - prev.x) < 120 && Math.abs(labelY - prev.labelY) < 34) {
        labelY = prev.labelY + 34;
      }
    }
    // Once a dense cluster has nowhere left to go, accept a little label
    // overlap rather than cascading the whole column off the map.
    if (labelY > maxY - 10) labelY = bubble.y + 12;
    placed.push({ ...bubble, labelY });
  }

  return placed;
}

export function bubbleRadius(amount: number, maxAmount: number): number {
  if (maxAmount <= 0) return 8;
  return 8 + Math.sqrt(amount / maxAmount) * 22;
}
