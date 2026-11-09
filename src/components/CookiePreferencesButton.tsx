"use client";

import { OPEN_COOKIE_PREFERENCES_EVENT } from "@/lib/analytics";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}
      className="shrink-0 text-left transition-colors hover:text-gold"
    >
      Preferências de cookies
    </button>
  );
}
