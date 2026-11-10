export const GA_MEASUREMENT_ID = "G-QZ8X5K9V2R";
export const ANALYTICS_CONSENT_KEY = "ledesma-consent-v1";
export const OPEN_COOKIE_PREFERENCES_EVENT = "ledesma:open-cookie-preferences";

/**
 * Executado no <head>, antes de qualquer tag Google. Mantém o modo básico de
 * consentimento: o gtag.js só será baixado depois da autorização.
 */
export const GOOGLE_CONSENT_DEFAULT_SCRIPT = `
(function(w){
  w.dataLayer=w.dataLayer||[];
  w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
  w.gtag('consent','default',{
    analytics_storage:'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    functionality_storage:'granted',
    security_storage:'granted',
    wait_for_update:500
  });
  w.gtag('set','ads_data_redaction',true);
})(window);`;

export type AnalyticsConsent = "accepted" | "rejected";

declare global {
  interface Window {
    dataLayer?: unknown[];
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
    send_to: GA_MEASUREMENT_ID,
    contact_channel: channel,
    contact_location: location,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}
