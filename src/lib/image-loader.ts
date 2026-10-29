/** Loader do export estático (GitHub Pages): serve o arquivo original, com o prefixo do repositório. */
export default function imageLoader({ src, width }: { src: string; width: number }) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${src}?w=${width}`;
}
