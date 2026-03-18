const fs = require('fs');
const path = 'c:/POS/pos.html';
let s = fs.readFileSync(path, 'utf8');

const css = `
/* Reference-inspired POS layout */
.layout{padding-left:0}
.sidebar{transform:translateX(-110%);transition:transform .2s ease}
.layout.sidebar-open .sidebar{transform:translateX(0)}
.main{padding:18px}
.topbar{background:rgba(255,255,255,.94);border-radius:18px;box-shadow:0 16px 38px rgba(2,44,34,.10);display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}
.topbar>div:last-child{display:flex;align-items:center;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.menu-toggle{display:inline-flex;align-items:center;justify-content:center}
.pos-shell{display:grid;grid-template-columns:minmax(0,1.08fr) 470px;gap:14px;align-items:start}
.catalog-shell,.checkout-card{background:#fff;border:1px solid #d9ece7;border-radius:22px;box-shadow:0 16px 38px rgba(2,44,34,.08)}
.catalog-shell{overflow:hidden}
.catalog-strip{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:linear-gradient(180deg,#fcfefe 0%,#f4fbfa 100%);border-bottom:1px solid #e2efec}
.catalog-brand{display:flex;align-items:center;gap:14px}.catalog-home{width:42px;height:42px;border-radius:14px;border:1px solid #d7ebe6;display:grid;place-items:center;font-size:1.2rem;color:#0b7d72;background:#fff}.catalog-title{font-size:1.5rem;font-weight:700;color:#0b7d72}.catalog-note{font-size:.84rem;color:#688487}.send-pill{min-width:220px;padding:12px 20px;border-radius:18px;background:#fff;border:1px solid #dcebea;box-shadow:0 12px 30px rgba(11,84,78,.12);display:flex;align-items:center;justify-content:center;gap:10px;font-size:1.15rem;font-weight:700;color:#695d52}.mini-status{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.status-chip{padding:7px 10px;border-radius:999px;background:#fff;border:1px solid #d6e8e4;color:#0d7b70;font-size:.8rem;font-weight:600}.status-chip.alert{color:#b54436}
.catalog-tabs{display:flex;align-items:center;gap:8px;padding:10px 18px;background:#1aa191;overflow:auto}.catalog-tab{border:none;background:#fff;color:#0d7b70;padding:8px 14px;border-radius:10px;font-weight:700;cursor:pointer;white-space:nowrap}.catalog-tab.secondary{background:rgba(255,255,255,.15);color:#fff}.catalog-tab.active{background:#fff;color:#0d7b70}
.catalog-main{display:grid;grid-template-columns:minmax(0,1fr) 1.05fr;min-height:720px}.catalog-left{border-right:1px solid #e6f1ee}.catalog-search{padding:12px 14px 8px;border-bottom:1px solid #edf4f3;display:grid;gap:10px}.catalog-search-row{display:grid;grid-template-columns:minmax(0,1fr) 44px 44px;gap:8px;align-items:center}.catalog-tools{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,340px);gap:12px;align-items:center}.responsable{display:flex;align-items:center;gap:8px;color:#0d7b70;font-size:.9rem;font-weight:600}.barcode-box{display:grid;grid-template-columns:30px minmax(0,1fr) auto auto;gap:8px;align-items:center}.barcode-tag{color:#1aa191;font-size:1.5rem;line-height:1}.inline-icon-btn,.round-icon-btn{border:none;cursor:pointer;display:grid;place-items:center;background:#1aa191;color:#fff}.inline-icon-btn{width:44px;height:44px;border-radius:12px}.round-icon-btn{width:36px;height:36px;border-radius:999px;font-size:1rem}.round-icon-btn.alt{background:#eff8f6;color:#0d7b70;border:1px solid #d5e7e3}
.product-grid{padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px;max-height:calc(100vh - 270px);overflow:auto}.product-card{border:1px solid #d4e5e1;border-radius:14px;background:#fff;padding:10px 10px 12px;min-height:210px;display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:transform .14s ease, box-shadow .14s ease}.product-card:hover{transform:translateY(-2px);box-shadow:0 12px 24px rgba(11,84,78,.12)}.product-topline{display:flex;align-items:center;justify-content:space-between;font-size:.78rem;color:#4f8f8b}.product-star{color:#e04c3a}.product-media{height:78px;border-radius:12px;background:linear-gradient(180deg,#f9fcfc 0%,#eff7f5 100%);display:grid;place-items:center;overflow:hidden}.product-media img{width:100%;height:100%;object-fit:cover}.product-media i{font-size:2rem;color:#8eb2ae}.product-name{font-size:.85rem;font-weight:700;color:#102b2d;line-height:1.25;min-height:38px;text-align:center}.product-stock{align-self:center;padding:4px 14px;border-radius:999px;background:#1aa191;color:#fff;font-size:.82rem;font-weight:700;min-width:88px;text-align:center}.product-stock.low{background:#f04f3e}.product-price{text-align:center;font-size:.98rem;font-weight:700;color:#0d7b70}.product-code{text-align:center;font-size:.74rem;color:#688487}.product-empty{grid-column:1/-1;padding:38px 18px;border:1px dashed #c9dcda;border-radius:18px;text-align:center;color:#688487;background:#fbfefe}
.checkout-shell{display:grid;gap:12px}.checkout-card{padding:14px}.checkout-top{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:8px;margin-bottom:10px}.checkout-customer{display:grid;grid-template-columns:44px minmax(0,1fr);gap:8px;margin-bottom:10px}.checkout-ident{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr);gap:10px;margin-bottom:12px}.totals-board{padding:14px 10px 10px;min-height:132px}.totals-line{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:end;margin-bottom:6px}.totals-line span:first-child{font-weight:700;color:#3a575c}.totals-line span:last-child{border-bottom:1px dotted #65777b;min-height:24px;display:flex;justify-content:flex-end;align-items:flex-end;font-weight:700}.totals-line.grand span:last-child{font-size:1.25rem;color:#0d7b70}.mini-stepper{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin:8px 0 12px}.mini-stepper button{width:30px;height:30px;border-radius:999px;border:1px solid #cfe3df;background:#fff;color:#1aa191;cursor:pointer;font-size:1.2rem;line-height:1}.tax-note{text-align:right;color:#0d7b70;font-size:.84rem;margin-bottom:12px}.checkout-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.ghost-bar{border:none;border-radius:10px;padding:12px 14px;background:#d5d6d8;color:#212529;font-size:.95rem}.checkout-primary{border:none;border-radius:10px;background:#1aa191;color:#fff;font-weight:700;font-size:1rem}.obs-box textarea{width:100%;min-height:64px;resize:vertical;border:2px solid #1aa191;border-radius:30px;padding:14px 18px;font:inherit}.cart-caption{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.cart-meta{font-size:.84rem;color:#688487}.cart-table-wrap{max-height:360px;overflow:auto;border:1px solid #edf4f3;border-radius:14px}.summary-tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.summary-tile{border:1px solid #d7e7e4;border-radius:16px;padding:12px;background:#f8fbfb}.summary-tile .label{font-size:.8rem;color:#688487;margin-bottom:4px}.summary-tile .value{font-size:1rem;font-weight:700;color:#163336}.utility-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.95fr);gap:12px;margin-top:12px}
@media(max-width:1280px){.pos-shell{grid-template-columns:1fr}.catalog-main{grid-template-columns:1fr}.catalog-left{border-right:none;border-bottom:1px solid #e6f1ee}.product-grid{max-height:none}}
@media(max-width:980px){.catalog-strip,.topbar,.catalog-tools,.utility-grid,.checkout-ident,.checkout-actions,.summary-tiles{grid-template-columns:1fr}.catalog-strip,.topbar{display:grid}.send-pill,.mini-status{justify-content:flex-start}}
@media(max-width:860px){.main{padding:12px}.catalog-search-row{grid-template-columns:minmax(0,1fr) 44px 44px}.barcode-box{grid-template-columns:30px minmax(0,1fr)}.checkout-top,.checkout-customer{grid-template-columns:minmax(0,1fr)}.product-grid{grid-template-columns:repeat(auto-fill,minmax(144px,1fr));padding:10px}.totals-line{grid-template-columns:96px 1fr}}
`;

s = s.replace('</style>', css + '\n</style>');

const oldSections = /<section class="grid">[\s\S]*?<section class="grid2">[\s\S]*?<\/section>/;
const newSections = `<section class="pos-shell no-print">
      <section class="catalog-shell">
        <div class="catalog-strip">
          <div class="catalog-brand">
            <div class="catalog-home"><i class="bi bi-grid-3x3-gap-fill"></i></div>
            <div>
              <div class="catalog-title">DEMO GENERAL</div>
              <div class="catalog-note">Productos actuales con una vista inspirada en la referencia.</div>
            </div>
          </div>
          <div class="send-pill"><i class="bi bi-credit-card-2-front"></i> ENVIAR <span id="headerSendTotal">$0</span></div>
          <div class="mini-status">
            <span class="status-chip alert">Aviso: entorno demo</span>
            <span class="status-chip">Online</span>
            <span class="status-chip"><i class="bi bi-youtube"></i></span>
            <span class="status-chip"><i class="bi bi-gear-fill"></i></span>
          </div>
        </div>
        <div class="catalog-tabs" id="categoryTabs"></div>
        <div class="catalog-main">
          <div class="catalog-left">
            <div class="catalog-search">
              <div class="catalog-search-row">
                <div class="search-box">
                  <input class="input" id="producto" placeholder="Buscar productos (F2)">
                  <div id="suggestions" class="suggestions"></div>
                </div>
                <button class="inline-icon-btn" type="button" onclick="limpiarVenta()" title="Limpiar venta"><i class="bi bi-trash3-fill"></i></button>
                <button class="inline-icon-btn" type="button" onclick="hideSuggestions()" title="Ocultar sugerencias"><i class="bi bi-funnel-fill"></i></button>
              </div>
              <div class="catalog-tools">
                <div class="responsable"><i class="bi bi-person-fill-check"></i> Seleccionar responsable</div>
                <div class="barcode-box">
                  <span class="barcode-tag"><i class="bi bi-upc-scan"></i></span>
                  <input class="input" id="barcode" placeholder="CODIGO (F4)">
                  <button class="round-icon-btn" type="button" onclick="agregarPorCodigo()" title="Agregar por codigo"><i class="bi bi-plus-lg"></i></button>
                  <button class="round-icon-btn alt" type="button" onclick="openScanModal()" title="Escanear con camara"><i class="bi bi-camera-fill"></i></button>
                </div>
              </div>
            </div>
            <div class="product-grid" id="productGrid"></div>
          </div>
          <div class="checkout-shell">
            <div class="checkout-card">
              <div class="checkout-top">
                <select id="metodo" class="input"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select>
                <button class="round-icon-btn alt" type="button"><i class="bi bi-currency-dollar"></i></button>
              </div>
              <div class="checkout-customer">
                <button class="inline-icon-btn" type="button"><i class="bi bi-person-plus-fill"></i></button>
                <input id="cliente" class="input" value="MOSTRADOR" placeholder="Cliente / cuenta de cobro">
              </div>
              <div class="checkout-ident">
                <select class="input"><option>Cedula de ciudadania</option><option>NIT</option><option>Pasaporte</option></select>
                <input class="input" placeholder="Buscar por N° cedula o Nit">
              </div>
              <div class="totals-board">
                <div class="totals-line"><span>Total Bruto:</span><span id="subtotal">$0</span></div>
                <div class="totals-line"><span>Descuento:</span><span id="discountValue">$0</span></div>
                <div class="totals-line"><span>Subtotal:</span><span id="subtotalCopy">$0</span></div>
                <div class="totals-line grand"><span>Total:</span><span id="total">$0</span></div>
              </div>
              <div class="mini-stepper">
                <button type="button" onclick="document.getElementById('cantidad').stepDown();">-</button>
                <button type="button" onclick="document.getElementById('cantidad').stepUp();">+</button>
              </div>
              <div class="tax-note">IVA estimado <span id="impuesto">$0</span></div>
              <div class="checkout-actions">
                <button class="ghost-bar" type="button" id="removeListBtn" onclick="limpiarVenta()"><i class="bi bi-x-circle-fill"></i> Remover lista</button>
                <button class="checkout-primary" type="button" onclick="cobrarVenta()"><i class="bi bi-send-fill"></i> Facturar (F9)</button>
              </div>
              <div class="obs-box">
                <div class="subtitle" style="margin-bottom:8px">Observaciones del documento</div>
                <textarea placeholder="Notas para la venta"></textarea>
              </div>
              <div class="msg" id="saleMsg"></div>
              <div class="msg" id="ticketMeta"></div>
            </div>
            <div class="checkout-card">
              <div class="cart-caption">
                <div class="h" style="margin:0">Detalle de venta</div>
                <div class="cart-meta"><span id="totalItems">0</span> items</div>
              </div>
              <div class="cart-table-wrap">
                <table class="table">
                  <thead><tr><th>Producto</th><th class="right">Cant</th><th class="right">Vlr Unit</th><th class="right">Subt</th><th></th></tr></thead>
                  <tbody id="cartRows"></tbody>
                </table>
              </div>
              <div class="summary-tiles">
                <div class="summary-tile"><div class="label">Pago recibido</div><input id="pago" class="input" type="number" min="0" step="0.01" value="0" oninput="renderTotals()"></div>
                <div class="summary-tile"><div class="label">Cambio</div><div class="value" id="changeView">$0</div></div>
                <div class="summary-tile"><div class="label">Estado</div><div class="value" id="payStatus">-</div></div>
              </div>
              <div class="row" style="margin-top:12px">
                <div><label class="subtitle" for="cantidad">Cantidad</label><input class="input" id="cantidad" type="number" min="1" value="1"></div>
                <div><label class="subtitle" for="valor">Valor unitario</label><input class="input" id="valor" type="number" min="0" step="0.01" value="0"></div>
              </div>
              <div class="row" style="margin-top:10px"><button class="btn" type="button" onclick="agregarItem()">Agregar manual</button><button class="btn alt" type="button" onclick="printFacturaPOS()">Tirilla POS</button></div>
              <div class="row" style="margin-top:10px"><button class="btn alt" type="button" onclick="printFactura()">Generar PDF</button><button class="btn alt" type="button" onclick="openScanModal()">Escanear con camara</button></div>
              <div class="kv" style="margin-top:12px"><label class="k" for="autoPrintEnabled">Impresion automatica</label><span class="v"><input id="autoPrintEnabled" type="checkbox" checked></span></div>
              <div class="kv"><label class="k" for="autoPrintFormat">Formato auto</label><span class="v"><select id="autoPrintFormat" class="input" style="padding:6px 8px;max-width:170px"><option value="pos">Tirilla POS</option><option value="a4">Factura A4</option></select></span></div>
              <div class="msg" id="formMsg"></div>
            </div>
          </div>
        </div>
      </section>
    </section>

    <section class="utility-grid no-print">
      <article class="card">
        <div class="h">Ultimas ventas del dia</div>
        <table class="table"><thead><tr><th>Venta</th><th>Metodo</th><th class="right">Total</th><th class="right">Accion</th></tr></thead><tbody id="closeRows"></tbody></table>
      </article>
      <article class="card">
        <div class="h">Cierre de caja</div>
        <div class="kv"><span class="k">Fecha</span><span class="v" id="ccDate">-</span></div>
        <div class="kv"><span class="k">Tickets</span><span class="v" id="ccTickets">0</span></div>
        <div class="kv"><span class="k">Total ventas</span><span class="v" id="ccTotal">$0</span></div>
        <div class="kv"><span class="k">Efectivo</span><span class="v" id="ccCash">$0</span></div>
        <div class="kv"><span class="k">Tarjeta</span><span class="v" id="ccCard">$0</span></div>
        <div class="kv"><span class="k">Transferencia</span><span class="v" id="ccTransfer">$0</span></div>
        <div class="kv"><span class="k">Efectivo contado</span><span class="v"><input id="ccCountCash" class="input" type="number" min="0" step="0.01" value="0"></span></div>
        <div class="kv"><span class="k">Tarjeta contado</span><span class="v"><input id="ccCountCard" class="input" type="number" min="0" step="0.01" value="0"></span></div>
        <div class="kv"><span class="k">Transfer contado</span><span class="v"><input id="ccCountTransfer" class="input" type="number" min="0" step="0.01" value="0"></span></div>
        <div class="kv"><span class="k">Nota</span><span class="v"><input id="ccNote" class="input" type="text" placeholder="Observacion (opcional)"></span></div>
        <div class="row"><button class="btn alt" onclick="loadCashClose()">Actualizar cierre</button><button class="btn" onclick="registerCashClose()">Registrar cierre</button></div>
        <div class="msg" id="closeMsg"></div>
        <div class="msg" id="ccDiffMsg"></div>
      </article>
    </section>`;

s = s.replace(oldSections, newSections);
s = s.replace('let zxingLib = null;','let zxingLib = null;\nlet selectedCategory = "all";');

const helperBlock = `
function getProductCategory_(p){
  const raw = p && (p.categoria || p.categoria_producto || p.linea || p.grupo || p.tipo || "");
  const cat = String(raw || "").trim();
  return cat || "Otros";
}
function getProductImage_(p){
  const keys = ["imagen","imagen_url","foto","foto_url","image","image_url","url_imagen","url_foto"];
  for(const key of keys){ const val = p && p[key]; if(String(val || "").trim()) return String(val).trim(); }
  return "";
}
function getVisibleCatalog(){
  const term = normalize(document.getElementById("producto")?.value || "");
  return catalog.filter((p) => {
    const sameCategory = selectedCategory === "all" || normalize(getProductCategory_(p)) === selectedCategory;
    if(!sameCategory) return false;
    if(!term) return true;
    return normalize(p.producto).includes(term) || normalize(p.codigo || "").includes(term);
  });
}
function renderCategoryTabs(){
  const box = document.getElementById("categoryTabs");
  if(!box) return;
  const counts = new Map();
  catalog.forEach((p)=>{ const cat = getProductCategory_(p); counts.set(cat, (counts.get(cat) || 0) + 1); });
  const cats = Array.from(counts.keys()).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
  let html = '<button class="catalog-tab ' + (selectedCategory === 'all' ? 'active' : '') + '" type="button" onclick="setCategoryFilter(\\'all\\')">TODOS</button>';
  html += '<button class="catalog-tab secondary" type="button">CATEGORIAS</button>';
  html += cats.map((cat)=>'<button class="catalog-tab ' + (selectedCategory === normalize(cat) ? 'active' : 'secondary') + '" type="button" onclick="setCategoryFilter(\\'' + String(cat).replace(/\\/g,'\\\\').replace(/'/g,'\\\'') + '\\')">' + escapeHtml_(cat.toUpperCase()) + '</button>').join('');
  box.innerHTML = html;
}
function renderProductGrid(){
  const box = document.getElementById("productGrid");
  if(!box) return;
  const list = getVisibleCatalog();
  if(!list.length){ box.innerHTML = '<div class="product-empty">No hay productos para este filtro.</div>'; return; }
  box.innerHTML = list.map((p, idx)=>{
    const stock = Number(p.stock || 0);
    const image = getProductImage_(p);
    return '<article class="product-card" onclick="quickAddProduct(' + idx + ')">' +
      '<div class="product-topline"><span class="product-star"><i class="bi bi-star-fill"></i></span><span>' + escapeHtml_(getProductCategory_(p)) + '</span></div>' +
      '<div class="product-media">' + (image ? '<img src="' + escapeHtml_(image) + '" alt="' + escapeHtml_(p.producto || 'Producto') + '" onerror="this.parentNode.innerHTML=\'&lt;i class=&quot;bi bi-bag-heart&quot;&gt;&lt;/i&gt;\'">' : '<i class="bi bi-bag-heart"></i>') + '</div>' +
      '<div class="product-name">' + escapeHtml_(p.producto || '-') + '</div>' +
      '<div class="product-stock ' + (stock <= 0 ? 'low' : '') + '">' + (stock > 0 ? String(stock) : '0') + '</div>' +
      '<div class="product-price">' + money(p.precio_venta || 0) + '</div>' +
      '<div class="product-code">' + escapeHtml_(p.codigo || 'Sin codigo') + '</div>' +
    '</article>';
  }).join('');
}
function setCategoryFilter(category){ selectedCategory = category === 'all' ? 'all' : normalize(category); renderCategoryTabs(); renderProductGrid(); }
function quickAddProduct(index){ const list = getVisibleCatalog(); const p = list[index]; if(!p) return; selectSuggestion(p); agregarItem(); }
`;
s = s.replace('function money(v){', helperBlock + '\nfunction money(v){');

s = s.replace(/async function loadCatalog\(\)\{[\s\S]*?\n\}/, `async function loadCatalog(){
  const sync = document.getElementById("sync");
  try{
    const empresa = encodeURIComponent(getEmpresa_());
    const res = await fetch(\`${API_URL}?action=pos_catalog&empresa=${empresa}\`, {cache:"no-store"});
    const json = await res.json();
    if(!json || !json.ok || !Array.isArray(json.rows)) throw new Error("catalogo invalido");
    catalog = json.rows;
    filteredCatalog = catalog;
    renderCategoryTabs();
    renderProductGrid();
    sync.textContent = \`Catalogo sincronizado: ${new Date().toLocaleTimeString("es-CO")}\`;
  }catch(e){
    renderCategoryTabs();
    renderProductGrid();
    sync.textContent = "No se pudo sincronizar catalogo";
  }
}`);
s = s.replace(/const updateSuggestions = debounce\(function\(\)\{[\s\S]*?\}, 120\);/, `const updateSuggestions = debounce(function(){
  const term = normalize(document.getElementById("producto").value);
  if(!term){ hideSuggestions(); renderProductGrid(); return; }
  const matches = catalog.filter(p => normalize(p.producto).includes(term) || normalize(p.codigo||"").includes(term)).slice(0,8);
  renderSuggestions(matches);
  renderProductGrid();
}, 120);`);
s = s.replace(/function selectSuggestion\(p\)\{[\s\S]*?\n\}/, `function selectSuggestion(p){
  document.getElementById("producto").value = p.producto || "";
  document.getElementById("valor").value = Number(p.precio_venta||0);
  document.getElementById("cantidad").value = 1;
  hideSuggestions();
  renderProductGrid();
}`);
s = s.replace(/function renderCart\(\)\{[\s\S]*?\n\}/, `function renderCart(){
  const tbody = document.getElementById("cartRows");
  tbody.innerHTML = "";
  if(!cart.length){
    tbody.innerHTML = "<tr><td colspan='5'>Sin productos en el carrito.</td></tr>";
  }else{
    cart.forEach((it,idx) => {
      const sub = Number(it.cantidad||0) * Number(it.valor_unitario||0);
      tbody.innerHTML += \`<tr><td>${it.producto}</td><td class='right'>${Number(it.cantidad||0).toLocaleString("es-CO")}</td><td class='right'>${money(it.valor_unitario)}</td><td class='right'>${money(sub)}</td><td class='no-print'><button class='btn warn' style='padding:4px 6px;font-size:.75rem' onclick='removeItem(${idx})'>Quitar</button></td></tr>\`;
    });
  }
  const removeBtn = document.getElementById("removeListBtn");
  if(removeBtn) removeBtn.disabled = !cart.length;
  renderTotals();
}`);
s = s.replace(/function renderTotals\(\)\{[\s\S]*?\n\}/, `function renderTotals(){
  const itemsCount = cart.reduce((a,b)=>a + Number(b.cantidad||0),0);
  const subtotal = cart.reduce((a,b)=>a + Number(b.cantidad||0) * Number(b.valor_unitario||0), 0);
  const impuesto = subtotal * TAX_RATE;
  const total = subtotal + impuesto;
  const pago = Number(document.getElementById("pago").value || 0);
  const cambio = pago - total;
  const setText = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
  setText("totalItems", itemsCount.toLocaleString("es-CO"));
  setText("subtotal", money(subtotal));
  setText("subtotalCopy", money(subtotal));
  setText("discountValue", money(0));
  setText("impuesto", money(impuesto));
  setText("total", money(total));
  setText("headerSendTotal", money(total));
  setText("payView", money(pago));
  setText("changeView", money(cambio));
  const status = document.getElementById("payStatus");
  if(status){
    if(pago >= total){ status.textContent = "Pago listo"; status.classList.remove("alert"); }
    else { status.textContent = "Faltan " + money(total - pago); status.classList.add("alert"); }
  }
}`);
s = s.replace(/function limpiarVenta\(\)\{[\s\S]*?\n\}/, `function limpiarVenta(){
  cart = [];
  document.getElementById("producto").value = "";
  document.getElementById("barcode").value = "";
  document.getElementById("cantidad").value = 1;
  document.getElementById("valor").value = 0;
  document.getElementById("pago").value = 0;
  hideSuggestions();
  renderCart();
  renderProductGrid();
}`);

fs.writeFileSync(path, s, 'utf8');
console.log('updated pos');
