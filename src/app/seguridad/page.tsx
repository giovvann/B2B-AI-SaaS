import Link from "next/link";

export const metadata = {
  title: "Seguridad | Veliora",
  description:
    "Conoce las practicas de seguridad de Veliora. Encriptacion, infraestructura, control de acceso y mas. Tus datos estan protegidos.",
};

export default function SeguridadPage() {
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
        {/* Title */}
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
            <span className="text-xs font-semibold text-blue-400 tracking-wider">SEGURIDAD</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Seguridad en Veliora
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            La confianza de nuestros clientes es lo mas importante. Te explicamos como protegemos tu informacion en
            cada capa de la plataforma.
          </p>
        </div>

        {/* Shield indicators */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl p-5 border border-green-500/20 text-center">
            <svg className="w-10 h-10 mx-auto text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="text-2xl font-black text-green-400">100%</div>
            <div className="text-xs text-gray-500 font-semibold mt-0.5">Trafico encriptado</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl p-5 border border-blue-500/20 text-center">
            <svg className="w-10 h-10 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div className="text-2xl font-black text-blue-400">24/7</div>
            <div className="text-xs text-gray-500 font-semibold mt-0.5">Monitoreo continuo</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 to-transparent rounded-2xl p-5 border border-cyan-500/20 text-center">
            <svg className="w-10 h-10 mx-auto text-cyan-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <div className="text-2xl font-black text-cyan-400">SOC 2</div>
            <div className="text-xs text-gray-500 font-semibold mt-0.5">Infraestructura conforme</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Encrypt */}
          <SecuritySection
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            title="Encriptacion de datos"
          >
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">TLS 1.3:</strong> Todo el trafico entre tu dispositivo y nuestros servidores esta cifrado con el estandar mas reciente de seguridad en transporte.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">Encriptacion en reposo:</strong> Los datos almacenados en la base de datos estan cifrados con AES-256.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">Contrasenas:</strong> Nunca se almacenan en texto plano. Usamos hashing con bcrypt + salt.</span>
              </li>
            </ul>
          </SecuritySection>

          {/* Infrastructure */}
          <SecuritySection
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            }
            title="Infraestructura"
          >
            <p>
              Veliora esta alojado en <strong className="text-white">Vercel</strong> y <strong className="text-white">Supabase</strong>,
              dos de las plataformas mas seguras del mundo. Ambas cumplen con estandares de seguridad de nivel empresarial:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs font-bold text-white mb-1">Vercel</p>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  <li>SOC 2 Tipo II</li>
                  <li>ISO 27001</li>
                  <li>GDPR compliant</li>
                  <li>Edge Network global</li>
                  <li>DDoS protection</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs font-bold text-white mb-1">Supabase</p>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  <li>SOC 2 Tipo II</li>
                  <li>ISO 27001</li>
                  <li>HIPAA compliant</li>
                  <li>Encriptacion AES-256</li>
                  <li>Copias diarias automaticas</li>
                </ul>
              </div>
            </div>
          </SecuritySection>

          {/* Access */}
          <SecuritySection
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Control de acceso"
          >
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">Autenticacion segura</strong> con Supabase Auth (sesiones JWT, refresh tokens, MCP).</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">Row Level Security (RLS):</strong> Cada boutique tiene sus datos completamente aislados. Es imposible que un usuario vea datos de otra boutique.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">Roles:</strong> Los empleados solo ven lo necesario para vender. Sin acceso a costos, ganancias ni configuracion.</span>
              </li>
            </ul>
          </SecuritySection>

          {/* Backups */}
          <SecuritySection
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
            title="Copias de seguridad"
          >
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span><strong className="text-white">Diarias automaticas</strong> de toda la base de datos.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span>Almacenadas en <strong className="text-white">ubicaciones separadas</strong> y encriptadas.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span>Capacidad de <strong className="text-white">restauracion en menos de 4 horas</strong> en caso de desastre.</span>
              </li>
            </ul>
          </SecuritySection>

          {/* Practices */}
          <SecuritySection
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Practicas de desarrollo"
          >
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span>Seguimos las mejores practicas de <strong className="text-white">OWASP</strong> para desarrollo seguro.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span>Dependencias <strong className="text-white">actualizadas regularmente</strong> para evitar vulnerabilidades conocidas.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span>No almacenamos informacion sensible innecesaria y <strong className="text-white">eliminamos datos obsoletos</strong> periodicamente.</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                <span>Las claves de API y tokens de servicios externos <strong className="text-white">nunca se exponen</strong> en el codigo fuente.</span>
              </li>
            </ul>
          </SecuritySection>

          {/* Vulnerability report */}
          <SecuritySection
            icon={
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            title="Reporte de vulnerabilidades"
          >
            <p>
              Si encuentras una vulnerabilidad de seguridad en Veliora, agradeceriamos que nos lo reportes de manera
              responsable. Nos comprometemos a:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1 text-gray-400">
              <li>Responder en menos de <strong className="text-white">24 horas</strong></li>
              <li>Mantenerte informado del progreso de la solucion</li>
              <li>Resolver el problema lo antes posible (tipicamente menos de 72 horas)</li>
              <li>No tomar acciones legales contra reportes de buena fe</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <a
                href="https://wa.me/528342177709?text=Hola%2C%20quiero%20reportar%20un%20tema%20de%20seguridad%20en%20Veliora"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #dc2626, #f97316)" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Reportar vulnerabilidad</span>
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
          </SecuritySection>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-xs text-gray-600">
            En Veliora, la seguridad es un proceso continuo, no un destino. Siempre estamos mejorando.
          </p>
          <p className="text-xs text-gray-700 mt-1">
            &copy; 2026 Veliora. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </main>
  );
}

function SecuritySection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-2xl p-6 sm:p-8 border border-white/[0.06] transition-all hover:border-white/10">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
          <div className="text-sm leading-relaxed text-gray-400 space-y-2">{children}</div>
        </div>
      </div>
    </section>
  );
}
