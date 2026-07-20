import Link from "next/link";

export const metadata = {
  title: "Aviso de Privacidad | Veliora",
  description:
    "Aviso de privacidad de Veliora. Conoce como protegemos y tratamos tus datos personales conforme a la ley mexicana.",
};

export default function PrivacidadPage() {
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <span style={{"fontSize":".6rem","fontWeight":600,"color":"#c8a476","letterSpacing":".12em","textTransform":"uppercase"}}>PRIVACIDAD</span>
          </div>
          <h1 style={{"fontSize":"clamp(1.5rem,3.5vw,2.5rem)","fontWeight":800,"color":"#2a2420","marginBottom":".4rem","letterSpacing":"-.02em","fontFamily":"'Playfair Display',Georgia,serif"}}>Aviso de Privacidad</h1>
          <p style={{"color":"rgba(42,36,32,.5)","maxWidth":"560px","margin":"0 auto","fontSize":".85rem","lineHeight":1.6}}>
            La protección de tus datos es nuestra prioridad. Te explicamos cómo los recopilamos, usamos y protegemos.
          </p>
        </div>

        {/* Last updated */}
        <div style={{"display":"flex","alignItems":"center","justifyContent":"center","gap":".35rem","marginBottom":"2rem","fontSize":".7rem","color":"rgba(42,36,32,.4)"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Última actualización: 18 de julio de 2026</span>
        </div>

        <div style={{"display":"flex","flexDirection":"column","gap":"1rem"}}>
          <PrivSection number="1" title="Responsable de los datos">
            <p>Veliora.lat (en adelante, <strong style={{"color":"#2a2420"}}>"Veliora"</strong>, <strong style={{"color":"#2a2420"}}>"nosotros"</strong> o <strong style={{"color":"#2a2420"}}>"el responsable"</strong>) es el responsable del tratamiento de sus datos personales. Nuestro domicilio se encuentra en Ciudad Victoria, Tamaulipas, México. Para cualquier comunicación, puede contactarnos a través de los medios indicados en la sección de contacto.</p>
          </PrivSection>

          <PrivSection number="2" title="Datos que recopilamos">
            <p style={{"marginBottom":".5rem"}}>Recopilamos únicamente la información necesaria para proveer el servicio:</p>
            <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(200px,1fr))","gap":".6rem"}}>
              <div style={{"background":"rgba(200,164,118,.05)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"marginBottom":".25rem"}}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                <p style={{"fontSize":".7rem","fontWeight":600,"color":"#2a2420","marginBottom":".1rem"}}>Datos de cuenta</p>
                <p style={{"fontSize":".65rem","color":"rgba(42,36,32,.5)"}}>Nombre, correo electrónico, número de teléfono, nombre de la boutique.</p>
              </div>
              <div style={{"background":"rgba(200,164,118,.05)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"marginBottom":".25rem"}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <p style={{"fontSize":".7rem","fontWeight":600,"color":"#2a2420","marginBottom":".1rem"}}>Datos de negocio</p>
                <p style={{"fontSize":".65rem","color":"rgba(42,36,32,.5)"}}>Inventario, productos, precios, tallas, colores, ventas, gastos y clientes que usted registre.</p>
              </div>
              <div style={{"background":"rgba(200,164,118,.05)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"marginBottom":".25rem"}}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <p style={{"fontSize":".7rem","fontWeight":600,"color":"#2a2420","marginBottom":".1rem"}}>Datos de uso</p>
                <p style={{"fontSize":".65rem","color":"rgba(42,36,32,.5)"}}>Páginas visitadas, funciones utilizadas, tiempo de sesión, tipo de dispositivo y navegador.</p>
              </div>
              <div style={{"background":"rgba(200,164,118,.05)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"marginBottom":".25rem"}}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
                <p style={{"fontSize":".7rem","fontWeight":600,"color":"#2a2420","marginBottom":".1rem"}}>Configuración</p>
                <p style={{"fontSize":".65rem","color":"rgba(42,36,32,.5)"}}>Preferencias de notificaciones, tema visual, idioma y configuración de cuenta.</p>
              </div>
            </div>
          </PrivSection>

          <PrivSection number="3" title="Finalidad del tratamiento">
            <p style={{"marginBottom":".5rem"}}>Sus datos personales serán utilizados únicamente para las siguientes finalidades:</p>
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","display":"flex","flexDirection":"column","gap":".3rem","fontSize":".78rem","color":"rgba(42,36,32,.55)"}}>
              <li>Proveer, mantener y mejorar su cuenta en la plataforma Veliora</li>
              <li>Procesar y gestionar su membresía, pagos y renovaciones</li>
              <li>Brindar soporte técnico, atención al cliente y resolver incidencias</li>
              <li>Enviar comunicaciones estrictamente relacionadas con el funcionamiento del servicio</li>
              <li>Generar métricas agregadas y anónimas para mejorar la plataforma</li>
              <li>Cumplir con obligaciones legales, fiscales y requerimientos de autoridades competentes</li>
            </ul>
            <p style={{"marginTop":".5rem","fontSize":".7rem","color":"rgba(42,36,32,.4)"}}><strong style={{"color":"#2a2420"}}>Importante:</strong> No utilizamos sus datos para fines publicitarios, venta a terceros, ni perfiles comerciales no relacionados con el servicio.</p>
          </PrivSection>

          <PrivSection number="4" title="Transferencia de datos">
            <p style={{"marginBottom":".5rem"}}>Sus datos personales no serán compartidos con terceros para fines comerciales ni de publicidad.</p>
            <p style={{"marginBottom":".5rem"}}>Podemos compartir datos limitados con proveedores de servicios tecnológicos esenciales para la operación de la plataforma:</p>
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","display":"flex","flexDirection":"column","gap":".3rem","fontSize":".78rem","color":"rgba(42,36,32,.55)"}}>
              <li><strong style={{"color":"#2a2420"}}>Supabase</strong> — Base de datos, autenticación y almacenamiento (SOC 2, ISO 27001)</li>
              <li><strong style={{"color":"#2a2420"}}>Vercel</strong> — Alojamiento web y edge functions (SOC 2, ISO 27001)</li>
              <li><strong style={{"color":"#2a2420"}}>Google Gemini</strong> — Procesamiento de IA para escaneo de facturas</li>
            </ul>
            <p style={{"marginTop":".5rem","fontSize":".7rem","color":"rgba(42,36,32,.4)"}}>Todos nuestros proveedores cumplen con estándares internacionales de seguridad y operan bajo estrictos acuerdos de confidencialidad. Sus datos nunca salen de estos proveedores hacia terceros no autorizados.</p>
          </PrivSection>

          <PrivSection number="5" title="Derechos ARCO">
            <p>Usted tiene derecho a <strong style={{"color":"#2a2420"}}>Acceder</strong>, <strong style={{"color":"#2a2420"}}>Rectificar</strong>, <strong style={{"color":"#2a2420"}}>Cancelar</strong> u <strong style={{"color":"#2a2420"}}>Oponerse</strong> al tratamiento de sus datos personales en cualquier momento. Para ejercer estos derechos:</p>
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","marginTop":".5rem","display":"flex","flexDirection":"column","gap":".3rem","fontSize":".78rem","color":"rgba(42,36,32,.55)"}}>
              <li>Envíe un correo a <strong style={{"color":"#2a2420"}}>giovva729@hotmail.com</strong> especificando su solicitud</li>
              <li>O envíe un mensaje por WhatsApp al <strong style={{"color":"#2a2420"}}>+528342177709</strong></li>
            </ul>
            <p style={{"marginTop":".5rem","fontSize":".7rem","color":"rgba(42,36,32,.4)"}}><strong style={{"color":"#2a2420"}}>Procedimiento:</strong> Le responderemos en un plazo máximo de 20 días hábiles. Para acreditar su identidad, deberá proporcionar su nombre completo y correo electrónico registrado.</p>
          </PrivSection>

          <PrivSection number="6" title="Seguridad de los datos">
            <p style={{"marginBottom":".5rem"}}>Implementamos las siguientes medidas de seguridad para proteger sus datos:</p>
            <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(120px,1fr))","gap":".5rem"}}>
              <div style={{"textAlign":"center","padding":".7rem","background":"rgba(200,164,118,.05)","borderRadius":".75rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"margin":"0 auto .2rem","display":"block"}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                <p style={{"fontSize":".65rem","fontWeight":600,"color":"#2a2420"}}>SSL/TLS</p>
                <p style={{"fontSize":".6rem","color":"rgba(42,36,32,.4)"}}>Todo cifrado</p>
              </div>
              <div style={{"textAlign":"center","padding":".7rem","background":"rgba(200,164,118,.05)","borderRadius":".75rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"margin":"0 auto .2rem","display":"block"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                <p style={{"fontSize":".65rem","fontWeight":600,"color":"#2a2420"}}>Encriptación</p>
                <p style={{"fontSize":".6rem","color":"rgba(42,36,32,.4)"}}>En reposo AES-256</p>
              </div>
              <div style={{"textAlign":"center","padding":".7rem","background":"rgba(200,164,118,.05)","borderRadius":".75rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"margin":"0 auto .2rem","display":"block"}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <p style={{"fontSize":".65rem","fontWeight":600,"color":"#2a2420"}}>Auth + RLS</p>
                <p style={{"fontSize":".6rem","color":"rgba(42,36,32,.4)"}}>Aislamiento total</p>
              </div>
            </div>
          </PrivSection>

          <PrivSection number="7" title="Período de conservación">
            <p>Conservaremos sus datos personales mientras mantenga una cuenta activa en Veliora. Al cancelar su cuenta, sus datos serán eliminados de nuestros servidores activos en un plazo de 30 días. Las copias de seguridad pueden conservar datos cifrados hasta 90 días adicionales, tras lo cual se purgan automáticamente.</p>
          </PrivSection>

          <PrivSection number="8" title="Cookies y tecnologías similares">
            <p>Veliora utiliza cookies estrictamente necesarias para el funcionamiento de la plataforma (sesión de usuario, preferencias de tema). No utilizamos cookies de rastreo, publicidad ni de terceros no esenciales. Puede configurar su navegador para rechazar cookies, aunque algunas funciones de la plataforma podrían verse afectadas.</p>
          </PrivSection>

          <PrivSection number="9" title="Cambios al aviso de privacidad">
            <p>Nos reservamos el derecho de modificar este aviso de privacidad en cualquier momento. Los cambios sustanciales serán notificados a través de la plataforma (banner informativo) y por correo electrónico a los usuarios registrados. Le recomendamos revisar periódicamente esta página para estar al tanto de cualquier actualización.</p>
          </PrivSection>

          <PrivSection number="10" title="Contacto">
            <p>Para ejercer sus derechos ARCO, resolver dudas sobre este aviso o reportar cualquier incidente de privacidad:</p>
            <div style={{"display":"flex","flexWrap":"wrap","gap":".6rem","marginTop":".8rem"}}>
              <a href="https://wa.me/528342177709?text=Hola%2C%20tengo%20una%20consulta%20sobre%20el%20aviso%20de%20privacidad" target="_blank" rel="noopener noreferrer" style={{"display":"inline-flex","alignItems":"center","gap":".4rem","padding":".6rem 1.2rem","borderRadius":".6rem","fontSize":".78rem","fontWeight":600,"color":"#fff","textDecoration":"none","background":"linear-gradient(135deg,#25D366,#128C7E)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </a>
              <a href="mailto:giovva729@hotmail.com" style={{"display":"inline-flex","alignItems":"center","gap":".4rem","padding":".6rem 1.2rem","borderRadius":".6rem","fontSize":".78rem","fontWeight":600,"color":"#2a2420","textDecoration":"none","border":"1px solid rgba(42,36,32,.12)","background":"transparent"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span>Correo electrónico</span>
              </a>
            </div>
          </PrivSection>
        </div>

        {/* Footer */}
        <div style={{"marginTop":"2.5rem","paddingTop":"1.5rem","borderTop":"1px solid rgba(200,164,118,.15)","textAlign":"center"}}>
          <p style={{"fontSize":".7rem","color":"rgba(42,36,32,.35)"}}>Veliora cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (México).</p>
          <p style={{"fontSize":".65rem","color":"rgba(42,36,32,.25)","marginTop":".15rem"}}>© 2026 Veliora. Todos los derechos reservados.</p>
        </div>
      </div>
    </main>
  );
}

function PrivSection({number,title,children}: {number:string;title:string;children:React.ReactNode}) {
  return (
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
}
