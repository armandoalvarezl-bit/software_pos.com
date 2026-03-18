<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lanzamiento | FarmaPOS Cloud</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<style>
:root{--bg:#0b1220;--bg2:#13213a;--bg3:#1e3a6d;--panel:rgba(255,255,255,.08);--line:rgba(255,255,255,.14);--text:#f8fafc;--muted:#dbe4f0;--brand:#f97316;--brand2:#eab308;--ink:#0f172a;--shadow:0 32px 80px rgba(2,6,23,.33);--shadow-soft:0 18px 42px rgba(2,6,23,.18)}
*{font-family:"Poppins",sans-serif}html{scroll-behavior:smooth}body{min-height:100vh;color:var(--text);background:radial-gradient(860px 520px at 0% 0%,rgba(249,115,22,.24),transparent 56%),radial-gradient(720px 420px at 100% 8%,rgba(234,179,8,.18),transparent 54%),linear-gradient(180deg,var(--bg3),var(--bg2) 42%,var(--bg) 100%);overflow-x:hidden}a{text-decoration:none;color:inherit}.bg-stage{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}.blob,.ring,.grid-fade,.line-glow{position:absolute}.blob{border-radius:50%;filter:blur(10px);opacity:.5}.blob.one{width:360px;height:360px;background:radial-gradient(circle,rgba(249,115,22,.42),transparent 68%);top:70px;left:-90px}.blob.two{width:460px;height:460px;background:radial-gradient(circle,rgba(239,68,68,.20),transparent 70%);right:-110px;top:220px}.ring{width:360px;height:360px;border-radius:50%;border:1px solid rgba(255,255,255,.08);right:7%;top:110px;box-shadow:0 0 0 32px rgba(255,255,255,.02),0 0 0 64px rgba(255,255,255,.015)}.grid-fade{width:560px;height:560px;left:0;bottom:40px;background:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:22px 22px;mask-image:radial-gradient(circle,rgba(0,0,0,1) 34%,transparent 72%);opacity:.16}.line-glow{left:0;right:0;top:520px;height:1px;background:linear-gradient(90deg,transparent,rgba(234,179,8,.38),transparent)}.site-wrap{position:relative;z-index:1}.topbar{padding:22px 0}.brand-shell{display:flex;align-items:center;gap:12px}.brand-shell img{width:54px;height:54px;object-fit:contain;padding:6px;border-radius:16px;background:rgba(255,255,255,.10);border:1px solid var(--line)}.brand-shell .small-note{font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;color:#f59e0b}.nav-pill{display:flex;flex-wrap:wrap;gap:10px;justify-content:end}.nav-pill a{padding:10px 15px;border-radius:999px;color:#f8fafc;font-size:.92rem;transition:.2s ease}.nav-pill a:hover{background:rgba(255,255,255,.08)}.hero{padding:34px 0 18px}.eyebrow{display:inline-flex;align-items:center;gap:10px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid var(--line);font-size:.76rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}.eyebrow i{color:#f59e0b}.hero h1{margin-top:18px;font-size:clamp(3rem,6vw,5.4rem);line-height:.92;letter-spacing:-.06em;max-width:9.2ch}.hero h1 span{color:#f59e0b}.hero .lead{margin-top:18px;max-width:650px;color:#dbeafe;font-size:1.02rem;line-height:1.9}.hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.btn-brand{background:linear-gradient(135deg,var(--brand),var(--brand2));border:none;color:#fff;padding:14px 20px;border-radius:16px;font-weight:700;box-shadow:0 16px 36px rgba(249,115,22,.28)}.btn-glass{padding:14px 20px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.06);color:#ecfeff;font-weight:700}.hero-checks{display:grid;gap:12px;margin-top:28px}.hero-checks .item{display:flex;gap:12px;align-items:flex-start;color:#dbeafe;line-height:1.7}.hero-checks i{color:#f59e0b;margin-top:3px}.hero-microstats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}.microstat{padding:16px 14px;border-radius:20px;background:rgba(255,255,255,.07);border:1px solid var(--line)}.microstat strong{display:block;font-size:1.1rem;letter-spacing:-.03em}.microstat span{display:block;margin-top:4px;color:#cbd5e1;font-size:.82rem;line-height:1.5}.float-panel{position:relative;padding:24px;border-radius:32px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.08));border:1px solid rgba(255,255,255,.14);box-shadow:var(--shadow);overflow:hidden}.mini-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(249,115,22,.18);font-size:.8rem}.pricing-core{margin-top:18px;padding:22px;border-radius:26px;background:linear-gradient(180deg,#fff7ed,#fffbeb);color:var(--ink);box-shadow:var(--shadow-soft)}.pricing-core .kicker{font-size:.78rem;color:#64748b;letter-spacing:.12em;text-transform:uppercase;font-weight:700}.pricing-core .amount{font-size:2.2rem;font-weight:800;letter-spacing:-.06em;margin-top:6px}.pricing-core .amount span{font-size:1rem;color:#64748b;font-weight:600}.pricing-core p{margin-top:10px;color:#334155;line-height:1.8}.mini-rows{display:grid;gap:10px;margin-top:18px}.mini-rows .row-item{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(15,23,42,.04);font-size:.9rem}.mini-rows .row-item strong{color:#9a3412}.side-note{margin-top:16px;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#dbeafe;line-height:1.7;font-size:.9rem}.trust-strip{padding:10px 0 28px}.trust-card{padding:18px 20px;border-radius:24px;background:rgba(255,255,255,.06);border:1px solid var(--line)}.trust-card .label{font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;color:#f59e0b;font-weight:700}.trust-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:14px}.trust-item{padding:16px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}.trust-item strong{display:block;font-size:1.1rem}.trust-item span{display:block;color:#cbd5e1;font-size:.82rem;margin-top:4px;line-height:1.5}.section-block{padding:34px 0}.section-head{margin-bottom:22px}.section-head .pre{display:inline-block;font-size:.8rem;color:#f59e0b;letter-spacing:.14em;text-transform:uppercase;font-weight:700;margin-bottom:8px}.section-head h2{font-size:clamp(1.85rem,2.2vw,2.7rem);letter-spacing:-.05em}.section-head p{margin-top:10px;max-width:720px;color:var(--muted);line-height:1.9}.feature-card,.plan-card,.req-card,.cta-card,.compare-card,.faq-card{height:100%;padding:24px;border-radius:28px;background:var(--panel);border:1px solid var(--line);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}.icon-chip{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:rgba(255,255,255,.14);color:#f59e0b;font-size:1.15rem;margin-bottom:16px}.feature-card h3,.plan-card h3,.req-card h3,.faq-card h3{font-size:1.06rem;margin-bottom:8px}.feature-card p,.plan-card p,.req-card p,.req-card li,.plan-card li,.faq-card p{color:#dbeafe;line-height:1.8;font-size:.92rem}.plan-card ul,.req-card ul{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:8px}.plan-card li,.req-card li{position:relative;padding-left:18px}.plan-card li:before,.req-card li:before{content:"";position:absolute;left:0;top:11px;width:8px;height:8px;border-radius:50%;background:#eab308}.plan-card.featured{background:linear-gradient(180deg,rgba(249,115,22,.18),rgba(255,255,255,.08));border-color:rgba(234,179,8,.32)}.plan-price{font-size:2rem;font-weight:800;letter-spacing:-.05em;margin:10px 0 2px}.plan-price span{font-size:.9rem;color:#cbd5e1;font-weight:600}.plan-badge{display:inline-block;padding:7px 10px;border-radius:999px;background:rgba(249,115,22,.16);border:1px solid rgba(234,179,8,.28);font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fde68a}.req-card{background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.07))}.compare-card{padding:0;overflow:hidden}.compare-head{padding:22px 22px 8px}.compare-table{width:100%;border-collapse:collapse}.compare-table th,.compare-table td{padding:16px 18px;border-top:1px solid rgba(255,255,255,.08);font-size:.9rem}.compare-table th{color:#f59e0b;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase}.compare-table td{color:#f8fafc}.compare-table tr:nth-child(even) td{background:rgba(255,255,255,.03)}.compare-table td.center{text-align:center;font-weight:700}.cta-card{padding:30px;background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.08));box-shadow:var(--shadow)}.cta-card h2{font-size:clamp(2rem,3vw,2.9rem);letter-spacing:-.05em}.cta-card p{margin-top:12px;color:#dbeafe;line-height:1.9;font-size:.98rem}.cta-list{display:grid;gap:10px;margin-top:18px}.cta-list .item{display:flex;gap:10px;align-items:flex-start;color:#ecfeff}.cta-list i{color:#f59e0b;margin-top:3px}.faq-card{background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.06))}.faq-card p{margin-bottom:0}.footer-note{padding:28px 0 38px;text-align:center;color:#94a3b8;font-size:.82rem}@media (max-width:991.98px){.hero h1{max-width:100%}.nav-pill{justify-content:start;margin-top:12px}.topbar .col-lg-6:last-child{display:none}.hero-microstats,.trust-grid{grid-template-columns:repeat(2,1fr)}}@media (max-width:575.98px){.hero-microstats,.trust-grid{grid-template-columns:1fr}.compare-table th,.compare-table td{padding:12px 10px;font-size:.82rem}}
</style>
</head>
<body>
<div class="bg-stage"><div class="blob one"></div><div class="blob two"></div><div class="ring"></div><div class="grid-fade"></div><div class="line-glow"></div></div>
<div class="site-wrap">
<div class="container py-1">
  <div class="row align-items-center topbar">
    <div class="col-lg-6">
      <a class="brand-shell" href="#inicio">
        <img src="image/Logo.png" alt="FarmaPOS">
        <div>
          <div class="fw-bold fs-5">FarmaPOS Cloud</div>
          <div class="small-note">Presentacion comercial</div>
        </div>
      </a>
    </div>
    <div class="col-lg-6">
      <nav class="nav-pill">
        <a href="#beneficios">Beneficios</a>
        <a href="#precios">Cotizacion</a>
        <a href="#requisitos">Requisitos</a>
        <a href="#faq">FAQ</a>
        <a href="#contacto">Contacto</a>
      </nav>
    </div>
  </div>

  <section class="hero" id="inicio">
    <div class="row align-items-center g-4 g-lg-5">
      <div class="col-lg-7">
        <div class="eyebrow"><i class="bi bi-stars"></i> Presentacion comercial</div>
        <h1>FarmaPOS Cloud <span>plataforma de gestion farmaceutica en la nube.</span></h1>
        <p class="lead">FarmaPOS Cloud es una solucion disenada para optimizar la gestion operativa de farmacias mediante una plataforma centralizada, accesible y adaptable a diferentes entornos de trabajo.</p>
        <p class="lead">Esta pagina presenta una vision general de la propuesta comercial, enfocada en facilitar la comprension del servicio, sus beneficios y su estructura operativa.</p>
        <div class="hero-actions">
          <a class="btn btn-brand" href="#precios"><i class="bi bi-file-earmark-text"></i> Ver estructura</a>
          <a class="btn btn-glass" href="#contacto"><i class="bi bi-chat-dots"></i> Contacto comercial</a>
        </div>
        <div class="hero-checks">
          <div class="item"><i class="bi bi-check2-circle"></i><span>Informacion clara y sin promesas no confirmadas.</span></div>
          <div class="item"><i class="bi bi-check2-circle"></i><span>Condiciones sujetas a validacion tecnica y operativa.</span></div>
          <div class="item"><i class="bi bi-check2-circle"></i><span>Estructura preparada para cotizacion personalizada.</span></div>
        </div>
        <div class="hero-microstats">
          <div class="microstat"><strong>Cotizacion</strong><span>Definida segun necesidades reales del negocio.</span></div>
          <div class="microstat"><strong>Validacion</strong><span>Tecnica y operativa antes de implementacion.</span></div>
          <div class="microstat"><strong>Presentacion</strong><span>Orientada a toma de decisiones comerciales.</span></div>
        </div>
      </div>
      <div class="col-lg-5">
        <aside class="float-panel" id="precios">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div class="text-uppercase fw-bold" style="font-size:.78rem;letter-spacing:.14em;color:#f59e0b">Importante</div>
              <h2 class="h3 mt-2 mb-0">Condiciones sujetas a validacion</h2>
            </div>
            <div class="mini-badge"><i class="bi bi-info-circle-fill"></i> Cotizacion formal</div>
          </div>
          <div class="pricing-core">
            <div class="kicker">Cotizacion</div>
            <div class="amount">$89.900 <span>/ mes</span></div>
            <p>El valor mensual de referencia es de $89.900. El valor final puede variar segun numero de usuarios, cantidad de sedes, nivel de implementacion requerido, necesidades operativas especificas y alcance del soporte.</p>
            <div class="mini-rows">
              <div class="row-item"><span>Implementacion</span><strong>Segun operacion</strong></div>
              <div class="row-item"><span>Valor mensual</span><strong>$89.900</strong></div>
              <div class="row-item"><span>Soporte</span><strong>Segun acuerdo</strong></div>
            </div>
          </div>
          <div class="side-note">Los valores, condiciones y alcance del servicio estan sujetos a validacion previa y deben confirmarse mediante una cotizacion formal basada en las necesidades reales del negocio.</div>
        </aside>
      </div>
    </div>
  </section>

  <section class="trust-strip">
    <div class="trust-card">
      <div class="label">Estructura del servicio</div>
      <div class="trust-grid">
        <div class="trust-item"><strong>Implementacion</strong><span>Configuracion segun operacion, parametrizacion inicial y validacion previa.</span></div>
        <div class="trust-item"><strong>Licenciamiento</strong><span>Definido segun modelo comercial acordado y propuesta formal.</span></div>
        <div class="trust-item"><strong>Soporte</strong><span>Nivel de soporte definido por acuerdo comercial.</span></div>
        <div class="trust-item"><strong>Presentacion</strong><span>Vision general del servicio, sus beneficios y estructura operativa.</span></div>
      </div>
    </div>
  </section>
  <section class="section-block" id="beneficios">
    <div class="section-head text-center text-lg-start">
      <div class="pre">Enfoque comercial</div>
      <h2>Presentacion profesional orientada a toma de decisiones</h2>
      <p>Esta propuesta esta construida bajo un enfoque transparente y verificable.</p>
    </div>
    <div class="row g-4">
      <div class="col-md-6 col-xl-3"><article class="feature-card"><div class="icon-chip"><i class="bi bi-shield-check"></i></div><h3>Enfoque responsable</h3><p>El contenido evita promesas no verificadas y presenta la informacion de forma clara y profesional.</p></article></div>
      <div class="col-md-6 col-xl-3"><article class="feature-card"><div class="icon-chip"><i class="bi bi-palette2"></i></div><h3>Imagen comercial solida</h3><p>Diseno moderno orientado a generar confianza y mejorar la percepcion del servicio.</p></article></div>
      <div class="col-md-6 col-xl-3"><article class="feature-card"><div class="icon-chip"><i class="bi bi-diagram-3"></i></div><h3>Mejor organizacion</h3><p>Estructura clara que facilita la comprension de condiciones, requisitos y alcance del servicio.</p></article></div>
      <div class="col-md-6 col-xl-3"><article class="feature-card"><div class="icon-chip"><i class="bi bi-phone"></i></div><h3>Adaptabilidad</h3><p>Compatible con escritorio, tablet y movil.</p></article></div>
    </div>
  </section>

  <section class="section-block">
    <div class="section-head text-center text-lg-start">
      <div class="pre">Esquema comercial de referencia</div>
      <h2>Categorias de referencia para cotizacion</h2>
      <p>Los siguientes niveles son categorias de referencia y no representan precios finales.</p>
    </div>
    <div class="row g-4">
      <div class="col-lg-4"><article class="plan-card"><span class="plan-badge">Referencia</span><div class="icon-chip mt-3"><i class="bi bi-rocket-takeoff"></i></div><h3>Referencia Base</h3><p>Para configuraciones iniciales.</p><div class="plan-price">$89.900 <span>/ mes</span></div><ul><li>Alcance por definir</li><li>Implementacion segun proyecto</li><li>Condiciones segun validacion</li></ul></article></div>
      <div class="col-lg-4"><article class="plan-card featured"><span class="plan-badge">Referencia</span><div class="icon-chip mt-3"><i class="bi bi-people"></i></div><h3>Referencia Multiusuario</h3><p>Para operaciones con mayor volumen.</p><div class="plan-price">Cotizacion <span>segun alcance</span></div><ul><li>Usuarios y sedes a validar</li><li>Soporte segun acuerdo</li><li>Implementacion segun proyecto</li></ul></article></div>
      <div class="col-lg-4"><article class="plan-card"><span class="plan-badge">Referencia</span><div class="icon-chip mt-3"><i class="bi bi-buildings"></i></div><h3>Referencia Personalizada</h3><p>Para necesidades especificas o multiples sedes.</p><div class="plan-price">Cotizacion <span>personalizada</span></div><ul><li>Alcance definido en propuesta formal</li><li>Condiciones segun validacion</li><li>Implementacion segun proyecto</li></ul></article></div>
    </div>
  </section>

  <section class="section-block">
    <div class="compare-card">
      <div class="compare-head">
        <div class="section-head mb-0 text-center text-lg-start">
          <div>
            <div class="pre">Comparativa comercial</div>
            <h2 class="mb-0">Comparativa comercial de referencia</h2>
          </div>
        </div>
      </div>
      <div class="table-responsive">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Aspecto</th>
              <th class="text-center">Base</th>
              <th class="text-center">Multiusuario</th>
              <th class="text-center">Personalizado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Licenciamiento</td>
              <td class="center">Segun cotizacion</td>
              <td class="center">Segun cotizacion</td>
              <td class="center">Segun cotizacion</td>
            </tr>
            <tr>
              <td>Usuarios/Sedes</td>
              <td class="center">A validar</td>
              <td class="center">A validar</td>
              <td class="center">A validar</td>
            </tr>
            <tr>
              <td>Soporte</td>
              <td class="center">Segun acuerdo</td>
              <td class="center">Segun acuerdo</td>
              <td class="center">Segun acuerdo</td>
            </tr>
            <tr>
              <td>Implementacion</td>
              <td class="center">Segun proyecto</td>
              <td class="center">Segun proyecto</td>
              <td class="center">Segun proyecto</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="section-block" id="requisitos">
    <div class="section-head text-center text-lg-start">
      <div class="pre">Requisitos</div>
      <h2>Requisitos referenciales</h2>
      <p>Los requisitos tecnicos y operativos deben validarse antes de la puesta en marcha definitiva.</p>
    </div>
    <div class="row g-4">
      <div class="col-lg-6"><article class="req-card"><div class="icon-chip"><i class="bi bi-pc-display"></i></div><h3>Tecnicos</h3><ul><li>Equipo de escritorio o portatil</li><li>Navegador actualizado</li><li>Conexion a internet</li><li>Perifericos segun operacion</li></ul></article></div>
      <div class="col-lg-6"><article class="req-card"><div class="icon-chip"><i class="bi bi-briefcase"></i></div><h3>Operativos</h3><ul><li>Informacion inicial del negocio</li><li>Datos administrativos y comerciales</li><li>Responsable del proyecto</li><li>Disponibilidad para validacion</li></ul></article></div>
    </div>
  </section>

  <section class="section-block" id="faq">
    <div class="section-head text-center text-lg-start">
      <div class="pre">FAQ</div>
      <h2>Preguntas frecuentes</h2>
      <p>Las respuestas siguientes aclaran el enfoque comercial y las condiciones de validacion de la propuesta.</p>
    </div>
    <div class="row g-4">
      <div class="col-lg-6"><article class="faq-card"><h3>El precio ya esta definido?</h3><p>La pagina muestra un valor mensual de referencia de $89.900. Las condiciones finales deben confirmarse mediante cotizacion formal segun el alcance del servicio.</p></article></div>
      <div class="col-lg-6"><article class="faq-card"><h3>Los requisitos son definitivos?</h3><p>No necesariamente. Se confirman en la validacion previa.</p></article></div>
      <div class="col-lg-6"><article class="faq-card"><h3>Los planes son finales?</h3><p>No. Son referencias comerciales, no propuestas cerradas.</p></article></div>
      <div class="col-lg-6"><article class="faq-card"><h3>Que falta para publicacion final?</h3><p>Definir precios reales, confirmar condiciones, incluir contactos oficiales y validar alcance del servicio.</p></article></div>
    </div>
  </section>

  <section class="section-block" id="contacto">
    <article class="cta-card text-center text-lg-start">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <h2>FarmaPOS Cloud presenta una propuesta estructurada, clara y adaptable.</h2>
          <p>Esta landing esta disenada como una base comercial solida, lista para ser completada con informacion validada y utilizada en entornos reales de negocio.</p>
          <div class="cta-list">
            <div class="item"><i class="bi bi-check2-circle"></i><span>Solicitud de propuesta comercial.</span></div>
            <div class="item"><i class="bi bi-check2-circle"></i><span>312 794 7484.</span></div>
            <div class="item"><i class="bi bi-check2-circle"></i><span>Canales de contacto del negocio.</span></div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="d-grid gap-3">
            <a class="btn btn-brand" href="mailto:farmapos_sft@gmail.com"><i class="bi bi-envelope-fill"></i> farmapos_sft@gmail.com</a>
            <a class="btn btn-glass" href="tel:+573127947484"><i class="bi bi-telephone-fill"></i> 312 794 7484</a>
          </div>
        </div>
      </div>
    </article>
  </section>

  <div class="footer-note">&copy; 2026 FarmaPOS Cloud. Landing comercial de lanzamiento.</div>
</div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>




