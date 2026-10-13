import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  component: Privacy,
});

function Privacy() {
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-16">
      <Link to="/" className="text-sm text-accent">
        Volver
      </Link>
      <h1 className="font-display mt-6 text-4xl text-fg">Privacidad</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted">
        <p>
          Pushidea no pide cuenta. Las ideas que guardas, el historial de las que ya viste y tus ajustes viven
          solo en este teléfono, en el almacenamiento local del navegador. No hay una base compartida: cualquiera
          podría leer o borrar ideas ajenas si estuvieran en un tablero público.
        </p>
        <p>
          Con «Ideas en vivo» apagado, nada sale del dispositivo. Con el interruptor activo, cada toque envía
          únicamente el ámbito elegido y los títulos ya mostrados, para no repetir. No se envían contactos,
          ubicación ni el texto de tus notas. La clave de ese servicio no viaja al teléfono.
        </p>
        <p>
          Caché: la última idea y las guardadas se reabren sin volver a pedirlas. El archivo local de ideas está
          dentro de la app y no se descarga de terceros. No hay anuncios ni medición de conducta.
        </p>
        <p>
          Esta app no propone pagos, transferencias, cuentas ni bancos. Si una idea generada menciona esos temas,
          se descarta antes de mostrarla.
        </p>
        <p>Puedes borrar las guardadas una por una, o vaciar el historial de vistas sin tocar lo que marcaste.</p>
      </div>
    </main>
  );
}
