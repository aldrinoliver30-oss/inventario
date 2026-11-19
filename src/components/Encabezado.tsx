import Link from "next/link";
import Icono from "./Icono";

/** Encabezado de pantalla con título, botón opcional de volver y acciones a la derecha. */
export default function Encabezado({
  titulo,
  subtitulo,
  volver,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  volver?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex min-h-14 items-center gap-2 bg-[#f4f5f7]/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      {volver && (
        <Link
          href={volver}
          className="-ml-2 rounded-full p-2 text-zinc-700 hover:bg-zinc-200/70"
          aria-label="Volver"
        >
          <Icono nombre="atras" className="size-6" />
        </Link>
      )}
      <div className="min-w-0 flex-1 py-2">
        <h1 className="truncate text-xl font-bold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="truncate text-sm text-zinc-500">{subtitulo}</p>}
      </div>
      {children}
    </header>
  );
}
