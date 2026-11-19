import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-lg font-semibold">Producto no encontrado</p>
      <p className="text-sm text-zinc-500">Puede que haya sido eliminado.</p>
      <Link href="/" className="boton-secundario">
        Volver a la lista
      </Link>
    </div>
  );
}
