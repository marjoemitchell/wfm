"use client";

import { useEffect, useState } from "react";

const KOFI_USERNAME = "whofundsmontana";

export default function SupportButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-nav-tab my-auto shrink-0 whitespace-nowrap bg-accent px-4 py-[8px] text-ground hover:bg-accent-hover"
      >
        ☕ Support the project
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-[440px] overflow-y-auto bg-ground-panel p-5 sm:p-8"
            style={{ border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <span className="text-eyebrow text-accent">Support the project</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink-quiet hover:text-ink"
              >
                ×
              </button>
            </div>

            <h2
              className="mt-2 text-ink"
              style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.02em" }}
            >
              Always free, no advertisements.
            </h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-ink-secondary">
              This site is built by a local Montanan. If you want to help support this project and keep it alive,
              please consider donating. Any little bit helps with maintenance and server costs.
            </p>

            <a
              href={`https://ko-fi.com/${KOFI_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-btn-cta mt-5 block bg-accent px-[26px] py-[14px] text-center text-ground hover:bg-accent-hover"
            >
              Donate on Ko-fi ↗
            </a>

            <iframe
              id="kofiframe"
              src={`https://ko-fi.com/${KOFI_USERNAME}/?hidefeed=true&widget=true&embed=true`}
              className="mt-5 w-full"
              style={{ border: "none", padding: 4, background: "#f9f9f9" }}
              height={500}
              title={KOFI_USERNAME}
            />
          </div>
        </div>
      )}
    </>
  );
}
