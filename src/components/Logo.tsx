import Image from "next/image";
import Link from "next/link";

/** Logotipo oficial (emblema + nome), recolorido para fundo escuro. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`} aria-label="Ledesma Advocacia – página inicial">
      <Image src="/brand/emblema.png" alt="" width={48} height={48} className="h-11 w-auto md:h-12" preload />
      <Image src="/brand/nome.png" alt="" width={150} height={24} className="h-[1.45rem] w-auto md:h-[1.6rem]" preload />
    </Link>
  );
}
