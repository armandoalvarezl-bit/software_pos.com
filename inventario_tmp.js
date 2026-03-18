
const API_URL = "https://script.google.com/macros/s/AKfycby9Rf23ERVyl9LwZvQBycddgtxyyx3R8OsqlX0Fyyr7hKuYqnKnEJTGDXH72HyFsrSg/exec";
const fallback={summary:{totalProducts:120,criticalStock:9,expiringCount:18},rows:[{producto:"Amoxicilina 500mg",lote:"AMX-212",stock:3,stock_min:10,precio_venta:12000,vencimiento:"2026-03-20",estado:"Critico",level:"danger"},{producto:"Ibuprofeno jarabe",lote:"IBU-808",stock:10,stock_min:8,precio_venta:8500,vencimiento:"2026-03-05",estado:"Por vencer",level:"warn"},{producto:"Vitamina C",lote:"VIT-123",stock:45,stock_min:10,precio_venta:15000,vencimiento:"2026-11-22",estado:"Normal",level:"ok"}]};
let isEditMode=false;
let originalKey={producto:"",lote:""};
function logout(){localStorage.removeItem("usuario");localStorage.removeItem("rol");localStorage.removeItem("empresa");window.location.href="index.html"}
function guard(){if(!localStorage.getItem("usuario")){window.location.href="index.html"}}
function badge(level,text){return `<span class='badge ${level||"ok"}'>${text||"Normal"}</span>`}
function money(v){
  var n=Number(v);
  if(!isFinite(n) || isNaN(n)) n=0;
  return "$"+n.toLocaleString("es-CO");
}
function normalizeEmpresaForApi(raw){
  var s=String(raw||"").trim();
  if(!s) return "";
  var n=s.toLowerCase();
  if(n==="general"||n==="sede principal"||n==="todas"||n==="todos") return "";
  return s;
}
function downloadBlob_(blob, filename){
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 500);
}
function csvEscape_(v){
  var s=String(v==null?"":v);
  if(/["";\n\r]/.test(s)) s="\""+s.replace(/\"/g,"\"\"")+"\"";
  return s;
}
function exportInventoryExcel(){
  var rows=window.__rowsCache||[];
  if(!rows.length){ showToast("No hay inventario para exportar"); return; }
  var headers=["Producto","Lote","Stock","Stock min","Precio venta","Vencimiento","Estado"];
  var lines=[];
  lines.push(headers.map(csvEscape_).join(";"));
  rows.forEach(function(r){
    lines.push([
      r.producto||"",
      r.lote||"",
      (r.stock==null?0:r.stock),
      (r.stock_min==null?0:r.stock_min),
      (isFinite(Number(r.precio_venta))?Number(r.precio_venta):0),
      r.vencimiento||"",
      r.estado||""
    ].map(csvEscape_).join(";"));
  });
  var csv="\uFEFF"+lines.join("\r\n");
  var empresa=normalizeEmpresaForApi(localStorage.getItem("empresa")||"");
  var stamp=new Date().toISOString().slice(0,10);
  var fname="inventario"+(empresa?("-"+empresa.replace(/[^a-z0-9]+/gi,"_")):"")+"-"+stamp+".csv";
  downloadBlob_(new Blob([csv],{type:"text/csv;charset=utf-8"}), fname);
}
function escapeHtml_(s){
  return String(s==null?"":s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/\x27/g,"&#39;");
}
function exportInventoryPdf(){
  var rows=window.__rowsCache||[];
  if(!rows.length){ showToast("No hay inventario para exportar"); return; }
  var empresa=normalizeEmpresaForApi(localStorage.getItem("empresa")||"");
  var now=new Date();
  var html="<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\">"+
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"+
    "<title>Inventario</title>"+
    "<style>"+
    "body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:18px}"+
    "h1{font-size:18px;margin:0 0 6px}"+
    ".meta{color:#475569;font-size:12px;margin:0 0 12px}"+
    "table{width:100%;border-collapse:collapse;font-size:12px}"+
    "th,td{border-bottom:1px solid #e2e8f0;padding:8px 6px;text-align:left;vertical-align:top}"+
    "th{background:#f8fafc}"+
    ".right{text-align:right}"+
    "@media print{button{display:none} body{padding:0}}"+
    "</style></head><body>"+
    "<button onclick=\"window.print()\">Imprimir / Guardar como PDF</button>"+
    "<h1>Inventario FarmaPOS</h1>"+
    "<div class=\"meta\">"+(empresa?("Empresa: "+escapeHtml_(empresa)+" | "):"")+"Generado: "+escapeHtml_(now.toLocaleString("es-CO"))+"</div>"+
    "<table><thead><tr>"+
    "<th>Producto</th><th>Lote</th><th class=\"right\">Stock</th><th class=\"right\">Min</th><th class=\"right\">Precio</th><th>Vencimiento</th><th>Estado</th>"+
    "</tr></thead><tbody>";
  rows.forEach(function(r){
    var precio=isFinite(Number(r.precio_venta))?Number(r.precio_venta):0;
    html+="<tr>"+
      "<td>"+escapeHtml_(r.producto||"-")+"</td>"+
      "<td>"+escapeHtml_(r.lote||"-")+"</td>"+
      "<td class=\"right\">"+escapeHtml_(String(r.stock==null?0:r.stock))+"</td>"+
      "<td class=\"right\">"+escapeHtml_(String(r.stock_min==null?0:r.stock_min))+"</td>"+
      "<td class=\"right\">"+escapeHtml_(money(precio))+"</td>"+
      "<td>"+escapeHtml_(r.vencimiento||"-")+"</td>"+
      "<td>"+escapeHtml_(r.estado||"")+"</td>"+
      "</tr>";
  });
  html+="</tbody></table></body></html>";
  var w=window.open("","_blank");
  if(!w){ alert("El navegador bloqueo la ventana emergente. Permite popups para exportar a PDF."); return; }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
function showToast(message){
  const t=document.getElementById("toast");
  t.textContent=message;
  t.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>t.classList.remove("show"),2200);
}
function todayIso(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function validateForm(payload){
  if(!payload.producto) return "Debes ingresar el nombre del producto.";
  if(!payload.lote) return "Debes ingresar el lote.";
  if(payload.stock < 0) return "Stock no puede ser negativo.";
  if(payload.stock_min < 0) return "Stock minimo no puede ser negativo.";
  if(payload.precio_venta < 0) return "Precio no puede ser negativo.";
  if(payload.vencimiento && payload.vencimiento < todayIso()) return "La fecha de vencimiento no puede ser pasada.";
  return "";
}
function resetForm(){
  document.getElementById("fProducto").value="";
  document.getElementById("fLote").value="";
  document.getElementById("fStock").value="";
  document.getElementById("fMin").value="";
  document.getElementById("fPrecio").value="";
  document.getElementById("fVence").value="";
  document.getElementById("formMsg").textContent="";
  isEditMode=false;
  originalKey={producto:"",lote:""};
  document.getElementById("saveBtn").textContent="Guardar";
  document.getElementById("cancelBtn").style.display="none";
}
function startEdit(producto,lote){
  const rows=window.__rowsCache||[];
  const item=rows.find(r=>(r.producto||"")===producto && (r.lote||"")===lote);
  if(!item) return;
  isEditMode=true;
  originalKey={producto:producto,lote:lote};
  document.getElementById("fProducto").value=item.producto||"";
  document.getElementById("fLote").value=item.lote||"";
  document.getElementById("fStock").value=Number(item.stock||0);
  document.getElementById("fMin").value=Number(item.stock_min||0);
  document.getElementById("fPrecio").value=Number(item.precio_venta||0);
  document.getElementById("fVence").value=item.vencimiento && item.vencimiento!=="-" ? item.vencimiento : "";
  document.getElementById("saveBtn").textContent="Guardar cambios";
  document.getElementById("cancelBtn").style.display="inline-block";
  document.getElementById("formMsg").textContent="Editando producto seleccionado.";
}
function cancelEdit(){
  resetForm();
}
async function saveProduct(){
  const formMsg=document.getElementById("formMsg");
  const payload={
    action:isEditMode ? "update_inventory" : "add_inventory",
    empresa:normalizeEmpresaForApi(localStorage.getItem("empresa")||""),
    producto:document.getElementById("fProducto").value.trim(),
    lote:document.getElementById("fLote").value.trim(),
    stock:Number(document.getElementById("fStock").value||0),
    stock_min:Number(document.getElementById("fMin").value||0),
    precio_venta:Number(document.getElementById("fPrecio").value||0),
    vencimiento:document.getElementById("fVence").value
  };
  if(isEditMode){
    payload.original_producto=originalKey.producto;
    payload.original_lote=originalKey.lote;
  }

  const validationError=validateForm(payload);
  if(validationError){
    formMsg.textContent=validationError;
    return;
  }

  formMsg.textContent="Guardando...";
  try{
    const qs = new URLSearchParams();
    Object.keys(payload).forEach((k) => qs.append(k, payload[k] == null ? "" : String(payload[k])));
    const res=await fetch(`${API_URL}?${qs.toString()}`,{cache:"no-store"});
    const raw=await res.text();
    let data={};
    try{
      data=JSON.parse(raw);
    }catch(parseErr){
      throw new Error("Respuesta no JSON del servidor");
    }

    if(!res.ok){
      throw new Error("HTTP "+res.status);
    }

    if(Array.isArray(data)){
      formMsg.textContent="El Web App no esta actualizado. Re-publica el Apps Script (Deploy > Manage deployments > Edit > Deploy).";
      return;
    }

    if(!data.ok){
      formMsg.textContent=data.error||"No se pudo guardar. Verifica que el deployment sea el mas reciente.";
      return;
    }
    formMsg.textContent=isEditMode ? "Producto actualizado correctamente." : "Producto guardado correctamente.";
    showToast(isEditMode ? "Producto actualizado" : "Producto agregado");
    resetForm();
    loadInventory();
  }catch(e){
    formMsg.textContent="Error enviando datos al servidor: " + (e.message || "desconocido");
  }
}
async function deleteProduct(producto,lote){
  if(!confirm(`Eliminar ${producto} (${lote})?`)) return;
  const qs = new URLSearchParams({
    action:"delete_inventory",
    empresa:normalizeEmpresaForApi(localStorage.getItem("empresa")||""),
    producto:producto||"",
    lote:lote||""
  });
  try{
    const res=await fetch(`${API_URL}?${qs.toString()}`,{cache:"no-store"});
    const data=await res.json();
    if(!data.ok){
      showToast(data.error||"No se pudo eliminar");
      return;
    }
    showToast("Producto eliminado");
    if(isEditMode && originalKey.producto===producto && originalKey.lote===lote) resetForm();
    loadInventory();
  }catch(e){
    showToast("Error eliminando producto");
  }
}
function render(data){
  const s=data.summary||{};
  document.getElementById("totalProducts").textContent=Number(s.totalProducts||0).toLocaleString("es-CO");
  document.getElementById("criticalStock").textContent=Number(s.criticalStock||0).toLocaleString("es-CO");
  document.getElementById("expiringCount").textContent=Number(s.expiringCount||0).toLocaleString("es-CO");
  const tbody=document.getElementById("invRows");
  tbody.innerHTML="";
  window.__rowsCache=data.rows||[];
  (data.rows||[]).forEach(r=>{
    const p=(r.producto||"").replace(/'/g,"\\'");
    const l=(r.lote||"").replace(/'/g,"\\'");
    tbody.innerHTML+=`<tr><td>${r.producto||"-"}</td><td>${r.lote||"-"}</td><td>${r.stock??0}</td><td>${r.stock_min??0}</td><td>${money(r.precio_venta)}</td><td>${r.vencimiento||"-"}</td><td>${badge(r.level,r.estado)}</td><td><button class="btn-small btn-edit" onclick="startEdit('${p}','${l}')">Editar</button> <button class="btn-small btn-delete" onclick="deleteProduct('${p}','${l}')">Eliminar</button></td></tr>`;
  });
  if(!(data.rows||[]).length){tbody.innerHTML="<tr><td colspan='8'>Sin productos.</td></tr>"}
}
async function loadInventory(){
  const sync=document.getElementById("sync");
  const empresa=encodeURIComponent(normalizeEmpresaForApi(localStorage.getItem("empresa")||""));
  try{
    const res=await fetch(`${API_URL}?action=inventory&empresa=${empresa}`,{cache:"no-store"});
    if(!res.ok) throw new Error("bad response");
    const data=await res.json();
    render(data && data.rows ? data : fallback);
    sync.textContent=`Ultima sincronizacion: ${new Date().toLocaleTimeString("es-CO")}`;
  }catch(e){
    render(fallback);
    sync.textContent="Modo local: sin conexion con la nube";
  }
}
guard();
resetForm();
loadInventory();

function toggleSidebar(forceOpen){
  const layout=document.querySelector(".layout");
  if(!layout) return;
  if(typeof forceOpen === "boolean") layout.classList.toggle("sidebar-open", forceOpen);
  else layout.classList.toggle("sidebar-open");
}
window.addEventListener("resize",()=>{ if(window.innerWidth>860) toggleSidebar(false); });
document.querySelectorAll(".menu a").forEach(a=>a.addEventListener("click",()=>{ if(window.innerWidth<=860) toggleSidebar(false); }));

