import type { SVGProps } from "react";

/** Ícones lineares próprios (traço fino), desenhados para a identidade do site. */
const paths = {
  balanca: (
    <>
      <path d="M12 3v18M7 21h10M5 7h14M12 5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      <path d="m5 7-3 6a3 3 0 0 0 6 0L5 7ZM19 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
    </>
  ),
  maleta: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M10.5 12.5v2h3v-2" />
    </>
  ),
  guardaChuva: (
    <>
      <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9ZM12 2v1M12 12v7a2 2 0 0 1-4 0" />
    </>
  ),
  documento: (
    <>
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5L14 3Z" />
      <path d="M14 3v4.5h4.5M9 12h6M9 15.5h6M9 8.5h2" />
    </>
  ),
  algema: (
    <>
      <circle cx="7" cy="15" r="4" />
      <circle cx="17" cy="15" r="4" />
      <path d="M7 11V8.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V11" />
    </>
  ),
  martelo: (
    <>
      <path d="m14 4 6 6M11.5 6.5l6 6M13 5l-4.5 4.5 6 6L19 11M10.5 12.5 4 19M3 21h9" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  colunas: (
    <>
      <path d="M3 9h18L12 3 3 9ZM4 21h16M5 18h14M6 9v9M10 9v9M14 9v9M18 9v9" />
    </>
  ),
  chave: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M17 6l2.5 2.5M15 8l2 2" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 17h2" />
    </>
  ),
  aperto: (
    <>
      <path d="m2.5 11.5 4-4 3 1.5 2-1.5 3.5 0 6 4.5" />
      <path d="m6.5 7.5-4 4 6 6 1.5-1.5M21 12l-4.5 4.5-1-1M15.5 15.5l-2 2-1-1M12.5 16.5l-1.5 1.5-1-1M11 9l-2.5 2.5a1.4 1.4 0 0 0 2 2l3-2.5 4 3.5" />
    </>
  ),
  moeda: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.5c-.4-1-1.3-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5V8M12 16v1.5" />
    </>
  ),
  pessoas: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14a6.5 6.5 0 0 1 3.5 6" />
    </>
  ),
  coracao: (
    <>
      <path d="M12 20s-8-4.6-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.4 12 20 12 20Z" />
    </>
  ),
  local: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  telefone: (
    <>
      <path d="M5 3.5h3.5l1.5 4-2 1.5a11 11 0 0 0 7 7l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5Z" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3l-4.5 1.5Z" />
      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a4.6 4.6 0 0 1-2.3-2.3l.8-1-1-2L9 8.5Z" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17 7h.01" />
    </>
  ),
  facebook: (
    <>
      <path d="M14 21v-7.5h2.5L17 10h-3V8.2c0-1 .3-1.7 1.8-1.7H17V3.4A20 20 0 0 0 14.6 3C12.2 3 10.5 4.5 10.5 7.2V10H8v3.5h2.5V21" />
    </>
  ),
  seta: <path d="M4 12h15m-5-5 5 5-5 5" />,
  setaBaixo: <path d="m6 9 6 6 6-6" />,
  menu: <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />,
  fechar: <path d="m5.5 5.5 13 13m0-13-13 13" />,
  externo: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  livro: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />
    </>
  ),
  alerta: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-6", ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
