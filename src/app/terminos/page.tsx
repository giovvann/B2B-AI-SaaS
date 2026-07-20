import Link from "next/link";

export const metadata = {
  title: "Terminos y Condiciones | Veliora",
  description:
    "Terminos y condiciones de uso de Veliora. Conoce los detalles de tu membresia, pagos, periodo de prueba y responsabilidades.",
};

export default function TerminosPage() {
  const Section = ({number,title,children}: {number:string;title:string;children:React.ReactNode}) => (
    <section style={{"background":"#fff","borderRadius":".8rem","padding":"1.25rem 1.5rem","border":"1px solid rgba(200,164,118,.12)","transition":"border-color .2s"}}>
      <div style={{"display":"flex","alignItems":"flex-start","gap":".75rem"}}>
        <span style={{"flexShrink":0,"width":"1.8rem","height":"1.8rem","borderRadius":".4rem","background":"rgba(200,164,118,.1)","color":"#c8a476","display":"flex","alignItems":"center","justifyContent":"center","fontSize":".65rem","fontWeight":700,"marginTop":".1rem"}}>{number}</span>
        <div style={{"flex":1,"minWidth":0}}>
          <h2 style={{"fontSize":".9rem","fontWeight":700,"color":"#2a2420","marginBottom":".4rem","fontFamily":"'Playfair Display',Georgia,serif"}}>{title}</h2>
          <div style={{"fontSize":".78rem","lineHeight":1.65,"color":"rgba(42,36,32,.55)","maxWidth":"680px"}}>{children}</div>
        </div>
      </div>
    </section>
  );

  return (
    <main style={{"background":"#fdfaf5","color":"#2a2420","minHeight":"100vh"}}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{"borderBottom":"1px solid rgba(42,36,32,.06)","backdropFilter":"blur(12px)","background":"rgba(253,250,245,.85)"}}>
        <div style={{"maxWidth":"980px","margin":"0 auto","padding":".75rem 1.5rem","display":"flex","alignItems":"center","justifyContent":"space-between"}}>
          <Link href="/" style={{"display":"inline-flex","alignItems":"baseline","gap":".15rem","textDecoration":"none","color":"#2a2420"}}>
            <span style={{"fontSize":"1.25rem","fontWeight":600,"fontFamily":"'Playfair Display',Georgia,serif"}}>Veliora</span>
            <em style={{"fontSize":".65rem","color":"#c8a476","fontStyle":"normal","fontFamily":"'Inter',sans-serif","fontWeight":300}}> · lat</em>
          </Link>
          <Link href="/" style={{"display":"flex","alignItems":"center","gap":".35rem","fontSize":".85rem","color":"rgba(42,36,32,.4)","textDecoration":"none","transition":"color .2s"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Volver</span>
          </Link>
        </div>
      </header>

      <div style={{"maxWidth":"840px","margin":"0 auto","padding":"3rem 1.5rem 5rem"}}>
        {/* Title */}
        <div style={{"marginBottom":"2.5rem","textAlign":"center"}}>
          <div style={{"display":"inline-flex","alignItems":"center","gap":".4rem","padding":".3rem 1rem","borderRadius":"100px","background":"rgba(200,164,118,.1)","border":"1px solid rgba(200,164,118,.2)","marginBottom":".8rem"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span style={{"fontSize":".6rem","fontWeight":600,"color":"#c8a476","letterSpacing":".12em","textTransform":"uppercase"}}>DOCUMENTO LEGAL</span>
          </div>
          <h1 style={{"fontSize":"clamp(1.5rem,3.5vw,2.5rem)","fontWeight":800,"color":"#2a2420","marginBottom":".4rem","letterSpacing":"-.02em","fontFamily":"'Playfair Display',Georgia,serif"}}>Términos y Condiciones</h1>
          <p style={{"color":"rgba(42,36,32,.5)","maxWidth":"560px","margin":"0 auto","fontSize":".85rem","lineHeight":1.6}}>Estos términos rigen el uso de la plataforma Veliora.</p>
        </div>

        {/* Last updated */}
        <div style={{"display":"flex","alignItems":"center","justifyContent":"center","gap":".35rem","marginBottom":"2rem","fontSize":".7rem","color":"rgba(42,36,32,.4)"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Última actualización: 18 de julio de 2026</span>
        </div>

        <div style={{"display":"flex","flexDirection":"column","gap":"1rem"}}>
          <Section number="1" title="Aceptación de los términos">
            <p>Al crear una cuenta en Veliora.lat (en adelante, <strong style={{"color":"#2a2420"}}>"la plataforma"</strong>), usted declara haber leído, entendido y aceptado estos Términos y Condiciones. Si no está de acuerdo con alguno de ellos, no debe utilizar la plataforma. El uso continuado del servicio implica la aceptación de cualquier modificación futura a estos términos.</p>
          </Section>

          <Section number="2" title="Descripción del servicio">
            <p>Veliora es un sistema de punto de venta e inventario con inteligencia artificial, diseñado para boutiques de ropa. La plataforma permite:</p>
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","marginTop":".4rem","display":"flex","flexDirection":"column","gap":".25rem","fontSize":".78rem","color":"rgba(42,36,32,.55)"}}>
              <li>Controlar inventario por tallas, colores y códigos de barras</li>
              <li>Registrar ventas de forma rápida con búsqueda inteligente</li>
              <li>Escaneo de facturas con IA para carga automática de productos</li>
              <li>Dashboard con métricas, gráficas y asistente de IA</li>
              <li>Exportación de datos a Excel y CSV</li>
              <li>Gestión de múltiples dispositivos y cuentas de empleados</li>
              <li>Funcionamiento sin conexión a internet (offline-first)</li>
            </ul>
          </Section>

          <Section number="3" title="Membresía y pago">
            <p style={{"marginBottom":".5rem"}}>El servicio se ofrece en dos modalidades:</p>
            <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(200px,1fr))","gap":".6rem","marginBottom":".6rem"}}>
              <div style={{"background":"rgba(200,164,118,.05)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <div style={{"fontSize":"1rem","fontWeight":700,"color":"#2a2420","marginBottom":".15rem"}}>Plan Gratis</div>
                <p style={{"fontSize":".72rem","color":"rgba(42,36,32,.5)"}}>$0 siempre. Hasta 50 productos, 1 dispositivo, funciones básicas.</p>
              </div>
              <div style={{"background":"rgba(200,164,118,.08)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.2)"}}>
                <div style={{"fontSize":"1rem","fontWeight":700,"color":"#2a2420","marginBottom":".15rem"}}>Plan Premium</div>
                <p style={{"fontSize":".72rem","color":"rgba(42,36,32,.5)"}} id="terminosPrice">$239/mes. Ilimitado, IA, escáner, alertas, multi-dispositivo.</p>
              </div>
            </div>
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","display":"flex","flexDirection":"column","gap":".25rem","fontSize":".78rem","color":"rgba(42,36,32,.55)"}}>
              <li>El pago se realiza por depósito bancario, transferencia SPEI o efectivo, coordinado vía WhatsApp.</li>
              <li>La membresía se activa una vez confirmado el pago (típicamente en menos de 30 minutos).</li>
              <li>Usted puede cancelar su membresía en cualquier momento sin multas ni penalizaciones.</li>
              <li>No se realizan reembolsos por meses parciales ya utilizados.</li>
              <li>El precio de lanzamiento se mantiene mientras sea miembro activo sin interrupciones.</li>
            </ul>
          </Section>

          <Section number="4" title="Período de prueba">
            <p>Ofrecemos 7 días de prueba gratuita del plan Premium sin necesidad de registrar tarjeta de crédito. Durante este período, usted tiene acceso a todas las funciones de la plataforma. Al finalizar, su cuenta continuará en el plan Gratis a menos que adquiera la membresía Premium.</p>
          </Section>

          <Section number="5" title="Uso de la plataforma">
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","display":"flex","flexDirection":"column","gap":".25rem","fontSize":".78rem","color":"rgba(42,36,32,.55)"}}>
              <li>Usted es el único responsable de mantener la confidencialidad de su cuenta y contraseña.</li>
              <li>No puede usar la plataforma para actividades ilegales, no autorizadas o que infrinjan derechos de terceros.</li>
              <li>Los datos de su negocio (inventario, ventas, clientes) le pertenecen exclusivamente a usted. Puede exportarlos en cualquier momento.</li>
              <li>Nos reservamos el derecho de suspender cuentas que violen estos términos, previa notificación.</li>
              <li>No está permitido revender, sublicenciar ni transferir su cuenta a terceros.</li>
            </ul>
          </Section>

          <Section number="6" title="Propiedad intelectual">
            <p>El nombre, logotipo, diseño de interfaz y código de Veliora son propiedad exclusiva del desarrollador. Usted no adquiere ningún derecho de propiedad sobre el software, solo una licencia de uso limitada al servicio contratado.</p>
          </Section>

          <Section number="7" title="Limitación de responsabilidad">
            <p>Veliora se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio sea ininterrumpido, libre de errores o que cumpla con expectativas específicas de su negocio. En la máxima medida permitida por la ley mexicana, no seremos responsables por daños indirectos, incidentales o pérdidas de ingresos derivadas del uso o la imposibilidad de usar la plataforma.</p>
          </Section>

          <Section number="8" title="Cancelación y suspensión">
            <p>Usted puede cancelar su cuenta en cualquier momento desde la plataforma o contactándonos por WhatsApp. Nos reservamos el derecho de suspender o cancelar cuentas por:</p>
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","marginTop":".4rem","display":"flex","flexDirection":"column","gap":".25rem","fontSize":".78rem","color":"rgba(42,36,32,.55)"}}>
              <li>Falta de pago de la membresía Premium</li>
              <li>Vulneración comprobada de estos términos</li>
              <li>Inactividad prolongada (más de 12 meses)</li>
              <li>Solicitud expresa del usuario</li>
            </ul>
          </Section>

          <Section number="9" title="Ley aplicable">
            <p>Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia relacionada con el servicio será resuelta ante los tribunales competentes de Ciudad Victoria, Tamaulipas, renunciando a cualquier otro fuero que pudiera corresponder.</p>
          </Section>

          <Section number="10" title="Contacto">
            <p>Para cualquier duda, aclaración o notificación sobre estos términos, puede contactarnos por:</p>
            <div style={{"display":"flex","flexWrap":"wrap","gap":".6rem","marginTop":".8rem"}}>
              <a href="https://wa.me/528342177709?text=Hola%2C%20tengo%20una%20duda%20sobre%20los%20t%C3%A9rminos%20y%20condiciones" target="_blank" rel="noopener noreferrer" style={{"display":"inline-flex","alignItems":"center","gap":".4rem","padding":".6rem 1.2rem","borderRadius":".6rem","fontSize":".78rem","fontWeight":600,"color":"#fff","textDecoration":"none","background":"linear-gradient(135deg,#25D366,#128C7E)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </a>
              <a href="mailto:giovva729@hotmail.com" style={{"display":"inline-flex","alignItems":"center","gap":".4rem","padding":".6rem 1.2rem","borderRadius":".6rem","fontSize":".78rem","fontWeight":600,"color":"#2a2420","textDecoration":"none","border":"1px solid rgba(42,36,32,.12)","background":"transparent"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span>Correo electrónico</span>
              </a>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{"marginTop":"2.5rem","paddingTop":"1.5rem","borderTop":"1px solid rgba(200,164,118,.15)","textAlign":"center"}}>
          <p style={{"fontSize":".7rem","color":"rgba(42,36,32,.35)"}}>Al usar Veliora, usted acepta estos términos. Le recomendamos leerlos cuidadosamente.</p>
          <p style={{"fontSize":".65rem","color":"rgba(42,36,32,.25)","marginTop":".15rem"}}>© 2026 Veliora. Todos los derechos reservados.</p>
        </div>
      </div>
    </main>
  );
}
