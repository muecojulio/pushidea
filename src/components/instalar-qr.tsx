import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Laptop,
  MonitorSmartphone,
  QrCode,
  Share2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { useAviso } from "@/components/ui/use-aviso";
import { Boton, type EstadoBoton } from "@/components/ui/boton";
import { Plegable } from "@/components/ui/plegable";
import { vars } from "@/lib/ui/cn";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Pestaña Instalar: un solo lugar para llevar Pushidea a cualquier dispositivo.
 *
 * El código QR se dibuja AQUÍ, en tu navegador, con la librería abierta
 * `qrcode` (github.com/soldair/qrcode). La dirección de la app no se envía a
 * ningún servicio externo de códigos QR.
 */
export function InstalarQr() {
  const anunciar = useAviso();
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [estadoCopiar, setEstadoCopiar] = useState<EstadoBoton>("inactivo");
  const [estadoCompartir, setEstadoCompartir] = useState<EstadoBoton>("inactivo");
  const [estadoInstalar, setEstadoInstalar] = useState<EstadoBoton>("inactivo");
  const [installed, setInstalled] = useState(false);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const destino = `${window.location.origin}/`;
    setUrl(destino);
    void QRCode.toDataURL(destino, {
      width: 640,
      margin: 2,
      color: { dark: "#1a120c", light: "#f4f1e8" },
    })
      .then(setQr)
      .catch(() => setQr(null));

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function copiar() {
    setEstadoCopiar("cargando");
    try {
      await navigator.clipboard.writeText(url);
      setEstadoCopiar("exito");
      anunciar("Liga copiada al portapapeles", "exito");
    } catch {
      setEstadoCopiar("error");
      anunciar("El navegador no dejó copiar la liga", "error");
    }
    window.setTimeout(() => setEstadoCopiar("inactivo"), 1900);
  }

  async function compartir() {
    setEstadoCompartir("cargando");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Pushidea", text: "Ideas de apps para el día a día", url });
        setEstadoCompartir("exito");
        anunciar("Liga compartida", "exito");
      } else {
        await copiar();
        setEstadoCompartir("exito");
        anunciar("Sin panel de compartir aquí: la liga quedó copiada", "aviso");
      }
    } catch {
      // La persona cerró el panel de compartir: no es un error.
      setEstadoCompartir("inactivo");
      return;
    }
    window.setTimeout(() => setEstadoCompartir("inactivo"), 1900);
  }

  async function instalar() {
    if (!promptEvent) return;
    setEstadoInstalar("cargando");
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      setPromptEvent(null);
      if (outcome === "accepted") {
        setInstalled(true);
        setEstadoInstalar("exito");
        anunciar("Pushidea instalada en este dispositivo", "exito");
      } else {
        setEstadoInstalar("inactivo");
        anunciar("Instalación cancelada", "neutro");
        return;
      }
    } catch {
      setEstadoInstalar("error");
      anunciar("El navegador no pudo instalarla ahora mismo", "error");
    }
    window.setTimeout(() => setEstadoInstalar("inactivo"), 2200);
  }

  return (
    <section className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-5 lg:space-y-0">
      <div className="tarjeta p-5 text-center" style={vars({ "--hue": "#e08a4f" })}>
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-fg">
          <MonitorSmartphone className="size-5 text-accent" aria-hidden="true" />
          Instálala en cualquier dispositivo
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Apunta la cámara de tu teléfono, tableta u otro equipo a este código. Abre Pushidea tal
          cual, sin tiendas ni cuentas.
        </p>

        <div className="relative mx-auto mt-6 w-fit">
          <span
            aria-hidden="true"
            className="absolute -inset-4 animate-respirar rounded-[2rem] bg-accent/20 blur-2xl"
          />
          <span className="marco-qr relative block rounded-2xl bg-[#f4f1e8] p-3">
            {qr ? (
              <span className="relative block">
                <img
                  src={qr}
                  alt={`Código QR para abrir Pushidea en ${url}`}
                  width={232}
                  height={232}
                  className="block size-58 rounded-xl"
                />
                <span aria-hidden="true" className="linea-escaneo" />
              </span>
            ) : (
              <span className="esqueleto flex size-58 items-center justify-center rounded-xl text-sm text-muted">
                Generando el código…
              </span>
            )}
          </span>
        </div>

        <p className="mt-5 text-xs break-all text-muted">{url}</p>
        <p className="mx-auto mt-3 flex max-w-sm items-start justify-center gap-2 text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-moss" aria-hidden="true" />
          El QR se crea en este navegador: la dirección no pasa por ningún servicio externo de
          códigos.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Boton
            variante="secundario"
            estado={estadoCopiar}
            onClick={() => void copiar()}
            className="w-full"
            icono={<Copy className="size-4" aria-hidden="true" />}
            mensajeExito="Liga copiada"
            mensajeError="No se pudo copiar la liga"
          >
            {estadoCopiar === "exito" ? "Copiada" : "Copiar liga"}
          </Boton>
          <Boton
            variante="primario"
            estado={estadoCompartir}
            onClick={() => void compartir()}
            className="w-full"
            icono={
              estadoCompartir === "exito" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Share2 className="size-4" aria-hidden="true" />
              )
            }
          >
            {estadoCompartir === "exito" ? "Compartida" : "Compartir"}
          </Boton>
        </div>
      </div>

      <div className="space-y-4">
        <div className="tarjeta p-4" style={vars({ "--hue": "#4fc08a" })}>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
            <QrCode className="size-4 text-jade" aria-hidden="true" />
            En este dispositivo
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {installed
              ? "Pushidea ya está instalada aquí. Ábrela desde tu pantalla de inicio."
              : "Si tu navegador lo permite, instálala directamente. Si no, sigue los pasos de abajo según tu equipo."}
          </p>
          {promptEvent && !installed ? (
            <Boton
              variante="primario"
              estado={estadoInstalar}
              onClick={() => void instalar()}
              className="mt-4 w-full"
              etiquetaCargando="Abriendo el aviso del navegador…"
              icono={<MonitorSmartphone className="size-4" aria-hidden="true" />}
            >
              {estadoInstalar === "exito" ? "Instalada" : "Instalar ahora"}
            </Boton>
          ) : null}
          {!installed ? (
            <a
              href="?install=1&platform=ios"
              className="boton boton-secundario mt-3 w-full"
              style={vars({ "--hue": "#4fc08a" })}
            >
              <Smartphone className="size-4" aria-hidden="true" />
              <span>Ver cómo instalar en iPhone</span>
            </a>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-muted uppercase">
            Según tu equipo
          </p>
          <Plegable
            titulo="Android"
            subtitulo="Chrome, Edge o el navegador que uses"
            icono={<Smartphone className="size-4.5" aria-hidden="true" />}
            hue="#4fc08a"
            abiertoInicial
          >
            <p className="text-sm leading-relaxed text-muted">
              Abre la liga o escanea el QR con Chrome, toca el menú{" "}
              <span className="text-fg">⋮</span> y elige «Instalar app» o «Agregar a pantalla de
              inicio».
            </p>
          </Plegable>
          <Plegable
            titulo="iPhone o iPad"
            subtitulo="Safari, con la pantalla completa"
            icono={<Smartphone className="size-4.5" aria-hidden="true" />}
            hue="#6a9df0"
          >
            <p className="text-sm leading-relaxed text-muted">
              Abre la liga en Safari, toca Compartir y luego «Agregar a inicio». Queda como una app
              más, a pantalla completa.
            </p>
          </Plegable>
          <Plegable
            titulo="Computadora"
            subtitulo="Chrome, Edge o favoritos"
            icono={<Laptop className="size-4.5" aria-hidden="true" />}
            hue="#a98bf0"
          >
            <p className="text-sm leading-relaxed text-muted">
              En Chrome o Edge busca el icono de instalación en la barra de direcciones. También
              puedes simplemente guardar la liga en favoritos.
            </p>
          </Plegable>
        </div>

        <p className="rounded-3xl border border-line bg-surface/70 px-4 py-3.5 text-sm leading-relaxed text-muted">
          Una vez instalada funciona sin conexión con tus ideas guardadas: todo vive en ese
          dispositivo.
        </p>
      </div>
    </section>
  );
}
