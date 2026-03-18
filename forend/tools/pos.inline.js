const API_URL = "https://script.google.com/macros/s/AKfycby9Rf23ERVyl9LwZvQBycddgtxyyx3R8OsqlX0Fyyr7hKuYqnKnEJTGDXH72HyFsrSg/exec";
  const PREFS_KEY = "pos_prefs_v2";

  let catalog = [];
  let cart = [];
  let companyProfile = { nombre_empresa: "", empresa: "", nit: "", telefono: "", direccion: "", nota_ticket: "Gracias por su compra", iva_porcentaje: 19 };
  let lastSale = null;

  function money(v){
    const n = Number(v);
    return "$" + (Number.isFinite(n) ? n : 0).toLocaleString("es-CO");
  }
  function normalize(s){return String(s||"").trim().toLowerCase();}
  function escapeHtml(s){
    return String(s==null?"":s)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/\"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function getEmpresa(){
    // localStorage puede venir URL-encoded desde otras pantallas
    let s = String(localStorage.getItem("empresa") || "").trim();
    if(!s) return "";
    s = s.replace(/\+/g," ");
    for(let i=0;i<2 && /%[0-9a-fA-F]{2}/.test(s);i++){
      try{ s = decodeURIComponent(s); }catch(_){ break; }
    }
    return String(s||"").trim();
  }

  function logout(){
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
    localStorage.removeItem("empresa");
    window.location.href = "index.html";
  }

  function loadPrefs(){
    let prefs = { taxEnabled: true };
    try{
      const raw = localStorage.getItem(PREFS_KEY);
      if(raw){
        const p = JSON.parse(raw);
        if(p && typeof p.taxEnabled === "boolean") prefs.taxEnabled = p.taxEnabled;
      }
    }catch(_){ }
    const taxEl = document.getElementById("includeTax");
    if(taxEl) taxEl.checked = !!prefs.taxEnabled;
  }

  function savePrefs(){
    const taxEl = document.getElementById("includeTax");
    const prefs = { taxEnabled: taxEl ? !!taxEl.checked : true };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  function taxRate(){
    const pct = Number(companyProfile.iva_porcentaje || 0);
    return pct > 0 ? (pct / 100) : 0;
  }
  function isTaxEnabled(){
    const el = document.getElementById("includeTax");
    return el ? !!el.checked : true;
  }

  async function fetchWithTimeout(url, opts, timeoutMs){
    const options = opts || {};
    if(typeof AbortController === "undefined"){
      return fetch(url, options);
    }
    const ctrl = new AbortController();
    const t = setTimeout(()=>{ try{ ctrl.abort(); }catch(_){ } }, timeoutMs || 8000);
    try{
      return await fetch(url, { ...options, signal: ctrl.signal });
    }finally{
      clearTimeout(t);
    }
  }

  function setSync(text, isError){
    const sync = document.getElementById("sync");
    if(!sync) return;
    sync.style.color = isError ? "#b91c1c" : "";
    sync.textContent = text;
  }

  async function loadCompanyProfile(){
    const empresa = getEmpresa();
    try{
      const url = `${API_URL}?action=settings&empresa=${encodeURIComponent(empresa)}`;
      const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
      const json = await res.json();
      if(json && json.ok && json.settings){
        companyProfile = {
          ...companyProfile,
          empresa: String(json.settings.empresa || empresa || "").trim(),
          nombre_empresa: String(json.settings.nombre_empresa || "").trim(),
          nit: String(json.settings.nit || "").trim(),
          telefono: String(json.settings.telefono || "").trim(),
          direccion: String(json.settings.direccion || "").trim(),
          nota_ticket: String(json.settings.nota_ticket || companyProfile.nota_ticket || "").trim() || "Gracias por su compra",
          iva_porcentaje: Number(json.settings.iva_porcentaje || json.settings.iva || companyProfile.iva_porcentaje || 0)
        };
      }
    }catch(_){ }

    const label = document.getElementById("taxLabel");
    if(label){
      const pct = Number(companyProfile.iva_porcentaje || 0);
      label.textContent = pct > 0 ? `Incluir IVA (${pct}%)` : "Incluir impuesto";
    }
    renderTotals();
  }

  async function loadCatalog(){
    setSync("Sincronizando catÃ¡logo...", false);
    try{
      const empresa = encodeURIComponent(getEmpresa());
      const url = `${API_URL}?action=pos_catalog&empresa=${empresa}`;
      const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
      const text = await res.text();
      let json = null;
      try{ json = JSON.parse(text); }catch(_){ }

      if(!res.ok){
        const msg = (json && (json.error || json.message)) ? (json.error || json.message) : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      if(!json || !json.ok || !Array.isArray(json.rows)){
        const msg = (json && (json.error || json.message)) ? (json.error || json.message) : "Respuesta no JSON o catÃ¡logo invÃ¡lido";
        throw new Error(msg);
      }
      catalog = json.rows;
      setSync(`CatÃ¡logo sincronizado: ${new Date().toLocaleTimeString("es-CO")} (${catalog.length} productos)`, false);
      hideSuggestions();
    }catch(e){
      console.error("No se pudo sincronizar catÃ¡logo", e);
      setSync(`No se pudo sincronizar catÃ¡logo: ${String(e && e.message ? e.message : e)}`, true);
    }
  }

  function hideSuggestions(){
    const box = document.getElementById("suggestions");
    if(box){ box.classList.remove("show"); box.innerHTML = ""; }
  }

  function renderSuggestions(list){
    const box = document.getElementById("suggestions");
    if(!box) return;
    box.innerHTML = "";
    if(!list.length){ box.classList.remove("show"); return; }
    list.forEach(p => {
      const div = document.createElement("div");
      div.className = "s-item";
      const stock = Number(p.stock || 0);
      const meta = `${money(p.precio_venta || 0)} Â· Stock ${stock.toLocaleString("es-CO")}`;
      div.innerHTML = `<span class="s-name">${escapeHtml(p.producto || "-")}</span><span class="s-meta">${escapeHtml(meta)}</span>`;
      div.onclick = () => selectSuggestion(p);
      box.appendChild(div);
    });
    box.classList.add("show");
  }

  function selectSuggestion(p){
    document.getElementById("producto").value = p.producto || "";
    document.getElementById("valor").value = Number(p.precio_venta || 0);
    document.getElementById("cantidad").value = 1;
    hideSuggestions();
  }

  function updateSuggestions(){
    const term = normalize(document.getElementById("producto").value);
    if(!term){ hideSuggestions(); return; }
    const matches = catalog
      .filter(p => normalize(p.producto).includes(term) || normalize(p.codigo || "").includes(term))
      .slice(0, 8);
    renderSuggestions(matches);
  }

  function fillPriceIfKnown(){
    const name = normalize(document.getElementById("producto").value);
    const found = catalog.find(p => normalize(p.producto) === name);
    if(found && Number(found.precio_venta || 0) > 0){
      document.getElementById("valor").value = Number(found.precio_venta || 0);
    }
  }

  function addByBarcode(){
    const code = normalize(document.getElementById("barcode").value);
    const msg = document.getElementById("formMsg");
    if(!code) return;
    const found = catalog.find(p => normalize(p.codigo) === code);
    if(!found){
      msg.style.color = "#b91c1c";
      msg.textContent = "CÃ³digo no encontrado en catÃ¡logo.";
      return;
    }
    document.getElementById("producto").value = found.producto;
    document.getElementById("valor").value = Number(found.precio_venta || 0);
    document.getElementById("cantidad").value = 1;
    addItem();
    document.getElementById("barcode").value = "";
  }

  function addItem(){
    const msg = document.getElementById("formMsg");
    msg.style.color = "";

    const producto = String(document.getElementById("producto").value || "").trim();
    const cantidad = Number(document.getElementById("cantidad").value || 0);
    const valor = Number(document.getElementById("valor").value || 0);

    if(!producto){ msg.style.color="#b91c1c"; msg.textContent="Selecciona un producto."; return; }
    if(cantidad <= 0){ msg.style.color="#b91c1c"; msg.textContent="Cantidad invÃ¡lida."; return; }
    if(valor < 0){ msg.style.color="#b91c1c"; msg.textContent="Valor unitario invÃ¡lido."; return; }

    // stock check (soft)
    const found = catalog.find(p => normalize(p.producto) === normalize(producto));
    if(found){
      const stock = Number(found.stock || 0);
      const already = cart.filter(i => normalize(i.producto) === normalize(producto)).reduce((a,b)=>a+Number(b.cantidad||0),0);
      const requested = already + cantidad;
      if(stock > 0 && requested > stock){
        msg.style.color="#b91c1c";
        msg.textContent = `Stock insuficiente. Disponible: ${stock}. En carrito: ${already}.`;
        return;
      }
    }

    const existing = cart.find(i => normalize(i.producto) === normalize(producto) && Number(i.valor_unitario) === Number(valor));
    if(existing) existing.cantidad += cantidad;
    else cart.push({ producto, cantidad, valor_unitario: valor });

    msg.style.color = "#166534";
    msg.textContent = "Producto agregado.";

    document.getElementById("producto").value = "";
    document.getElementById("cantidad").value = 1;
    document.getElementById("valor").value = 0;
    hideSuggestions();
    renderCart();
  }

  function removeItem(idx){
    cart.splice(idx, 1);
    renderCart();
  }

  function clearSale(){
    cart = [];
    lastSale = null;
    document.getElementById("pago").value = 0;
    document.getElementById("saleMsg").textContent = "";
    renderCart();
  }

  function totalsFromItems(items){
    const subtotal = (items || []).reduce((a,b)=>a + Number(b.cantidad||0) * Number(b.valor_unitario||0), 0);
    const applyTax = isTaxEnabled() && taxRate() > 0;
    const impuesto = applyTax ? (subtotal * taxRate()) : 0;
    const total = subtotal + impuesto;
    return { subtotal, impuesto, total, applyTax };
  }

  function renderTotals(){
    const itemsCount = cart.reduce((a,b)=>a + Number(b.cantidad||0), 0);
    const t = totalsFromItems(cart);
    const pago = Number(document.getElementById("pago").value || 0);
    const cambio = pago - t.total;

    const taxRow = document.getElementById("taxRow");
    if(taxRow) taxRow.style.display = t.applyTax ? "" : "none";

    document.getElementById("totalItems").textContent = itemsCount.toLocaleString("es-CO");
    document.getElementById("subtotal").textContent = money(t.subtotal);
    document.getElementById("impuesto").textContent = money(t.impuesto);
    document.getElementById("total").textContent = money(t.total);
    document.getElementById("cambio").textContent = money(cambio);
  }

  function renderCart(){
    const tbody = document.getElementById("cartRows");
    tbody.innerHTML = "";
    if(!cart.length){
      tbody.innerHTML = "<tr><td colspan='5'>Sin productos.</td></tr>";
      renderTotals();
      return;
    }
    cart.forEach((it, idx) => {
      const sub = Number(it.cantidad||0) * Number(it.valor_unitario||0);
      tbody.innerHTML += `
        <tr>
          <td>${escapeHtml(it.producto||"")}</td>
          <td class='right'>${Number(it.cantidad||0).toLocaleString("es-CO")}</td>
          <td class='right'>${money(it.valor_unitario)}</td>
          <td class='right'>${money(sub)}</td>
          <td class='right'><button class='btn alt' style='padding:6px 10px;font-size:.78rem' onclick='removeItem(${idx})'>Quitar</button></td>
        </tr>`;
    });
    renderTotals();
  }

  async function saveSale(){
    const msg = document.getElementById("saleMsg");
    msg.style.color = "#334155";

    if(!cart.length){ msg.style.color="#b91c1c"; msg.textContent="No hay productos."; return; }

    const t = totalsFromItems(cart);
    const pago = Number(document.getElementById("pago").value || 0);
    if(pago < t.total){ msg.style.color="#b91c1c"; msg.textContent="Pago insuficiente."; return; }

    const payload = {
      action: "create_sale",
      empresa: getEmpresa(),
      cliente: String(document.getElementById("cliente").value || "MOSTRADOR").trim() || "MOSTRADOR",
      cajero: localStorage.getItem("usuario") || "",
      metodo_pago: document.getElementById("metodo").value || "Efectivo",
      fecha: new Date().toISOString(),
      aplica_iva: t.applyTax ? 1 : 0,
      iva_porcentaje: t.applyTax ? Number(companyProfile.iva_porcentaje || 0) : 0,
      subtotal: t.subtotal,
      impuesto: t.impuesto,
      total: t.total,
      items: JSON.stringify(cart)
    };

    msg.textContent = "Guardando venta...";
    try{
      const body = new URLSearchParams(payload).toString();
      const res = await fetchWithTimeout(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body
      }, 10000);

      const text = await res.text();
      let json = null;
      try{ json = JSON.parse(text); }catch(_){ }
      if(!res.ok || !json || !json.ok){
        const err = (json && (json.error || json.message)) ? (json.error || json.message) : `HTTP ${res.status}`;
        throw new Error(err);
      }

      const saleId = json.sale_id || "-";
      const totalSaved = Number(json.total != null ? json.total : t.total);
      const impuestoSaved = Number(json.impuesto != null ? json.impuesto : t.impuesto);
      const subtotalSaved = Number(json.subtotal != null ? json.subtotal : t.subtotal);

      lastSale = {
        ticketId: saleId,
        fecha: new Date().toLocaleString("es-CO"),
        cliente: payload.cliente,
        metodo: payload.metodo_pago,
        items: cart.map(x => ({...x})),
        subtotal: subtotalSaved,
        impuesto: impuestoSaved,
        total: totalSaved,
        pago: pago,
        cambio: pago - totalSaved,
        aplica_iva: t.applyTax,
        iva_porcentaje: payload.iva_porcentaje
      };

      msg.style.color = "#166534";
      msg.textContent = `Venta guardada: ${saleId} | Total ${money(totalSaved)}`;

      // reset for next sale
      cart = [];
      document.getElementById("pago").value = 0;
      renderCart();

    }catch(e){
      msg.style.color = "#b91c1c";
      msg.textContent = `Error guardando venta: ${String(e && e.message ? e.message : e)}`;
    }
  }

  function fillPrint(){
    const data = lastSale;
    if(!data){
      alert("No hay venta para imprimir.");
      return false;
    }
    const name = companyProfile.nombre_empresa || "FarmaPOS";
    const empresa = companyProfile.empresa || getEmpresa() || "";

    document.getElementById("pNombre").textContent = name;
    document.getElementById("pEmpresa").textContent = empresa || "-";
    document.getElementById("pNit").textContent = `NIT: ${companyProfile.nit || "-"}`;
    document.getElementById("pDir").textContent = `DIR: ${companyProfile.direccion || "-"}`;
    document.getElementById("pTel").textContent = `TEL: ${companyProfile.telefono || "-"}`;

    document.getElementById("pTicket").textContent = data.ticketId || "-";
    document.getElementById("pFecha").textContent = data.fecha || "-";
    document.getElementById("pCliente").textContent = data.cliente || "MOSTRADOR";
    document.getElementById("pMetodo").textContent = data.metodo || "Efectivo";

    const rows = document.getElementById("pRows");
    rows.innerHTML = "";
    (data.items || []).forEach(it => {
      const qty = Number(it.cantidad || 0);
      const unit = Number(it.valor_unitario || 0);
      const sub = qty * unit;
      rows.innerHTML += `
        <div class="p-row">
          <div class="p-right">${qty.toLocaleString("es-CO")}</div>
          <div class="p-desc">${escapeHtml(it.producto || "-")}</div>
          <div class="p-right">${money(unit)}</div>
          <div class="p-right">${money(sub)}</div>
        </div>`;
    });

    const applyTax = !!data.aplica_iva;
    const taxRow = document.getElementById("pTaxRow");
    if(taxRow) taxRow.style.display = applyTax ? "" : "none";

    document.getElementById("pSubtotal").textContent = money(data.subtotal);
    document.getElementById("pImpuesto").textContent = money(data.impuesto);
    document.getElementById("pTotal").textContent = money(data.total);
    document.getElementById("pPago").textContent = money(data.pago);
    document.getElementById("pCambio").textContent = money(data.cambio);
    document.getElementById("pNota").textContent = companyProfile.nota_ticket || "Gracias por su compra";
    return true;
  }

  function printPos(){
    if(!fillPrint()) return;
    setTimeout(()=>window.print(), 50);
  }

  window.addEventListener("load", async () => {
    if(!localStorage.getItem("usuario")){
      window.location.href = "index.html";
      return;
    }

    const d = new Date();
    const fecha = d.toLocaleDateString("es-CO", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    const empresa = getEmpresa() || "Sede";
    const user = localStorage.getItem("usuario") || "Usuario";
    document.getElementById("today").textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
    document.getElementById("welcome").textContent = `Punto de venta | ${empresa}`;
    document.getElementById("cashier").textContent = user;

    loadPrefs();

    document.getElementById("includeTax").addEventListener("change", () => { savePrefs(); renderTotals(); });
    document.getElementById("pago").addEventListener("input", renderTotals);

    const prodEl = document.getElementById("producto");
    prodEl.addEventListener("input", () => { fillPriceIfKnown(); updateSuggestions(); });
    prodEl.addEventListener("blur", () => setTimeout(hideSuggestions, 140));

    document.getElementById("barcode").addEventListener("keydown", (ev) => {
      if(ev.key === "Enter"){ ev.preventDefault(); addByBarcode(); }
    });

    renderCart();

    // Cargar catÃ¡logo primero para no quedar colgado
    await loadCatalog();
    loadCompanyProfile();
  });
