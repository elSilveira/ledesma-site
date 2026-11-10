export const GA_MEASUREMENT_ID = "G-QZ8X5K9V2R";
export const GTM_CONTAINER_ID = "GTM-KTV9BVKV";
export const ANALYTICS_CONSENT_KEY = "ledesma-consent-v1";
export const OPEN_COOKIE_PREFERENCES_EVENT = "ledesma:open-cookie-preferences";

/**
 * Executado no <head>, antes de qualquer tag Google. Mantém o modo básico de
 * consentimento: o GTM e suas tags só serão baixados depois da autorização.
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

const GTM_SCRIPT_ID = "ledesma-google-tag-manager";
let tagManagerLoadPromise: Promise<void> | null = null;
let tagManagerStarted = false;

export function initializeGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    // Mantém o formato nativo do gtag, inclusive quando o head não executou.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
}

/** Único carregador Google do site: o contêiner existente gerencia GA4 e Ads. */
export function loadGoogleTagManager(consent: AnalyticsConsent | null): Promise<void> {
  if (consent !== "accepted") return Promise.resolve();
  initializeGtag();
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  if (tagManagerLoadPromise) return tagManagerLoadPromise;
  tagManagerLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(GTM_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }
    const script = existing || document.createElement("script");
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => {
      script.remove();
      tagManagerLoadPromise = null;
      reject(new Error("Não foi possível carregar o Google Tag Manager."));
    }, { once: true });
    if (existing) return;
    script.id = GTM_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
    if (!tagManagerStarted) {
      window.dataLayer?.push({ "gtm.start": Date.now(), event: "gtm.js" });
      tagManagerStarted = true;
    }
    document.head.appendChild(script);
  });
  return tagManagerLoadPromise;
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
