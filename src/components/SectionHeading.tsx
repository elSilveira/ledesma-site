import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left",
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  const center = align === "center";
  return (
    <div data-reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`eyebrow ${center ? "justify-center" : ""}`}>{eyebrow}</p>
      <h2 id={id} className="mt-4 text-3xl md:text-[2.6rem]">
        {title}
      </h2>
      {children && <div className="mt-5 text-paper">{children}</div>}
    </div>
  );
}
