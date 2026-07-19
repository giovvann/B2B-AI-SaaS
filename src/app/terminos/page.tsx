import Link from "next/link";

export const metadata = {
  title: "Terminos y Condiciones | Veliora",
  description:
    "Terminos y condiciones de uso de Veliora. Conoce los detalles de tu membresia, pagos, periodo de prueba y responsabilidades.",
};

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10" style={{ backdropFilter: "blur(10px)", background: "rgba(10,10,15,0.85)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-baseline gap-1 hover:opacity-80 transition-opacity"
          >
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              Veliora
            </span>
            <span
              className="text-xs text-cyan-400"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
            >
              .lat
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Volver</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/20 mb-4">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-semibold text-blue-400 tracking-wider">DOCUMENTO LEGAL</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Terminos y Condiciones
          </h1>
          <p className="text-gray-400">
            Estos terminos rigen el uso de la plataforma Veliora.
          </p>
        </div>

        {/* Last updated */}
        <div className="flex items-center justify-center gap-2 mb-10 text-xs text-gray-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Ultima actualizacion: 18 de julio de 2026</span>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <Section number="1" title="Aceptacion de los terminos">
            <p>
              Al crear una cuenta en Veliora.lat (en adelante, <strong className="text-white">&ldquo;la plataforma&rdquo;</strong>),
              usted declara haber leido, entendido y aceptado estos Terminos y Condiciones. Si no esta de acuerdo con
              alguno de ellos, no debe utilizar la plataforma. El uso continuado del servicio implica la aceptacion de
              cualquier modificacion futura a estos terminos.
            </p>
          </Section>

          <Section number="2" title="Descripcion del servicio">
            <p>
              Veliora es un sistema de punto de venta e inventario con inteligencia artificial, disenado para boutiques
              de ropa. La plataforma permite:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5 text-gray-400">
              <li>Controlar inventario por tallas, colores y codigos de barras</li>
              <li>Registrar ventas de forma rapida con busqueda inteligente</li>
              <li>Escaneo de facturas con IA para carga automatica de productos</li>
              <li>Dashboard con metricas, graficas y asistente de IA</li>
              <li>Exportacion de datos a Excel y CSV</li>
              <li>Gestion de multiples dispositivos y cuentas de empleados</li>
              <li>Funcionamiento sin conexion a internet (offline-first)</li>
            </ul>
          </Section>

          <Section number="3" title="Membresia y pago">
            <p className="mb-3">El servicio se ofrece en dos modalidades:</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-xl p-5 border border-white/10">
                <div className="text-lg font-bold text-white mb-1">Plan Gratis</div>
                <p className="text-sm text-gray-500">$0 siempre. Hasta 50 productos, 1 dispositivo, funciones basicas.</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-xl p-5 border border-blue-500/20">
                <div className="text-lg font-bold text-white mb-1">Plan Premium</div>
                <p className="text-sm text-gray-500" id="terminosPrice">$239/mes. Ilimitado, IA, escaner, alertas, multi-dispositivo.</p>
              </div>
            </div>
            <ul className="list-disc pl-6 mt-2 space-y-1.5 text-gray-400">
              <li>El pago se realiza por deposito bancario, transferencia SPEI o efectivo, coordinado via WhatsApp.</li>
              <li>La membresia se activa una vez confirmado el pago (tipicamente en menos de 30 minutos).</li>
              <li>Usted puede cancelar su membresia en cualquier momento sin multas ni penalizaciones.</li>
              <li>No se realizan reembolsos por meses parciales ya utilizados.</li>
              <li>El precio de lanzamiento se mantiene mientras sea miembro activo sin interrupciones.</li>
            </ul>
          </Section>

          <Section number="4" title="Periodo de prueba">
            <p>
              Ofrecemos 7 dias de prueba gratuita del plan Premium sin necesidad de registrar tarjeta de credito.
              Durante este periodo, usted tiene acceso a todas las funciones de la plataforma. Al finalizar, su cuenta
              continuara en el plan Gratis a menos que adquiera la membresia Premium.
            </p>
          </Section>

          <Section number="5" title="Uso de la plataforma">
            <ul className="list-disc pl-6 mt-2 space-y-1.5 text-gray-400">
              <li>Usted es el unico responsable de mantener la confidencialidad de su cuenta y contrasena.</li>
              <li>No puede usar la plataforma para actividades ilegales, no autorizadas o que infrinjan derechos de terceros.</li>
              <li>Los datos de su negocio (inventario, ventas, clientes) le pertenecen exclusivamente a usted. Puede exportarlos en cualquier momento.</li>
              <li>Nos reservamos el derecho de suspender cuentas que violen estos terminos, previa notificacion.</li>
              <li>No esta permitido revender, sublicenciar ni transferir su cuenta a terceros.</li>
            </ul>
          </Section>

          <Section number="6" title="Propiedad intelectual">
            <p>
              El nombre, logotipo, diseno de interfaz y codigo de Veliora son propiedad exclusiva del desarrollador.
              Usted no adquiere ningun derecho de propiedad sobre el software, solo una licencia de uso limitada al
              servicio contratado.
            </p>
          </Section>

          <Section number="7" title="Limitacion de responsabilidad">
            <p>
              Veliora se proporciona &ldquo;tal cual&rdquo; y &ldquo;segun disponibilidad&rdquo;. No garantizamos que el servicio sea
              ininterrumpido, libre de errores o que cumpla con expectativas especificas de su negocio. En la maxima
              medida permitida por la ley mexicana, no seremos responsables por danos indirectos, incidentales o
              perdidas de ingresos derivadas del uso o la imposibilidad de usar la plataforma.
            </p>
          </Section>

          <Section number="8" title="Cancelacion y suspension">
            <p>
              Usted puede cancelar su cuenta en cualquier momento desde la plataforma o contactandonos por WhatsApp.
              Nos reservamos el derecho de suspender o cancelar cuentas por:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5 text-gray-400">
              <li>Falta de pago de la membresia Premium</li>
              <li>Violacion comprobada de estos terminos</li>
              <li>Inactividad prolongada (mas de 12 meses)</li>
              <li>Solicitud expresa del usuario</li>
            </ul>
          </Section>

          <Section number="9" title="Ley aplicable">
            <p>
              Estos Terminos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier
              controversia relacionada con el servicio sera resuelta ante los tribunales competentes de Ciudad
              Victoria, Tamaulipas, renunciando a cualquier otro fuero que pudiera corresponder.
            </p>
          </Section>

          <Section number="10" title="Contacto">
            <p>
              Para cualquier duda, aclaracion o notificacion sobre estos terminos, puede contactarnos por:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <a
                href="https://wa.me/528342177709?text=Hola%2C%20tengo%20una%20duda%20sobre%20los%20t%C3%A9rminos%20y%20condiciones"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:giovva729@hotmail.com"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/5 transition-all hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Correo electronico</span>
              </a>
            </div>
          </Section>
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-gray-600">
            Al usar Veliora, usted acepta estos terminos. Le recomendamos leerlos cuidadosamente.
          </p>
          <p className="text-xs text-gray-700 mt-1">
            &copy; 2026 Veliora. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-2xl p-6 sm:p-8 border border-white/[0.06] transition-all hover:border-white/10">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-sm font-black text-white mt-0.5">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
          <div className="text-sm leading-relaxed text-gray-400 space-y-2">{children}</div>
        </div>
      </div>
    </section>
  );
}
