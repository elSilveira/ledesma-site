export const GA_MEASUREMENT_ID = "G-F954XFDV9M";
export const ANALYTICS_CONSENT_KEY = "ledesma-consent-v1";
export const OPEN_COOKIE_PREFERENCES_EVENT = "ledesma:open-cookie-preferences";

export type AnalyticsConsent = "accepted" | "rejected";

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

/** Registra uma intenção de contato sem enviar número, e-mail ou mensagem ao GA4. */
export function trackContactClick(channel: "whatsapp" | "telephone" | "email", location = "page") {
  if (getAnalyticsConsent() !== "accepted") return;
  window.gtag?.("event", `click_${channel}`, {
    contact_channel: channel,
    contact_location: location,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}
