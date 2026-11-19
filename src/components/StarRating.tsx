"use client";

import type { Calidad } from "@/lib/types";

const VALORES: Calidad[] = [1, 2, 3, 4, 5];

interface Props {
  /** 0 = sin calificar (solo en el formulario). */
  value: Calidad | 0;
  /** Si se omite, las estrellas son de solo lectura. */
  onChange?: (valor: Calidad) => void;
  size?: "sm" | "lg";
  id?: string;
}

export default function StarRating({ value, onChange, size = "sm", id }: Props) {
  const tamano = size === "lg" ? "text-3xl" : "text-base";

  if (!onChange) {
    return (
      <span
        className={`${tamano} leading-none text-amber-500`}
        role="img"
        aria-label={`Calidad ${value} de 5`}
      >
        {VALORES.map((v) => (v <= value ? "★" : "☆")).join("")}
      </span>
    );
  }

  return (
    <div id={id} role="radiogroup" aria-label="Calidad" className="flex gap-1">
      {VALORES.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          aria-label={`${v} ${v === 1 ? "estrella" : "estrellas"}`}
          onClick={() => onChange(v)}
          className={`${tamano} p-1 leading-none text-amber-500 focus-visible:outline-2 focus-visible:outline-emerald-600`}
        >
          {v <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
