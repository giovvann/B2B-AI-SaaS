export const metadata = {
  title: 'Seguridad | Veliora',
  description: 'Prácticas de seguridad de Veliora. Tus datos están protegidos.',
}

export default function SeguridadPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <a href="/" className="inline-flex items-baseline gap-1 mb-8 hover:opacity-80 transition-opacity">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>Veliora</span>
          <span className="text-xs text-cyan-400" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>.lat</span>
        </a>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Seguridad</h1>

        <div className="space-y-6 text-sm leading-relaxed">
          <p>En Veliora, la seguridad de tus datos es nuestra prioridad. Esto es lo que hacemos para proteger tu información:</p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Encriptación de datos</h2>
            <p>Todos los datos transmitidos entre tu dispositivo y nuestros servidores están cifrados con TLS 1.3 (SSL). Los datos almacenados en la base de datos están cifrados en reposo. Tu contraseña nunca se almacena en texto plano.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Infraestructura</h2>
            <p>Veliora está alojado en los servidores de Vercel y Supabase, dos de las plataformas más seguras del mundo. Ambos cumplen con estándares de seguridad como SOC 2, ISO 27001 y GDPR. Los datos se almacenan en centros de datos con vigilancia física 24/7, control de acceso biométrico y redundancia geográfica.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Control de acceso</h2>
            <p>Implementamos autenticación segura con Supabase Auth. Cada usuario tiene acceso únicamente a los datos de su propia boutique. Los empleados solo ven la información necesaria para vender, sin acceso a costos, ganancias ni datos sensibles. El superadmin tiene acceso restringido y auditado.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Separación de datos</h2>
            <p>Cada boutique tiene sus datos completamente aislados mediante políticas de seguridad a nivel de base de datos (RLS). Es técnicamente imposible que un usuario vea datos de otra boutique.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Copias de seguridad</h2>
            <p>Realizamos copias de seguridad automáticas diarias de toda la base de datos. Las copias se almacenan en ubicaciones separadas y encriptadas. En caso de desastre, podemos restaurar el servicio en menos de 4 horas.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Reporte de vulnerabilidades</h2>
            <p>Si encuentras una vulnerabilidad de seguridad en Veliora, repórtala de inmediato a giovva729@hotmail.com o por WhatsApp al +528342177709. Nos comprometemos a responder en menos de 24 horas y a resolver el problema lo antes posible.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Prácticas de desarrollo</h2>
            <p>Seguimos las mejores prácticas de OWASP para desarrollo seguro. Realizamos revisiones de código y actualizaciones periódicas de dependencias. No almacenamos información sensible innecesaria y eliminamos datos obsoletos regularmente.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Preguntas de seguridad</h2>
            <p>Si tienes preguntas sobre nuestras prácticas de seguridad, contáctanos por WhatsApp al +528342177709 o al correo giovva729@hotmail.com.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
