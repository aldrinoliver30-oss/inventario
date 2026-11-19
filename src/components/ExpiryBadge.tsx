import { getEstadoVencimiento } from "@/lib/expiry";
import type { EstadoVencimiento } from "@/lib/types";

export const ETIQUETAS_VENCIMIENTO: Record<EstadoVencimiento, string> = {
  vencido: "Vencido",
  "por-vencer": "Por vencer",
  ok: "Vigente",
};

const ESTILOS: Record<EstadoVencimiento, string> = {
  vencido: "bg-red-100 text-red-800 ring-red-600/30",
  "por-vencer": "bg-yellow-100 text-yellow-900 ring-yellow-600/40",
  ok: "bg-green-100 text-green-800 ring-green-600/30",
};

interface Props {
  fechaVencimiento: string;
}

export default function ExpiryBadge({ fechaVencimiento }: Props) {
  const estado = getEstadoVencimiento(fechaVencimiento);
  return (
    <span
      data-estado={estado}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ESTILOS[estado]}`}
    >
      {ETIQUETAS_VENCIMIENTO[estado]}
    </span>
  );
}
