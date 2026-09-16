"use client";

import { useState } from "react";
import { money } from "@/lib/format";

export type StateTableRow = { postal: string; name: string; amount: number };

type SortKey = "name" | "amount";

// A text equivalent of the choropleth above it, for screen reader and
// keyboard users a colored SVG can't reach on its own: every state that
// has data, sortable the same two ways the map's own shading and postal
// labels let a sighted user compare.
export default function StateTable({ rows }: { rows: StateTableRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [ascending, setAscending] = useState(false);

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setAscending((a) => !a);
    } else {
      setSortKey(key);
      setAscending(key === "name");
    }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = sortKey === "name" ? a.name.localeCompare(b.name) : a.amount - b.amount;
    return ascending ? diff : -diff;
  });

  const headerClass = (key: SortKey) =>
    `text-[12.6px] uppercase tracking-[0.12em] ${sortKey === key ? "text-accent" : "text-ink-quiet"}`;
  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" =>
    sortKey === key ? (ascending ? "ascending" : "descending") : "none";

  return (
    <table className="mt-6 w-full max-h-[420px] overflow-y-auto text-left">
      <caption className="sr-only">Itemized contributions by state, sortable by state or amount</caption>
      <thead className="sticky top-0 bg-ground">
        <tr className="border-b border-rule">
          <th scope="col" aria-sort={ariaSort("name")} className="pb-3">
            <button type="button" onClick={() => sortBy("name")} className={headerClass("name")}>
              State{sortKey === "name" ? (ascending ? " ▲" : " ▼") : ""}
            </button>
          </th>
          <th scope="col" aria-sort={ariaSort("amount")} className="pb-3 text-right">
            <button type="button" onClick={() => sortBy("amount")} className={headerClass("amount")}>
              Amount{sortKey === "amount" ? (ascending ? " ▲" : " ▼") : ""}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={row.postal} className="border-b border-rule-faint">
            <td className="py-2 text-[15.6px] text-ink-secondary">{row.name}</td>
            <td className="py-2 text-right text-[15.6px] tabular-nums text-ink">{money(row.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
