/**
 * Marcador de informação pendente.
 * Visível apenas em desenvolvimento (ou com NEXT_PUBLIC_SHOW_PENDING=true).
 * Em produção não renderiza nada: o site nunca exibe dados fictícios.
 */
const visivel = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_PENDING === "true";

export function Pending({ label, className = "" }: { label: string; className?: string }) {
  if (!visivel) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-dashed border-gold/50 px-2 py-0.5 font-sans text-[0.7rem] font-medium tracking-wide text-gold ${className}`}
      title="Informação a ser fornecida pelo escritório antes da publicação"
    >
      Pendente: {label}
    </span>
  );
}
