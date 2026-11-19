"use client";

import { useRouter } from "next/navigation";
import Encabezado from "@/components/Encabezado";
import FormularioProducto from "@/components/FormularioProducto";
import { useToast } from "@/components/Toast";
import { estadoStock } from "@/lib/estados";
import { crearProducto } from "@/lib/productos";
import { FORMULARIO_VACIO } from "@/lib/validacion";
import { rutaProducto } from "@/lib/rutas";

export default function NuevoProductoPage() {
  const router = useRouter();
  const toast = useToast();

  return (
    <>
      <Encabezado titulo="Nuevo producto" volver="/" />
      <FormularioProducto
        inicial={FORMULARIO_VACIO}
        textoGuardar="Guardar producto"
        onGuardar={async (datos, foto) => {
          const id = await crearProducto(datos, foto);
          const estado = estadoStock(datos);
          if (estado === "ok") {
            toast({ tipo: "exito", titulo: "Producto guardado" });
          } else {
            toast({
              tipo: "alerta",
              titulo: estado === "agotado" ? `${datos.nombre}: sin stock` : `${datos.nombre}: stock bajo`,
              mensaje: "Guardado. Registra una entrada cuando repongas.",
            });
          }
          router.replace(rutaProducto(id));
        }}
      />
    </>
  );
}
