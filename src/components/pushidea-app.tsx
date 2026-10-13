import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  Check,
  Compass,
  Eye,
  Hand,
  History,
  Info,
  QrCode,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { IdeaTarjeta } from "@/components/idea-tarjeta";
import { InstalarQr } from "@/components/instalar-qr";
import { PanelAjustes } from "@/components/panel-ajustes";
import { PanelGuardadas } from "@/components/panel-guardadas";
import { PrivacidadContenido } from "@/components/privacidad-contenido";
import { ConsejoDelDia } from "@/components/recursos-idea";
import { ProveedorAvisos } from "@/components/ui/avisos";
import { useAviso } from "@/components/ui/use-aviso";
import { Boton, type EstadoBoton } from "@/components/ui/boton";
import { FondoVivo } from "@/components/ui/fondo-vivo";
import { PanelDeslizable } from "@/components/ui/panel-deslizable";
import { Pestanias, type Pestania } from "@/components/ui/pestanias";
import { Riel } from "@/components/ui/riel";
import { generateIdea } from "@/lib/ideas/generate";
import { ideaText, isBanned, norm } from "@/lib/ideas/guard";
import { pickLocal, quedanIdeas, type AreaFilter } from "@/lib/ideas/pick";
import { usePushidea } from "@/lib/ideas/store";
import { CATALOG } from "@/lib/ideas/catalog";
import { AREA_LABEL, type Idea } from "@/lib/ideas/types";
import { cn, vars } from "@/lib/ui/cn";
import { prefiereMovimientoReducido } from "@/lib/ui/gestos";
import { temaDe } from "@/lib/ui/tema";

export type Tab = "generar" | "guardadas" | "instalar" | "privacidad" | "ajustes";

/** Orden real de las pestañas: manda sobre el swipe y sobre las flechas. */
const ORDEN: Tab[] = ["generar", "guardadas", "instalar", "privacidad", "ajustes"];

type Mensaje = { texto: string; tono: "neutro" | "exito" | "aviso" | "error" };

export function PushideaApp() {
  return (
    <ProveedorAvisos>
      <Pushidea />
    </ProveedorAvisos>
  );
}

function Pushidea() {
  const saved = usePushidea((state) => state.saved);
  const seenTitles = usePushidea((state) => state.seenTitles);
  const focusIdea = usePushidea((state) => state.focusIdea);

  const [tab, setTab] = useState<Tab>("generar");
  const [direccion, setDireccion] = useState<-1 | 1>(1);
  // Viven aquí, no en el panel: cambiar de pestaña no debe borrar el filtro.
  const [busqueda, setBusqueda] = useState("");
  const [filtroArea, setFiltroArea] = useState<AreaFilter>("cualquiera");

  useEffect(() => {
    void Promise.resolve(usePushidea.persist.rehydrate());
  }, []);

  const irA = useCallback(
    (destino: Tab, sentido?: -1 | 1) => {
      const desde = ORDEN.indexOf(tab);
      const hacia = ORDEN.indexOf(destino);
      setDireccion(sentido ?? (hacia >= desde ? 1 : -1));
      setTab(destino);
      // Al cambiar de sección se vuelve arriba, sin sorpresas con el teclado.
      if (typeof window !== "undefined" && window.scrollY > 4) {
        window.scrollTo({ top: 0, behavior: prefiereMovimientoReducido() ? "auto" : "smooth" });
      }
    },
    [tab],
  );

  const abrirIdea = useCallback(
    (idea: Idea) => {
      focusIdea(idea);
      irA("generar");
    },
    [focusIdea, irA],
  );

  const panel = useRef<HTMLDivElement>(null);
  const focoPendiente = useRef(false);

  useEffect(() => {
    if (!focoPendiente.current) return;
    focoPendiente.current = false;
    panel.current?.focus();
  }, [tab]);

  const onSwipe = useCallback(
    (sentido: -1 | 1) => {
      const indice = ORDEN.indexOf(tab);
      // Deslizar a la izquierda (sentido -1) avanza a la sección siguiente; el
      // panel nuevo entra por el lado contrario al dedo.
      const siguiente = ORDEN[(indice - sentido + ORDEN.length) % ORDEN.length];
      if (!siguiente) return;
      focoPendiente.current = true;
      irA(siguiente, sentido === -1 ? 1 : -1);
    },
    [tab, irA],
  );

  const guardadas = Object.keys(saved).length;
  /** Cuántas de las 40 ideas del archivo local ya salieron en este teléfono. */
  const exploradas = useMemo(() => {
    const vistas = new Set(seenTitles.map(norm));
    return CATALOG.filter((idea) => vistas.has(norm(idea.title))).length;
  }, [seenTitles]);

  const pestanias = useMemo<Pestania[]>(
    () => [
      {
        id: "generar",
        etiqueta: "Generar",
        icono: <Sparkles className="size-5" aria-hidden="true" />,
      },
      {
        id: "guardadas",
        etiqueta: "Guardadas",
        icono: <Bookmark className="size-5" aria-hidden="true" />,
        aviso: guardadas,
        etiquetaAviso: `${guardadas} ${guardadas === 1 ? "idea guardada" : "ideas guardadas"}`,
      },
      {
        id: "instalar",
        etiqueta: "Instalar",
        icono: <QrCode className="size-5" aria-hidden="true" />,
      },
      {
        id: "privacidad",
        etiqueta: "Privacidad",
        icono: <ShieldCheck className="size-5" aria-hidden="true" />,
      },
      {
        id: "ajustes",
        etiqueta: "Ajustes",
        icono: <SlidersHorizontal className="size-5" aria-hidden="true" />,
      },
    ],
    [guardadas],
  );

  return (
    <div className="relative flex min-h-dvh flex-col">
      <FondoVivo />

      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Saltar al contenido
      </a>

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:max-w-6xl lg:px-8">
        <Encabezado guardadas={guardadas} exploradas={exploradas} />

        <nav
          aria-label="Secciones de la app"
          className="dock order-3 fixed inset-x-0 bottom-0 z-30 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:order-2 lg:static lg:mt-2 lg:rounded-3xl lg:border lg:border-line lg:px-3 lg:pb-2"
        >
          <div className="mx-auto w-full max-w-lg lg:max-w-3xl">
            <Pestanias
              pestanias={pestanias}
              activa={tab}
              etiqueta="Secciones de Pushidea"
              onCambiar={(id, sentido) => irA(id as Tab, sentido)}
            />
          </div>
        </nav>

        <main
          id="contenido"
          className="order-2 flex-1 pt-5 pb-32 focus:outline-none lg:order-3 lg:pt-8 lg:pb-16"
        >
          <PanelDeslizable activo={tab} direccion={direccion} onSwipe={onSwipe}>
            <div
              ref={panel}
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`pestania-${tab}`}
              tabIndex={-1}
              className="focus:outline-none"
            >
              {tab === "generar" ? <PanelGenerar onIrA={irA} /> : null}
              {tab === "guardadas" ? (
                <PanelGuardadas
                  onAbrir={abrirIdea}
                  query={busqueda}
                  onQuery={setBusqueda}
                  area={filtroArea}
                  onArea={setFiltroArea}
                />
              ) : null}
              {tab === "instalar" ? <InstalarQr /> : null}
              {tab === "privacidad" ? <PrivacidadContenido /> : null}
              {tab === "ajustes" ? <PanelAjustes onIrA={irA} /> : null}
            </div>
          </PanelDeslizable>
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Cabecera                                                                    */
/* -------------------------------------------------------------------------- */

function Encabezado({ guardadas, exploradas }: { guardadas: number; exploradas: number }) {
  return (
    <header className="order-1 pb-1">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
        <div className="min-w-0">
          <span className="flex items-center gap-2.5">
            <span className="relative flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f0a25f] to-[#d9703c] shadow-cta">
              <span
                className="absolute inset-0 animate-respirar rounded-2xl bg-accent/40 blur-lg"
                aria-hidden="true"
              />
              <Wand2 className="relative size-4.5 text-ink" aria-hidden="true" />
            </span>
            <span className="text-[0.6875rem] leading-none font-semibold tracking-[0.2em] text-muted uppercase">
              Una idea por toque
            </span>
          </span>

          <h1 className="font-display mt-3.5 text-[2.75rem] leading-[0.92] font-semibold tracking-tight lg:text-6xl">
            <span className="texto-luz">Pushidea</span>
          </h1>

          <svg
            aria-hidden="true"
            viewBox="0 0 240 12"
            preserveAspectRatio="none"
            className="mt-2 h-3 w-52 max-w-full overflow-visible text-accent/80"
          >
            <path
              d="M3 8C46 2 74 11 120 6.5S200 2 237 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="subrayado-trazo"
              style={vars({ "--largo": "260" })}
            />
          </svg>
        </div>

        <div className="flex gap-2.5 lg:flex-col lg:items-end">
          <Medidor
            icono={<Bookmark className="size-4" aria-hidden="true" />}
            valor={guardadas}
            etiqueta={guardadas === 1 ? "guardada" : "guardadas"}
            hue="#93c95f"
          />
          <Medidor
            icono={<Compass className="size-4" aria-hidden="true" />}
            valor={exploradas}
            etiqueta="ideas vistas"
            max={CATALOG.length}
            hue="#6a9df0"
          />
        </div>
      </div>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
        Ideas de aplicaciones para la vida diaria o para aligerar un proceso. Cada toque propone una
        distinta, con para quién es, qué resuelve y cómo se usaría. Sin pagos, transferencias ni
        bancos.
      </p>
    </header>
  );
}

function Medidor({
  icono,
  valor,
  etiqueta,
  max,
  hue,
}: {
  icono: ReactNode;
  valor: number;
  etiqueta: string;
  max?: number;
  hue: string;
}) {
  const porcentaje = max ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  return (
    <div
      className="tarjeta tarjeta-suave flex min-w-32 items-center gap-2.5 rounded-2xl px-3 py-2 lg:min-w-44"
      style={vars({ "--hue": hue })}
    >
      <span aria-hidden="true" style={{ color: hue }}>
        {icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="font-display text-lg leading-none text-fg">{valor}</span>
          <span className="truncate text-[0.625rem] leading-none tracking-[0.12em] text-muted uppercase">
            {etiqueta}
          </span>
        </span>
        {max ? (
          <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-raised">
            <span
              className="block h-full rounded-full transition-[width] duration-700 ease-entrada"
              style={{ width: `${porcentaje}%`, background: hue }}
            />
          </span>
        ) : null}
      </span>
      {max ? <span className="sr-only">de {max} del archivo local</span> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pestaña Generar                                                             */
/* -------------------------------------------------------------------------- */

function PanelGenerar({ onIrA }: { onIrA: (tab: Tab) => void }) {
  const anunciar = useAviso();
  const current = usePushidea((state) => state.current);
  const recent = usePushidea((state) => state.recent);
  const saved = usePushidea((state) => state.saved);
  const settings = usePushidea((state) => state.settings);
  const seenTitles = usePushidea((state) => state.seenTitles);
  const toggleSave = usePushidea((state) => state.toggleSave);
  const focusIdea = usePushidea((state) => state.focusIdea);

  const [ocupado, setOcupado] = useState(false);
  const [estadoCta, setEstadoCta] = useState<EstadoBoton>("inactivo");
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pendiente = temporizador;
    return () => {
      if (pendiente.current) clearTimeout(pendiente.current);
    };
  }, []);

  const agotado = useMemo(
    () =>
      !quedanIdeas({
        area: settings.area,
        focus: settings.focus,
        blocked: [...seenTitles, ...Object.values(saved).map((idea) => norm(idea.title))],
      }),
    [settings.area, settings.focus, seenTitles, saved],
  );

  async function generar() {
    if (ocupado) return;
    setOcupado(true);
    setEstadoCta("cargando");
    setMensaje(null);

    const state = usePushidea.getState();
    const blocked = state.blockedTitles();
    let nueva: Idea | null = null;
    let aviso: Mensaje | null = null;

    try {
      let liveReason: "sin-ia" | "vacia" | null = null;
      if (state.settings.useAi) {
        const result = await generateIdea({
          data: {
            area: state.settings.area,
            focus: state.settings.focus,
            avoidTitles: blocked.slice(0, 24),
          },
        });
        if (
          result.ok &&
          !isBanned(ideaText(result.idea)) &&
          !blocked.map(norm).includes(norm(result.idea.title))
        ) {
          state.commit(result.idea);
          nueva = result.idea;
        } else if (!result.ok) {
          liveReason = result.reason;
        } else {
          liveReason = "vacia";
        }
      }
      if (!nueva) {
        const local = pickLocal({
          area: state.settings.area,
          focus: state.settings.focus,
          blocked,
        });
        if (local) {
          state.commit(local);
          nueva = local;
          if (liveReason === "vacia") {
            aviso = {
              tono: "aviso",
              texto: "La idea en vivo no cumplía las reglas. Esta es del archivo de tu teléfono.",
            };
          } else if (liveReason === "sin-ia") {
            aviso = {
              tono: "aviso",
              texto: "La idea en vivo no respondió a tiempo. Esta es del archivo de tu teléfono.",
            };
          }
        }
      }
    } catch {
      const local = pickLocal({ area: state.settings.area, focus: state.settings.focus, blocked });
      if (local) {
        state.commit(local);
        nueva = local;
        aviso = {
          tono: "aviso",
          texto:
            "Sin conexión con la idea en vivo. Esta queda guardada solo en tu teléfono si la marcas.",
        };
      }
    } finally {
      setOcupado(false);
    }

    if (nueva && !aviso) {
      aviso = { tono: "exito", texto: `Idea nueva: «${nueva.title}» · ${AREA_LABEL[nueva.area]}` };
    }
    if (!nueva && !aviso) {
      aviso = {
        tono: "error",
        texto:
          "Ya no quedan ideas nuevas con este filtro. Cambia el ámbito o vacía el historial de vistas.",
      };
    }
    setMensaje(aviso);
    setEstadoCta(nueva ? "exito" : "error");
    temporizador.current = setTimeout(() => setEstadoCta("inactivo"), nueva ? 1700 : 2600);
  }

  const recientes = recent.filter((idea) => idea.id !== current?.id);
  const tema = temaDe(settings.area);

  return (
    <section className="lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-6">
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute -inset-2 animate-respirar rounded-[1.75rem] bg-accent/22 blur-2xl"
          />
          <Boton
            variante="primario"
            tamano="grande"
            estado={estadoCta}
            onClick={() => void generar()}
            aria-describedby="ayuda-cta"
            className="relative w-full"
            etiquetaCargando="Buscando una idea distinta…"
            icono={<Sparkles className="size-5" aria-hidden="true" />}
          >
            {estadoCta === "exito"
              ? "Idea lista"
              : estadoCta === "error"
                ? "Sin ideas nuevas"
                : "Dame una idea"}
          </Boton>
        </div>

        <p id="ayuda-cta" className="mt-3 text-xs leading-relaxed text-muted">
          Un toque = una idea distinta. Se guarda en este teléfono solo si la marcas.
        </p>

        <EstadoVivo mensaje={mensaje} />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PildoraInfo
            glifo={tema.emoji}
            texto={`Ámbito: ${settings.area === "cualquiera" ? "cualquiera" : AREA_LABEL[settings.area]}`}
          />
          <PildoraInfo
            texto={`Enfoque: ${settings.focus === "ambos" ? "ambos" : settings.focus === "procesos" ? "procesos" : "uso diario"}`}
          />
          <PildoraInfo
            glifo={settings.useAi ? "🛰️" : "📴"}
            texto={settings.useAi ? "Ideas en vivo" : "Solo archivo local"}
          />
          <Boton
            variante="fantasma"
            onClick={() => onIrA("ajustes")}
            className="min-h-11 border border-line px-3.5 text-xs"
            icono={<SlidersHorizontal className="size-3.5" aria-hidden="true" />}
          >
            Cambiar
          </Boton>
        </div>

        {agotado ? (
          <div className="tarjeta rise mt-5 p-5" style={vars({ "--hue": "#e2725b" })}>
            <h2 className="font-display text-2xl leading-tight text-fg">
              {settings.useAi
                ? "El archivo local ya se agotó con este filtro"
                : "Ya no quedan ideas nuevas con este filtro"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {settings.useAi
                ? "Las ideas en vivo pueden seguir proponiendo cosas nuevas. Si prefieres el archivo de este teléfono, cambia el ámbito o vacía el historial de vistas: lo que guardaste no se borra."
                : "Cambia el ámbito en Ajustes o vacía el historial de vistas. Lo que guardaste no se borra."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Boton
                variante="primario"
                onClick={() => onIrA("ajustes")}
                icono={<SlidersHorizontal className="size-4" />}
              >
                Abrir ajustes
              </Boton>
              <Boton
                variante="secundario"
                onClick={() => onIrA("guardadas")}
                icono={<Bookmark className="size-4" />}
              >
                Ver guardadas
              </Boton>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <ConsejoDelDia />
        </div>
      </div>

      <div className="mt-6 lg:mt-0">
        {current ? (
          <IdeaTarjeta
            key={current.id}
            idea={current}
            saved={Boolean(saved[current.id])}
            onToggle={() => toggleSave(current)}
          />
        ) : (
          <Bienvenida />
        )}
      </div>

      {recientes.length > 0 ? (
        <div className="mt-8 lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.16em] text-muted uppercase">
              <History className="size-3.5" aria-hidden="true" />
              Recientes en este teléfono
            </h2>
            <span aria-hidden="true" className="text-xs text-muted">
              {recientes.length}
            </span>
          </div>
          <Riel etiqueta="Ideas recientes" pista="Desliza" className="mt-2">
            {recientes.map((idea) => (
              <button
                key={idea.id}
                type="button"
                onClick={() => {
                  focusIdea(idea);
                  anunciar(`Abriendo «${idea.title}»`, "neutro");
                }}
                className="tarjeta tarjeta-elevable w-56 p-3.5 text-left"
                style={vars({ "--hue": temaDe(idea.area).hue })}
                aria-label={`Volver a abrir la idea ${idea.title}`}
              >
                <span className="flex items-center gap-1.5 text-[0.6875rem] tracking-wide text-muted uppercase">
                  <span aria-hidden="true">{temaDe(idea.area).emoji}</span>
                  {AREA_LABEL[idea.area]}
                </span>
                <span className="font-display mt-1.5 block truncate text-lg leading-tight text-fg">
                  {idea.title}
                </span>
                <span className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                  <Eye className="size-3" aria-hidden="true" />
                  {saved[idea.id] ? "Guardada" : "Vista antes"}
                </span>
              </button>
            ))}
          </Riel>
        </div>
      ) : null}
    </section>
  );
}

function PildoraInfo({ glifo, texto }: { glifo?: string; texto: string }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs text-muted">
      {glifo ? <span aria-hidden="true">{glifo}</span> : null}
      {texto}
    </span>
  );
}

const TONO_MENSAJE = {
  neutro: {
    clase: "border-line bg-surface text-fg",
    icono: <Info className="size-4 shrink-0 text-accent" aria-hidden="true" />,
  },
  exito: {
    clase: "border-moss/45 bg-moss/10 text-[#e9f6dc]",
    icono: <Check className="size-4 shrink-0 text-moss" aria-hidden="true" />,
  },
  aviso: {
    clase: "border-aviso/45 bg-aviso/10 text-[#f8ecc9]",
    icono: <Info className="size-4 shrink-0 text-aviso" aria-hidden="true" />,
  },
  error: {
    clase: "border-peligro/50 bg-peligro/10 text-[#ffe6de]",
    icono: <TriangleAlert className="size-4 shrink-0 text-peligro" aria-hidden="true" />,
  },
} as const;

/** Región viva única del panel: aquí se anuncian los resultados de cada toque. */
function EstadoVivo({ mensaje }: { mensaje: Mensaje | null }) {
  return (
    <div role="status" aria-live="polite">
      {mensaje ? (
        <p
          className={cn(
            "aviso-flotante mt-3 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-sm leading-relaxed",
            TONO_MENSAJE[mensaje.tono].clase,
          )}
        >
          {TONO_MENSAJE[mensaje.tono].icono}
          <span className="min-w-0">{mensaje.texto}</span>
        </p>
      ) : null}
    </div>
  );
}

function Bienvenida() {
  const pasos = [
    {
      icono: <Hand className="size-4" aria-hidden="true" />,
      titulo: "Pulsa",
      texto: "Una idea distinta en cada toque, del archivo local o pensada en vivo.",
    },
    {
      icono: <Compass className="size-4" aria-hidden="true" />,
      titulo: "Explora",
      texto: "Para quién es, qué problema cotidiano resuelve y cómo se usaría, paso a paso.",
    },
    {
      icono: <Bookmark className="size-4" aria-hidden="true" />,
      titulo: "Guarda",
      texto: "Lo que te sirve se queda en este dispositivo, sin cuenta ni nube.",
    },
  ];

  return (
    <div className="tarjeta rise p-6 lg:p-7" style={vars({ "--hue": "#e08a4f" })}>
      <p className="font-display text-3xl leading-[1.05] text-fg lg:text-[2.5rem]">
        Una idea cada vez que pulses.
      </p>
      <p className="mt-3.5 max-w-md text-sm leading-relaxed text-muted">
        Pushidea propone aplicaciones de uso cotidiano o que aligeran un proceso. Nada de pagos,
        transferencias ni cuentas de banco: si una idea roza esos temas, se descarta antes de
        mostrarse.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {pasos.map((paso, indice) => (
          <li
            key={paso.titulo}
            className={cn(
              "rounded-2xl border border-line bg-surface/70 p-3.5 rise",
              `d${indice + 1}`,
            )}
          >
            <span className="flex items-center gap-2 text-accent">
              {paso.icono}
              <span className="text-sm font-semibold text-fg">{paso.titulo}</span>
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-muted">{paso.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
