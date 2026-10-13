import type { CSSProperties } from "react";
import { cn } from "@/lib/ui/cn";

type Mancha = {
  color: string;
  alto: string;
  clase: string;
  estilo: CSSProperties;
};

/**
 * Capas de mancha cálida que derivan muy despacio: la luz de la app cambia
 * sin distraer. Todo es CSS (gradientes + filtro), no hay imágenes ni canvas.
 */
const MANCHAS: Mancha[] = [
  {
    color: "#e08a4f",
    alto: "clamp(22rem, 55vw, 44rem)",
    clase: "animate-deriva",
    estilo: { top: "-14rem", left: "-12rem", opacity: 0.34 },
  },
  {
    color: "#4fc08a",
    alto: "clamp(18rem, 45vw, 36rem)",
    clase: "animate-deriva-lenta",
    estilo: { top: "14rem", right: "-14rem", opacity: 0.2 },
  },
  {
    color: "#a98bf0",
    alto: "clamp(16rem, 42vw, 32rem)",
    clase: "animate-deriva",
    estilo: { bottom: "-8rem", left: "4rem", opacity: 0.17, animationDelay: "-8s" },
  },
  {
    color: "#f0a63a",
    alto: "clamp(14rem, 34vw, 26rem)",
    clase: "animate-deriva-lenta",
    estilo: { top: "46%", left: "-10rem", opacity: 0.14, animationDelay: "-16s" },
  },
];

/** Chispas que suben despacio. Posiciones fijas: mismo HTML en servidor y cliente. */
const CHISPAS = [
  { left: "12%", delay: "0s", duracion: "19s", size: 5, color: "#f2c14e" },
  { left: "28%", delay: "-6s", duracion: "24s", size: 3, color: "#e08a4f" },
  { left: "47%", delay: "-12s", duracion: "21s", size: 4, color: "#93c95f" },
  { left: "63%", delay: "-3s", duracion: "27s", size: 3, color: "#f2c14e" },
  { left: "78%", delay: "-16s", duracion: "23s", size: 5, color: "#e08a4f" },
  { left: "89%", delay: "-9s", duracion: "26s", size: 3, color: "#a98bf0" },
];

/**
 * Fondo vivo de Pushidea: degradado base, manchas a la deriva, trama de puntos,
 * grano fino, chispas y viñeta. Decorativo de punta a punta (`aria-hidden`) y
 * sin interacción; con movimiento reducido se queda quieto por CSS.
 */
export function FondoVivo() {
  return (
    <div className="fondo-vivo" aria-hidden="true">
      {MANCHAS.map((mancha, indice) => (
        <span
          key={indice}
          className={cn("fondo-mancha", mancha.clase)}
          style={{
            ...mancha.estilo,
            height: mancha.alto,
            width: mancha.alto,
            background: `radial-gradient(circle at 50% 50%, ${mancha.color} 0%, ${mancha.color}00 68%)`,
          }}
        />
      ))}

      <span className="fondo-trama" />

      <span className="absolute inset-x-0 bottom-0 h-1/2">
        {CHISPAS.map((chispa, indice) => (
          <span
            key={indice}
            className="fondo-chispa"
            style={
              {
                left: chispa.left,
                bottom: "-4rem",
                height: `${chispa.size}px`,
                width: `${chispa.size}px`,
                opacity: 0.55,
                animationDelay: chispa.delay,
                "--duracion": chispa.duracion,
                background: `radial-gradient(circle, ${chispa.color} 0%, ${chispa.color}00 72%)`,
              } as CSSProperties
            }
          />
        ))}
      </span>

      <span className="fondo-grano" />
      <span className="fondo-vineta" />
    </div>
  );
}
