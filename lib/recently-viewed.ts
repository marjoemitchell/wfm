const KEY = "wfm:recently-viewed";
const MAX_STORED = 10;

export function getRecentlyViewed(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function recordView(slug: string): void {
  try {
    const existing = getRecentlyViewed().filter((s) => s !== slug);
    const next = [slug, ...existing].slice(0, MAX_STORED);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing, blocked, etc.), fine to no-op.
  }
}
