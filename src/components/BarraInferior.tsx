"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { resumenAvisos } from "@/lib/estados";
import Icono, { type NombreIcono } from "./Icono";

const PESTANAS: { href: string; texto: string; icono: NombreIcono }[] = [
  { href: "/", texto: "Productos", icono: "caja" },
  { href: "/avisos", texto: "Avisos", icono: "campana" },
  { href: "/ajustes", texto: "Ajustes", icono: "ajustes" },
];

export default function BarraInferior() {
  const ruta = usePathname();
  const avisos = useLiveQuery(async () => resumenAvisos(await db.productos.toArray()).total, []);

  return (
    <nav
      aria-label="Navegación principal"
      className="bottom-safe fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/90 backdrop-blur-lg"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-3">
        {PESTANAS.map((p) => {
          const activa = p.href === "/" ? ruta === "/" || ruta.startsWith("/productos") : ruta.startsWith(p.href);
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={activa ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 text-xs font-medium transition ${
                  activa ? "text-emerald-700" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span className="relative">
                  <Icono nombre={p.icono} className="size-6" grosor={activa ? 2.2 : 1.8} />
                  {p.href === "/avisos" && !!avisos && (
                    <span className="absolute -top-1.5 -right-2.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] leading-5 font-bold text-white ring-2 ring-white">
                      {avisos > 99 ? "99+" : avisos}
                    </span>
                  )}
                </span>
                {p.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
