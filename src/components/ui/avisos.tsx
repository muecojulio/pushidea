import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Info, TriangleAlert } from "lucide-react";
import {
  ContextoAviso,
  type AccionAviso,
  type Anunciar,
  type Tono,
} from "@/components/ui/use-aviso";
import { cn } from "@/lib/ui/cn";

type Aviso = { id: number; texto: string; tono: Tono; accion?: AccionAviso };

let contador = 0;

const ESTILO: Record<Tono, { clase: string; icono: ReactNode }> = {
  neutro: {
    clase: "border-line bg-panel text-fg",
    icono: <Info className="size-4 shrink-0 text-accent" aria-hidden="true" />,
  },
  exito: {
    clase: "border-moss/50 bg-[#20301a] text-[#e9f6dc]",
    icono: <Check className="size-4 shrink-0 text-moss" aria-hidden="true" />,
  },
  aviso: {
    clase: "border-aviso/50 bg-[#33290f] text-[#f8ecc9]",
    icono: <Info className="size-4 shrink-0 text-aviso" aria-hidden="true" />,
  },
  error: {
    clase: "border-peligro/55 bg-[#3a1b15] text-[#ffe6de]",
    icono: <TriangleAlert className="size-4 shrink-0 text-peligro" aria-hidden="true" />,
  },
};

/**
 * Una sola región viva para toda la app: los estados importantes de botones,
 * filtros y acciones llegan aquí y se anuncian sin duplicar `aria-live`.
 * El aviso es visible y audible a la vez, y desaparece solo.
 */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const temporizadores = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const anunciar = useCallback<Anunciar>((texto, tono = "neutro", accion) => {
    if (!texto) return;
    const id = ++contador;
    setAvisos((previos) => [...previos.slice(-1), { id, texto, tono, accion }]);
    const temporizador = setTimeout(
      () => {
        setAvisos((previos) => previos.filter((aviso) => aviso.id !== id));
        temporizadores.current.delete(id);
      },
      accion ? 6000 : 3600,
    );
    temporizadores.current.set(id, temporizador);
  }, []);

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => {
      pendientes.forEach((temporizador) => clearTimeout(temporizador));
      pendientes.clear();
    };
  }, []);

  return (
    <ContextoAviso.Provider value={anunciar}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-5 lg:bottom-8"
      >
        {avisos.map((aviso) => (
          <p
            key={aviso.id}
            className={cn(
              "aviso-flotante pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-flotante backdrop-blur-md",
              ESTILO[aviso.tono].clase,
            )}
          >
            {ESTILO[aviso.tono].icono}
            <span className="min-w-0 flex-1">{aviso.texto}</span>
            {aviso.accion ? (
              <button
                type="button"
                onClick={() => {
                  aviso.accion?.onClick();
                  setAvisos((previos) => previos.filter((item) => item.id !== aviso.id));
                }}
                className="press shrink-0 rounded-full border border-fg/25 px-3 py-1.5 text-xs font-semibold text-fg hover:bg-fg/10"
              >
                {aviso.accion.etiqueta}
              </button>
            ) : null}
          </p>
        ))}
      </div>
    </ContextoAviso.Provider>
  );
}
