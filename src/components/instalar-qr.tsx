import { useEffect, useState } from "react";
import { Check, Copy, MonitorSmartphone, Share2 } from "lucide-react";
import QRCode from "qrcode";

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
  const [url, setUrl] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [compartido, setCompartido] = useState(false);
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
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  }

  async function compartir() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Pushidea", text: "Ideas de apps para el día a día", url });
        setCompartido(true);
      } else {
        await copiar();
      }
    } catch {
      // La persona cerró el panel de compartir: no es un error.
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-line bg-surface p-5 text-center">
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-fg">
          <MonitorSmartphone className="size-5 text-accent" aria-hidden="true" />
          Instálala en cualquier dispositivo
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Apunta la cámara de tu teléfono, tableta u otro equipo a este código. Abre Pushidea tal cual, sin tiendas
          ni cuentas.
        </p>
        {qr ? (
          <img
            src={qr}
            alt={`Código QR para abrir Pushidea en ${url}`}
            width={256}
            height={256}
            className="mx-auto mt-5 size-64 rounded-2xl"
          />
        ) : (
          <p className="mt-5 text-sm text-muted">Generando el código…</p>
        )}
        <p className="mt-4 text-xs break-all text-muted">{url}</p>
        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted">
          El QR se crea en este navegador: la dirección no pasa por ningún servicio externo de códigos.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void copiar()}
            className="press flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-raised text-sm font-medium text-fg"
          >
            {copiado ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copiado ? "Copiada" : "Copiar liga"}
          </button>
          <button
            type="button"
            onClick={() => void compartir()}
            className="press flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-medium text-ink"
          >
            <Share2 className="size-4" aria-hidden="true" />
            {compartido ? "Compartida" : "Compartir"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-fg">En este dispositivo</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {installed
            ? "Pushidea ya está instalada aquí. Ábrela desde tu pantalla de inicio."
            : "Si tu navegador lo permite, instálala directamente. Si no, sigue los pasos de abajo según tu equipo."}
        </p>
        {promptEvent && !installed ? (
          <button
            type="button"
            className="press mt-4 h-12 w-full rounded-2xl bg-accent text-sm font-medium text-ink"
            onClick={() => {
              void promptEvent.prompt();
              setPromptEvent(null);
            }}
          >
            Instalar ahora
          </button>
        ) : null}
        {!installed ? (
          <a
            href="?install=1&platform=ios"
            className="press mt-3 flex h-12 items-center justify-center rounded-2xl border border-line text-sm font-medium text-fg"
          >
            Ver cómo instalar en iPhone
          </a>
        ) : null}
      </div>

      <div className="space-y-3 rounded-3xl border border-line bg-surface p-4 text-sm leading-relaxed">
        <p className="font-medium text-fg">Según tu equipo</p>
        <p className="text-muted">
          <span className="text-fg">Android:</span> abre la liga o escanea el QR con Chrome, toca el menú ⋮ y elige
          «Instalar app» o «Agregar a pantalla de inicio».
        </p>
        <p className="text-muted">
          <span className="text-fg">iPhone o iPad:</span> abre la liga en Safari, toca Compartir y luego «Agregar a
          inicio». Queda como una app más, a pantalla completa.
        </p>
        <p className="text-muted">
          <span className="text-fg">Computadora:</span> en Chrome o Edge busca el icono de instalación en la barra
          de direcciones. También puedes simplemente guardar la liga en favoritos.
        </p>
        <p className="text-muted">
          Una vez instalada funciona sin conexión con tus ideas guardadas: todo vive en ese dispositivo.
        </p>
      </div>
    </section>
  );
}
