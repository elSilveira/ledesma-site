import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type Variant = "primary" | "outline" | "ghost";

const base =
  "group inline-flex items-center justify-center gap-2.5 rounded-[2px] px-6 py-3.5 font-sans text-[0.74rem] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ease-out-soft disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-wine text-ivory shadow-[inset_0_0_0_1px_rgb(196_166_110/0.35)] hover:bg-wine-bright hover:shadow-[inset_0_0_0_1px_rgb(196_166_110/0.7)]",
  outline: "text-ivory shadow-[inset_0_0_0_1px_rgb(196_166_110/0.45)] hover:bg-gold/10 hover:shadow-[inset_0_0_0_1px_rgb(196_166_110/0.9)]",
  ghost: "px-0 py-1 text-gold hover:text-ivory",
};

type Common = { variant?: Variant; icon?: IconName; children: ReactNode; className?: string };

function Inner({ icon, children }: Pick<Common, "icon" | "children">) {
  return (
    <>
      {icon && <Icon name={icon} className="size-4.5 shrink-0" />}
      <span>{children}</span>
      {!icon && <Icon name="seta" className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />}
    </>
  );
}

/** Link interno com aparência de botão. */
export function ButtonLink({ href, variant = "primary", icon, children, className = "", ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      <Inner icon={icon}>{children}</Inner>
    </Link>
  );
}

/** Link externo (WhatsApp, telefone, mapas, redes) com aparência de botão. */
export function ButtonExternal({
  href,
  variant = "primary",
  icon,
  children,
  className = "",
  newTab = true,
  ...rest
}: Common & ComponentProps<"a"> & { newTab?: boolean }) {
  return (
    <a
      href={href}
      className={`${base} ${variants[variant]} ${className}`}
      {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      <Inner icon={icon}>{children}</Inner>
    </a>
  );
}

export const buttonClasses = (variant: Variant = "primary") => `${base} ${variants[variant]}`;
