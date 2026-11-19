"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import Encabezado from "@/components/Encabezado";
import FormularioProducto from "@/components/FormularioProducto";
import NoEncontrado from "@/components/NoEncontrado";
import { useToast } from "@/components/Toast";
import { db } from "@/lib/db";
import { actualizarProducto } from "@/lib/productos";
import { aFormulario } from "@/lib/validacion";
import { rutaProducto } from "@/lib/rutas";

export default function EditarProductoPage() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const toast = useToast();
  // El formulario copia estos valores al montarse, así que no se reinicia mientras se edita.
  const datos = useLiveQuery(async () => {
    const producto = (await db.productos.get(id)) ?? null;
    const foto = producto?.tieneFoto ? ((await db.fotos.get(id))?.dataUrl ?? null) : null;
    return { producto, foto };
  }, [id]);

  if (datos === undefined) return <p className="py-12 text-center text-zinc-500">Cargando…</p>;
  if (datos.producto === null) return <NoEncontrado />;

  return (
    <>
      <Encabezado titulo="Editar producto" subtitulo={datos.producto.nombre} volver={rutaProducto(id)} />
      <FormularioProducto
        key={id}
        inicial={aFormulario(datos.producto)}
        fotoInicial={datos.foto}
        editando
        textoGuardar="Guardar cambios"
        onGuardar={async (nuevos, foto) => {
          await actualizarProducto(id, nuevos, foto);
          toast({ tipo: "exito", titulo: "Cambios guardados" });
          router.replace(rutaProducto(id));
        }}
      />
    </>
  );
}
