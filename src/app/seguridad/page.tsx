import Link from "next/link";

export const metadata = {
  title: "Seguridad | Veliora",
  description:
    "Conoce las practicas de seguridad de Veliora. Encriptacion, infraestructura, control de acceso y mas. Tus datos estan protegidos.",
};

export default function SeguridadPage() {
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
            <span style={{"fontSize":".6rem","fontWeight":600,"color":"#c8a476","letterSpacing":".12em","textTransform":"uppercase"}}>SEGURIDAD</span>
          </div>
          <h1 style={{"fontSize":"clamp(1.5rem,3.5vw,2.5rem)","fontWeight":800,"color":"#2a2420","marginBottom":".4rem","letterSpacing":"-.02em","fontFamily":"'Playfair Display',Georgia,serif"}}>Seguridad en Veliora</h1>
          <p style={{"color":"rgba(42,36,32,.5)","maxWidth":"560px","margin":"0 auto","fontSize":".85rem","lineHeight":1.6}}>
            La confianza de nuestros clientes es lo más importante. Te explicamos cómo protegemos tu información en cada capa de la plataforma.
          </p>
        </div>

        {/* Shield indicators */}
        <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(110px,1fr))","gap":".6rem","marginBottom":"2rem"}}>
          <div style={{"background":"rgba(200,164,118,.06)","borderRadius":".85rem","padding":"1.1rem","border":"1px solid rgba(200,164,118,.1)","textAlign":"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"margin":"0 auto .3rem","display":"block"}}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <div style={{"fontSize":"1.1rem","fontWeight":800,"color":"#2a2420"}}>100%</div>
            <div style={{"fontSize":".6rem","color":"rgba(42,36,32,.4)","fontWeight":600,"marginTop":".05rem"}}>Tráfico encriptado</div>
          </div>
          <div style={{"background":"rgba(200,164,118,.06)","borderRadius":".85rem","padding":"1.1rem","border":"1px solid rgba(200,164,118,.1)","textAlign":"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"margin":"0 auto .3rem","display":"block"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            <div style={{"fontSize":"1.1rem","fontWeight":800,"color":"#2a2420"}}>24/7</div>
            <div style={{"fontSize":".6rem","color":"rgba(42,36,32,.4)","fontWeight":600,"marginTop":".05rem"}}>Monitoreo continuo</div>
          </div>
          <div style={{"background":"rgba(200,164,118,.06)","borderRadius":".85rem","padding":"1.1rem","border":"1px solid rgba(200,164,118,.1)","textAlign":"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2" style={{"margin":"0 auto .3rem","display":"block"}}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>
            <div style={{"fontSize":"1.1rem","fontWeight":800,"color":"#2a2420"}}>SOC 2</div>
            <div style={{"fontSize":".6rem","color":"rgba(42,36,32,.4)","fontWeight":600,"marginTop":".05rem"}}>Infraestructura conforme</div>
          </div>
        </div>

        <div style={{"display":"flex","flexDirection":"column","gap":"1rem"}}>
          {/* Encrypt */}
          <Section icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" title="Encriptación de datos">
            <ul style={{"listStyle":"none","padding":0,"margin":0,"display":"flex","flexDirection":"column","gap":".5rem"}}>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span><strong style={{"color":"#2a2420"}}>TLS 1.3:</strong> Todo el tráfico entre tu dispositivo y nuestros servidores está cifrado con el estándar más reciente de seguridad en transporte.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span><strong style={{"color":"#2a2420"}}>Encriptación en reposo:</strong> Los datos almacenados en la base de datos están cifrados con AES-256.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span><strong style={{"color":"#2a2420"}}>Contraseñas:</strong> Nunca se almacenan en texto plano. Usamos hashing con bcrypt + salt.</span>
              </li>
            </ul>
          </Section>

          {/* Infrastructure */}
          <Section icon="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" title="Infraestructura">
            <p>Veliora está alojado en <strong style={{"color":"#2a2420"}}>Vercel</strong> y <strong style={{"color":"#2a2420"}}>Supabase</strong>, dos de las plataformas más seguras del mundo. Ambas cumplen con estándares de seguridad de nivel empresarial:</p>
            <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(180px,1fr))","gap":".6rem","marginTop":".8rem"}}>
              <div style={{"background":"rgba(200,164,118,.05)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <p style={{"fontSize":".7rem","fontWeight":700,"color":"#2a2420","marginBottom":".25rem"}}>Vercel</p>
                <ul style={{"fontSize":".65rem","color":"rgba(42,36,32,.5)","listStyle":"none","padding":0,"margin":0,"lineHeight":1.6}}>
                  <li>• SOC 2 Tipo II</li><li>• ISO 27001</li><li>• GDPR compliant</li><li>• Edge Network global</li><li>• DDoS protection</li>
                </ul>
              </div>
              <div style={{"background":"rgba(200,164,118,.05)","borderRadius":".75rem","padding":".8rem 1rem","border":"1px solid rgba(200,164,118,.1)"}}>
                <p style={{"fontSize":".7rem","fontWeight":700,"color":"#2a2420","marginBottom":".25rem"}}>Supabase</p>
                <ul style={{"fontSize":".65rem","color":"rgba(42,36,32,.5)","listStyle":"none","padding":0,"margin":0,"lineHeight":1.6}}>
                  <li>• SOC 2 Tipo II</li><li>• ISO 27001</li><li>• HIPAA compliant</li><li>• Encriptación AES-256</li><li>• Copias diarias automáticas</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* Access */}
          <Section icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" title="Control de acceso">
            <ul style={{"listStyle":"none","padding":0,"margin":0,"display":"flex","flexDirection":"column","gap":".5rem"}}>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span><strong style={{"color":"#2a2420"}}>Autenticación segura</strong> con Supabase Auth (sesiones JWT, refresh tokens, MCP).</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span><strong style={{"color":"#2a2420"}}>Row Level Security (RLS):</strong> Cada boutique tiene sus datos completamente aislados. Es imposible que un usuario vea datos de otra boutique.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span><strong style={{"color":"#2a2420"}}>Roles:</strong> Los empleados solo ven lo necesario para vender. Sin acceso a costos, ganancias ni configuración.</span>
              </li>
            </ul>
          </Section>

          {/* Backups */}
          <Section icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" title="Copias de seguridad">
            <ul style={{"listStyle":"none","padding":0,"margin":0,"display":"flex","flexDirection":"column","gap":".5rem"}}>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span><strong style={{"color":"#2a2420"}}>Diarias automáticas</strong> de toda la base de datos.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Almacenadas en <strong style={{"color":"#2a2420"}}>ubicaciones separadas</strong> y encriptadas.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Capacidad de <strong style={{"color":"#2a2420"}}>restauración en menos de 4 horas</strong> en caso de desastre.</span>
              </li>
            </ul>
          </Section>

          {/* Practices */}
          <Section icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" title="Prácticas de desarrollo">
            <ul style={{"listStyle":"none","padding":0,"margin":0,"display":"flex","flexDirection":"column","gap":".5rem"}}>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Seguimos las mejores prácticas de <strong style={{"color":"#2a2420"}}>OWASP</strong> para desarrollo seguro.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Dependencias <strong style={{"color":"#2a2420"}}>actualizadas regularmente</strong> para evitar vulnerabilidades conocidas.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>No almacenamos información sensible innecesaria y <strong style={{"color":"#2a2420"}}>eliminamos datos obsoletos</strong> periódicamente.</span>
              </li>
              <li style={{"display":"flex","gap":".5rem","alignItems":"flex-start"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="2.5" style={{"marginTop":".15rem","flexShrink":0}}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span>Las claves de API y tokens de servicios externos <strong style={{"color":"#2a2420"}}>nunca se exponen</strong> en el código fuente.</span>
              </li>
            </ul>
          </Section>

          {/* Vulnerability report */}
          <Section icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" title="Reporte de vulnerabilidades">
            <p>Si encuentras una vulnerabilidad de seguridad en Veliora, agradeceríamos que nos lo reportes de manera responsable. Nos comprometemos a:</p>
            <ul style={{"listStyle":"disc","paddingLeft":"1.25rem","marginTop":".5rem","display":"flex","flexDirection":"column","gap":".3rem"}}>
              <li>Responder en menos de <strong style={{"color":"#2a2420"}}>24 horas</strong></li>
              <li>Mantenerte informado del progreso de la solución</li>
              <li>Resolver el problema lo antes posible (típicamente menos de 72 horas)</li>
              <li>No tomar acciones legales contra reportes de buena fe</li>
            </ul>
            <div style={{"display":"flex","flexWrap":"wrap","gap":".6rem","marginTop":"1rem"}}>
              <a href="https://wa.me/528342177709?text=Hola%2C%20quiero%20reportar%20un%20tema%20de%20seguridad%20en%20Veliora" target="_blank" rel="noopener noreferrer" style={{"display":"inline-flex","alignItems":"center","gap":".4rem","padding":".6rem 1.2rem","borderRadius":".6rem","fontSize":".78rem","fontWeight":600,"color":"#fff","textDecoration":"none","background":"linear-gradient(135deg,#dc2626,#f97316)"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Reportar vulnerabilidad</span>
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
          <p style={{"fontSize":".7rem","color":"rgba(42,36,32,.35)"}}>En Veliora, la seguridad es un proceso continuo, no un destino. Siempre estamos mejorando.</p>
          <p style={{"fontSize":".65rem","color":"rgba(42,36,32,.25)","marginTop":".15rem"}}>© 2026 Veliora. Todos los derechos reservados.</p>
        </div>
      </div>
    </main>
  );
}

function Section({icon,title,children}: {icon:string;title:string;children:React.ReactNode}) {
  return (
    <section style={{"background":"#fff","borderRadius":".8rem","padding":"1.25rem 1.5rem","border":"1px solid rgba(200,164,118,.12)","transition":"border-color .2s"}}>
      <div style={{"display":"flex","alignItems":"flex-start","gap":".75rem"}}>
        <span style={{"flexShrink":0,"width":"1.8rem","height":"1.8rem","borderRadius":".4rem","background":"rgba(200,164,118,.1)","display":"flex","alignItems":"center","justifyContent":"center","marginTop":".1rem"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a476" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={icon}/></svg>
        </span>
        <div style={{"flex":1,"minWidth":0}}>
          <h2 style={{"fontSize":".9rem","fontWeight":700,"color":"#2a2420","marginBottom":".4rem","fontFamily":"'Playfair Display',Georgia,serif"}}>{title}</h2>
          <div style={{"fontSize":".78rem","lineHeight":1.65,"color":"rgba(42,36,32,.55)","maxWidth":"680px"}}>{children}</div>
        </div>
      </div>
    </section>
  );
}
