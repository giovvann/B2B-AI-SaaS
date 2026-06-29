export const metadata = {
  title: 'Términos y Condiciones | Veliora',
  description: 'Términos y condiciones de uso de Veliora.',
}

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <a href="/" className="inline-flex items-baseline gap-1 mb-8 hover:opacity-80 transition-opacity">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>Veliora</span>
          <span className="text-xs text-cyan-400" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>.lat</span>
        </a>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Términos y Condiciones</h1>

        <div className="space-y-6 text-sm leading-relaxed">
          <p><strong className="text-white">Fecha de vigencia:</strong> 1 de julio de 2026</p>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Aceptación de los términos</h2>
            <p>Al crear una cuenta en Veliora.lat (en adelante, "la plataforma"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguno de ellos, no debe utilizar la plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Descripción del servicio</h2>
            <p>Veliora es un sistema de punto de venta e inventario con inteligencia artificial, diseñado para boutiques de ropa. La plataforma permite controlar inventario por tallas y colores, registrar ventas, escanear facturas con IA, y generar métricas de negocio.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Membresía y pago</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>El costo de la membresía es de $449 MXN mensuales o $4,499 MXN anuales.</li>
              <li>El pago se realiza a través de transferencia bancaria o depósito, acordado vía WhatsApp.</li>
              <li>La membresía se activa una vez confirmado el pago.</li>
              <li>Usted puede cancelar su membresía en cualquier momento. Sin multas ni penalizaciones.</li>
              <li>No se realizan reembolsos por meses parciales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Período de prueba</h2>
            <p>Ofrecemos 7 días de prueba gratuita sin necesidad de registrar tarjeta de crédito. Durante este período, usted tiene acceso a todas las funciones de la plataforma. Al finalizar el período, deberá adquirir una membresía para continuar usando el servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Uso de la plataforma</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.</li>
              <li>No puede usar la plataforma para actividades ilegales o no autorizadas.</li>
              <li>Los datos de su boutique (inventario, ventas, etc.) le pertenecen a usted. Puede exportarlos en cualquier momento.</li>
              <li>Nos reservamos el derecho de suspender cuentas que violen estos términos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Limitación de responsabilidad</h2>
            <p>Veliora se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio sea ininterrumpido o libre de errores. No seremos responsables por daños indirectos o pérdidas derivadas del uso de la plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Cancelación y suspensión</h2>
            <p>Usted puede cancelar su cuenta en cualquier momento desde la plataforma o contactándonos por WhatsApp. Nos reservamos el derecho de suspender o cancelar cuentas por falta de pago o violación de estos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Contacto</h2>
            <p>Para cualquier duda sobre estos términos, contáctenos por WhatsApp al +528342177709 o al correo giovva729@hotmail.com.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
