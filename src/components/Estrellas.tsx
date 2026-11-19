"use client";

const ESTRELLA = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

function Estrella({ llena, className }: { llena: boolean; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d={ESTRELLA}
        className={llena ? "fill-amber-400 stroke-amber-400" : "fill-zinc-200 stroke-zinc-200"}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Calidad de 1 a 5 estrellas. Sin `onChange` es solo lectura. */
export default function Estrellas({
  valor,
  onChange,
  tamano = "sm",
  invalido,
}: {
  valor: number;
  onChange?: (v: number) => void;
  tamano?: "sm" | "lg";
  invalido?: boolean;
}) {
  const clase = tamano === "lg" ? "size-9" : "size-4";

  if (!onChange) {
    return (
      <span className="inline-flex gap-0.5" role="img" aria-label={`Calidad ${valor} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Estrella key={n} llena={n <= valor} className={clase} />
        ))}
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label="Calidad" aria-invalid={invalido} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
          onClick={() => onChange(n)}
          className="rounded-lg p-0.5 transition active:scale-90"
        >
          <Estrella llena={n <= valor} className={clase} />
        </button>
      ))}
    </div>
  );
}
