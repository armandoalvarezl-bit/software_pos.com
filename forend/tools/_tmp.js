const API_URL = "https://script.google.com/macros/s/AKfycby9Rf23ERVyl9LwZvQBycddgtxyyx3R8OsqlX0Fyyr7hKuYqnKnEJTGDXH72HyFsrSg/exec";
const PRINT_PREFS_KEY = "pos_print_prefs_v1";
const TAX_RATE = 0.19; // 19% IVA (ajusta segÃƒÂºn paÃƒÂ­s)
let catalog = [];
let filteredCatalog = [];
let cart = [];
let lastSale = null;
let lastCashCloseSummary = null;
let cashClosePrintPayload = null;
let printPayload = null;
let currentPrintMode = "a4";
let companyProfile = {
  empresa: "",
  nombre_empresa: "",
  nit: "",
  telefono: "",
  direccion: "",
  correo: "",
  logo: ""
};
let scanStream = null;
let scanLoopId = null;
let scanReader = null;
let zxingLib = null;

function decodeEmpresa_(raw){
  let s = String(raw || "").trim();
  if(!s) return "";
  // Evita doble/triple-encode cuando `empresa` queda guardada como URL-encoded
  // (ej: "Sede%20principal" o "Sede%2520principal").
  s = s.replace(/\+/g," ");
  for(let i=0;i<3 && /%[0-9a-fA-F]{2}/.test(s);i++){
    try{
      const decoded = decodeURIComponent(s);
      if(decoded === s) break;
      s = decoded;
    }catch(_){
      break;
    }
  }
  return String(s || "").trim();
}
function getEmpresa_(){
  return decodeEmpresa_(localStorage.getItem("empresa") || "");
}

function ensureZXing(){
  if(zxingLib && zxingLib.BrowserMultiFormatReader) return Promise.resolve(zxingLib);
  if(window.ZXing && window.ZXing.BrowserMultiFormatReader){
    zxingLib = window.ZXing;
    return Promise.resolve(zxingLib);
  }
  return new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://unpkg.com/@zxing/library@0.21.2/umd/index.min.js";
    script.onload=()=>{ zxingLib = window.ZXing; resolve(zxingLib); };
    script.onerror=()=>reject(new Error("No se pudo cargar el lector de cÃƒÆ’Ã‚Â³digos."));
    document.head.appendChild(script);
  });
}

function debounce(fn, wait){
  let t;
  return function(...args){
    clearTimeout(t);
    t=setTimeout(()=>fn.apply(this,args), wait);
  };
}
function openModal(title, body, okText, onOk){
  const modal=document.getElementById("appModal");
  if(!modal) return;
  const ok=document.getElementById("modalOk");
  const cancel=document.getElementById("modalCancel");
  document.getElementById("modalTitle").textContent=title||"";
  document.getElementById("modalBody").innerHTML=body||"";
  if(ok){
    ok.textContent=okText||"Aceptar";
    ok.onclick=function(){ closeModal(); if(typeof onOk==="function") onOk(); };
  }
  if(cancel){ cancel.onclick=closeModal; }
  modal.onclick=(e)=>{ if(e.target===modal) closeModal(); };
  modal.classList.add("active");
}
function closeModal(){
  const modal=document.getElementById("appModal");
  if(modal) modal.classList.remove("active");
}

function openScanModal(){
  const modal=document.getElementById("scanModal");
  if(!modal) return;
  modal.classList.add("active");
  const status=document.getElementById("scanStatus");
  if(status) status.textContent="Apunta la camara al codigo de barras.";
  startScanCamera();
}

async function startScanCamera(){
  const video=document.getElementById("scanVideo");
  const status=document.getElementById("scanStatus");
  if(!video){
    return;
  }
  try{
    stopScanCamera(true);
    if(status) status.textContent="Activando camara...";

    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      if(status) status.textContent="Tu navegador no permite usar la camara. Usa el lector de codigo.";
      return;
    }

    const canDetect = "BarcodeDetector" in window;
    if(!canDetect){
      if(status) status.textContent="Modo compatibilidad: usando lector universal...";
      const ZX = await ensureZXing();
      scanReader = new ZX.BrowserMultiFormatReader();
      scanReader.decodeFromVideoDevice(null, video, (result, err)=>{
        if(result){
          handleDetectedCode(result.getText());
        }else if(status && err && !(err instanceof ZX.NotFoundException)){
          status.textContent = "Sin lectura: mueve el codigo frente a la camara.";
        }
      });
      return;
    }

    scanStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});
    video.srcObject = scanStream;
    await video.play();
    if(status) status.textContent="Buscando codigo...";

    const detector = new BarcodeDetector({formats:["ean_13","ean_8","code_128","code_39","upc_a","upc_e","qr_code"]});
    const loop = async ()=>{
      if(!scanStream) return;
      try{
        const codes = await detector.detect(video);
        if(codes && codes.length){
          handleDetectedCode(codes[0].rawValue || codes[0].rawvalue || "");
          return;
        }
      }catch(_){}
      scanLoopId = requestAnimationFrame(loop);
    };
    scanLoopId = requestAnimationFrame(loop);
  }catch(e){
    if(status) status.textContent = "No se pudo usar la camara: " + (e && e.message ? e.message : "permiso denegado");
  }
}

function handleDetectedCode(code){
  const clean = String(code || "").trim();
  const status=document.getElementById("scanStatus");
  if(!clean){
    if(status) status.textContent="No se leyÃƒÂ³ el codigo. Intenta de nuevo.";
    return;
  }
  if(status) status.textContent = "Codigo detectado: " + clean;
  const input=document.getElementById("barcode");
  if(input) input.value = clean;
  agregarPorCodigo();
  stopScanCamera();
}

function stopScanCamera(keepModal){
  if(scanLoopId){ cancelAnimationFrame(scanLoopId); scanLoopId=null; }
  if(scanReader){ try{ scanReader.reset(); }catch(_){ } scanReader=null; }
  if(scanStream){
    try{ scanStream.getTracks().forEach(t=>t.stop()); }catch(_){}
    scanStream=null;
  }
  const video=document.getElementById("scanVideo");
  if(video) video.srcObject=null;
  if(!keepModal){
    const modal=document.getElementById("scanModal");
    if(modal) modal.classList.remove("active");
  }
}

function money(v){
  const n = Number(v);
  return "$" + (Number.isFinite(n) ? n : 0).toLocaleString("es-CO");
}
function normalize(s){return String(s||"").trim().toLowerCase();}
function escapeHtml_(s){
  return String(s==null?"":s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function isTaxEnabled(){
  const el = document.getElementById("includeTax");
  return el ? !!el.checked : true;
}
function logout(){localStorage.removeItem("usuario");localStorage.removeItem("rol");localStorage.removeItem("empresa");window.location.href="index.html";}

function loadPrintPrefs(){
  const raw = localStorage.getItem(PRINT_PREFS_KEY);
  let prefs = { enabled: true, format: "pos", taxEnabled: true };
  if(raw){
    try{
      const parsed = JSON.parse(raw);
      prefs.enabled = parsed && parsed.enabled !== false;
      prefs.format = parsed && (parsed.format === "a4" ? "a4" : "pos");
      prefs.taxEnabled = !(parsed && parsed.taxEnabled === false);
    }catch(_){ }
  }
  const enabledEl = document.getElementById("autoPrintEnabled");
  const formatEl = document.getElementById("autoPrintFormat");
  const taxEl = document.getElementById("includeTax");
  if(enabledEl) enabledEl.checked = !!prefs.enabled;
  if(formatEl) formatEl.value = prefs.format;
  if(taxEl) taxEl.checked = !!prefs.taxEnabled;
}

function savePrintPrefs(){
  const enabledEl = document.getElementById("autoPrintEnabled");
  const formatEl = document.getElementById("autoPrintFormat");
  const taxEl = document.getElementById("includeTax");
  const prefs = {
    enabled: enabledEl ? !!enabledEl.checked : true,
    format: formatEl && formatEl.value === "a4" ? "a4" : "pos",
    taxEnabled: taxEl ? !!taxEl.checked : true
  };
  localStorage.setItem(PRINT_PREFS_KEY, JSON.stringify(prefs));
}

function getAutoPrintMode(){{
  const enabledEl = document.getElementById("autoPrintEnabled");
  const formatEl = document.getElementById("autoPrintFormat");
  if(enabledEl && !enabledEl.checked) return "";
  if(formatEl && formatEl.value === "a4") return "a4";
  return "pos";
}

function ensurePrintPageStyleTag(){
  let styleTag = document.getElementById("dynamicPrintPage");
  if(styleTag) return styleTag;
  styleTag = document.createElement("style");
  styleTag.id = "dynamicPrintPage";
  document.head.appendChild(styleTag);
  return styleTag;
}

function applyPrintPageMode(mode){
  const styleTag = ensurePrintPageStyleTag();
  if(mode === "pos"){
    styleTag.textContent = "@media print { @page { size: 80mm auto; margin: 0; } }";
    return;
  }
  styleTag.textContent = "@media print { @page { size: A4; margin: 8mm; } }";
}

function initHeader(){
  const d = new Date();
  const fecha = d.toLocaleDateString("es-CO",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const empresa = getEmpresa_() || "Sede principal";
  const user = localStorage.getItem("usuario") || "Usuario";
  document.getElementById("today").textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  document.getElementById("welcome").textContent = `Punto de venta | ${empresa}`;
  document.getElementById("cashier").textContent = user;
}

function getCompanyNameForPrint() {
  return companyProfile.nombre_empresa || companyProfile.empresa || getEmpresa_() || "Sede principal";
}

async function loadCompanyProfile(){
  const empresa = getEmpresa_();
  try{
    const res = await fetch(`${API_URL}?action=settings&empresa=${encodeURIComponent(empresa)}`, {cache:"no-store"});
    const json = await res.json();
    if(json && json.ok && json.settings){
      companyProfile = {
        empresa: String(json.settings.empresa || empresa || "").trim(),
        nombre_empresa: String(json.settings.nombre_empresa || "").trim(),
        nit: String(json.settings.nit || "").trim(),
        telefono: String(json.settings.telefono || "").trim(),
        direccion: String(json.settings.direccion || "").trim(),
        correo: String(json.settings.correo || json.settings.email || "").trim(),
        logo: String(json.settings.logo || json.settings.logo_url || "").trim()
      };
    }else{
      companyProfile = {
        empresa: String(empresa || "").trim(),
        nombre_empresa: "",
        nit: "",
        telefono: "",
        direccion: "",
        correo: "",
        logo: ""
      };
    }
  }catch(_){
    companyProfile = {
      empresa: String(empresa || "").trim(),
      nombre_empresa: "",
      nit: "",
      telefono: "",
      direccion: "",
      correo: "",
      logo: ""
    };
  }
}

async function loadCatalog(){
  const sync = document.getElementById("sync");
  try{
  const empresa = encodeURIComponent(getEmpresa_());
  const res = await fetch(`${API_URL}?action=pos_catalog&empresa=${empresa}`, {cache:"no-store"});
  const json = await res.json();
  if(!json || !json.ok || !Array.isArray(json.rows)) throw new Error("catalogo invalido");

  catalog = json.rows;
  filteredCatalog = catalog;

  sync.textContent = `Catalogo sincronizado: ${new Date().toLocaleTimeString("es-CO")}`;
}catch(e){
  sync.textContent = "No se pudo sincronizar catalogo";
}
}

function hideSuggestions(){
  const box = document.getElementById("suggestions");
  if(box){ box.classList.remove("show"); box.innerHTML=""; }
}

function renderSuggestions(list){
  const box = document.getElementById("suggestions");
  if(!box) return;
  box.innerHTML="";
  if(!list.length){ box.classList.remove("show"); return; }
  list.forEach(p=>{
    const div=document.createElement("div");
    div.innerHTML=`<span>${p.producto||"-"}</span><span class="s-meta">${money(p.precio_venta||0)} Ã‚Â· Stock ${Number(p.stock||0).toLocaleString("es-CO")}</span>`;
    div.onclick=function(){ selectSuggestion(p); };
    box.appendChild(div);
  });
  box.classList.add("show");
}

const updateSuggestions = debounce(function(){
  const term = normalize(document.getElementById("producto").value);
  if(!term){ hideSuggestions(); return; }
  const matches = catalog
    .filter(p => normalize(p.producto).includes(term) || normalize(p.codigo||"").includes(term))
    .slice(0,8);
  renderSuggestions(matches);
}, 120);

function selectSuggestion(p){
  document.getElementById("producto").value = p.producto || "";
  document.getElementById("valor").value = Number(p.precio_venta||0);
  document.getElementById("cantidad").value = 1;
  hideSuggestions();
}

function fillPriceIfKnown(){
  const name = normalize(document.getElementById("producto").value);
  const found = catalog.find(p => normalize(p.producto) === name);
  if(found && Number(found.precio_venta||0) > 0){
    document.getElementById("valor").value = Number(found.precio_venta||0);
  }
}

function agregarPorCodigo(){
  const code = normalize(document.getElementById("barcode").value);
  const formMsg = document.getElementById("formMsg");
  if(!code){return;}
  const found = catalog.find(p => normalize(p.codigo) === code);
  if(!found){
    formMsg.textContent = "Codigo no encontrado en catalogo.";
    return;
  }
  document.getElementById("producto").value = found.producto;
  document.getElementById("valor").value = Number(found.precio_venta || 0);
  document.getElementById("cantidad").value = 1;
  agregarItem();
  document.getElementById("barcode").value = "";
}

function agregarItem(){
  const formMsg = document.getElementById("formMsg");
  const producto = document.getElementById("producto").value.trim();
  const cantidad = Number(document.getElementById("cantidad").value || 0);
  const valor = Number(document.getElementById("valor").value || 0);

  if(!producto){formMsg.textContent="Selecciona un producto.";return;}
  if(cantidad <= 0){formMsg.textContent="Cantidad invalida.";return;}
  if(valor < 0){formMsg.textContent="Valor unitario invalido.";return;}

  const found = catalog.find(p => normalize(p.producto) === normalize(producto));
  if(found){
    const stock = Number(found.stock || 0);
    const already = cart
      .filter(i => normalize(i.producto) === normalize(producto))
      .reduce((a,b) => a + Number(b.cantidad || 0), 0);
    const requested = already + cantidad;
    if(stock > 0 && requested > stock){
      formMsg.textContent = `Stock insuficiente. Disponible: ${stock}. En carrito: ${already}.`;
      return;
    }
  }
  const existing = cart.find(i => normalize(i.producto) === normalize(producto) && Number(i.valor_unitario) === Number(valor));
  if(existing){
    existing.cantidad += cantidad;
  }else{
    cart.push({producto, cantidad, valor_unitario: valor});
  }

  formMsg.textContent = "Producto agregado al carrito.";
  document.getElementById("producto").value = "";
  document.getElementById("cantidad").value = 1;
  document.getElementById("valor").value = 0;
  renderCart();
}

function removeItem(index){
  cart.splice(index,1);
  renderCart();
}

function renderCart(){
  const tbody = document.getElementById("cartRows");
  tbody.innerHTML = "";

  if(!cart.length){
    tbody.innerHTML = "<tr><td colspan='5'>Sin productos en el carrito.</td></tr>";
  }else{
    cart.forEach((it,idx) => {
      const sub = Number(it.cantidad||0) * Number(it.valor_unitario||0);
      tbody.innerHTML += `<tr>
        <td>${it.producto}</td>
        <td class='right'>${Number(it.cantidad||0).toLocaleString("es-CO")}</td>
        <td class='right'>${money(it.valor_unitario)}</td>
        <td class='right'>${money(sub)}</td>
        <td class='no-print'><button class='btn warn' style='padding:4px 6px;font-size:.75rem' onclick='removeItem(${idx})'>Quitar</button></td>
      </tr>`;
    });
  }
  renderTotals();
}

function renderTotals(){
  const itemsCount = cart.reduce((a,b)=>a + Number(b.cantidad||0),0);
  const subtotal = cart.reduce((a,b)=>a + Number(b.cantidad||0) * Number(b.valor_unitario||0), 0);
  const applyTax = isTaxEnabled();   const impuesto = applyTax ? subtotal * TAX_RATE : 0;   const total = subtotal + impuesto;   const taxRow = document.getElementById("impuestoRow");   if(taxRow) taxRow.style.display = applyTax ? "" : "none";
  const pago = Number(document.getElementById("pago").value || 0);
  const cambio = pago - total;

  const setText = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
  setText("totalItems", itemsCount.toLocaleString("es-CO"));
  setText("subtotal", money(subtotal));
  setText("impuesto", money(impuesto));
  setText("total", money(total));
  setText("cambio", money(cambio));
  setText("payView", money(pago));
  setText("changeView", money(cambio));

  const status = document.getElementById("payStatus");
  if(status){
    if(pago >= total){
      status.textContent = "Pago listo";
      status.classList.remove("alert");
    }else{
      status.textContent = "Faltan " + money(total - pago);
      status.classList.add("alert");
    }
  }
}

function currentTotalsFromItems(items, applyTax){
  const subtotal = (items || []).reduce((a,b)=>a + Number(b.cantidad||0) * Number(b.valor_unitario||0), 0);
  const useTax = (applyTax == null) ? isTaxEnabled() : !!applyTax;   const impuesto = useTax ? subtotal * TAX_RATE : 0;   const total = subtotal + impuesto;
  return { subtotal, impuesto, total };
}

function buildPrintData(){
  if(lastSale && Array.isArray(lastSale.items) && lastSale.items.length){
    return lastSale;
  }

  const liveItems = cart.map(it => ({
    producto: it.producto,
    cantidad: Number(it.cantidad||0),
    valor_unitario: Number(it.valor_unitario||0)
  }));

  const applyTax = isTaxEnabled();
  const totals = currentTotalsFromItems(liveItems, applyTax);
  const pago = Number(document.getElementById("pago").value || 0);

  return {
    ticketId: "BORRADOR",
    fecha: new Date().toLocaleString("es-CO"),
    empresa: getCompanyNameForPrint(),
    cliente: document.getElementById("cliente").value.trim() || "MOSTRADOR",
    cajero: localStorage.getItem("usuario") || "Usuario",
    metodo: document.getElementById("metodo").value || "Efectivo",
    items: liveItems,
    aplica_iva: applyTax,
    iva_porcentaje: applyTax ? Math.round(TAX_RATE * 10000) / 100 : 0,
    subtotal: totals.subtotal,
    impuesto: totals.impuesto,
    total: totals.total,
    pago: pago,
    cambio: pago - totals.total
  };
}

function ensureItemsForPrint(data){
  const safe = data || {};
  if(Array.isArray(safe.items) && safe.items.length) return safe;
  const total = Number(safe.total || 0);
  return {
    ...safe,
    items: total > 0 ? [{producto:"Productos varios", cantidad:1, valor_unitario:total}] : []
  };
}

function renderPrintTicket(data){
  const rows = document.getElementById("printRows");
  rows.innerHTML = "";

  const applyTax = (data && data.aplica_iva != null) ? !!data.aplica_iva : isTaxEnabled();
  (data.items || []).forEach((it, idx) => {
    const sub = Number(it.cantidad||0) * Number(it.valor_unitario||0);
    rows.innerHTML += `<tr>
      <td>${idx + 1}</td>
      <td>${it.producto || "-"}</td>
      <td class='right'>${Number(it.cantidad||0).toLocaleString("es-CO")}</td>
      <td class='right'>${money(it.valor_unitario)}</td>
      <td class='right'>${money(sub)}</td>
    </tr>`;
  });

  if(!rows.innerHTML){
    rows.innerHTML = "<tr><td colspan='5'>Sin productos para imprimir.</td></tr>";
  }

  const auth = String(data.ticketId || "00000000").replace(/[^0-9]/g, "").slice(-8) || "00000000";
  const accessKey = `${new Date().getFullYear()}${auth}${Math.round(Number(data.total||0)).toString().padStart(6,"0")}01`;

  const logoEl = document.getElementById("printLogo");
  if(logoEl){
    if(companyProfile.logo){
      logoEl.innerHTML = `<img src="${companyProfile.logo}" alt="logo">`;
    }else{
      logoEl.innerHTML = `<div class="p-logo-badge">FarmaPOS<br><span style="font-size:11px;font-weight:500">Cloud</span></div>`;
    }
  }

  const e1 = document.getElementById("printEmpresa");
  if(e1) e1.textContent = data.empresa || "-";
  const e2a = document.getElementById("printEmpresa2");
  if(e2a) e2a.textContent = data.empresa || "-";
  document.getElementById("printTicketId").textContent = data.ticketId || "-";
  document.getElementById("printFecha").textContent = data.fecha || "-";
  document.getElementById("printAutorizacion").textContent = auth;
  document.getElementById("printClaveAcceso").textContent = accessKey;
  document.getElementById("printCliente").textContent = data.cliente || "MOSTRADOR";
  document.getElementById("printCajero").textContent = data.cajero || "Usuario";
  document.getElementById("printMetodo").textContent = data.metodo || "Efectivo";
  document.getElementById("printSubtotal").textContent = money(data.subtotal);
  document.getElementById("printImpuesto").textContent = money(data.impuesto);
  const taxRowEl = document.getElementById("printImpuestoRow");
  if(taxRowEl) taxRowEl.style.display = applyTax ? "" : "none";
  document.getElementById("printTotal").textContent = money(data.total);
  document.getElementById("printPago").textContent = money(data.pago);
  document.getElementById("printCambio").textContent = money(data.cambio);
  const e2b = document.getElementById("printEmpresa2");
  if(e2b) e2b.textContent = companyProfile.nombre_empresa || data.empresa || "-";
  const infoBox = document.querySelector(".p-info-body");
  if(infoBox){
    infoBox.innerHTML = `Empresa: ${escapeHtml_(companyProfile.nombre_empresa || data.empresa || "-")}<br>
NIT: ${escapeHtml_(companyProfile.nit || "-")}<br>
Tel: ${escapeHtml_(companyProfile.telefono || "-")}<br>
Dir: ${escapeHtml_(companyProfile.direccion || "-")}<br>
Correo: ${escapeHtml_(companyProfile.correo || "-")}<br>
Documento generado en FarmaPOS Cloud.`;
  }
}

function renderPrintPosTicket(data){
  const rows = document.getElementById("posPrintRows");
  rows.innerHTML = "";

  (data.items || []).forEach((it) => {
    const qty = Number(it.cantidad || 0);
    const unit = Number(it.valor_unitario || 0);
    const sub = qty * unit;
    rows.innerHTML += `<div class="pos-row">
      <div class="right">${qty.toLocaleString("es-CO")}</div>
      <div class="desc">${escapeHtml_(it.producto || "-")}</div>
      <div class="right">${money(unit)}</div>
      <div class="right">${money(sub)}</div>
    </div>`;
  });
  if(!rows.innerHTML){
    rows.innerHTML = "<div class='pos-items-empty'>Sin productos.</div>";
  }

  document.getElementById("posPrintEmpresa").textContent = data.empresa || "-";
  document.getElementById("posPrintNombre").textContent = companyProfile.nombre_empresa || data.empresa || "FarmaPOS";
  document.getElementById("posPrintNit").textContent = `NIT: ${companyProfile.nit || "-"}`;
  document.getElementById("posPrintTel").textContent = `TEL: ${companyProfile.telefono || "-"}`;
  document.getElementById("posPrintDir").textContent = `DIR: ${companyProfile.direccion || "-"}`;
  document.getElementById("posPrintMail").textContent = `MAIL: ${companyProfile.correo || "-"}`;
  document.getElementById("posPrintTicketId").textContent = data.ticketId || "-";
  document.getElementById("posPrintFecha").textContent = data.fecha || "-";
  document.getElementById("posPrintCliente").textContent = data.cliente || "MOSTRADOR";
  document.getElementById("posPrintCajero").textContent = data.cajero || "Usuario";
  document.getElementById("posPrintMetodo").textContent = data.metodo || "Efectivo";
  document.getElementById("posPrintSubtotal").textContent = money(data.subtotal);
  document.getElementById("posPrintImpuesto").textContent = money(data.impuesto);
  const taxRowEl = document.getElementById("posPrintImpuestoRow");
  if(taxRowEl) taxRowEl.style.display = applyTax ? "" : "none";
  document.getElementById("posPrintTotal").textContent = money(data.total);
  document.getElementById("posPrintPago").textContent = money(data.pago);
  document.getElementById("posPrintCambio").textContent = money(data.cambio);

  const posLogo=document.getElementById("posLogo");
  if(posLogo){
    if(companyProfile.logo){
      posLogo.innerHTML=`<img src="${companyProfile.logo}" alt="logo">`;
      posLogo.style.display="block";
    }else{
      posLogo.innerHTML="";
      posLogo.style.display="none";
    }
  }
}


function renderPrintCashCloseTicket(data){
  const rows = document.getElementById("ccPrintRows");
  if(!rows) return;
  const empresaEl = document.getElementById("ccPrintEmpresa");
  const nombreEl = document.getElementById("ccPrintNombre");
  const fechaEl = document.getElementById("ccPrintFecha");
  const cajeroEl = document.getElementById("ccPrintCajero");
  const closeEl = document.getElementById("ccPrintCloseId");

  const empresa = data && data.empresa ? data.empresa : getCompanyNameForPrint();
  const nombre = data && data.nombre ? data.nombre : (companyProfile.nombre_empresa || "FarmaPOS");
  if(empresaEl) empresaEl.textContent = empresa;
  if(nombreEl) nombreEl.textContent = nombre;
  if(fechaEl) fechaEl.textContent = "Fecha: " + (data.fecha || "-");
  if(cajeroEl) cajeroEl.textContent = "Cajero: " + (data.cajero || "-");
  if(closeEl) closeEl.textContent = "Cierre: " + (data.closeId || "-");

  const exp = data.expected || {};
  const cnt = data.counted || {};
  const diff = data.diff || {};

  const lines = [
    ["Tickets", String(exp.tickets ?? "-")],
    ["Total ventas", money(exp.total_sales || 0)],
    ["Efectivo (esperado)", money(exp.cash || 0)],
    ["Tarjeta (esperado)", money(exp.card || 0)],
    ["Transfer (esperado)", money(exp.transfer || 0)],
    ["Efectivo contado", money(cnt.cash || 0)],
    ["Tarjeta contado", money(cnt.card || 0)],
    ["Transfer contado", money(cnt.transfer || 0)],
    ["Total contado", money(cnt.total || 0)],
    ["Diferencia total", money(diff.total || 0)]
  ];
  if(data.nota){
    lines.push(["Nota", String(data.nota)]);
  }

  rows.innerHTML = lines.map(([k,v]) => `
    <div class="pos-item">
      <div class="pos-item-name">${k}</div>
      <div class="pos-item-meta"><span></span><span>${v}</span></div>
    </div>
  `).join("");

  const logoEl = document.getElementById("ccPosLogo");
  if(logoEl){
    if(companyProfile.logo){
      logoEl.innerHTML = `<img src="${companyProfile.logo}" alt="logo">`;
      logoEl.style.display = "block";
    }else{
      logoEl.innerHTML = "";
      logoEl.style.display = "none";
    }
  }
}

function startCashClosePrint(data){
  cashClosePrintPayload = data || null;
  currentPrintMode = "pos";
  applyPrintPageMode("pos");
  document.body.classList.remove("print-pos-mode");
  document.body.classList.add("print-cash-close-mode");
  setTimeout(() => window.print(), 80);
}
function startPrint(mode, data){
  currentPrintMode = mode === "pos" ? "pos" : "a4";
  applyPrintPageMode(currentPrintMode);
  printPayload = ensureItemsForPrint(data || buildPrintData());
  document.body.classList.remove("print-pos-mode");
  if(mode === "pos"){
    document.body.classList.add("print-pos-mode");
  }
  setTimeout(() => window.print(), 80);
}

function printFactura(){
  const saleMsg = document.getElementById("saleMsg");
  if((!lastSale || !lastSale.items || !lastSale.items.length) && !cart.length){
    saleMsg.style.color = "#b91c1c";
    saleMsg.textContent = "No hay datos para imprimir.";
    return;
  }
  const data = buildPrintData();
  const safe = ensureItemsForPrint(data);
  renderPrintTicket(safe);
  renderPrintPosTicket(safe);
  startPrint("a4", safe);
}

function printFacturaPOS(){
  const saleMsg = document.getElementById("saleMsg");
  if((!lastSale || !lastSale.items || !lastSale.items.length) && !cart.length){
    saleMsg.style.color = "#b91c1c";
    saleMsg.textContent = "No hay datos para imprimir.";
    return;
  }
  const data = buildPrintData();
  const safe = ensureItemsForPrint(data);
  renderPrintTicket(safe);
  renderPrintPosTicket(safe);
  startPrint("pos", safe);
}

async function printSaleCopy(saleId, mode){
  const saleMsg = document.getElementById("saleMsg");
  if(!saleId){
    saleMsg.style.color = "#b91c1c";
    saleMsg.textContent = "ID de venta invalido para imprimir copia.";
    return;
  }
  const printMode = (String(mode || "").toLowerCase() === "pos") ? "pos" : "a4";

  saleMsg.style.color = "#334155";
  saleMsg.textContent = "Consultando venta para imprimir copia...";
  try{
    const empresa = encodeURIComponent(getEmpresa_());
    const id = encodeURIComponent(saleId);
    const res = await fetch(`${API_URL}?action=sale_detail&empresa=${empresa}&id_venta=${id}`, {cache:"no-store"});
    const data = await res.json();
    if(!data || !data.ok || !data.sale){
      throw new Error((data && data.error) || "No se pudo obtener el detalle de la venta.");
    }

    const sale = data.sale;
    const total = Number(sale.total || 0);
    const paid = total;
    lastSale = {
      ticketId: sale.id_venta || saleId,
      fecha: sale.fecha || new Date().toLocaleString("es-CO"),
      empresa: getCompanyNameForPrint(),
      cliente: sale.cliente || "MOSTRADOR",
      cajero: sale.cajero || (localStorage.getItem("usuario") || "Usuario"),
      metodo: sale.metodo_pago || "Efectivo",
      items: Array.isArray(sale.items) ? sale.items : [],
      subtotal: Number(sale.subtotal || total),
      impuesto: Number(sale.impuesto || 0),
      aplica_iva: sale.aplica_iva != null ? !!sale.aplica_iva : undefined,
      iva_porcentaje: Number(sale.iva_porcentaje || 0),
      total: total,
      pago: paid,
      cambio: Number(paid - total)
    };
    lastSale = ensureItemsForPrint(lastSale);

    saleMsg.style.color = "#166534";
    saleMsg.textContent = `Copia lista: ${lastSale.ticketId}`;
    renderPrintTicket(lastSale);
    renderPrintPosTicket(lastSale);
    startPrint(printMode, lastSale);
  }catch(e){
    saleMsg.style.color = "#b91c1c";
    saleMsg.textContent = "No se pudo generar la copia: " + (e.message || "error desconocido");
  }
}

async function cobrarVenta(){
  const saleMsg = document.getElementById("saleMsg");
  saleMsg.style.color = "#334155";

  if(!cart.length){saleMsg.textContent = "No hay productos para cobrar.";return;}

  const applyTax = isTaxEnabled();
  const totals = currentTotalsFromItems(cart, applyTax);
  const subtotal = totals.subtotal;
  const impuesto = totals.impuesto;
  const total = totals.total;
  const pago = Number(document.getElementById("pago").value || 0);
  if(pago < total){saleMsg.style.color="#b91c1c";saleMsg.textContent="Pago insuficiente.";return;}

  const payload = {
    action: "create_sale",
    empresa: getEmpresa_(),
    cliente: document.getElementById("cliente").value.trim() || "MOSTRADOR",
    cajero: localStorage.getItem("usuario") || "",
    metodo_pago: document.getElementById("metodo").value,
    fecha: new Date().toISOString(),
    aplica_iva: applyTax ? 1 : 0,
    iva_porcentaje: applyTax ? Math.round(TAX_RATE * 10000) / 100 : 0,
    subtotal: subtotal,
    impuesto: impuesto,
    total: total,
    items: JSON.stringify(cart)
  };

  saleMsg.textContent = "Guardando venta...";
  try{
    const body = new URLSearchParams(payload).toString();
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
      body
    });

    const text = await res.text();
    let data = {};
    try{ data = JSON.parse(text); } catch(_) { throw new Error("Respuesta invalida del servidor"); }

    if(!data.ok){
      saleMsg.style.color = "#b91c1c";
      saleMsg.textContent = data.error || "No se pudo guardar la venta.";
      return;
    }

    const paid = Number(document.getElementById("pago").value || 0);
    const soldItems = cart.map(it => ({
      producto: it.producto,
      cantidad: Number(it.cantidad||0),
      valor_unitario: Number(it.valor_unitario||0)
    }));

    lastSale = {
      ticketId: data.sale_id || "-",
      fecha: new Date().toLocaleString("es-CO"),
      empresa: getCompanyNameForPrint(),
      cliente: payload.cliente || "MOSTRADOR",
      cajero: payload.cajero || "Usuario",
      metodo: payload.metodo_pago || "Efectivo",
      items: soldItems,
      subtotal: subtotal,
      impuesto: impuesto,
      total: Number(data.total || total),
      pago: paid,
      cambio: paid - Number(data.total || total)
    };

    saleMsg.style.color = "#166534";
    saleMsg.textContent = `Venta guardada: ${data.sale_id} | Total ${money(data.total)}`;
    document.getElementById("ticketMeta").textContent = `Ticket: ${data.sale_id} | Fecha: ${lastSale.fecha}`;

    // Auto-print with user's selected format (recommended POS receipt for Epson TM-T20III).
    const autoMode = getAutoPrintMode();
    if(autoMode){
      renderPrintTicket(lastSale);
      renderPrintPosTicket(lastSale);
      startPrint(autoMode, lastSale);
    }

    cart = [];
    document.getElementById("pago").value = 0;
    renderCart();
    await loadCatalog();
    await loadCashClose();

    openModal(
      "Venta guardada",
      `Ticket: <strong>${data.sale_id || "-"}</strong><br>Total: <strong>${money(data.total)}</strong><br>Cliente: ${escapeHtml_(payload.cliente)}`,
      "Aceptar"
    );
  }catch(e){
    saleMsg.style.color = "#b91c1c";
    saleMsg.textContent = "Error guardando venta: " + (e.message || "desconocido");
  }
}

function limpiarVenta(){
  cart = [];
  document.getElementById("producto").value = "";
  document.getElementById("cantidad").value = 1;
  document.getElementById("valor").value = 0;
  document.getElementById("pago").value = 0;
  document.getElementById("formMsg").textContent = "";
  document.getElementById("saleMsg").textContent = "";
  document.getElementById("ticketMeta").textContent = "";
  renderCart();
}

async function loadCashClose(){
  const closeMsg = document.getElementById("closeMsg");
  closeMsg.textContent = "Consultando...";
  try{
    const empresa = encodeURIComponent(getEmpresa_());
    const cajero = encodeURIComponent(localStorage.getItem("usuario") || "");
    const res = await fetch(`${API_URL}?action=cash_close&empresa=${empresa}&cajero=${cajero}`, {cache:"no-store"});
    const data = await res.json();
    if(!data || !data.ok || !data.summary) throw new Error("sin resumen");

    const s = data.summary;
    lastCashCloseSummary = s;
    document.getElementById("ccDate").textContent = s.date || "-";
    document.getElementById("ccTickets").textContent = Number(s.tickets || 0).toLocaleString("es-CO");
    document.getElementById("ccTotal").textContent = money(s.total_sales);
    document.getElementById("ccCash").textContent = money(s.cash);
    document.getElementById("ccCard").textContent = money(s.card);
    document.getElementById("ccTransfer").textContent = money(s.transfer);

    const inCash = document.getElementById("ccCountCash");
    const inCard = document.getElementById("ccCountCard");
    const inTransfer = document.getElementById("ccCountTransfer");
    if(inCash) inCash.value = String(Number(s.cash || 0));
    if(inCard) inCard.value = String(Number(s.card || 0));
    if(inTransfer) inTransfer.value = String(Number(s.transfer || 0));
    renderCashCloseDiff_();

    const tbody = document.getElementById("closeRows");
    tbody.innerHTML = "";
    (data.rows || []).forEach(r => {
      const safeId = String(r.id_venta || "").replace(/'/g,"\\'");
      tbody.innerHTML += `<tr>
        <td>${r.id_venta || "-"}</td>
        <td>${r.metodo_pago || "-"}</td>
        <td class='right'>${money(r.total)}</td>
        <td class='right'><button class='btn alt' style='padding:4px 8px;font-size:.74rem' onclick="printSaleCopy('${safeId}')">Imprimir copia</button></td>
      </tr>`;
    });
    if(!(data.rows || []).length){
      tbody.innerHTML = "<tr><td colspan='4'>Sin ventas registradas hoy.</td></tr>";
    }

    closeMsg.textContent = `Actualizado ${new Date().toLocaleTimeString("es-CO")}`;
  }catch(e){
    closeMsg.textContent = "No se pudo consultar el cierre de caja.";
  }
}

function renderCashCloseDiff_(){
  const box = document.getElementById("ccDiffMsg");
  if(!box) return;
  if(!lastCashCloseSummary){
    box.textContent = "";
    return;
  }
  const cash = Number(document.getElementById("ccCountCash")?.value || 0);
  const card = Number(document.getElementById("ccCountCard")?.value || 0);
  const transfer = Number(document.getElementById("ccCountTransfer")?.value || 0);
  const expCash = Number(lastCashCloseSummary.cash || 0);
  const expCard = Number(lastCashCloseSummary.card || 0);
  const expTransfer = Number(lastCashCloseSummary.transfer || 0);
  const expTotal = Number(lastCashCloseSummary.total_sales || 0);
  const countedTotal = (isFinite(cash)?cash:0) + (isFinite(card)?card:0) + (isFinite(transfer)?transfer:0);
  const diffCash = (isFinite(cash)?cash:0) - expCash;
  const diffTotal = countedTotal - expTotal;
  box.textContent = `Diferencia efectivo: ${money(diffCash)} | Diferencia total: ${money(diffTotal)}`;
  if(Math.abs(diffTotal) < 0.01) box.style.color = "#166534";
  else if(diffTotal < 0) box.style.color = "#b91c1c";
  else box.style.color = "#b45309";
}

async function registerCashClose(){
  const closeMsg = document.getElementById("closeMsg");
  closeMsg.textContent = "Registrando cierre...";
  try{
    if(!lastCashCloseSummary) await loadCashClose();
    if(!lastCashCloseSummary) throw new Error("No hay resumen de cierre");

    const payload = {
      action: "register_cash_close",
      empresa: getEmpresa_(),
      cajero: localStorage.getItem("usuario") || "",
      fecha: lastCashCloseSummary.date || "",
      contado_efectivo: document.getElementById("ccCountCash")?.value || "0",
      contado_tarjeta: document.getElementById("ccCountCard")?.value || "0",
      contado_transferencia: document.getElementById("ccCountTransfer")?.value || "0",
      nota: String(document.getElementById("ccNote")?.value || "").trim()
    };

    const body = new URLSearchParams(payload).toString();
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body
    });
    const data = await res.json();
    if(!res.ok || !data || data.ok === false){
      throw new Error((data && data.error) ? data.error : "No se pudo registrar cierre");
    }

    renderCashCloseDiff_();
    const diff = data.diff || {};
    closeMsg.textContent = `Cierre registrado: ${data.close_id || "-"} | Dif total: ${money(diff.total || 0)}`;
    closeMsg.style.color = "#166534";
    // Mostrar ticket del cierre en un modal (sin afectar el resto del POS)
    try{
      const s = lastCashCloseSummary || {};
      const countedCash = Number(document.getElementById("ccCountCash")?.value || 0);
      const countedCard = Number(document.getElementById("ccCountCard")?.value || 0);
      const countedTransfer = Number(document.getElementById("ccCountTransfer")?.value || 0);
      const countedTotal = (isFinite(countedCash)?countedCash:0) + (isFinite(countedCard)?countedCard:0) + (isFinite(countedTransfer)?countedTransfer:0);
      const expectedTotal = Number(s.total_sales || 0);
      const expectedCash = Number(s.cash || 0);
      const expectedCard = Number(s.card || 0);
      const expectedTransfer = Number(s.transfer || 0);

      const ticket = {
        closeId: data.close_id || "-",
        fecha: s.date || new Date().toLocaleString("es-CO"),
        empresa: getCompanyNameForPrint(),
        nombre: companyProfile.nombre_empresa || "FarmaPOS",
        cajero: localStorage.getItem("usuario") || "",
        nota: String(document.getElementById("ccNote")?.value || "").trim(),
        expected: {
          tickets: s.tickets || 0,
          total_sales: expectedTotal,
          cash: expectedCash,
          card: expectedCard,
          transfer: expectedTransfer
        },
        counted: {
          cash: countedCash,
          card: countedCard,
          transfer: countedTransfer,
          total: countedTotal
        },
        diff: {
          total: countedTotal - expectedTotal
        }
      };

      const bodyHtml = `
        <div style="font-size:.9rem;line-height:1.35">
          <div style="font-weight:800;color:#065f46;margin-bottom:6px">Ticket de cierre generado</div>
          <div style="color:#475569;margin-bottom:10px">Cierre: <strong>${ticket.closeId}</strong> | ${ticket.fecha}</div>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#f8fafc">
            <div style="display:flex;justify-content:space-between;gap:10px"><span>Total ventas</span><strong>${money(ticket.expected.total_sales)}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:10px"><span>Total contado</span><strong>${money(ticket.counted.total)}</strong></div>
            <div style="display:flex;justify-content:space-between;gap:10px"><span>Diferencia</span><strong>${money(ticket.diff.total)}</strong></div>
          </div>
          <div style="margin-top:10px;color:#64748b;font-size:.86rem">Pulsa <strong>Imprimir ticket</strong> para imprimir en formato POS (80mm).</div>
        </div>
      `;

      openModal("Cierre de caja registrado", bodyHtml, "Imprimir ticket", ()=>{
        renderPrintCashCloseTicket(ticket);
        startCashClosePrint(ticket);
      });
    }catch(_){ }
  }catch(e){
    closeMsg.textContent = "No se pudo registrar el cierre: " + (e && e.message ? e.message : "error");
    closeMsg.style.color = "#b91c1c";
  }
}

window.addEventListener("load", async () => {
  if(!localStorage.getItem("usuario")){
    window.location.href = "index.html";
    return;
  }
  initHeader();
  document.getElementById("producto").addEventListener("change", fillPriceIfKnown);
  document.getElementById("producto").addEventListener("input", fillPriceIfKnown);
  document.getElementById("producto").addEventListener("input", updateSuggestions);
  document.getElementById("producto").addEventListener("blur", ()=>setTimeout(hideSuggestions,120));
  document.getElementById("barcode").addEventListener("keydown", (ev) => {
    if(ev.key === "Enter"){ ev.preventDefault(); agregarPorCodigo(); }
  });
  document.getElementById("autoPrintEnabled").addEventListener("change", savePrintPrefs);
  document.getElementById("autoPrintFormat").addEventListener("change", savePrintPrefs);
  const taxEl = document.getElementById("includeTax");
  if(taxEl) taxEl.addEventListener("change", () => { savePrintPrefs(); renderTotals(); });
  loadPrintPrefs();
  await loadCompanyProfile();
  renderCart();
  await loadCatalog();
  await loadCashClose();

  ["ccCountCash","ccCountCard","ccCountTransfer"].forEach((id)=>{
    const el=document.getElementById(id);
    if(el) el.addEventListener("input", renderCashCloseDiff_);
  });

  const modal = document.getElementById("appModal");
  if(modal){
    modal.addEventListener("click",(e)=>{ if(e.target===modal) closeModal(); });
    const btnOk=document.getElementById("modalOk");
    const btnCancel=document.getElementById("modalCancel");
    if(btnCancel) btnCancel.onclick=closeModal;
    if(btnOk) btnOk.onclick=closeModal;
  }

  const scanModal=document.getElementById("scanModal");
  if(scanModal){
    scanModal.addEventListener("click",(e)=>{ if(e.target===scanModal) stopScanCamera(); });
  }

  // Permite imprimir copia desde Reportes: pos.html?print=<id>&mode=a4|pos
  try{
    const qs = new URLSearchParams(window.location.search || "");
    const saleId = String(qs.get("print") || "").trim();
    let mode = String(qs.get("mode") || "a4").toLowerCase();
    if(mode !== "pos") mode = "a4";
    if(saleId){
      await printSaleCopy(saleId, mode);
    }
  }catch(_){}
});

window.addEventListener("beforeprint", () => {
  if(document.body.classList.contains("print-cash-close-mode") && cashClosePrintPayload){
    currentPrintMode = "pos";
    applyPrintPageMode("pos");
    renderPrintCashCloseTicket(cashClosePrintPayload);
    return;
  }
  applyPrintPageMode(currentPrintMode);
  const data = ensureItemsForPrint(printPayload || buildPrintData());
  renderPrintTicket(data);
  renderPrintPosTicket(data);
});

window.addEventListener("afterprint", () => {
  document.body.classList.remove("print-pos-mode");
  document.body.classList.remove("print-cash-close-mode");
  cashClosePrintPayload = null;
  printPayload = null;
  currentPrintMode = "a4";
  applyPrintPageMode("a4");
});

window.addEventListener("beforeunload", () => {
  stopScanCamera();
});

function toggleSidebar(forceOpen){
  const layout=document.querySelector(".layout");
  if(!layout) return;
  if(typeof forceOpen === "boolean") layout.classList.toggle("sidebar-open", forceOpen);
  else layout.classList.toggle("sidebar-open");
}
  window.addEventListener("resize",()=>{ if(window.innerWidth>860) toggleSidebar(false); });
  document.querySelectorAll(".menu a").forEach(a=>a.addEventListener("click",()=>{ if(window.innerWidth<=860) toggleSidebar(false); }));
