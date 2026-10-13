import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as EventoTeclado,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { norm } from "@/lib/ideas/guard";
import { cn, vars } from "@/lib/ui/cn";

export type OpcionCombo = {
  id: string;
  etiqueta: string;
  detalle?: string;
  glifo?: ReactNode;
  hue?: string;
};

type Props = {
  /** Nombre accesible del campo: siempre hay `<label>`, el placeholder no basta. */
  etiqueta: string;
  opciones: OpcionCombo[];
  valor?: string | null;
  onElegir: (id: string) => void;
  /** Se llama en cada tecla, para filtrar también lo que se ve fuera del menú. */
  onTexto?: (texto: string) => void;
  /** Modo controlado: el texto lo decide quien usa el campo. */
  texto?: string;
  textoInicial?: string;
  placeholder?: string;
  ayuda?: string;
  mensajeVacio?: string;
  icono?: ReactNode;
  className?: string;
  /** Etiqueta accesible del conjunto de resultados. */
  etiquetaLista?: string;
};

/**
 * Combobox con búsqueda del sistema: filtra mientras se escribe ignorando
 * mayúsculas y diacríticos, expone `combobox`/`listbox`/`option` con
 * `aria-activedescendant`, y se maneja entero con teclado (flechas, Inicio,
 * Fin, Enter, Escape) o con el botón táctil de la derecha.
 */
export function Combobox({
  etiqueta,
  opciones,
  valor,
  onElegir,
  onTexto,
  texto: textoControlado,
  textoInicial = "",
  placeholder = "Buscar…",
  ayuda,
  mensajeVacio = "Nada coincide con esa búsqueda.",
  icono,
  className,
  etiquetaLista,
}: Props) {
  const base = useId();
  const idCampo = `${base}-campo`;
  const idLista = `${base}-lista`;
  const idAyuda = `${base}-ayuda`;
  const [interno, setInterno] = useState(textoInicial);
  const texto = textoControlado ?? interno;
  const [abierta, setAbierta] = useState(false);
  const [activa, setActiva] = useState(-1);
  const contenedor = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  const filtradas = useMemo(() => {
    const consulta = norm(texto);
    if (!consulta) return opciones;
    return opciones.filter((opcion) =>
      norm(`${opcion.etiqueta} ${opcion.detalle ?? ""}`).includes(consulta),
    );
  }, [opciones, texto]);

  // La opción activa sigue a la seleccionada y vuelve al principio al filtrar.
  useEffect(() => {
    if (!abierta) return;
    const elegida = filtradas.findIndex((opcion) => opcion.id === valor);
    setActiva(elegida >= 0 ? elegida : filtradas.length > 0 ? 0 : -1);
  }, [abierta, filtradas, valor]);

  // Cierra al pulsar fuera, conservando el texto escrito.
  useEffect(() => {
    if (!abierta) return;
    function fuera(evento: PointerEvent) {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierta(false);
    }
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierta]);

  // La opción activa nunca queda fuera de vista al navegar con flechas.
  useEffect(() => {
    if (!abierta || activa < 0) return;
    const cont = lista.current;
    const nodo = cont?.querySelector<HTMLElement>(`[data-indice="${activa}"]`);
    if (!cont || !nodo) return;
    const arriba = nodo.offsetTop;
    const abajo = arriba + nodo.offsetHeight;
    if (arriba < cont.scrollTop) cont.scrollTop = arriba;
    else if (abajo > cont.scrollTop + cont.clientHeight) cont.scrollTop = abajo - cont.clientHeight;
  }, [activa, abierta]);

  const escribir = useCallback(
    (siguiente: string) => {
      setInterno(siguiente);
      onTexto?.(siguiente);
      setAbierta(true);
    },
    [onTexto],
  );

  const elegir = useCallback(
    (id: string) => {
      setAbierta(false);
      onElegir(id);
      campo.current?.focus();
    },
    [onElegir],
  );

  function onKeyDown(event: EventoTeclado<HTMLInputElement>) {
    const total = filtradas.length;
    if (event.key === "Escape") {
      if (abierta) {
        event.preventDefault();
        event.stopPropagation();
        setAbierta(false);
      }
      return;
    }
    if (event.key === "Tab") {
      setAbierta(false);
      return;
    }
    if (event.key === "Enter") {
      if (abierta && activa >= 0 && filtradas[activa]) {
        event.preventDefault();
        elegir(filtradas[activa].id);
      }
      return;
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      if (!abierta) {
        setAbierta(true);
        return;
      }
      if (total === 0) return;
      if (event.key === "Home") return setActiva(0);
      if (event.key === "End") return setActiva(total - 1);
      const paso = event.key === "ArrowDown" ? 1 : -1;
      setActiva((previa) => {
        const siguiente = previa + paso;
        if (siguiente < 0) return total - 1;
        if (siguiente >= total) return 0;
        return siguiente;
      });
    }
  }

  const anuncio = abierta ? resumen(filtradas.length, mensajeVacio) : "";

  return (
    <div ref={contenedor} className={cn("relative", className)}>
      <label htmlFor={idCampo} className="block text-sm font-medium text-fg">
        {etiqueta}
      </label>

      <div className="campo mt-2 flex items-center gap-2 px-0">
        <span className="pl-3.5 text-muted" aria-hidden="true">
          {icono ?? <Search className="size-4.5" />}
        </span>
        <input
          ref={campo}
          id={idCampo}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          value={texto}
          placeholder={placeholder}
          aria-expanded={abierta}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={
            abierta && activa >= 0 && filtradas[activa]
              ? `${idLista}-${filtradas[activa].id}`
              : undefined
          }
          aria-describedby={ayuda ? idAyuda : undefined}
          onChange={(evento) => escribir(evento.target.value)}
          onFocus={() => setAbierta(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-fg outline-none placeholder:text-muted"
        />
        {texto ? (
          <button
            type="button"
            onClick={() => {
              escribir("");
              campo.current?.focus();
            }}
            aria-label="Borrar lo escrito"
            data-sin-gesto=""
            className="press flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setAbierta((previa) => !previa);
            campo.current?.focus();
          }}
          aria-label={
            abierta
              ? `Cerrar lista de ${etiquetaLista ?? etiqueta}`
              : `Abrir lista de ${etiquetaLista ?? etiqueta}`
          }
          aria-expanded={abierta}
          aria-controls={idLista}
          data-sin-gesto=""
          className="press flex size-11 shrink-0 items-center justify-center rounded-full text-fg hover:bg-raised"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-300",
              abierta && "rotate-180 text-accent",
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {ayuda ? (
        <p id={idAyuda} className="mt-1.5 text-xs leading-relaxed text-muted">
          {ayuda}
        </p>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </p>

      {abierta ? (
        <div
          id={idLista}
          ref={lista}
          className="lista-opciones sin-barra absolute z-40 mt-2 w-full"
          data-sin-gesto=""
        >
          {filtradas.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">{mensajeVacio}</p>
          ) : (
            <ul role="listbox" aria-label={etiquetaLista ?? etiqueta} className="m-0 list-none p-0">
              {filtradas.map((opcion, indice) => {
                const seleccionada = opcion.id === valor;
                return (
                  <li
                    key={opcion.id}
                    id={`${idLista}-${opcion.id}`}
                    role="option"
                    aria-selected={seleccionada}
                    data-indice={indice}
                    data-activa={indice === activa}
                    onPointerEnter={() => setActiva(indice)}
                    onClick={() => elegir(opcion.id)}
                    className="opcion"
                    style={opcion.hue ? vars({ "--hue": opcion.hue }) : undefined}
                  >
                    {opcion.glifo ? (
                      <span aria-hidden="true" className="shrink-0 text-base leading-none">
                        {opcion.glifo}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{opcion.etiqueta}</span>
                      {opcion.detalle ? (
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {opcion.detalle}
                        </span>
                      ) : null}
                    </span>
                    {seleccionada ? (
                      <Check className="size-4 shrink-0 text-moss" aria-hidden="true" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function resumen(cantidad: number, vacio: string): string {
  if (cantidad === 0) return vacio;
  return cantidad === 1 ? "1 coincidencia" : `${cantidad} coincidencias`;
}
