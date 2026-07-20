'use client';

import { useRef, useEffect } from 'react';

export default function LandingPage() {
const deferredPromptRef = useRef<any>(null);

function installPWA() {    const d = deferredPromptRef.current;    if (d) {      d.prompt();      d.userChoice.then(function(r:any){if(r.outcome==='accepted')deferredPromptRef.current=null;});    } else if ((window as any).navigator.standalone===true) {      closeDownloadModal();    } else {      openDownloadModal();    }  };

function closeDownloadModal(e?: any) {    if (e && e.target !== e.currentTarget) return;    const modal = document.getElementById('downloadModalOverlay');    const content = document.getElementById('downloadModal');    if (!modal || !content) return;    content.classList.remove('scale-100');    content.classList.add('scale-95');    modal.classList.add('opacity-0');    setTimeout(() => modal.classList.add('pointer-events-none'), 300);    document.body.style.overflow = '';  };

function installPWAFromModal() {    const deferred = deferredPromptRef.current;    if (deferred) {      deferred.prompt();      deferred.userChoice.then(function(result: any) {        if (result.outcome === 'accepted') closeDownloadModal();      });      deferredPromptRef.current = null;    } else if ((window as any).navigator.standalone === true) {      const btn = document.getElementById('downloadModalBtn');      if (btn) {        btn.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg><span>Ya esta instalada</span></span>';        btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';      }      setTimeout(closeDownloadModal, 1500);    } else {      const hint = document.getElementById('downloadModalHint');      const btn2 = document.getElementById('downloadModalBtn');      if (btn2) {        btn2.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg><span>Entendido</span></span>';        (btn2 as any).onclick = closeDownloadModal;      }      if (hint) hint.innerHTML = 'Abre el menu de tu navegador y selecciona "Instalar app" o "Agregar a pantalla de inicio".';      const grid = document.querySelector('#downloadModal .grid-cols-2');      if (grid) {        grid.insertAdjacentHTML('afterend', '<div class="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 mb-6 border border-amber-500/10"><p class="text-xs text-amber-300 text-center"><strong>Tu navegador no soporta instalacion automatica.</strong><br>En Chrome/Edge: Menu → Instalar Veliora.<br>En Safari: Compartir → Agregar a pantalla de inicio.</p></div>');      }    }  };

function openDownloadModal() {    const modal = document.getElementById('downloadModalOverlay');    const content = document.getElementById('downloadModal');    if (!modal || !content) return;    modal.classList.remove('opacity-0', 'pointer-events-none');    setTimeout(() => { content.classList.remove('scale-95'); content.classList.add('scale-100'); }, 10);    document.body.style.overflow = 'hidden';  };

function closeMobileMenu() {    const nav = document.getElementById('mobileNav');    if (nav) nav.classList.remove('open');    if (overlay) overlay.classList.remove('open');  };
function cMob() { const el = document.getElementById('mob'); if (el) el.classList.remove('open'); };
function oMob() { const el = document.getElementById('mob'); if (el) el.classList.add('open'); };
function tF(e: any) { if (e && e.parentElement) e.parentElement.classList.toggle('open'); };

const overlay = typeof document !== 'undefined' ? document.getElementById('mobileOverlay') : null;

  useEffect(() => {
    // Nav scroll effect
    const nav = document.getElementById('nav');
    const progress = document.getElementById('progress');
    const handleScroll = () => {
      const y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 60);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        if (h > 0) progress.style.width = (y / h * 100) + '%';
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Mobile menu toggle
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.getElementById('mob')?.classList.add('open');
      });
    }
    const closeBtn = document.getElementById('mob')?.querySelector('.mob-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.getElementById('mob')?.classList.remove('open');
      });
    }

    // Scroll reveal animations
    const revealElements = document.querySelectorAll('.r');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('v');
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -50px 0px' }
    );
    revealElements.forEach((el) => revealObserver.observe(el));

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e: Event) => {
        const href = a.getAttribute('href');
        if (href && href.length > 1) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // beforeinstallprompt (PWA)
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Escape key closes download modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDownloadModal();
    };
    document.addEventListener('keydown', handleEscape);

    // Service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      document.removeEventListener('keydown', handleEscape);
      revealObserver.disconnect();
    };
  }, []);

return (
    <>
<div className="bg-atmosphere"></div>
<div className="bg-noise"></div>
<div id="progress"></div>


<div className="mob" id="mob">
  <button className="mob-close" onClick={() => { cMob() }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
  </button>
  <a href="#" onClick={(e) => { e.preventDefault(); cMob(); installPWA(); }}>Descargar</a>
  <a href="#funciona" onClick={() => { cMob() }}>C&oacute;mo funciona</a>
  <a href="#beneficios" onClick={() => { cMob() }}>Beneficios</a>
  <a href="#planes" onClick={() => { cMob() }}>Planes</a>
  <a href="#faq" onClick={() => { cMob() }}>FAQ</a>
  <a href="/login">Entrar</a>
  <a href="/registro?trial=true" style={{"marginTop":".3rem","padding":".7rem 2rem","borderRadius":"100px","background":"#2a2420","color":"#fdfaf5","fontSize":".85rem"}}>Probar gratis en veliora.lat</a>
</div>


<nav id="nav">
  <div className="nav-inner">
    <a href="#" className="logo">Veliora <em>· lat</em></a>
    <div className="nav-links">
      <a href="#" onClick={(e) => { e.preventDefault(); installPWA(); }}>Descargar</a>
      <a href="#funciona">C&oacute;mo funciona</a>
      <a href="#beneficios">Beneficios</a>
      <a href="#planes">Planes</a>
      <a href="#faq">FAQ</a>
      <a href="/login">Entrar</a>
      <a href="/registro?trial=true" className="nav-cta">Probar gratis</a>
    </div>
    <button className="mob-toggle" onClick={() => { oMob() }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
</nav>


<section className="hero">
  <div className="container">
    <div className="hero-grid">
      <div>
        <div className="hero-sub">
          <span className="hero-sub-line"></span>
          <span>Para la due&ntilde;a que merece orden</span>
        </div>
        <h1>
          Tu boutique,<br />
          siempre en <i>orden</i>
        </h1>
        <p>
          Olvida las libretas, las b&uacute;squedas interminables y el no saber cu&aacute;nto est&aacute;s ganando. 
          Veliora organiza cada prenda, registra cada venta y te da respuestas claras para que 
          tomes mejores decisiones todos los d&iacute;as.
        </p>
        <div className="hero-actions">
          <a href="/registro?trial=true" className="btn btn-primary">
            Probar gratis en veliora.lat
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="#imagine" className="btn btn-secondary">Ver c&oacute;mo funciona</a>
        <a href="/registro?trial=true" className="btn btn-download"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 1v10M3 8l5 5 5-5" strokeLinecap="round"/></svg> Descargar</a></div>
        <div className="hero-trust">
          <span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Sin tarjeta de cr&eacute;dito</span>
          <span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Soporte por WhatsApp</span>
          <span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Cancela cuando quieras</span>
        </div>
      </div>
      <div className="hero-visual r">
        <div className="hero-card">
          <div className="hero-card-p">
            <div className="hero-card-top">
              <div>
                <h4>Mi boutique</h4>
                <h3>Resumen del d&iacute;a</h3>
              </div>
              <div className="val">
                <div className="n">$8,240</div>
                <div className="l">Ventas hoy</div>
              </div>
            </div>
            <div className="hero-card-stats">
              <div className="hero-card-stat">
                <div className="n">32</div>
                <div className="l">Prendas vendidas</div>
                <div className="d">+12% que ayer</div>
              </div>
              <div className="hero-card-stat">
                <div className="n">$847</div>
                <div className="l">Ticket promedio</div>
                <div className="d" style={{"color":"rgba(42,36,32,.25)","fontSize":".6rem","fontWeight":"600","marginTop":"2px"}}>Sin cambio</div>
              </div>
            </div>
            <div className="hero-card-items">
              <div className="hero-card-item">
                <div className="info"><div className="nm">Vestido Primavera</div><div className="dt">Ch &middot; Rojo &middot; M&aacute;s vendido</div></div>
                <div className="pr">$890</div>
              </div>
              <div className="hero-card-item">
                <div className="info"><div className="nm">Blusa Lisa Algod&oacute;n</div><div className="dt">M &middot; Azul &middot; Quedan 4</div></div>
                <div className="pr">$450</div>
              </div>
              <div className="hero-card-item">
                <div className="info"><div className="nm">Jean Tiro Alto</div><div className="dt">28 &middot; Negro &middot; Quedan 2</div></div>
                <div className="pr">$720</div>
              </div>
            </div>
            <div className="hero-card-alert">
              <div className="ic">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="14" height="10" rx="1.5" strokeLinejoin="round"/><path d="M4 9h.01M8 9h.01M12 9h.01"/></svg>
              </div>
              <p><strong>Alerta:</strong> Quedan 2 Vestidos Primavera talla M. <span style={{"borderBottom":"1px solid #c8a476","cursor":"pointer"}}>Sugerir pedido &rarr;</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="pain" className="pain">
  <div className="container">
    <div className="pain-grid">
      <div className="r d1">
        <div className="pain-quotes">
          <div className="pain-q">&ldquo;Esp&eacute;reme tantito, voy a ver si me queda&hellip;&rdquo; <span>Y la clienta espera. O se va.</span></div>
          <div className="pain-q">&ldquo;No encuentro esa talla. Creo que ya no hay.&rdquo; <span>Pero tal vez s&iacute; hay. Perdiste la venta buscando.</span></div>
          <div className="pain-q">&ldquo;D&eacute;jeme revisar mi libreta&hellip; &iquest;D&oacute;nde anot&eacute; esa venta?&rdquo; <span>Fin del d&iacute;a y no sabes cu&aacute;nto ganaste.</span></div>
          <div className="pain-q">&ldquo;Ped&iacute; lo mismo del mes pasado. Ojal&aacute; se venda.&rdquo; <span>Comprar sin saber qu&eacute; se vende es jugar a la suerte.</span></div>
        </div>
      </div>
      <div className="r d2">
        <p style={{"fontSize":".6rem","textTransform":"uppercase","letterSpacing":".22em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>Te suena familiar?</p>
        <h2>Due&ntilde;a de boutique no deber&iacute;a ser sin&oacute;nimo de estr&eacute;s</h2>
        <p>Pasas horas buscando prendas, anotando ventas en libretas, preocup&aacute;ndote por si tienes o no una talla. No es justo. Tu boutique merece orden. Y t&uacute; mereces tranquilidad.</p>
        <p>Hay una forma diferente. Una forma simple. Que te permite encontrar cualquier prenda en segundos, saber exactamente cu&aacute;nto ganaste hoy y tomar decisiones sin adivinar.</p>
        <a href="#funciona" className="btn btn-secondary">Quiero conocerla</a>
      </div>
    </div>
  </div>
</section>


<section id="imagine" className="imagine">
  <div className="container">
    <div style={{"textAlign":"center","marginBottom":"3.5rem"}} className="r">
      <p style={{"fontSize":".6rem","textTransform":"uppercase","letterSpacing":".22em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>Imagina tu d&iacute;a con Veliora</p>
      <h2 style={{"fontFamily":"'Playfair Display',Georgia,serif","fontSize":"clamp(1.3rem,2.5vw,2rem)","fontWeight":"700","color":"#1a1612"}}>Dos realidades. Una decisi&oacute;n.</h2>
    </div>
    <div className="imagine-grid">
      <div className="imagine-card imagine-before r d1">
        <h4>Sin Veliora</h4>
        <div className="imagine-list">
          <div className="imagine-item"><div className="mk x"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg></div><p>Buscas prendas entre montones de ropa mientras la clienta espera</p></div>
          <div className="imagine-item"><div className="mk x"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg></div><p>Anotas ventas en una libreta que al final del d&iacute;a no te dice nada</p></div>
          <div className="imagine-item"><div className="mk x"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg></div><p>No sabes cu&aacute;nto ganaste realmente porque mezclas gastos y ventas</p></div>
          <div className="imagine-item"><div className="mk x"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg></div><p>Compras mercanc&iacute;a por corazonada. A veces sobra, a veces falta</p></div>
          <div className="imagine-item"><div className="mk x"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg></div><p>Sales de la boutique con la sensaci&oacute;n de que algo se te escap&oacute;</p></div>
        </div>
      </div>
      <div className="imagine-card imagine-after r d2">
        <h4>Con Veliora</h4>
        <div className="imagine-list">
          <div className="imagine-item"><div className="mk c"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 8l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg></div><p>Encuentras cualquier prenda en segundos. La clienta compra feliz</p></div>
          <div className="imagine-item"><div className="mk c"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 8l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg></div><p>Cada venta se registra autom&aacute;ticamente. Sabes exactamente cu&aacute;nto vendiste</p></div>
          <div className="imagine-item"><div className="mk c"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 8l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg></div><p>Veliora calcula tus ganancias, m&aacute;rgenes y productos m&aacute;s rentables</p></div>
          <div className="imagine-item"><div className="mk c"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 8l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg></div><p>Recibes alertas cuando algo se agota y sugerencias de qu&eacute; pedir</p></div>
          <div className="imagine-item"><div className="mk c"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 8l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg></div><p>Cierras la boutique sabiendo que todo est&aacute; en orden. Sales tranquila</p></div>
        </div>
      </div>
    </div>
  </div>
</section>


<section id="funciona" className="how">
  <div className="container">
    <div className="how-header r">
      <p style={{"fontSize":".6rem","textTransform":"uppercase","letterSpacing":".22em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>As&iacute; de simple</p>
      <h2>Tu nueva rutina en tres pasos</h2>
      <p>Sin aprendizaje. Sin manuales. Sin complicaciones.</p>
    </div>
    <div className="how-grid">
      <div className="how-card r d1">
        <div className="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <h3>Captura tu inventario</h3>
        <p>Toma una foto a tu factura de proveedor. Veliora registra cada prenda, talla, color y precio autom&aacute;ticamente. O agr&eacute;gales manualmente si prefieres.</p>
      </div>
      <div className="how-card r d2">
        <div className="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0" strokeLinecap="round"/></svg>
        </div>
        <h3>Vende como siempre</h3>
        <p>Busca cualquier prenda por nombre, talla o color. Registra la venta en segundos. El inventario se actualiza solo. Tus clientas ni lo notan.</p>
      </div>
      <div className="how-card r d3">
        <div className="how-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" strokeLinecap="round"/><path d="M12 6v6l4 2" strokeLinecap="round"/></svg>
        </div>
        <h3>Veliora organiza todo</h3>
        <p>Alertas cuando algo se agota, reportes de lo que m&aacute;s se vende, sugerencias de pedido. Tu boutique trabajando con informaci&oacute;n, no con suposiciones.</p>
      </div>
    </div>
  </div>
</section>


<section id="asistente" className="assistant">
  <div className="container">
    <div className="assistant-header r">
      <p className="eyebrow">Tu asesora personal</p>
      <h2>Conoce a quien siempre sabe lo que pasa en tu boutique</h2>
      <p>Preg&uacute;ntale cualquier cosa sobre tu negocio. Veliora conoce tu inventario, tus ventas y tus ganancias para ayudarte a tomar mejores decisiones.</p>
    </div>
    <div className="assistant-grid">
      <div className="assistant-visual r d1">
        <div className="assistant-chat">
          <div className="chat-header">
            <div className="chat-avatar">V</div>
            <div className="chat-name">
              <h4>Asistente Veliora</h4>
              <span>Conoce toda tu boutique</span>
            </div>
          </div>
          <div className="chat-body">
            <div className="chat-bubble chat-user" style={{"animationDelay":".2s"}}>Qu&eacute; talla debo volver a pedir esta semana?</div>
            <div className="chat-bubble chat-ai" style={{"animationDelay":".4s"}}>
              Basado en tus ventas de los &uacute;ltimos 15 d&iacute;as, los <strong>Vestidos Primavera talla M</strong> son tus m&aacute;s vendidos y solo quedan 2. Tambi&eacute;n se est&aacute;n agotando las <strong>Blusas Lisas talla Ch</strong>. Te sugiero pedir 12 unidades de cada una.
            </div>
            <div className="chat-bubble chat-user" style={{"animationDelay":".6s"}}>Cu&aacute;nto gan&eacute; este mes?</div>
            <div className="chat-bubble chat-ai" style={{"animationDelay":".8s"}}>
              Llevas <strong>$67,430 en ventas</strong> este mes. Tu margen promedio es del 56%. Tus productos m&aacute;s rentables son los vestidos, con un margen del 72%. Quieres ver el desglose por categor&iacute;a?
            </div>
            <div className="chat-bubble chat-user" style={{"animationDelay":"1s"}}>Qu&eacute; productos llevan mucho tiempo sin venderse?</div>
            <div className="chat-bubble chat-ai" style={{"animationDelay":"1.2s"}}>
              Hay 8 productos que no se han vendido en m&aacute;s de 60 d&iacute;as. Destacan: <strong>Chamarra Cuero Talla G</strong> (89 d&iacute;as), <strong>Falda Plisada Talla Ch</strong> (74 d&iacute;as) y <strong>Blusa Estampada Talla XG</strong> (62 d&iacute;as). Quieres revisar si vale la pena ponerlos en oferta?
            </div>
          </div>
        </div>
      </div>
      <div className="assistant-content r d2">
        <h3>Es como tener una gerente que nunca olvida nada</h3>
        <p>Veliora registra cada prenda, cada venta y cada movimiento de tu boutique. As&iacute; que puedes preguntarle cualquier cosa y obtener respuestas precisas al instante.</p>
        <p style={{"marginBottom":"1.5rem"}}>No m&aacute;s corazonadas. No m&aacute;s decisiones a ciegas. Informaci&oacute;n real para tu boutique real.</p>
        <div style={{"borderTop":"1px solid rgba(200,164,118,.06)","paddingTop":"1rem"}}>
          <p style={{"fontSize":".65rem","textTransform":"uppercase","letterSpacing":".15em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>Cosas que puedes preguntarle:</p>
          <div className="example-q">&ldquo;Cu&aacute;nto inventario tengo exactamente?&rdquo;</div>
          <div className="example-q">&ldquo;Qu&eacute; productos est&aacute;n por agotarse?&rdquo;</div>
          <div className="example-q">&ldquo;Qu&eacute; categor&iacute;a me deja m&aacute;s ganancias?&rdquo;</div>
          <div className="example-q">&ldquo;Qu&eacute; pas&oacute; con mis ventas comparadas con el mes pasado?&rdquo;</div>
          <div className="example-q">&ldquo;Qu&eacute; productos llevan meses ocupando espacio?&rdquo;</div>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="video">
  <div className="container">
    <div className="video-inner r">
      <p style={{"fontSize":".6rem","textTransform":"uppercase","letterSpacing":".22em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>Mira c&oacute;mo funciona</p>
      <h2 style={{"fontFamily":"'Playfair Display',Georgia,serif","fontSize":"clamp(1.2rem,2.3vw,1.8rem)","fontWeight":"700","color":"#1a1612","marginBottom":".5rem"}}>Una clienta pregunta. T&uacute; encuentras. Vendes.</h2>
      <p style={{"fontSize":".82rem","color":"rgba(42,36,32,.5)","maxWidth":"480px","margin":"0 auto"}}>Sin buscar entre montones. Sin dejar a nadie esperando.</p>
      <div className="video-frame">
        <div className="video-play">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <p className="video-label">Video demo &middot; 1:32 min</p>
    </div>
  </div>
</section>


<section id="beneficios" className="benefits">
  <div className="container">
    <div className="benefits-header r">
      <p style={{"fontSize":".6rem","textTransform":"uppercase","letterSpacing":".22em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>Beneficios que transforman tu d&iacute;a</p>
      <h2>Lo que cambia cuando todo est&aacute; organizado</h2>
      <p>No son funciones. Son resultados que hacen tu vida m&aacute;s simple.</p>
    </div>
    <div className="benefits-grid">
      <div className="benefit-card r d1">
        <span className="benefit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></span>
        <div className="outcome">Encuentra cualquier prenda en segundos</div>
        <p>Busca por nombre, talla, color o c&oacute;digo de barras. Nunca m&aacute;s pierdas una venta por no encontrar lo que te piden.</p>
      </div>
      <div className="benefit-card r d2">
        <span className="benefit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
        <div className="outcome">Conoce exactamente cu&aacute;nto ganas</div>
        <p>Reportes claros de ventas, m&aacute;rgenes y rentabilidad. Saber si tu boutique va bien deja de ser un misterio.</p>
      </div>
      <div className="benefit-card r d3">
        <span className="benefit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        <div className="outcome">Nunca te quedes sin una talla</div>
        <p>Alertas cuando el inventario est&aacute; bajo. Sugerencias de pedido basadas en lo que realmente se vende.</p>
      </div>
      <div className="benefit-card r d1">
        <span className="benefit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg></span>
        <div className="outcome">Funciona aunque falle el internet</div>
        <p>Si se va la se&ntilde;al, sigues vendiendo. Todo se sincroniza autom&aacute;ticamente cuando vuelve la conexi&oacute;n.</p>
      </div>
      <div className="benefit-card r d2">
        <span className="benefit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87" strokeLinecap="round"/><path d="M16 3.13a4 4 0 010 7.75" strokeLinecap="round"/></svg></span>
        <div className="outcome">Tu equipo vende, t&uacute; controlas</div>
        <p>Ellos ven lo que necesitan para vender. T&uacute; ves los n&uacute;meros, las alertas y el panorama completo.</p>
      </div>
      <div className="benefit-card r d3">
        <span className="benefit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17l10 5 10-5" strokeLinecap="round"/><path d="M2 12l10 5 10-5" strokeLinecap="round"/></svg></span>
        <div className="outcome">Un asistente que conoce tu negocio</div>
        <p>Preg&uacute;ntale cualquier cosa: ventas, inventario, ganancias. Te responde al instante con datos reales.</p>
      </div>
    </div>
  </div>
</section>





<section className="testimonials">
  <div className="container">
    <div className="testimonial-inner r">
      <div className="testimonial-marks">&ldquo;</div>
      <p className="testimonial-text">
        Antes pasaba horas cada semana contando inventario. Ahora abro Veliora y en 10 segundos s&eacute; qu&eacute; tengo, qu&eacute; falta y cu&aacute;nto he vendido. Es como tener una asistente personal para mi boutique.
      </p>
      <p className="testimonial-author"><strong>Mar&iacute;a Garc&iacute;a</strong> &middot; Boutique Mar&iacute;a Bonita, Quer&eacute;taro</p>
      <div className="testimonial-stats">
        <div className="testimonial-stat"><div className="n">+2,400</div><div className="l">Boutiques registradas</div></div>
        <div className="testimonial-stat"><div className="n">+85K</div><div className="l">Prendas organizadas</div></div>
        <div className="testimonial-stat"><div className="n">97%</div><div className="l">Satisfacci&oacute;n</div></div>
      </div>
    </div>
  </div>
</section>


<section id="planes" className="pricing">
  <div className="container">
    <div className="pricing-header r">
      <p style={{"fontSize":".6rem","textTransform":"uppercase","letterSpacing":".22em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>Elige el plan ideal</p>
      <h2>Empieza hoy. Paga cuando crezcas.</h2>
      <p>Sin tarjeta. Sin permanencia. Cancela cuando quieras.</p>
    </div>
    <div className="pricing-grid">
      
      <div className="pricing-card r d1">
        <p className="pricing-plan">Inicial</p>
        <div className="pricing-price">
          <span className="free">$0</span>
          <span className="per">/mes</span>
        </div>
        <p className="pricing-desc">Perfecto para empezar a organizar tu boutique.</p>
        <ul className="pricing-features">
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Hasta 100 productos</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Registro b&aacute;sico de ventas</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Asistente inteligente</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> 1 empleado</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Funciona sin internet</li>
        </ul>
        <a href="/registro?trial=true" className="btn btn-secondary" style={{"fontSize":".75rem"}}>Crear cuenta gratis</a>
      </div>

      
      <div className="pricing-card featured r d2">
        <div className="pricing-badge">Recomendado</div>
        <p className="pricing-plan">Premium &mdash; M&aacute;s popular</p>
        <div className="pricing-price">
          <span className="old">$239</span>
          $199
          <span className="per">/mes</span>
        </div>
        <p className="pricing-desc">Todo lo que necesitas para hacer crecer tu boutique.</p>
        <ul className="pricing-features">
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Productos ilimitados</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Escaneo de facturas</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Asistente inteligente</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Hasta 5 empleados</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Reportes autom&aacute;ticos</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Alertas de inventario</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Funciona sin internet</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Soporte WhatsApp</li>
        </ul>
        <a href="/registro?trial=true" className="btn btn-primary" style={{"fontSize":".78rem"}}>
          Probar 7 d&iacute;as gratis
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
        <div className="pricing-guarantee">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sin tarjeta &middot; Sin permanencia &middot; Cancela cuando quieras
        </div>
      </div>

      
      <div className="pricing-card r d3">
        <p className="pricing-plan">Ilimitado</p>
        <div className="pricing-price">
          $379
          <span className="per">/mes</span>
        </div>
        <p className="pricing-desc">Para boutiques que quieren crecer sin l&iacute;mites.</p>
        <ul className="pricing-features">
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Productos ilimitados</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Escaneo de facturas</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Asistente inteligente</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Empleados ilimitados</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Reportes avanzados</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Alertas inteligentes</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Funciona sin internet</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Soporte 1 a 1 prioritario</li>
          <li><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Capacitaci&oacute;n personalizada</li>
        </ul>
        <a href="/registro?trial=true" className="btn btn-secondary" style={{"fontSize":".75rem"}}>Elegir Ilimitado</a>
      </div>
    </div>
  </div>
</section>


<section id="faq" className="faq">
  <div className="container">
    <div className="faq-header r">
      <p style={{"fontSize":".6rem","textTransform":"uppercase","letterSpacing":".22em","color":"#c8a476","fontWeight":"600","marginBottom":".5rem"}}>Resolvemos tus dudas</p>
      <h2>Preguntas frecuentes</h2>
    </div>
    <div className="faq-list">
      <div className="faq-item"><div className="faq-q" onClick={(e) => { tF(e.currentTarget) }}>Necesito saber de tecnolog&iacute;a para usarlo?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div><div className="faq-a"><p>No. Veliora est&aacute; dise&ntilde;ada para que cualquier persona lo use desde el primer minuto. Si sabes usar WhatsApp, sabes usar Veliora. Botones grandes, colores claros, todo es intuitivo.</p></div></div>
      <div className="faq-item"><div className="faq-q" onClick={(e) => { tF(e.currentTarget) }}>Qu&eacute; pasa si no tengo internet en mi local?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div><div className="faq-a"><p>Sin problema. Veliora funciona sin conexi&oacute;n. Puedes seguir vendiendo y registrando todo. Cuando regrese el internet, se sincroniza autom&aacute;ticamente. No pierdes ni una venta.</p></div></div>
      <div className="faq-item"><div className="faq-q" onClick={(e) => { tF(e.currentTarget) }}>Puedo usarlo desde mi celular?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div><div className="faq-a"><p>S&iacute;. Veliora funciona en cualquier dispositivo: celular, tablet o computadora. Tus empleados pueden usarlo desde su tel&eacute;fono y t&uacute; supervisas todo desde el tuyo.</p></div></div>
      <div className="faq-item"><div className="faq-q" onClick={(e) => { tF(e.currentTarget) }}>C&oacute;mo capturo mi inventario actual?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div><div className="faq-a"><p>Puedes tomarle una foto a tu factura m&aacute;s reciente y Veliora registra todo autom&aacute;ticamente. O si tienes un archivo de Excel, podemos ayudarte a migrarlo sin costo. Si arrancas de cero, tambi&eacute;n puedes agregar productos uno por uno desde tu tel&eacute;fono.</p></div></div>
      <div className="faq-item"><div className="faq-q" onClick={(e) => { tF(e.currentTarget) }}>Qu&eacute; pasa despu&eacute;s de los 7 d&iacute;as gratis?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div><div className="faq-a"><p>Si te gusta Veliora, eliges un plan y contin&uacute;as. Si no, simplemente dejas de usarlo. Sin cargos, sin compromiso, sin llamadas de retenci&oacute;n. Toda tu informaci&oacute;n sigue siendo tuya y la puedes exportar cuando quieras.</p></div></div>
      <div className="faq-item"><div className="faq-q" onClick={(e) => { tF(e.currentTarget) }}>Realmente es f&aacute;cil de usar?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div><div className="faq-a"><p>La mayor&iacute;a de nuestras clientas lo usan desde el primer d&iacute;a sin capacitaci&oacute;n. Si en alg&uacute;n momento tienes dudas, estamos a un WhatsApp de distancia. Te respondemos en persona, no un bot.</p></div></div>
    </div>
  </div>
</section>


<section className="cta">
  <div className="container r">
    <h2>Tu boutique merece trabajar con informaci&oacute;n,<br />no con suposiciones.</h2>
    <p>Empieza hoy mismo. 7 d&iacute;as gratis. Sin tarjeta. Sin compromiso.</p>
    <a href="/registro?trial=true" className="btn btn-primary">
      Probar Veliora gratis
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
    <div className="cta-notes">
      <span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Sin tarjeta</span>
      <span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Sin permanencia</span>
      <span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Cancela cuando quieras</span>
      <span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.3 4.3L6 11.6 2.7 8.3" strokeLinecap="round" strokeLinejoin="round"/></svg> Soporte por WhatsApp</span>
    <a href="/registro?trial=true" className="btn btn-download" style={{"marginTop":".8rem"}}><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 1v10M3 8l5 5 5-5" strokeLinecap="round"/></svg> Descargar app</a></div>
    <p className="cta-domain">veliora.lat</p>
  </div>
</section>


<footer>
  <div className="container">
    <div className="footer-inner">
      <div className="footer-brand">
        <a href="#" className="logo">Veliora <em>· lat</em></a>
        <p>Hecho en M&eacute;xico para boutiques mexicanas. Porque tu tiempo vale y tu boutique merece orden.</p>
        <div className="footer-soc">
          <a href="https://wa.me/528342177709" aria-label="WhatsApp"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
          <a href="#" aria-label="Instagram"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
          <a href="#" aria-label="Facebook"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
        </div>
      </div>
      <div className="footer-col">
        <h4>Veliora</h4>
        <a href="#imagine">Imagina tu d&iacute;a</a>
        <a href="#funciona">C&oacute;mo funciona</a>
        <a href="#asistente">Asistente</a>
        <a href="#planes">Planes</a>
        <a href="#faq">FAQ</a>
      </div>
      <div className="footer-col">
        <h4>Legal</h4>
        <a href="/seguridad">Seguridad</a>
        <a href="/privacidad">Privacidad</a>
        <a href="/terminos">T&eacute;rminos</a>
      </div>
    </div>
    <div className="footer-bottom">
      <span>&copy; 2026 Veliora &middot; Hecho en M&eacute;xico</span>
      <span>veliora.lat &mdash; Tu boutique, siempre en orden</span>
    </div>
  </div>
</footer>


<a href="https://wa.me/528342177709?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Veliora" target="_blank" className="wfab" aria-label="WhatsApp">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>
    <style>{"/* ── Reset ── */\n*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\nhtml{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}\nbody{\n  font-family:'Inter',system-ui,-apple-system,sans-serif;\n  background:#fdfaf5;color:#2a2420;\n  overflow-x:hidden;line-height:1.6;\n}\n::selection{background:rgba(200,164,118,.3);color:#1a1612}\n\n/* ── Scrollbar ── */\n::-webkit-scrollbar{width:4px}\n::-webkit-scrollbar-track{background:#f5f0e8}\n::-webkit-scrollbar-thumb{background:rgba(200,164,118,.4);border-radius:2px}\n\n/* ── Typography ── */\n.display{font-family:'Playfair Display',Georgia,'Times New Roman',serif}\n.body{font-family:'Inter',system-ui,-apple-system,sans-serif}\n.jakarta{font-family:'Plus Jakarta Sans','Inter',sans-serif}\n\n/* ── Bg ── */\n.bg-atmosphere{\n  position:fixed;inset:0;z-index:-1;pointer-events:none;\n  background:\n    radial-gradient(ellipse 55% 45% at 15% 25%, rgba(232,196,184,.25), transparent 70%),\n    radial-gradient(ellipse 40% 35% at 85% 75%, rgba(200,164,118,.12), transparent 60%),\n    radial-gradient(ellipse 30% 30% at 50% 50%, rgba(237,228,213,.3), transparent 50%);\n}\n.bg-noise{\n  position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.12;\n  background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");\n}\n\n/* ── Progress ── */\n#progress{\n  position:fixed;top:0;left:0;z-index:999;\n  height:2px;background:linear-gradient(90deg,#c8a476,#b8926a);\n  width:0;transition:width .12s ease;\n}\n\n/* ── Nav ── */\nnav{\n  position:fixed;top:0;left:0;right:0;z-index:100;\n  padding:1.25rem 2rem;transition:all .4s ease;\n}\nnav.scrolled{\n  background:rgba(253,250,245,.88);backdrop-filter:blur(24px) saturate(1.3);\n  border-bottom:1px solid rgba(200,164,118,.1);\n  padding:.75rem 2rem;\n}\n.nav-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}\n.logo{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:1.4rem;font-weight:700;color:#2a2420;text-decoration:none;\n  letter-spacing:-.03em;line-height:1;\n}\n.logo em{font-style:italic;font-weight:400;color:#c8a476}\n.nav-links{display:flex;align-items:center;gap:2.4rem}\n.nav-links a{\n  color:rgba(42,36,32,.5);text-decoration:none;font-size:.78rem;font-weight:500;\n  letter-spacing:.02em;transition:color .3s;\n}\n.nav-links a:hover{color:#2a2420}\n.nav-cta{\n  background:#2a2420;color:#fdfaf5!important;\n  padding:.5rem 1.4rem;border-radius:100px;\n  font-weight:600!important;font-size:.75rem!important;\n  transition:all .3s!important;\n}\n.nav-cta:hover{background:#1a1612!important}\n\n/* ── Mobile ── */\n.mob-toggle{display:none;background:none;border:none;color:#2a2420;cursor:pointer}\n.mob{\n  position:fixed;inset:0;z-index:200;background:#fdfaf5;\n  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.8rem;\n  opacity:0;pointer-events:none;transition:all .5s cubic-bezier(.4,0,.2,1);\n}\n.mob.open{opacity:1;pointer-events:all}\n.mob a{color:#4a3a2a;text-decoration:none;font-size:1.2rem;font-family:'Playfair Display',serif;transition:color .2s}\n.mob a:hover{color:#2a2420}\n.mob-close{\n  position:absolute;top:1.5rem;right:1.5rem;background:rgba(0,0,0,.03);border:none;\n  cursor:pointer;width:40px;height:40px;border-radius:50%;\n  display:flex;align-items:center;justify-content:center;color:#2a2420;\n}\n\n/* ── Sections ── */\nsection{position:relative}\n.container{max-width:1120px;margin:0 auto;padding:0 2rem}\n\n/* ── Hero ── */\n.hero{min-height:100vh;display:flex;align-items:center;padding:7rem 0 3rem}\n.hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:4.5rem;align-items:center}\n.hero-sub{\n  display:flex;align-items:center;gap:.6rem;\n  margin-bottom:1.8rem;font-size:.65rem;text-transform:uppercase;\n  letter-spacing:.22em;color:rgba(42,36,32,.4);font-weight:500;\n}\n.hero-sub-line{width:24px;height:1px;background:rgba(200,164,118,.5)}\n.hero h1{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(2.2rem,4.5vw,3.6rem);\n  font-weight:800;line-height:1.06;color:#1a1612;margin-bottom:1.2rem;\n}\n.hero h1 br{display:none}\n.hero h1 i{font-style:italic;font-weight:600;color:#b8926a}\n.hero p{\n  font-size:.95rem;color:rgba(42,36,32,.55);line-height:1.7;\n  max-width:440px;margin-bottom:2rem;\n}\n.hero-actions{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2rem}\n.btn{\n  display:inline-flex;align-items:center;gap:.5rem;\n  padding:.85rem 2rem;border-radius:100px;\n  font-weight:500;font-size:.8rem;letter-spacing:.02em;\n  text-decoration:none;cursor:pointer;font-family:'Inter',sans-serif;\n  transition:all .4s cubic-bezier(.4,0,.2,1);\n}\n.btn-primary{background:#2a2420;color:#fdfaf5;border:none}\n.btn-primary:hover{background:#1a1612;transform:translateY(-2px);box-shadow:0 12px 28px -8px rgba(42,36,32,.15)}\n.btn-secondary{background:transparent;color:#2a2420;border:1px solid rgba(42,36,32,.1)}\n.btn-secondary:hover{border-color:#2a2420;background:rgba(42,36,32,.02);transform:translateY(-2px)}\n.btn-download{background:transparent;color:#2a2420;border:1px solid rgba(42,36,32,.12);padding:.4rem 1rem;border-radius:100px;font-size:.7rem;font-weight:500;text-decoration:none;transition:all .3s;cursor:pointer;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:.35rem;line-height:1}\n.btn-download:hover{background:rgba(42,36,32,.03);border-color:#2a2420}\n.hero-trust{display:flex;gap:1.5rem;flex-wrap:wrap}\n.hero-trust span{\n  display:flex;align-items:center;gap:.4rem;\n  font-size:.72rem;color:rgba(42,36,32,.4);\n}\n.hero-trust svg{width:12px;height:12px;color:#22c55e;flex-shrink:0}\n\n/* ── Hero Card ── */\n.hero-card-wrap{position:relative;display:flex;justify-content:center;align-items:flex-start}\n.hero-card{\n  background:#fff;border-radius:24px;\n  box-shadow:0 35px 80px -25px rgba(42,36,32,.12),0 0 0 1px rgba(200,164,118,.06);\n  width:100%;max-width:420px;overflow:hidden;\n  animation:float 8s ease-in-out infinite;\n}\n@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}\n.hero-card-p{padding:2rem}\n.hero-card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem}\n.hero-card-top h4{font-size:.55rem;text-transform:uppercase;letter-spacing:.18em;color:rgba(42,36,32,.35);font-weight:600}\n.hero-card-top h3{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:#1a1612;margin-top:2px}\n.hero-card-top .val{text-align:right}\n.hero-card-top .val .n{font-size:1.3rem;font-weight:700;color:#1a1612;line-height:1}\n.hero-card-top .val .l{font-size:.55rem;color:rgba(42,36,32,.35);text-transform:uppercase;letter-spacing:.1em;margin-top:1px}\n.hero-card-stats{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;margin-bottom:1.2rem}\n.hero-card-stat{background:#f8f4ee;border-radius:12px;padding:.9rem}\n.hero-card-stat .n{font-size:1.1rem;font-weight:700;color:#1a1612}\n.hero-card-stat .l{font-size:.55rem;color:rgba(42,36,32,.35);text-transform:uppercase;letter-spacing:.08em;margin-top:1px}\n.hero-card-stat .d{font-size:.6rem;color:#22c55e;font-weight:600;margin-top:2px}\n.hero-card-items{margin-bottom:1rem}\n.hero-card-item{\n  display:flex;justify-content:space-between;align-items:center;\n  padding:.5rem 0;border-bottom:1px solid rgba(42,36,32,.04);\n}\n.hero-card-item:last-child{border-bottom:none}\n.hero-card-item .info .nm{font-size:.75rem;font-weight:600;color:#2a2420}\n.hero-card-item .info .dt{font-size:.55rem;color:rgba(42,36,32,.35)}\n.hero-card-item .pr{font-size:.75rem;font-weight:600;color:#2a2420}\n.hero-card-alert{\n  display:flex;align-items:center;gap:.6rem;\n  background:linear-gradient(135deg,#f8f0e8,#fdfaf5);\n  border:1px solid rgba(200,164,118,.12);\n  border-radius:12px;padding:.8rem 1rem;\n}\n.hero-card-alert .ic{\n  width:28px;height:28px;border-radius:8px;\n  background:rgba(200,164,118,.1);\n  display:flex;align-items:center;justify-content:center;\n  flex-shrink:0;\n}\n.hero-card-alert .ic svg{width:14px;height:14px;color:#b8926a}\n.hero-card-alert p{font-size:.68rem;color:rgba(42,36,32,.65);line-height:1.4}\n.hero-card-alert p strong{color:#b8926a}\n\n/* ── Pain ── */\n.pain{padding:6rem 0}\n.pain-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}\n.pain-quotes{display:flex;flex-direction:column;gap:.6rem}\n.pain-q{\n  padding:1.2rem 1.5rem;border-radius:16px;\n  background:#fff;border:1px solid rgba(200,164,118,.06);\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:.95rem;font-style:italic;color:#4a3a2a;line-height:1.5;\n  transition:all .3s;\n}\n.pain-q:hover{border-color:rgba(200,164,118,.15);box-shadow:0 8px 24px -8px rgba(42,36,32,.04)}\n.pain-q span{display:block;font-size:.65rem;font-style:normal;color:rgba(42,36,32,.3);margin-top:.4rem;font-family:'Inter',sans-serif}\n.pain-right h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.5rem,3vw,2.3rem);\n  font-weight:700;color:#1a1612;line-height:1.15;\n  margin-bottom:.8rem;\n}\n.pain-right p{font-size:.88rem;color:rgba(42,36,32,.5);line-height:1.7;margin-bottom:1.5rem}\n.pain-right .btn{margin-top:.5rem}\n\n/* ── Imagine ── */\n.imagine{padding:6rem 0;background:rgba(200,164,118,.03)}\n.imagine-grid{display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}\n.imagine-card{\n  padding:2.5rem;border-radius:20px;position:relative;\n}\n.imagine-before{background:#fff;border:1px solid rgba(200,164,118,.06)}\n.imagine-after{background:#2a2420;border:1px solid rgba(200,164,118,.08)}\n.imagine-card h4{\n  font-size:.6rem;text-transform:uppercase;letter-spacing:.18em;\n  font-weight:600;margin-bottom:1.5rem;\n}\n.imagine-before h4{color:rgba(42,36,32,.25)}\n.imagine-after h4{color:rgba(253,250,245,.3)}\n.imagine-list{display:flex;flex-direction:column;gap:.8rem}\n.imagine-item{display:flex;gap:.7rem;align-items:flex-start}\n.imagine-item .mk{\n  width:20px;height:20px;border-radius:50%;\n  display:flex;align-items:center;justify-content:center;flex-shrink:0;\n}\n.imagine-item .mk svg{width:10px;height:10px}\n.imagine-item .mk.x{background:rgba(239,68,68,.08)}\n.imagine-item .mk.x svg{color:#ef4444}\n.imagine-item .mk.c{background:rgba(34,197,94,.08)}\n.imagine-item .mk.c svg{color:#22c55e}\n.imagine-item p{font-size:.82rem;line-height:1.5}\n.imagine-before .imagine-item p{color:rgba(42,36,32,.5)}\n.imagine-after .imagine-item p{color:rgba(253,250,245,.55)}\n\n/* ── How ── */\n.how{padding:6rem 0}\n.how-header{text-align:center;margin-bottom:4.5rem}\n.how-header h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.5rem,3vw,2.3rem);font-weight:700;color:#1a1612;\n  margin-bottom:.5rem;\n}\n.how-header p{font-size:.88rem;color:rgba(42,36,32,.5);max-width:400px;margin:0 auto}\n.how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2.5rem;max-width:960px;margin:0 auto}\n.how-card{text-align:center}\n.how-icon{\n  width:72px;height:72px;border-radius:50%;\n  display:flex;align-items:center;justify-content:center;\n  margin:0 auto 1.5rem;\n  background:rgba(200,164,118,.08);color:#b8926a;\n  transition:all .4s;\n}\n.how-icon svg{width:28px;height:28px}\n.how-card:hover .how-icon{background:#c8a476;color:#fff;transform:scale(1.05)}\n.how-card:hover .how-icon svg{color:#fff}\n.how-card h3{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:1.05rem;font-weight:700;color:#1a1612;margin-bottom:.4rem;\n}\n.how-card p{font-size:.82rem;color:rgba(42,36,32,.5);line-height:1.6;max-width:260px;margin:0 auto}\n\n/* ── AI Assistant ── */\n.assistant{padding:7rem 0;background:linear-gradient(180deg,transparent,rgba(200,164,118,.04),transparent)}\n.assistant-header{text-align:center;margin-bottom:4rem}\n.assistant-header .eyebrow{\n  font-size:.6rem;text-transform:uppercase;letter-spacing:.25em;\n  color:#c8a476;font-weight:600;margin-bottom:.5rem;\n}\n.assistant-header h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.5rem,3vw,2.3rem);font-weight:700;color:#1a1612;\n  margin-bottom:.6rem;\n}\n.assistant-header p{font-size:.88rem;color:rgba(42,36,32,.5);max-width:500px;margin:0 auto}\n.assistant-grid{display:grid;grid-template-columns:1fr 1fr;gap:3.5rem;align-items:center;max-width:1050px;margin:0 auto}\n.assistant-visual{order:1}\n.assistant-chat{\n  background:#fff;border-radius:24px;\n  box-shadow:0 25px 60px -20px rgba(42,36,32,.1),0 0 0 1px rgba(200,164,118,.06);\n  overflow:hidden;max-width:460px;\n}\n.chat-header{\n  display:flex;align-items:center;gap:.6rem;\n  padding:1rem 1.2rem;border-bottom:1px solid rgba(200,164,118,.06);\n}\n.chat-avatar{\n  width:32px;height:32px;border-radius:50%;\n  background:linear-gradient(135deg,#c8a476,#b8926a);\n  display:flex;align-items:center;justify-content:center;\n  color:#fff;font-size:.65rem;font-weight:700;font-family:'Playfair Display',serif;\n  flex-shrink:0;\n}\n.chat-name h4{font-size:.7rem;font-weight:600;color:#2a2420}\n.chat-name span{font-size:.55rem;color:rgba(42,36,32,.3)}\n.chat-body{padding:1.2rem;display:flex;flex-direction:column;gap:1rem}\n.chat-bubble{\n  max-width:88%;padding:.9rem 1.1rem;border-radius:14px;\n  font-size:.78rem;line-height:1.6;\n  animation:fadeUp .5s ease both;\n}\n.chat-user{\n  align-self:flex-end;background:rgba(200,164,118,.08);\n  color:#2a2420;border-bottom-right-radius:4px;\n}\n.chat-ai{\n  align-self:flex-start;background:#f5f0e8;\n  color:rgba(42,36,32,.75);border-bottom-left-radius:4px;\n}\n.chat-ai strong{color:#b8926a;font-weight:600}\n@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}\n\n.assistant-content{order:2}\n.assistant-content h3{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:1.4rem;font-weight:700;color:#1a1612;margin-bottom:1rem;\n}\n.assistant-content p{\n  font-size:.85rem;color:rgba(42,36,32,.5);line-height:1.7;margin-bottom:1rem;\n}\n.assistant-content .example-q{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:.9rem;font-style:italic;color:#6a5a4a;\n  padding:.7rem 0;border-bottom:1px solid rgba(200,164,118,.06);\n}\n.assistant-content .example-q:last-child{border-bottom:none}\n\n/* ── Video ── */\n.video{padding:5rem 0}\n.video-inner{max-width:720px;margin:0 auto;text-align:center}\n.video-frame{\n  background:#fff;border-radius:24px;overflow:hidden;\n  box-shadow:0 25px 60px -20px rgba(42,36,32,.08);\n  border:1px solid rgba(200,164,118,.06);\n  aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;\n  margin-top:2rem;cursor:pointer;position:relative;\n  background:linear-gradient(145deg,#f8f4ee,#f0e8de);\n  transition:all .3s;\n}\n.video-frame:hover{box-shadow:0 30px 80px -20px rgba(42,36,32,.12)}\n.video-play{\n  width:64px;height:64px;border-radius:50%;\n  background:#2a2420;display:flex;align-items:center;justify-content:center;\n  transition:all .3s;color:#fdfaf5;\n}\n.video-frame:hover .video-play{transform:scale(1.05);box-shadow:0 12px 32px -8px rgba(42,36,32,.15)}\n.video-label{font-size:.55rem;text-transform:uppercase;letter-spacing:.15em;color:rgba(42,36,32,.25);font-weight:600;margin-bottom:1rem;margin-top:.8rem}\n\n/* ── Benefits ── */\n.benefits{padding:6rem 0}\n.benefits-header{text-align:center;margin-bottom:4rem}\n.benefits-header h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.5rem,3vw,2.2rem);font-weight:700;color:#1a1612;\n  margin-bottom:.5rem;\n}\n.benefits-header p{font-size:.88rem;color:rgba(42,36,32,.5);max-width:440px;margin:0 auto}\n.benefits-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;max-width:960px;margin:0 auto}\n.benefit-card{\n  padding:1.8rem;border-radius:16px;\n  background:#fff;border:1px solid rgba(200,164,118,.04);\n  transition:all .4s;\n}\n.benefit-card:hover{\n  border-color:rgba(200,164,118,.12);\n  transform:translateY(-3px);\n  box-shadow:0 12px 32px -12px rgba(42,36,32,.04);\n}\n.benefit-icon{display:block;margin-bottom:.8rem}\n.benefit-icon svg{width:22px;height:22px;color:#b8926a}\n.benefit-card h4{font-size:.85rem;font-weight:600;color:#2a2420;margin-bottom:3px}\n.benefit-card .outcome{font-size:.85rem;font-weight:500;color:#b8926a;margin-bottom:.3rem;font-family:'Playfair Display',serif}\n.benefit-card p{font-size:.75rem;color:rgba(42,36,32,.45);line-height:1.5}\n.benefit-card .how-tag{\n  display:inline-block;font-size:.6rem;color:rgba(200,164,118,.6);\n  margin-top:6px;font-weight:500;\n}\n\n/* ── Compare ── */\n.compare{padding:6rem 0;background:rgba(200,164,118,.02)}\n.compare-header{text-align:center;margin-bottom:3.5rem}\n.compare-header h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.3rem,2.5vw,2rem);font-weight:700;color:#1a1612;\n}\n.compare-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;max-width:820px;margin:0 auto}\n.compare-card{padding:2.5rem;border-radius:20px}\n.compare-without{background:#fff;border:1px solid rgba(200,164,118,.06)}\n.compare-with{background:#2a2420}\n.compare-card h3{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:1rem;font-weight:700;margin-bottom:1.8rem;\n}\n.compare-without h3{color:#1a1612}\n.compare-with h3{color:#fdfaf5}\n.compare-item{\n  display:flex;align-items:center;gap:.7rem;\n  padding:.55rem 0;border-bottom:1px solid rgba(42,36,32,.03);\n}\n.compare-item:last-child{border-bottom:none}\n.compare-with .compare-item{border-color:rgba(253,250,245,.04)}\n.compare-item .mk{\n  width:18px;height:18px;border-radius:50%;\n  display:flex;align-items:center;justify-content:center;flex-shrink:0;\n}\n.compare-item .mk svg{width:9px;height:9px}\n.compare-item .mk.x{border:1px solid rgba(239,68,68,.15)}\n.compare-item .mk.x svg{color:#ef4444}\n.compare-item .mk.c{border:1px solid rgba(34,197,94,.15)}\n.compare-item .mk.c svg{color:#22c55e}\n.compare-item .txt{font-size:.8rem;line-height:1.4}\n.compare-without .compare-item .txt{color:rgba(42,36,32,.5)}\n.compare-with .compare-item .txt{color:rgba(253,250,245,.5)}\n\n/* ── Testimonials ── */\n.testimonials{padding:6rem 0}\n.testimonial-inner{max-width:750px;margin:0 auto;text-align:center}\n.testimonial-marks{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:4rem;line-height:1;color:#c8a476;opacity:.3;margin-bottom:-1rem;\n}\n.testimonial-text{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:1.25rem;font-style:italic;line-height:1.6;\n  color:#3a2a1a;margin-bottom:1.2rem;\n}\n.testimonial-author{font-size:.8rem;color:rgba(42,36,32,.4)}\n.testimonial-author strong{color:#2a2420;font-weight:600}\n.testimonial-stats{\n  display:flex;justify-content:center;gap:3.5rem;margin-top:3.5rem;\n}\n.testimonial-stat .n{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:1.8rem;font-weight:700;color:#1a1612;\n}\n.testimonial-stat .l{font-size:.68rem;color:rgba(42,36,32,.35)}\n\n/* ── Pricing ── */\n.pricing{padding:6rem 0}\n.pricing-header{text-align:center;margin-bottom:3rem}\n.pricing-header h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.5rem,2.8vw,2.2rem);font-weight:700;color:#1a1612;\n  margin-bottom:.4rem;\n}\n.pricing-header p{font-size:.82rem;color:rgba(42,36,32,.5)}\n.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;max-width:960px;margin:0 auto;align-items:start}\n.pricing-card{\n  background:#fff;border-radius:20px;\n  border:1px solid rgba(200,164,118,.06);\n  padding:2rem 1.5rem;text-align:center;\n  position:relative;box-shadow:0 15px 40px -20px rgba(42,36,32,.04);\n  transition:all .3s;\n}\n.pricing-card:hover{border-color:rgba(200,164,118,.12);transform:translateY(-3px)}\n.pricing-card.featured{border-color:#c8a476;box-shadow:0 20px 50px -20px rgba(42,36,32,.08)}\n.pricing-badge{\n  position:absolute;top:-12px;left:50%;transform:translateX(-50%);\n  padding:.25rem 1.2rem;border-radius:100px;\n  font-size:.52rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;\n  background:#c8a476;color:#fdfaf5;white-space:nowrap;\n}\n.pricing-plan{font-size:.55rem;text-transform:uppercase;letter-spacing:.2em;color:rgba(42,36,32,.2);font-weight:600;margin-bottom:.3rem}\n.pricing-price{font-family:'Playfair Display',Georgia,serif;font-size:2.4rem;font-weight:800;color:#1a1612;line-height:1;display:flex;align-items:baseline;justify-content:center;gap:.4rem}\n.pricing-price .old{font-size:1rem;color:rgba(42,36,32,.15);text-decoration:line-through;font-weight:400}\n.pricing-price .per{font-size:.75rem;color:rgba(42,36,32,.25);font-weight:400;font-family:'Inter',sans-serif}\n.pricing-price .free{font-size:2rem;letter-spacing:-.04em}\n.pricing-desc{font-size:.7rem;color:rgba(42,36,32,.35);margin:.6rem 0 1.2rem}\n.pricing-features{list-style:none;margin-bottom:1.5rem;display:flex;flex-direction:column;gap:.05rem}\n.pricing-features li{display:flex;align-items:center;gap:.45rem;justify-content:center;padding:.3rem 0;font-size:.72rem;color:rgba(42,36,32,.45)}\n.pricing-features li svg{width:10px;height:10px;color:#c8a476;flex-shrink:0}\n.pricing .btn{width:100%;justify-content:center;font-size:.78rem;padding:.85rem 1.5rem}\n.pricing-guarantee{display:flex;align-items:center;justify-content:center;gap:.35rem;margin-top:.8rem;font-size:.62rem;color:rgba(42,36,32,.25)}\n.pricing-guarantee svg{width:10px;height:10px;color:#c8a476}\n\n/* ── FAQ ── */\n.faq{padding:6rem 0;background:rgba(200,164,118,.02)}\n.faq-header{text-align:center;margin-bottom:3.5rem}\n.faq-header h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.3rem,2.5vw,2rem);font-weight:700;color:#1a1612;\n}\n.faq-list{max-width:620px;margin:0 auto;display:flex;flex-direction:column;gap:.35rem}\n.faq-item{background:#fff;border:1px solid rgba(200,164,118,.04);border-radius:14px;overflow:hidden;transition:all .3s}\n.faq-item:hover{border-color:rgba(200,164,118,.1)}\n.faq-q{\n  padding:1.1rem 1.4rem;display:flex;justify-content:space-between;\n  align-items:center;cursor:pointer;font-size:.82rem;font-weight:500;\n  color:#2a2420;user-select:none;gap:1rem;\n}\n.faq-q svg{width:14px;height:14px;color:rgba(42,36,32,.2);transition:transform .4s;flex-shrink:0}\n.faq-item.open .faq-q svg{transform:rotate(180deg)}\n.faq-a{max-height:0;overflow:hidden;transition:all .4s ease}\n.faq-item.open .faq-a{max-height:350px;padding:0 1.4rem 1.1rem}\n.faq-a p{font-size:.78rem;color:rgba(42,36,32,.45);line-height:1.7}\n\n/* ── CTA ── */\n.cta{padding:6rem 0;text-align:center}\n.cta h2{\n  font-family:'Playfair Display',Georgia,serif;\n  font-size:clamp(1.5rem,2.8vw,2.2rem);font-weight:700;color:#1a1612;\n  margin-bottom:.6rem;\n}\n.cta p{font-size:.9rem;color:rgba(42,36,32,.5);margin-bottom:2rem;max-width:460px;margin-left:auto;margin-right:auto}\n.cta .btn{font-size:.85rem;padding:1rem 2.5rem}\n.cta-notes{display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap;margin-top:1.5rem}\n.cta-notes span{font-size:.7rem;color:rgba(42,36,32,.3);display:flex;align-items:center;gap:.3rem}\n.cta-notes span svg{width:11px;height:11px;color:#22c55e}\n.cta-domain{\n  margin-top:1rem;font-size:.7rem;color:rgba(42,36,32,.2);\n  font-family:'Georgia',serif;letter-spacing:.05em;\n}\n\n/* ── Footer ── */\nfooter{\n  border-top:1px solid rgba(200,164,118,.06);\n  padding:3.5rem 0 2rem;\n}\n.footer-inner{display:grid;grid-template-columns:2fr 1fr 1fr;gap:3rem;margin-bottom:2.5rem}\n.footer-brand .logo{font-size:1.1rem}\n.footer-brand p{font-size:.75rem;color:rgba(42,36,32,.35);margin-top:.4rem;max-width:260px;line-height:1.6}\n.footer-soc{display:flex;gap:.4rem;margin-top:.8rem}\n.footer-soc a{\n  width:32px;height:32px;border-radius:50%;\n  display:flex;align-items:center;justify-content:center;\n  background:rgba(200,164,118,.06);color:rgba(42,36,32,.3);\n  text-decoration:none;transition:all .2s;\n}\n.footer-soc a:hover{background:#c8a476;color:#fff}\n.footer-col h4{font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:#2a2420;margin-bottom:.8rem}\n.footer-col a{display:block;font-size:.75rem;color:rgba(42,36,32,.35);text-decoration:none;padding:.15rem 0;transition:color .2s}\n.footer-col a:hover{color:#2a2420}\n.footer-bottom{\n  border-top:1px solid rgba(200,164,118,.05);\n  padding-top:1.2rem;display:flex;justify-content:space-between;\n  font-size:.65rem;color:rgba(42,36,32,.2);\n}\n\n/* ── WhatsApp ── */\n.wfab{\n  position:fixed;bottom:1.5rem;right:1.5rem;z-index:50;\n  width:48px;height:48px;border-radius:50%;\n  background:linear-gradient(135deg,#25d366,#128c7e);\n  display:flex;align-items:center;justify-content:center;\n  color:#fff;box-shadow:0 6px 20px rgba(37,211,102,.2);\n  text-decoration:none;transition:all .3s;\n}\n.wfab:hover{transform:scale(1.06);box-shadow:0 8px 28px rgba(37,211,102,.3)}\n\n/* ── Reveal ── */\n.r{opacity:0;transform:translateY(18px);transition:all .7s cubic-bezier(.4,0,.2,1)}\n.r.v{opacity:1;transform:translateY(0)}\n.d1{transition-delay:.1s}\n.d2{transition-delay:.2s}\n.d3{transition-delay:.3s}\n.d4{transition-delay:.4s}\n\n/* ── Responsive ── */\n@media(max-width:960px){\n  .hero-grid{grid-template-columns:1fr;gap:3rem}\n  .hero-visual{order:-1}\n  .hero-card{max-width:380px;margin:0 auto}\n  .pain-grid{grid-template-columns:1fr;gap:2.5rem}\n  .imagine-grid{grid-template-columns:1fr;gap:2rem}\n  .assistant-grid{grid-template-columns:1fr;gap:2.5rem}\n  .assistant-visual{order:1;margin:0 auto}\n  .assistant-content{order:2;text-align:center}\n  .assistant-content .example-q{text-align:center}\n  .how-grid{grid-template-columns:1fr;max-width:380px}\n  .benefits-grid{grid-template-columns:1fr;max-width:420px;margin-left:auto;margin-right:auto}\n  .compare-grid{grid-template-columns:1fr;max-width:460px}\n  .pricing-grid{grid-template-columns:1fr;max-width:380px}\n  .footer-inner{grid-template-columns:1fr 1fr;gap:2rem}\n  .footer-brand{grid-column:1/-1}\n}\n@media(max-width:640px){\n  .nav-links{display:none}\n  .mob-toggle{display:block}\n  .hero{padding:6rem 0 2rem}\n  .hero h1{font-size:1.8rem}\n  .hero h1 br{display:block}\n  .hero-card{max-width:100%}\n  .pain-q{font-size:.85rem}\n  .testimonial-stats{flex-direction:column;gap:1.2rem}\n  .testimonial-text{font-size:1.05rem}\n  .pricing-card{padding:1.5rem}\n  .pricing-grid{gap:1rem}\n  .footer-inner{grid-template-columns:1fr}\n  .footer-bottom{flex-direction:column;gap:.4rem;text-align:center}\n}"}</style>
    <a href="https://wa.me/528342177709?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Veliora" target="_blank" className="wfab" aria-label="WhatsApp" style={{"position":"fixed","bottom":"1.5rem","right":"1.5rem","zIndex":50,"width":"48px","height":"48px","borderRadius":"50%","background":"linear-gradient(135deg,#25d366,#128c7e)","display":"flex","alignItems":"center","justifyContent":"center","color":"#fff","boxShadow":"0 6px 20px rgba(37,211,102,.2)","textDecoration":"none"}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </a>
    
      {/* Download PWA Modal */}
      <div id="downloadModalOverlay" onClick={closeDownloadModal} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
        <div id="downloadModal" onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 scale-95 transition-transform duration-300">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Instalar Veliora</h3>
            <p id="downloadModalHint" className="text-sm text-gray-500 mb-6">Accede rápido desde tu pantalla de inicio</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <svg className="w-6 h-6 text-amber-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <p className="text-xs font-semibold text-gray-700">Sin conexión</p>
                <p className="text-[10px] text-gray-400">Funciona offline</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <svg className="w-6 h-6 text-amber-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-xs font-semibold text-gray-700">Rápido</p>
                <p className="text-[10px] text-gray-400">Abrir al instante</p>
              </div>
            </div>
            <button id="downloadModalBtn" onClick={installPWAFromModal} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-[0.98]">
              Instalar ahora
            </button>
            <button id="downloadModalClose" onClick={(e) => { e.preventDefault(); closeDownloadModal(); }} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors w-full text-center">
              Ahora no
            </button>
          </div>
        </div>
      </div>

</>
  );}