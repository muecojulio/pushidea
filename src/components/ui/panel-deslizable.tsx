import { useRef, useState, type ReactNode, type TouchEvent as EventoTactil } from "react";
import { cn } from "@/lib/ui/cn";
import {
  empiezaEnControl,
  ejeDelGesto,
  swipeHorizontal,
  vieneDelBorde,
  type Eje,
  type Punto,
} from "@/lib/ui/gestos";

type Props = {
  children: ReactNode;
  /** Identificador del panel visible: remonta y dispara la animación de entrada. */
  activo: string;
  /** Dirección del último cambio, para que la entrada venga del lado correcto. */
  direccion: -1 | 1;
  onSwipe: (direccion: -1 | 1) => void;
  className?: string;
};

/** Cuánto pesa el dedo: el panel acompaña con resistencia, no 1:1. */
const RESISTENCIA = 0.3;

/**
 * Contenedor de paneles con swipe horizontal entre secciones.
 *
 * - Bloqueo de eje (factor 1,2): si el gesto es vertical, la página sigue su
 *   scroll y aquí no pasa nada.
 * - No arranca si el toque nace en un botón, enlace, campo, pestaña o carril.
 * - Respeta el borde de la pantalla, reservado a los gestos del navegador.
 * - Nunca llama a `preventDefault`: el navegador conserva el control.
 */
export function PanelDeslizable({ children, activo, direccion, onSwipe, className }: Props) {
  const inicio = useRef<Punto | null>(null);
  const eje = useRef<Eje>("indefinido");
  const [arrastre, setArrastre] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);

  function onTouchStart(event: EventoTactil<HTMLDivElement>) {
    const toque = event.touches[0];
    if (!toque) return;
    if (empiezaEnControl(toque.target)) return;
    if (typeof window !== "undefined" && vieneDelBorde(toque.clientX, window.innerWidth)) return;
    inicio.current = { x: toque.clientX, y: toque.clientY, t: event.timeStamp };
    eje.current = "indefinido";
  }

  function onTouchMove(event: EventoTactil<HTMLDivElement>) {
    const origen = inicio.current;
    if (!origen) return;
    const toque = event.touches[0];
    if (!toque) return;
    const actual: Punto = { x: toque.clientX, y: toque.clientY, t: event.timeStamp };

    if (eje.current === "indefinido") {
      const decidido = ejeDelGesto(origen, actual);
      if (decidido === "vertical") {
        inicio.current = null;
        return;
      }
      if (decidido === "horizontal") {
        eje.current = "horizontal";
        setArrastrando(true);
      }
    }
    if (eje.current !== "horizontal") return;
    setArrastre((actual.x - origen.x) * RESISTENCIA);
  }

  function onTouchEnd(event: EventoTactil<HTMLDivElement>) {
    const origen = inicio.current;
    inicio.current = null;
    setArrastrando(false);
    if (!origen || eje.current !== "horizontal") {
      setArrastre(0);
      return;
    }
    const toque = event.changedTouches[0];
    const fin: Punto = toque
      ? { x: toque.clientX, y: toque.clientY, t: event.timeStamp }
      : { ...origen };
    const gesto = swipeHorizontal(origen, fin);
    setArrastre(0);
    if (gesto.valido) onSwipe(gesto.direccion);
  }

  function onTouchCancel() {
    inicio.current = null;
    eje.current = "indefinido";
    setArrastrando(false);
    setArrastre(0);
  }

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div
        className={cn("panel-arrastrable", arrastrando && "panel-arrastrando")}
        style={{
          transform: arrastre ? `translateX(${arrastre}px)` : undefined,
          opacity: arrastre ? Math.max(0.62, 1 - Math.abs(arrastre) / 340) : undefined,
        }}
      >
        <div key={activo} className="panel" data-direccion={direccion}>
          {children}
        </div>
      </div>
    </div>
  );
}
