var API_URL = "https://script.google.com/macros/s/AKfycby9Rf23ERVyl9LwZvQBycddgtxyyx3R8OsqlX0Fyyr7hKuYqnKnEJTGDXH72HyFsrSg/exec";
var fallback={summary:{totalProducts:120,criticalStock:9,expiringCount:18},rows:[{producto:"Amoxicilina 500mg",lote:"AMX-212",stock:3,stock_min:10,precio_venta:12000,vencimiento:"2026-03-20",estado:"Critico",level:"danger"},{producto:"Ibuprofeno jarabe",lote:"IBU-808",stock:10,stock_min:8,precio_venta:8500,vencimiento:"2026-03-05",estado:"Por vencer",level:"warn"},{producto:"Vitamina C",lote:"VIT-123",stock:45,stock_min:10,precio_venta:15000,vencimiento:"2026-11-22",estado:"Normal",level:"ok"}]};
var isEditMode=false;
var originalKey={producto:"",lote:""};
var scanStreamInv=null, scanLoopInv=null, scanReaderInv=null, zxingLibInv=null;

function logout(){localStorage.removeItem("usuario");localStorage.removeItem("rol");localStorage.removeItem("empresa");window.location.href="index.html"}
function guard(){if(!localStorage.getItem("usuario")){window.location.href="index.html"}}
function badge(level,text){return "<span class='badge "+(level||"ok")+"'>"+(text||"Normal")+"</span>"}
function money(v){
  var n=Number(v);
  if(!isFinite(n) || isNaN(n)) n=0;
  return "$"+n.toLocaleString("es-CO");
}
function normalizeEmpresaForApi(raw){
  var s=String(raw||"").trim();
  if(!s) return "";
  // Corrige valores guardados como URL-encoded (ej: "Sede%20principal" o "Sede%2520principal"),
  // para evitar doble encode (%2520) y filtros que no coinciden en el backend.
  try{
    var maybe=s.replace(/\+/g," ");
    var v=maybe;
    // Decodifica varias veces por si viene doble/triple encoded.
    for(var i=0;i<3 && /%[0-9a-fA-F]{2}/.test(v); i++){
      var dec=decodeURIComponent(v);
      if(dec===v) break;
      v=dec;
    }
    s=v;
  }catch(_){
    s=s.replace(/\+/g," ");
  }
  s=String(s||"").trim();
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
    "body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;display:flex;justify-content:center;}"+
    ".wrap{width:960px;max-width:100%;}"+
    "h1{font-size:20px;margin:0 0 8px}"+
    ".meta{color:#475569;font-size:12px;margin:0 0 14px}"+
    ".actions{margin-bottom:12px}"+
    ".print-btn{padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;cursor:pointer}"+
    "table{width:100%;border-collapse:collapse;font-size:12px}"+
    "th,td{border-bottom:1px solid #e2e8f0;padding:8px 6px;text-align:left;vertical-align:top}"+
    "th{background:#f8fafc}"+
    ".right{text-align:right}"+
    "@media print{.actions{display:none} body{padding:0}}"+
    "</style></head><body>"+
    "<div class=\"wrap\">"+
    "<div class=\"actions\"><button class=\"print-btn\" onclick=\"window.print()\">Imprimir / Guardar como PDF</button></div>"+
    "<h1>Inventario FarmaPOS</h1>"+
    "<div class=\"meta\">"+(empresa?("Empresa: "+escapeHtml_(empresa)+" | "):"")+"Generado: "+escapeHtml_(now.toLocaleString("es-CO"))+"</div>"+
    "<table><thead><tr>"+
    "<th>Producto</th><th>Lote</th><th class=\"right\">Stock</th><th class=\"right\">Min</th><th class=\"right\">Precio</th><th>Vencimiento</th><th>Estado</th>"+
    "</tr></thead><tbody>";
  rows.forEach(function(r){
    var precio = isFinite(Number(r.precio_venta)) ? Number(r.precio_venta) : 0;
    html += "<tr>" +
      "<td>" + escapeHtml_(r.producto || "-") + "</td>" +
      "<td>" + escapeHtml_(r.lote || "-") + "</td>" +
      "<td class=\"right\">" + escapeHtml_(String(r.stock == null ? 0 : r.stock)) + "</td>" +
      "<td class=\"right\">" + escapeHtml_(String(r.stock_min == null ? 0 : r.stock_min)) + "</td>" +
      "<td class=\"right\">" + escapeHtml_(money(precio)) + "</td>" +
      "<td>" + escapeHtml_(r.vencimiento || "-") + "</td>" +
      "<td>" + escapeHtml_(r.estado || "") + "</td>" +
    "</tr>";
  });
  html += "</tbody></table></div></body></html>";
  var w = window.open("", "_blank");
  if(!w){
    alert("El navegador bloqueo la ventana emergente. Permite popups para exportar a PDF.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
function showToast(message){
  var t=document.getElementById("toast");
  if(!t) return;
  t.textContent=message;
  t.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(function(){ t.classList.remove("show"); },2200);
}

function ensureZXingInv(){
  if(zxingLibInv && zxingLibInv.BrowserMultiFormatReader) return Promise.resolve(zxingLibInv);
  if(window.ZXing && window.ZXing.BrowserMultiFormatReader){
    zxingLibInv = window.ZXing;
    return Promise.resolve(zxingLibInv);
  }
  return new Promise(function(resolve,reject){
    var script=document.createElement("script");
    script.src="https://unpkg.com/@zxing/library@0.21.2/umd/index.min.js";
    script.onload=function(){ zxingLibInv = window.ZXing; resolve(zxingLibInv); };
    script.onerror=function(){ reject(new Error("No se pudo cargar el lector de cÃ³digos.")); };
    document.head.appendChild(script);
  });
}

function openScanModalInv(){
  var modal=document.getElementById("scanModalInv");
  if(!modal) return;
  modal.classList.add("active");
  var status=document.getElementById("scanStatusInv");
  if(status) status.textContent="Apunta la cÃ¡mara al cÃ³digo de barras.";
  startScanCameraInv();
}

async function startScanCameraInv(){
  var video=document.getElementById("scanVideoInv");
  var status=document.getElementById("scanStatusInv");
  if(!video) return;
  try{
    stopScanCameraInv(true);
    if(status) status.textContent="Activando cÃ¡mara...";

    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      if(status) status.textContent="Tu navegador no permite usar la cÃ¡mara.";
      return;
    }

    var canDetect = "BarcodeDetector" in window;
    if(!canDetect){
      if(status) status.textContent="Modo compatibilidad: lector universal activo...";
      try{
        var ZX = await ensureZXingInv();
        scanReaderInv = new ZX.BrowserMultiFormatReader();
        scanReaderInv.decodeFromVideoDevice(null, video, function(result, err){
          if(result){
            handleDetectedCodeInv(result.getText());
          }else if(status && err && !(err instanceof ZX.NotFoundException)){
            status.textContent="Sin lectura, mueve el cÃ³digo frente a la cÃ¡mara.";
          }
        });
      }catch(e){
        if(status) status.textContent="No se pudo abrir la cÃ¡mara: "+(e && e.message ? e.message : "error");
      }
      return;
    }

    scanStreamInv = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});
    video.srcObject = scanStreamInv;
    await video.play();
    if(status) status.textContent="Buscando cÃ³digo...";

    var detector = new BarcodeDetector({formats:["ean_13","ean_8","code_128","code_39","upc_a","upc_e","qr_code"]});
    var loop = async function(){
      if(!scanStreamInv) return;
      try{
        var codes = await detector.detect(video);
        if(codes && codes.length){
          handleDetectedCodeInv(codes[0].rawValue || codes[0].rawvalue || "");
          return;
        }
      }catch(_){}
      scanLoopInv = requestAnimationFrame(loop);
    };
    scanLoopInv = requestAnimationFrame(loop);
  }catch(e){
    if(status) status.textContent="No se pudo usar la cÃ¡mara: "+(e && e.message ? e.message : "permiso denegado");
  }
}

function handleDetectedCodeInv(code){
  var clean=String(code||"").trim();
  var status=document.getElementById("scanStatusInv");
  if(!clean){
    if(status) status.textContent="No se leyÃ³ el cÃ³digo. Intenta de nuevo.";
    return;
  }
  if(status) status.textContent="CÃ³digo detectado: "+clean;
  var input=document.getElementById("fCodigo");
  if(input) input.value=clean;
  stopScanCameraInv();
}

function stopScanCameraInv(keepModal){
  if(scanLoopInv){ cancelAnimationFrame(scanLoopInv); scanLoopInv=null; }
  if(scanReaderInv){ try{ scanReaderInv.reset(); }catch(_){ } scanReaderInv=null; }
  if(scanStreamInv){
    try{ scanStreamInv.getTracks().forEach(function(t){ t.stop(); }); }catch(_){}
    scanStreamInv=null;
  }
  var video=document.getElementById("scanVideoInv");
  if(video) video.srcObject=null;
  if(!keepModal){
    var modal=document.getElementById("scanModalInv");
    if(modal) modal.classList.remove("active");
  }
}

function todayIso(){
  var d=new Date();
  var y=d.getFullYear();
  var m=("0"+(d.getMonth()+1)).slice(-2);
  var day=("0"+d.getDate()).slice(-2);
  return y+"-"+m+"-"+day;
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
  var bc=document.getElementById("fCodigo");
  if(bc) bc.value="";
  var el=null;
  el=document.getElementById("fProducto"); if(el) el.value="";
  el=document.getElementById("fLote"); if(el) el.value="";
  el=document.getElementById("fStock"); if(el) el.value="";
  el=document.getElementById("fMin"); if(el) el.value="";
  el=document.getElementById("fPrecio"); if(el) el.value="";
  el=document.getElementById("fVence"); if(el) el.value="";
  el=document.getElementById("formMsg"); if(el) el.textContent="";
  isEditMode=false;
  originalKey={producto:"",lote:""};
  el=document.getElementById("saveBtn"); if(el) el.textContent="Guardar";
  el=document.getElementById("cancelBtn"); if(el) el.style.display="none";
}
function startEdit(producto,lote){
  var rows=window.__rowsCache||[];
  var item=null;
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    if((r.producto||"")===producto && (r.lote||"")===lote){ item=r; break; }
  }
  if(!item) return;
  isEditMode=true;
  originalKey={producto:producto,lote:lote};
  var bc=document.getElementById("fCodigo");
  if(bc) bc.value=item.codigo||"";
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
function saveProduct(){
  var formMsg=document.getElementById("formMsg");
  var payload={
    action:isEditMode ? "update_inventory" : "add_inventory",
    empresa:normalizeEmpresaForApi(localStorage.getItem("empresa")||""),
    codigo:document.getElementById("fCodigo") ? document.getElementById("fCodigo").value.trim() : "",
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
  var validationError=validateForm(payload);
  if(validationError){
    formMsg.textContent=validationError;
    return;
  }
  formMsg.textContent="Guardando...";
  var qs = new URLSearchParams();
  Object.keys(payload).forEach(function(k){ qs.append(k, payload[k] == null ? "" : String(payload[k])); });
  fetch(API_URL+"?"+qs.toString(),{cache:"no-store"})
    .then(function(res){
      return res.text().then(function(raw){ return {res:res, raw:raw}; });
    })
    .then(function(ctx){
      var res=ctx.res;
      var raw=ctx.raw;
      var data={};
      try{ data=JSON.parse(raw); }
      catch(parseErr){ throw new Error("Respuesta no JSON del servidor"); }
      if(!res.ok){ throw new Error("HTTP "+res.status); }
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
    })
    .catch(function(e){
      formMsg.textContent="Error enviando datos al servidor: " + (e && e.message ? e.message : "desconocido");
    });
}
function deleteProduct(producto,lote){
  if(!confirm("Eliminar "+producto+" ("+lote+")?")) return;
  var qs = new URLSearchParams({
    action:"delete_inventory",
    empresa:normalizeEmpresaForApi(localStorage.getItem("empresa")||""),
    producto:producto||"",
    lote:lote||""
  });
  fetch(API_URL+"?"+qs.toString(),{cache:"no-store"})
    .then(function(res){ return res.json(); })
    .then(function(data){
      if(!data.ok){
        showToast(data.error||"No se pudo eliminar");
        return;
      }
      showToast("Producto eliminado");
      if(isEditMode && originalKey.producto===producto && originalKey.lote===lote) resetForm();
      loadInventory();
    })
    .catch(function(){
      showToast("Error eliminando producto");
    });
}
function render(data){
  data=data||{};
  var s=data.summary||{};
  var el=null;
  el=document.getElementById("totalProducts"); if(el) el.textContent=Number(s.totalProducts||0).toLocaleString("es-CO");
  el=document.getElementById("criticalStock"); if(el) el.textContent=Number(s.criticalStock||0).toLocaleString("es-CO");
  el=document.getElementById("expiringCount"); if(el) el.textContent=Number(s.expiringCount||0).toLocaleString("es-CO");
  var tbody=document.getElementById("invRows");
  if(!tbody) return;
  window.__rowsCache=data.rows||[];
  var html="";
  (data.rows||[]).forEach(function(r){
    var p=(r.producto||"").replace(/'/g,"\\'");
    var l=(r.lote||"").replace(/'/g,"\\'");
    html +=
      "<tr><td>"+(r.producto||"-")+"</td>"+
      "<td>"+(r.lote||"-")+"</td>"+
      "<td>"+(r.stock==null?0:r.stock)+"</td>"+
      "<td>"+(r.stock_min==null?0:r.stock_min)+"</td>"+
      "<td>"+money(r.precio_venta)+"</td>"+
      "<td>"+(r.vencimiento||"-")+"</td>"+
      "<td>"+badge(r.level,r.estado)+"</td>"+
      "<td><button class=\"btn-small btn-edit\" onclick=\"startEdit('"+p+"','"+l+"')\">Editar</button> <button class=\"btn-small btn-delete\" onclick=\"deleteProduct('"+p+"','"+l+"')\">Eliminar</button></td></tr>";
  });
  tbody.innerHTML = html || "<tr><td colspan='8'>Sin productos.</td></tr>";
}
function showInvRowMessage(message){
  var tbody=document.getElementById("invRows");
  if(!tbody) return;
  tbody.innerHTML="<tr><td colspan='8'>"+String(message||"")+"</td></tr>";
}
function loadInventory(){
  var sync=document.getElementById("sync");
  var empresaRaw=normalizeEmpresaForApi(localStorage.getItem("empresa")||"");
  var empresa=encodeURIComponent(empresaRaw);
  var cacheKey="inventory_cache:"+(empresaRaw||"general");
  var cached=null;
  try{ cached=JSON.parse(localStorage.getItem(cacheKey)||"null"); }catch(_){ cached=null; }
  var hasCache=!!(cached && Array.isArray(cached.rows));

  if(hasCache){
    render(cached);
    if(sync) sync.textContent="Mostrando inventario local ("+(cached.rows?cached.rows.length:0)+" items). Sincronizando...";
  }else{
    showInvRowMessage("Cargando inventario...");
    if(sync) sync.textContent="Sincronizando... (empresa: "+(empresaRaw||"general")+")";
  }

  var controller=null;
  var timeoutId=null;
  if(typeof AbortController !== "undefined"){
    controller=new AbortController();
    timeoutId=setTimeout(function(){ try{ controller.abort(); }catch(_){} }, 10000);
  }
  var opts={cache:"no-store"};
  if(controller) opts.signal=controller.signal;

  fetch(API_URL+"?action=inventory&empresa="+empresa, opts)
     .then(function(res){
       if(!res.ok) throw new Error("HTTP "+res.status);
       return res.json();
     })
     .then(function(data){
       if(timeoutId) clearTimeout(timeoutId);
       if(data && Array.isArray(data.rows)){
         render(data);
         try{ localStorage.setItem(cacheKey, JSON.stringify(data)); }catch(_){}
       }else{
         render(fallback);
       }
       if(sync){
         var count = (data && Array.isArray(data.rows)) ? data.rows.length : 0;
         sync.textContent="Nube OK ("+count+" items) Â· "+new Date().toLocaleTimeString("es-CO");
       }
     })
     .catch(function(e){
       if(timeoutId) clearTimeout(timeoutId);
       if(!hasCache) render(fallback);
       if(sync){
         var emsg = (e && e.message) ? e.message : "Sin conexion con la nube";
         sync.textContent=(e && e.name==="AbortError")
           ? "Sin conexion (tiempo de espera agotado). Usando inventario local."
           : ("Modo local: "+emsg+". Usando inventario local.");
       }
       try{ showToast("Sin conexion. Usando inventario local."); }catch(_){}
     });
}
guard();
resetForm();
loadInventory();

var scanModal=document.getElementById("scanModalInv");
if(scanModal){
  scanModal.addEventListener("click",function(e){ if(e.target===scanModal) stopScanCameraInv(); });
}
window.addEventListener("beforeunload",function(){ stopScanCameraInv(); });

// Muestra errores JS en pantalla (evita depender de la consola del navegador).
window.addEventListener("error",function(ev){
  var msg=ev && ev.message ? ev.message : "Error desconocido";
  var sync=document.getElementById("sync");
  if(sync) sync.textContent="Error JS: "+msg;
});
window.addEventListener("unhandledrejection",function(ev){
  var reason=ev && ev.reason ? ev.reason : null;
  var msg=(reason && reason.message) ? reason.message : String(reason || "Error desconocido");
  var sync=document.getElementById("sync");
  if(sync) sync.textContent="Error: "+msg;
});

function toggleSidebar(forceOpen){
  var layout=document.querySelector(".layout");
  if(!layout) return;
  if(typeof forceOpen === "boolean") layout.classList.toggle("sidebar-open", forceOpen);
  else layout.classList.toggle("sidebar-open");
}
window.addEventListener("resize",function(){ if(window.innerWidth>860) toggleSidebar(false); });
Array.prototype.forEach.call(document.querySelectorAll(".menu a"),function(a){
  a.addEventListener("click",function(){ if(window.innerWidth<=860) toggleSidebar(false); });
});
function showToast(message){
  var t=document.getElementById("toast");
  if(!t) return;
  t.textContent=message;
  t.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(function(){ t.classList.remove("show"); },2200);
}

