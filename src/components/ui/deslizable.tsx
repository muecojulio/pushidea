import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { MoreHorizontal, X } from "lucide-react";
import { CONSULTA_ESCRITORIO, useConsulta } from "@/components/ui/use-consulta";
import { useAviso } from "@/components/ui/use-aviso";
import { cn, vars } from "@/lib/ui/cn";
import {
  TOLERANCIA,
  decidirRevelado,
  ejeDelGesto,
  empiezaEnControl,
  limitarArrastre,
  prefiereMovimientoReducido,
  type Punto,
} from "@/lib/ui/gestos";

export type AccionDeslizable = {
  id: string;
  etiqueta: string;
  icono?: ReactNode;
  tono?: "neutro" | "peligro";
  onClick: () => void;
};

type Props = {
  /** Contenido del frente: la tarjeta entera, con su propio fondo opaco. */
  children: ReactNode;
  acciones: AccionDeslizable[];
  /** Nombre del elemento, para el control explícito («Acciones de Despensa quieta»). */
  nombre: string;
  hue?: string;
  className?: string;
};

/** Aviso entre tarjetas: solo una revela sus acciones a la vez. */
const CANAL = "pushidea:deslizable";

const TONO: Record<NonNullable<AccionDeslizable["tono"]>, string> = {
  neutro: "boton-secundario",
  peligro: "boton-peligro",
};

/**
 * Tarjeta que se desliza para revelar acciones contextuales.
 *
 * - Bloqueo de eje: solo se mueve cuando el gesto es claramente horizontal;
 *   si gana lo vertical, el navegador conserva el scroll de la página.
 * - Los botones, enlaces y campos anidados quedan fuera del gesto.
 * - El recorrido topea en el ancho del panel y un gesto rápido también decide.
 * - Un clic posterior al arrastre no activa la tarjeta por accidente.
 * - Siempre hay un control visible (`aria-expanded`) para abrir y cerrar: el
 *   swipe es un atajo, nunca la única puerta.
 * - En escritorio las acciones se muestran directamente, sin deslizar.
 */
export function Deslizable({ children, acciones, nombre, hue, className }: Props) {
  const escritorio = useConsulta(CONSULTA_ESCRITORIO);
  const anunciar = useAviso();
  const idPanel = useId();
  const [abierta, setAbierta] = useState(false);
  const [ancho, setAncho] = useState(0);
  const [arrastre, setArrastre] = useState<number | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const frente = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const mango = useRef<HTMLButtonElement>(null);
  const inicio = useRef<Punto | null>(null);
  const eje = useRef<"horizontal" | "vertical" | "indefinido">("indefinido");
  const movido = useRef(false);

  // El panel de acciones mide su propio ancho: ahí topea el arrastre.
  useEffect(() => {
    if (escritorio) return;
    const medir = () => setAncho(panel.current?.offsetWidth ?? 0);
    medir();
    if (typeof ResizeObserver !== "function" || !panel.current) return;
    const observador = new ResizeObserver(medir);
    observador.observe(panel.current);
    return () => observador.disconnect();
  }, [escritorio, acciones.length]);

  // Una sola tarjeta abierta a la vez.
  useEffect(() => {
    function cerrar(event: Event) {
      if ((event as CustomEvent<string>).detail !== idPanel) setAbierta(false);
    }
    window.addEventListener(CANAL, cerrar);
    return () => window.removeEventListener(CANAL, cerrar);
  }, [idPanel]);

  function abrirSola() {
    window.dispatchEvent(new CustomEvent(CANAL, { detail: idPanel }));
  }

  function cambiar(siguiente: boolean) {
    if (!siguiente && panel.current?.contains(document.activeElement)) {
      // El panel pasa a `inert`: el foco vuelve al control que lo abre.
      mango.current?.focus();
    }
    setAbierta(siguiente);
    if (siguiente) abrirSola();
    anunciar(siguiente ? `Acciones de ${nombre} visibles` : `Acciones de ${nombre} ocultas`);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (escritorio || event.button !== 0) return;
    if (empiezaEnControl(event.target)) return;
    inicio.current = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    eje.current = "indefinido";
    movido.current = false;
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const origen = inicio.current;
    if (!origen) return;
    const actual: Punto = { x: event.clientX, y: event.clientY, t: event.timeStamp };

    if (eje.current === "indefinido") {
      const decidido = ejeDelGesto(origen, actual);
      if (decidido === "vertical") {
        // La página manda: se soltó el gesto y no se vuelve a mirar.
        inicio.current = null;
        return;
      }
      if (decidido === "horizontal") {
        eje.current = "horizontal";
        setArrastrando(true);
        try {
          frente.current?.setPointerCapture(event.pointerId);
        } catch {
          // Sin captura el gesto sigue funcionando, solo pierde continuidad.
        }
      }
    }
    if (eje.current !== "horizontal") return;

    const base = abierta ? -ancho : 0;
    movido.current = Math.abs(actual.x - origen.x) > TOLERANCIA;
    setArrastre(limitarArrastre(actual.x - origen.x + base, ancho));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const origen = inicio.current;
    inicio.current = null;
    setArrastrando(false);
    if (!origen || eje.current !== "horizontal") {
      setArrastre(null);
      return;
    }
    const ms = Math.max(1, event.timeStamp - origen.t);
    const velocidad = (event.clientX - origen.x) / ms;
    const posicion = arrastre ?? (abierta ? -ancho : 0);
    const destino = decidirRevelado(posicion, ancho, velocidad);
    setArrastre(null);
    if (destino !== abierta) cambiar(destino);
  }

  function onPointerCancel() {
    inicio.current = null;
    eje.current = "indefinido";
    setArrastrando(false);
    setArrastre(null);
  }

  /** Nada de clic accidental tras arrastrar; con las acciones abiertas, cierra. */
  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (movido.current) {
      movido.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (abierta) {
      event.preventDefault();
      event.stopPropagation();
      cambiar(false);
      mango.current?.focus();
    }
  }

  const desplazamiento = arrastre ?? (abierta ? -ancho : 0);

  if (escritorio) {
    // En escritorio no hace falta deslizar: las acciones viven en el flujo.
    return (
      <div
        className={cn("relative flex flex-col", className)}
        style={hue ? vars({ "--hue": hue }) : undefined}
      >
        {children}
        <div className="flex flex-wrap items-center gap-2 px-5 pt-3 pb-5">
          {acciones.map((accion) => (
            <button
              key={accion.id}
              type="button"
              onClick={accion.onClick}
              className={cn("boton", TONO[accion.tono ?? "neutro"])}
              style={hue ? vars({ "--hue": hue }) : undefined}
            >
              {accion.icono}
              <span>{accion.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("deslizable", arrastrando && "deslizable-arrastrando", className)}
      style={hue ? vars({ "--hue": hue }) : undefined}
      onKeyDown={(event) => {
        if (event.key === "Escape" && abierta) {
          event.stopPropagation();
          cambiar(false);
          mango.current?.focus();
        }
      }}
    >
      <div
        ref={panel}
        id={idPanel}
        className="deslizable-acciones"
        role="group"
        inert={!abierta}
        aria-label={`Acciones de ${nombre}`}
      >
        {acciones.map((accion) => (
          <button
            key={accion.id}
            type="button"
            onClick={accion.onClick}
            tabIndex={abierta ? 0 : -1}
            className={cn(
              "boton h-full min-w-20 flex-col gap-1 rounded-2xl px-2.5 text-xs",
              TONO[accion.tono ?? "neutro"],
            )}
          >
            {accion.icono}
            <span>{accion.etiqueta}</span>
          </button>
        ))}
      </div>

      <div
        ref={frente}
        className="deslizable-frente"
        style={{
          transform: `translateX(${desplazamiento}px)`,
          transitionDuration: arrastrando || prefiereMovimientoReducido() ? "0ms" : undefined,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
      >
        {children}
        <button
          ref={mango}
          type="button"
          onClick={() => cambiar(!abierta)}
          aria-expanded={abierta}
          aria-controls={idPanel}
          data-sin-gesto=""
          className={cn(
            "boton boton-icónico size-11 absolute top-3 right-3 z-10",
            abierta ? "boton-primario" : "boton-fantasma border border-line",
          )}
        >
          <span className="sr-only">
            {abierta ? `Cerrar acciones de ${nombre}` : `Abrir acciones de ${nombre}`}
          </span>
          {abierta ? (
            <X className="size-4" aria-hidden="true" />
          ) : (
            <MoreHorizontal className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
