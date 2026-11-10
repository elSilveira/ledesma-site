"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ANALYTICS_CONSENT_KEY,
  type AnalyticsConsent,
  GA_MEASUREMENT_ID,
  getAnalyticsConsent,
  OPEN_COOKIE_PREFERENCES_EVENT,
  trackContactClick,
} from "@/lib/analytics";

const GA_SCRIPT_ID = "google-analytics-4";
let analyticsLoadPromise: Promise<void> | null = null;
let analyticsConfigured = false;

function initializeGtag() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
}

function loadGoogleAnalytics(): Promise<void> {
  initializeGtag();
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  if (!analyticsConfigured) {
    window.gtag?.("js", new Date());
    // O efeito de rota envia a visualização; o page_view automático ficaria duplicado.
    window.gtag?.("config", GA_MEASUREMENT_ID, { send_page_view: false });
    analyticsConfigured = true;
  }
  if (!analyticsLoadPromise) {
    analyticsLoadPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(GA_SCRIPT_ID) as HTMLScriptElement | null;
      if (existing?.dataset.loaded === "true") {
        resolve();
        return;
      }
      const script = existing || document.createElement("script");
      const onLoad = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      const onError = () => {
        script.remove();
        analyticsLoadPromise = null;
        reject(new Error("Não foi possível carregar o Google Analytics."));
      };
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      if (existing) return;
      script.id = GA_SCRIPT_ID;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    });
  }
  return analyticsLoadPromise;
}

function removeGoogleAnalyticsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || (name !== "_ga" && !name.startsWith("_ga_"))) continue;
    for (const domain of [undefined, window.location.hostname, `.${window.location.hostname}`]) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export function AnalyticsConsentManager() {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const lastPageRef = useRef<string | null>(null);

  useEffect(() => {
    initializeGtag();
    const saved = getAnalyticsConsent();
    if (saved === "accepted") {
      void loadGoogleAnalytics()
        .then(() => setAnalyticsReady(true))
        .catch((error) => {
          console.error("[Analytics] Falha ao carregar o GA4.", error);
          setAnalyticsReady(false);
        });
    }
    // Aguarda a hidratação para refletir uma preferência que existe apenas no navegador.
    queueMicrotask(() => {
      setConsent(saved);
      setAnalyticsEnabled(saved === "accepted");
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const open = () => {
      setAnalyticsEnabled(getAnalyticsConsent() === "accepted");
      setPreferencesOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open);
  }, []);

  useEffect(() => {
    if (consent !== "accepted" || !analyticsReady) return;
    const pagePath = `${window.location.pathname}${window.location.search}`;
    if (lastPageRef.current === pagePath) return;
    lastPageRef.current = pagePath;
    window.gtag?.("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
    });
    const articleMatch = pathname.match(/\/artigos\/([^/]+)\/?$/);
    if (articleMatch) {
      window.gtag?.("event", "view_article", {
        send_to: GA_MEASUREMENT_ID,
        article_slug: decodeURIComponent(articleMatch[1]),
        page_title: document.title,
        page_path: pagePath,
      });
    }
  }, [analyticsReady, consent, pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      const location = anchor.closest("header") ? "header" : anchor.closest("footer") ? "footer" : "page";
      if (/^https?:\/\/(?:www\.)?(?:wa\.me|api\.whatsapp\.com)\//i.test(href)) trackContactClick("whatsapp", location);
      else if (/^tel:/i.test(href)) trackContactClick("telephone", location);
      else if (/^mailto:/i.test(href)) trackContactClick("email", location);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const saveConsent = useCallback((value: AnalyticsConsent) => {
    try {
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    } catch {
      // A escolha continua valendo nesta página quando o armazenamento está indisponível.
    }
    setConsent(value);
    setAnalyticsEnabled(value === "accepted");
    setPreferencesOpen(false);
    lastPageRef.current = null;
    if (value === "accepted") {
      setAnalyticsReady(false);
      void loadGoogleAnalytics()
        .then(() => setAnalyticsReady(true))
        .catch((error) => {
          console.error("[Analytics] Falha ao carregar o GA4.", error);
          setAnalyticsReady(false);
        });
    } else {
      setAnalyticsReady(false);
      initializeGtag();
      window.gtag?.("consent", "update", { analytics_storage: "denied" });
      removeGoogleAnalyticsCookies();
    }
  }, []);

  return (
    <>
      {hydrated && consent === null && (
        <section aria-label="Consentimento de cookies" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-4xl border border-gold/40 bg-coal p-5 shadow-2xl md:flex md:items-center md:gap-6 md:p-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-xl text-ivory">Sua privacidade</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper">
              Usamos cookies de medição do Google Analytics somente com sua autorização. Eles ajudam a entender visitas e contatos, sem enviar o conteúdo das mensagens. Consulte a{" "}
              <Link href="/politica-de-privacidade" className="text-gold underline underline-offset-2 hover:text-ivory">Política de Privacidade</Link>.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 md:mt-0 md:shrink-0">
            <button type="button" onClick={() => saveConsent("accepted")} className="rounded-[2px] bg-wine px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-wine-bright">Aceitar</button>
            <button type="button" onClick={() => saveConsent("rejected")} className="rounded-[2px] border border-gold/40 px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-gold/10">Recusar</button>
            <button type="button" onClick={() => setPreferencesOpen(true)} className="px-2 py-3 text-xs text-gold underline underline-offset-4 hover:text-ivory">Alterar preferências</button>
          </div>
        </section>
      )}
      {preferencesOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4" onMouseDown={(event) => event.target === event.currentTarget && setPreferencesOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title" className="w-full max-w-lg border border-gold/40 bg-coal p-6 shadow-2xl md:p-8">
            <h2 id="cookie-preferences-title" className="font-serif text-2xl text-ivory">Preferências de cookies</h2>
            <p className="mt-3 text-sm leading-relaxed text-paper">Você pode mudar sua escolha a qualquer momento. Cookies necessários mantêm apenas sua preferência e não podem ser desativados.</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start justify-between gap-5 border border-white/10 p-4">
                <div><h3 className="font-semibold text-ivory">Necessários</h3><p className="mt-1 text-xs text-muted">Armazenam a escolha de privacidade neste navegador.</p></div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">Sempre ativos</span>
              </div>
              <label className="flex cursor-pointer items-start justify-between gap-5 border border-white/10 p-4">
                <span><span className="block font-semibold text-ivory">Medição</span><span className="mt-1 block text-xs text-muted">Google Analytics 4: páginas, artigos e cliques de contato.</span></span>
                <input type="checkbox" checked={analyticsEnabled} onChange={(event) => setAnalyticsEnabled(event.target.checked)} className="mt-1 size-5 accent-[#c4a66e]" />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {consent !== null && <button type="button" onClick={() => setPreferencesOpen(false)} className="px-4 py-3 text-xs text-paper hover:text-ivory">Cancelar</button>}
              <button type="button" onClick={() => saveConsent(analyticsEnabled ? "accepted" : "rejected")} className="rounded-[2px] bg-wine px-5 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-wine-bright">Salvar preferências</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
