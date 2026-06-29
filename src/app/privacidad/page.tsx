export const metadata = {
  title: 'Aviso de Privacidad | Veliora',
  description: 'Aviso de privacidad de Veliora. Conoce cómo protegemos tus datos.',
}

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <a href="/" className="inline-flex items-baseline gap-1 mb-8 hover:opacity-80 transition-opacity">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>Veliora</span>
          <span className="text-xs text-cyan-400" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>.lat</span>
        </a>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Aviso de Privacidad</h1>

        <div className="space-y-6 text-sm leading-relaxed">
          <p><strong className="text-white">Fecha de vigencia:</strong> 1 de julio de 2026</p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Responsable de los datos</h2>
            <p>Veliora.lat (en adelante, "Veliora", "nosotros" o "el responsable") es el responsable del tratamiento de sus datos personales. Nuestro domicilio se encuentra en Ciudad Victoria, Tamaulipas, México.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Datos que recopilamos</h2>
            <p>Recopilamos la siguiente información cuando usted crea una cuenta y utiliza nuestros servicios:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Nombre y correo electrónico</li>
              <li>Nombre de su boutique y datos de inventario que usted ingresa</li>
              <li>Datos de ventas y transacciones registradas en la plataforma</li>
              <li>Información de uso de la plataforma (páginas visitadas, funciones utilizadas)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Finalidad del tratamiento</h2>
            <p>Sus datos personales serán utilizados para las siguientes finalidades:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Proveer y mantener su cuenta en la plataforma Veliora</li>
              <li>Procesar y gestionar su membresía y pagos</li>
              <li>Brindar soporte técnico y atención al cliente</li>
              <li>Mejorar nuestros servicios y desarrollar nuevas funcionalidades</li>
              <li>Enviar comunicaciones relacionadas con su cuenta y membresía</li>
              <li>Cumplir con obligaciones legales y fiscales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Transferencia de datos</h2>
            <p>Sus datos personales no serán compartidos con terceros para fines comerciales. Podemos compartir datos con proveedores de servicios tecnológicos (como servidores en la nube) que nos ayudan a operar la plataforma, bajo estrictos acuerdos de confidencialidad.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Sus derechos ARCO</h2>
            <p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, envíe un correo a giovva729@hotmail.com o un mensaje por WhatsApp al +528342177709.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Seguridad de los datos</h2>
            <p>Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger sus datos contra daño, pérdida, alteración, destrucción o uso no autorizado. Sus datos se almacenan en servidores seguros con encriptación SSL/TLS.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Cambios al aviso de privacidad</h2>
            <p>Nos reservamos el derecho de modificar este aviso de privacidad en cualquier momento. Los cambios serán notificados a través de la plataforma o por correo electrónico.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
