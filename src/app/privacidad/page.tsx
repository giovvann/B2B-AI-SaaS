import Link from "next/link";

export const metadata = {
  title: "Aviso de Privacidad | Veliora",
  description:
    "Aviso de privacidad de Veliora. Conoce como protegemos y tratamos tus datos personales conforme a la ley mexicana.",
};

export default function PrivacidadPage() {
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs font-semibold text-blue-400 tracking-wider">PRIVACIDAD</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Aviso de Privacidad
          </h1>
          <p className="text-gray-400">
            La proteccion de tus datos es nuestra prioridad. Te explicamos como los recopilamos, usamos y protegemos.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10 text-xs text-gray-600">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Ultima actualizacion: 18 de julio de 2026</span>
        </div>

        <div className="space-y-6">
          <Section
            number="1"
            title="Responsable de los datos"
          >
            <p>
              Veliora.lat (en adelante, <strong className="text-white">&ldquo;Veliora&rdquo;</strong>, <strong className="text-white">&ldquo;nosotros&rdquo;</strong> o
              <strong className="text-white">&ldquo;el responsable&rdquo;</strong>) es el responsable del tratamiento de sus datos
              personales. Nuestro domicilio se encuentra en Ciudad Victoria, Tamaulipas, Mexico. Para cualquier
              comunicacion, puede contactarnos a traves de los medios indicados en la seccion de contacto.
            </p>
          </Section>

          <Section
            number="2"
            title="Datos que recopilamos"
          >
            <p className="mb-3">Recopilamos unicamente la informacion necesaria para proveer el servicio:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">Datos de cuenta</span>
                </div>
                <p className="text-xs text-gray-500">Nombre, correo electronico, numero de telefono, nombre de la boutique.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">Datos de negocio</span>
                </div>
                <p className="text-xs text-gray-500">Inventario, productos, precios, tallas, colores, ventas, gastos y clientes que usted registre.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">Datos de uso</span>
                </div>
                <p className="text-xs text-gray-500">Paginas visitadas, funciones utilizadas, tiempo de sesion, tipo de dispositivo y navegador.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">Configuracion</span>
                </div>
                <p className="text-xs text-gray-500">Preferencias de notificaciones, tema visual, idioma y configuracion de cuenta.</p>
              </div>
            </div>
          </Section>

          <Section
            number="3"
            title="Finalidad del tratamiento"
          >
            <p className="mb-3">Sus datos personales seran utilizados unicamente para las siguientes finalidades:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-400">
              <li>Proveer, mantener y mejorar su cuenta en la plataforma Veliora</li>
              <li>Procesar y gestionar su membresia, pagos y renovaciones</li>
              <li>Brindar soporte tecnico, atencion al cliente y resolver incidencias</li>
              <li>Enviar comunicaciones estrictamente relacionadas con el funcionamiento del servicio</li>
              <li>Generar metricas agregadas y anonimas para mejorar la plataforma</li>
              <li>Cumplir con obligaciones legales, fiscales y requerimientos de autoridades competentes</li>
            </ul>
            <p className="mt-3 text-gray-500 text-xs">
              <strong className="text-gray-400">Importante:</strong> No utilizamos sus datos para fines publicitarios,
              venta a terceros, ni perfiles comerciales no relacionados con el servicio.
            </p>
          </Section>

          <Section
            number="4"
            title="Transferencia de datos"
          >
            <p className="mb-3">Sus datos personales no seran compartidos con terceros para fines comerciales ni de publicidad.</p>
            <p className="mb-3">Podemos compartir datos limitados con proveedores de servicios tecnologicos esenciales para la operacion de la plataforma:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-400">
              <li><strong className="text-white">Supabase</strong> — Base de datos, autenticacion y almacenamiento (SOC 2, ISO 27001)</li>
              <li><strong className="text-white">Vercel</strong> — Alojamiento web y edge functions (SOC 2, ISO 27001)</li>
              <li><strong className="text-white">Google Gemini</strong> — Procesamiento de IA para escaneo de facturas</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              Todos nuestros proveedores cumplen con estandares internacionales de seguridad y operan bajo estrictos
              acuerdos de confidencialidad. Sus datos nunca salen de estos proveedores hacia terceros no autorizados.
            </p>
          </Section>

          <Section
            number="5"
            title="Derechos ARCO"
          >
            <p>
              Usted tiene derecho a <strong className="text-white">Acceder</strong>, <strong className="text-white">Rectificar</strong>,
              <strong className="text-white">Cancelar</strong> u <strong className="text-white">Oponerse</strong> al tratamiento
              de sus datos personales en cualquier momento. Para ejercer estos derechos:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1.5 text-gray-400">
              <li>Envie un correo a <strong className="text-white">giovva729@hotmail.com</strong> especificando su solicitud</li>
              <li>O envie un mensaje por WhatsApp al <strong className="text-white">+528342177709</strong></li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              <strong className="text-gray-400">Procedimiento:</strong> Le responderemos en un plazo maximo de 20 dias habiles.
              Para acreditar su identidad, debera proporcionar su nombre completo y correo electronico registrado.
            </p>
          </Section>

          <Section
            number="6"
            title="Seguridad de los datos"
          >
            <p>Implementamos las siguientes medidas de seguridad para proteger sus datos:</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <svg className="w-6 h-6 mx-auto text-green-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs font-semibold text-white">Encriptacion SSL/TLS</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Todo el trafico cifrado</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <svg className="w-6 h-6 mx-auto text-green-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-xs font-semibold text-white">Cifrado en reposo</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Base de datos encriptada</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <svg className="w-6 h-6 mx-auto text-green-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs font-semibold text-white">Autenticacion segura</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Supabase Auth + RLS</p>
              </div>
            </div>
          </Section>

          <Section
            number="7"
            title="Periodo de conservacion"
          >
            <p>
              Conservaremos sus datos personales mientras mantenga una cuenta activa en Veliora. Al cancelar su cuenta,
              sus datos seran eliminados de nuestros servidores activos en un plazo de 30 dias. Las copias de seguridad
              pueden conservar datos cifrados hasta 90 dias adicionales, tras lo cual se purgan automaticamente.
            </p>
          </Section>

          <Section
            number="8"
            title="Cookies y tecnologias similares"
          >
            <p>
              Veliora utiliza cookies estrictamente necesarias para el funcionamiento de la plataforma (sesion de
              usuario, preferencias de tema). No utilizamos cookies de rastreo, publicidad ni de terceros no
              esenciales. Puede configurar su navegador para rechazar cookies, aunque algunas funciones de la
              plataforma podrian verse afectadas.
            </p>
          </Section>

          <Section
            number="9"
            title="Cambios al aviso de privacidad"
          >
            <p>
              Nos reservamos el derecho de modificar este aviso de privacidad en cualquier momento. Los cambios
              sustanciales seran notificados a traves de la plataforma (banner informativo) y por correo electronico
              a los usuarios registrados. Le recomendamos revisar periodicamente esta pagina para estar al tanto de
              cualquier actualizacion.
            </p>
          </Section>

          <Section
            number="10"
            title="Contacto"
          >
            <p>
              Para ejercer sus derechos ARCO, resolver dudas sobre este aviso o reportar cualquier incidente de
              privacidad:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <a
                href="https://wa.me/528342177709?text=Hola%2C%20tengo%20una%20consulta%20sobre%20el%20aviso%20de%20privacidad"
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

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-gray-600">
            Veliora cumple con la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (Mexico).
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
