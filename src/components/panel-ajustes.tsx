import { useMemo, useRef, useState } from "react";
import {
  Accessibility,
  Eraser,
  History,
  QrCode,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { Tab } from "@/components/pushidea-app";
import { useAviso } from "@/components/ui/use-aviso";
import { Boton, type EstadoBoton } from "@/components/ui/boton";
import { Chip } from "@/components/ui/chip";
import { Interruptor } from "@/components/ui/interruptor";
import { Riel } from "@/components/ui/riel";
import { Segmentado, type OpcionSegmento } from "@/components/ui/segmentado";
import { CATALOG } from "@/lib/ideas/catalog";
import { norm } from "@/lib/ideas/guard";
import type { FocusFilter } from "@/lib/ideas/pick";
import { usePushidea } from "@/lib/ideas/store";
import { AREAS } from "@/lib/ideas/types";
import { vars } from "@/lib/ui/cn";
import { temaDe } from "@/lib/ui/tema";

const ENFOQUES: OpcionSegmento<FocusFilter>[] = [
  { id: "ambos", etiqueta: "Ambos", glifo: <Sparkles className="size-3.5" aria-hidden="true" /> },
  {
    id: "cotidiano",
    etiqueta: "Diario",
    glifo: <History className="size-3.5" aria-hidden="true" />,
  },
  {
    id: "procesos",
    etiqueta: "Procesos",
    glifo: <Target className="size-3.5" aria-hidden="true" />,
  },
];

const TEXTO_ENFOQUE: Record<FocusFilter, string> = {
  ambos: "Mezcla ideas de uso diario con ideas que ordenan un proceso.",
  cotidiano: "Solo ideas para el día a día: casa, comida, trayectos, hábitos.",
  procesos: "Solo ideas que aligeran un proceso con pasos y principio claro.",
};

/**
 * Pestaña Ajustes: interruptor accesible para las ideas en vivo, carril de
 * chips para el ámbito, control segmentado con píldora deslizante para el
 * enfoque y vaciado del historial con confirmación en dos pasos.
 */
export function PanelAjustes({ onIrA }: { onIrA: (tab: Tab) => void }) {
  const settings = usePushidea((state) => state.settings);
  const seenTitles = usePushidea((state) => state.seenTitles);
  const saved = usePushidea((state) => state.saved);
  const setSettings = usePushidea((state) => state.setSettings);
  const resetSeen = usePushidea((state) => state.resetSeen);
  const anunciar = useAviso();

  const [armado, setArmado] = useState(false);
  const [estadoVaciar, setEstadoVaciar] = useState<EstadoBoton>("inactivo");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vistas = useMemo(() => {
    const marcadas = new Set(seenTitles.map(norm));
    return CATALOG.filter((idea) => marcadas.has(norm(idea.title))).length;
  }, [seenTitles]);

  function vaciar() {
    if (!armado) {
      setArmado(true);
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setArmado(false), 4200);
      anunciar("Toca otra vez para vaciar el historial de vistas", "aviso");
      return;
    }
    if (temporizador.current) clearTimeout(temporizador.current);
    setArmado(false);
    setEstadoVaciar("cargando");
    const antes = usePushidea.getState().seenTitles.length;
    resetSeen();
    setEstadoVaciar("exito");
    anunciar(
      antes > 0
        ? `Historial vacío: ${antes} títulos vuelven a estar disponibles`
        : "El historial ya estaba vacío",
      "exito",
    );
    temporizador.current = setTimeout(() => setEstadoVaciar("inactivo"), 1900);
  }

  return (
    <section className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:space-y-0">
      <div className="lg:col-span-2">
        <Interruptor
          encendido={settings.useAi}
          onCambiar={(valor) => setSettings({ useAi: valor })}
          etiqueta="Ideas en vivo"
          hue="#4fc08a"
          detalle="Si está activo, cada toque pide una idea nueva pensada para ti. Si falla o tarda, se usa el archivo de este teléfono. Apagado, no sale ningún dato del dispositivo."
        />
      </div>

      <div
        className="tarjeta p-4 lg:col-span-2"
        style={vars({ "--hue": temaDe(settings.area).hue })}
      >
        <h2 className="text-sm font-semibold text-fg">Ámbito</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          De qué tratan las ideas que aparecen. Con «Cualquiera» se mezclan todos los ámbitos.
        </p>
        <Riel
          etiqueta="Ámbitos disponibles"
          pista="Desliza"
          centrarCuando={settings.area}
          className="mt-3"
        >
          <Chip
            activo={settings.area === "cualquiera"}
            hue={temaDe("cualquiera").hue}
            glifo={temaDe("cualquiera").emoji}
            onClick={() => setSettings({ area: "cualquiera" })}
          >
            Cualquiera
          </Chip>
          {AREAS.map((item) => (
            <Chip
              key={item.id}
              activo={settings.area === item.id}
              hue={temaDe(item.id).hue}
              glifo={temaDe(item.id).emoji}
              onClick={() => setSettings({ area: item.id })}
            >
              {item.label}
            </Chip>
          ))}
        </Riel>
      </div>

      <div className="tarjeta p-4">
        <h2 className="text-sm font-semibold text-fg">Enfoque</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">{TEXTO_ENFOQUE[settings.focus]}</p>
        <Segmentado
          className="mt-3.5"
          etiqueta="Enfoque de las ideas"
          opciones={ENFOQUES}
          valor={settings.focus}
          onCambiar={(focus) => {
            setSettings({ focus });
            anunciar(
              `Enfoque: ${ENFOQUES.find((opcion) => opcion.id === focus)?.etiqueta ?? focus}`,
            );
          }}
        />
      </div>

      <div className="tarjeta p-4" style={vars({ "--hue": "#e2725b" })}>
        <h2 className="text-sm font-semibold text-fg">Historial de vistas</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {vistas > 0
            ? `${vistas} de ${CATALOG.length} ideas del archivo local ya salieron en este teléfono. Vaciarlo las devuelve todas; lo que guardaste no se toca.`
            : "Sin historial todavía: todas las ideas del archivo local están disponibles."}
        </p>
        <Boton
          variante={armado ? "peligro" : "secundario"}
          estado={estadoVaciar}
          onClick={vaciar}
          className="mt-3.5 w-full"
          hue="#e2725b"
          aria-describedby="ayuda-vaciar"
          icono={<Eraser className="size-4" aria-hidden="true" />}
        >
          {armado
            ? "Toca otra vez para vaciar"
            : estadoVaciar === "exito"
              ? "Historial vacío"
              : "Vaciar historial de vistas"}
        </Boton>
        <p id="ayuda-vaciar" className="mt-2 text-xs leading-relaxed text-muted">
          Pide confirmación: el primer toque solo prepara la acción.
        </p>
      </div>

      <div className="tarjeta p-4 lg:col-span-2" style={vars({ "--hue": "#a98bf0" })}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Accessibility className="size-4 text-lila" aria-hidden="true" />
          Movimiento y accesibilidad
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Pushidea respeta el ajuste «movimiento reducido» de tu sistema: apaga derivas del fondo,
          entradas escalonadas, brillos y desplazamientos suaves, y deja el estado de cada control
          visible con color, icono y texto. Todo se puede usar con teclado: las pestañas con
          flechas, Inicio y Fin; los carriles y filtros sin gestos; y el buscador de guardadas
          entero con flechas, Enter y Escape.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Boton
            variante="secundario"
            hue="#a98bf0"
            onClick={() => onIrA("instalar")}
            icono={<QrCode className="size-4" aria-hidden="true" />}
          >
            Instalar en otro equipo
          </Boton>
          <Boton
            variante="secundario"
            hue="#a98bf0"
            onClick={() => onIrA("privacidad")}
            icono={<ShieldCheck className="size-4" aria-hidden="true" />}
          >
            Qué se guarda y qué sale
          </Boton>
        </div>
        <p className="mt-3 text-xs text-muted">
          {Object.keys(saved).length} ideas guardadas viven solo en este dispositivo.
        </p>
      </div>
    </section>
  );
}
