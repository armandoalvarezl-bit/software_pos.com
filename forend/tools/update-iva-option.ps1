$ErrorActionPreference = 'Stop'

function Get-EncodingFromBytes([byte[]]$b){
  if($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF){ return New-Object System.Text.UTF8Encoding($true) }
  if($b.Length -ge 2 -and $b[0] -eq 0xFF -and $b[1] -eq 0xFE){ return New-Object System.Text.UnicodeEncoding($false,$true) }
  if($b.Length -ge 2 -and $b[0] -eq 0xFE -and $b[1] -eq 0xFF){ return New-Object System.Text.UnicodeEncoding($true,$true) }
  return New-Object System.Text.UTF8Encoding($false)
}

function Replace-Literal([string]$label, [ref]$content, [string]$needle, [string]$repl){
  if($content.Value.IndexOf($needle, [StringComparison]::Ordinal) -lt 0){
    throw "No encontre el patron literal: $label"
  }
  $content.Value = $content.Value.Replace($needle, $repl)
}

function Replace-RegexOnce([string]$label, [ref]$content, [string]$pattern, [string]$repl){
  $r = New-Object System.Text.RegularExpressions.Regex($pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $m = $r.Match($content.Value)
  if(-not $m.Success){ throw "No encontre el patron regex: $label" }
  $content.Value = $r.Replace($content.Value, $repl, 1)
}

# ---- pos.html ----
$posPath = Join-Path (Get-Location) 'pos.html'
Copy-Item $posPath (Join-Path (Get-Location) 'pos.html.bak-iva-2026-03-16') -Force
$posBytes = [IO.File]::ReadAllBytes($posPath)
$posEnc = Get-EncodingFromBytes $posBytes
$pos = [ref]$posEnc.GetString($posBytes)
$posOrig = $pos.Value
$nl = if($pos.Value.Contains("`r`n")){"`r`n"} else {"`n"}

# UI: checkbox + wrap impuesto row
$metodoLine = '<div class="kv"><label class="k" for="metodo">Metodo</label><span class="v"><select id="metodo" class="input"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></span></div>'
$ivaLine = '<div class="kv"><label class="k" for="includeTax">Incluir IVA (19%)</label><span class="v"><input id="includeTax" type="checkbox" checked></span></div>'
if($pos.Value.IndexOf('id="includeTax"', [StringComparison]::Ordinal) -lt 0){
  Replace-Literal 'insert includeTax checkbox' $pos $metodoLine ($metodoLine + $nl + '        ' + $ivaLine)
}

$taxRowNeedle = '<div class="row"><span class="label">Impuesto</span><span class="val" id="impuesto">$0</span></div>'
$taxRowRepl = '<div class="row" id="impuestoRow"><span class="label">Impuesto</span><span class="val" id="impuesto">$0</span></div>'
if($pos.Value.IndexOf('id="impuestoRow"', [StringComparison]::Ordinal) -lt 0){
  Replace-Literal 'wrap impuesto row' $pos $taxRowNeedle $taxRowRepl
}

# Print: ids for tax rows
if($pos.Value.IndexOf('id="printImpuestoRow"', [StringComparison]::Ordinal) -lt 0){
  Replace-Literal 'A4 impuesto row id' $pos '<div class="p-row"><div class="p-label">Impuesto</div><div class="p-value" id="printImpuesto">$0</div></div>' '<div class="p-row" id="printImpuestoRow"><div class="p-label">Impuesto</div><div class="p-value" id="printImpuesto">$0</div></div>'
}
if($pos.Value.IndexOf('id="posPrintImpuestoRow"', [StringComparison]::Ordinal) -lt 0){
  Replace-Literal 'POS impuesto row id' $pos '<div class="pos-line"><span>Impuesto</span><span id="posPrintImpuesto">$0</span></div>' '<div class="pos-line" id="posPrintImpuestoRow"><span>Impuesto</span><span id="posPrintImpuesto">$0</span></div>'
}

# Prefs: replace load/save functions
Replace-RegexOnce 'loadPrintPrefs rewrite' $pos 'function loadPrintPrefs\(\)\{.*?\}\s*\n\s*function savePrintPrefs\(\)' (@(
  'function loadPrintPrefs(){',
  '  const raw = localStorage.getItem(PRINT_PREFS_KEY);',
  '  let prefs = { enabled: true, format: "pos", taxEnabled: true };',
  '  if(raw){',
  '    try{',
  '      const parsed = JSON.parse(raw);',
  '      prefs.enabled = parsed && parsed.enabled !== false;',
  '      prefs.format = parsed && (parsed.format === "a4" ? "a4" : "pos");',
  '      prefs.taxEnabled = !(parsed && parsed.taxEnabled === false);',
  '    }catch(_){ }',
  '  }',
  '  const enabledEl = document.getElementById("autoPrintEnabled");',
  '  const formatEl = document.getElementById("autoPrintFormat");',
  '  const taxEl = document.getElementById("includeTax");',
  '  if(enabledEl) enabledEl.checked = !!prefs.enabled;',
  '  if(formatEl) formatEl.value = prefs.format;',
  '  if(taxEl) taxEl.checked = !!prefs.taxEnabled;',
  '}',
  '',
  'function savePrintPrefs(){'
) -join $nl)

Replace-RegexOnce 'savePrintPrefs rewrite' $pos 'function savePrintPrefs\(\)\{.*?\}\s*\n\s*function getAutoPrintMode\(\)' (@(
  'function savePrintPrefs(){',
  '  const enabledEl = document.getElementById("autoPrintEnabled");',
  '  const formatEl = document.getElementById("autoPrintFormat");',
  '  const taxEl = document.getElementById("includeTax");',
  '  const prefs = {',
  '    enabled: enabledEl ? !!enabledEl.checked : true,',
  '    format: formatEl && formatEl.value === "a4" ? "a4" : "pos",',
  '    taxEnabled: taxEl ? !!taxEl.checked : true',
  '  };',
  '  localStorage.setItem(PRINT_PREFS_KEY, JSON.stringify(prefs));',
  '}',
  '',
  'function getAutoPrintMode(){'
) -join $nl)

# Helper: isTaxEnabled()
if($pos.Value -notmatch 'function isTaxEnabled\('){
  Replace-RegexOnce 'insert isTaxEnabled helper' $pos '(function escapeHtml_\(s\)\{.*?\}\s*)\n\s*function logout\(' ('$1' + $nl + @(
    'function isTaxEnabled(){',
    '  const el = document.getElementById("includeTax");',
    '  return el ? !!el.checked : true;',
    '}',
    ''
  ) -join $nl + $nl + 'function logout(')
}

# renderTotals tax optional + hide row
Replace-RegexOnce 'renderTotals tax calc' $pos '(function renderTotals\(\)\{.*?const subtotal = [^\n]*\n)(\s*const impuesto = subtotal \* TAX_RATE;\s*\n\s*const total = subtotal \+ impuesto;)' ('$1' + @(
  '  const applyTax = isTaxEnabled();',
  '  const impuesto = applyTax ? subtotal * TAX_RATE : 0;',
  '  const total = subtotal + impuesto;',
  '  const taxRow = document.getElementById("impuestoRow");',
  '  if(taxRow) taxRow.style.display = applyTax ? "" : "none";'
) -join $nl)

# currentTotalsFromItems signature + calc
Replace-RegexOnce 'currentTotalsFromItems signature' $pos 'function currentTotalsFromItems\(items\)\{' 'function currentTotalsFromItems(items, applyTax){'
Replace-RegexOnce 'currentTotalsFromItems calc' $pos '(function currentTotalsFromItems\(items, applyTax\)\{\s*\n\s*const subtotal = .*?\n)\s*const impuesto = subtotal \* TAX_RATE;\s*\n\s*const total = subtotal \+ impuesto;' ('$1' + @(
  '  const useTax = (applyTax == null) ? isTaxEnabled() : !!applyTax;',
  '  const impuesto = useTax ? subtotal * TAX_RATE : 0;',
  '  const total = subtotal + impuesto;'
) -join $nl)

# buildPrintData uses applyTax and adds fields
Replace-RegexOnce 'buildPrintData totals call' $pos '(const liveItems = cart\.map\(it => \(\{.*?\}\)\);\s*\n\s*)(const totals = currentTotalsFromItems\(liveItems\);)' ('$1' + 'const applyTax = isTaxEnabled();' + $nl + '  const totals = currentTotalsFromItems(liveItems, applyTax);')

if($pos.Value -notmatch 'aplica_iva'){ 
  Replace-RegexOnce 'buildPrintData add fields' $pos '(metodo: document\.getElementById\("metodo"\)\.value \|\| "Efectivo",\s*\n\s*items: liveItems,\s*\n)' ('$1' + '    aplica_iva: applyTax,' + $nl + '    iva_porcentaje: applyTax ? Math.round(TAX_RATE * 10000) / 100 : 0,' + $nl)
}

# cobrarVenta tax optional + payload fields + lastSale fields
Replace-RegexOnce 'cobrarVenta calc' $pos '(async function cobrarVenta\(\)\{.*?\n\s*const subtotal = cart\.reduce\(\(a,b\)=>a \+ Number\(b\.cantidad\|\|0\) \* Number\(b\.valor_unitario\|\|0\), 0\);\s*\n)\s*const impuesto = subtotal \* TAX_RATE;\s*\n\s*const total = subtotal \+ impuesto;' ('$1' + @(
  '  const applyTax = isTaxEnabled();',
  '  const totals = currentTotalsFromItems(cart, applyTax);',
  '  const subtotal = totals.subtotal;',
  '  const impuesto = totals.impuesto;',
  '  const total = totals.total;'
) -join $nl)

# payload: add iva flags
Replace-RegexOnce 'cobrarVenta payload add iva' $pos '(fecha: new Date\(\)\.toISOString\(\),\s*\n\s*items: JSON\.stringify\(cart\)\s*\n\s*\};)' ('fecha: new Date().toISOString(),' + $nl +
  '    aplica_iva: applyTax ? 1 : 0,' + $nl +
  '    iva_porcentaje: applyTax ? Math.round(TAX_RATE * 10000) / 100 : 0,' + $nl +
  '    subtotal: subtotal,' + $nl +
  '    impuesto: impuesto,' + $nl +
  '    total: total,' + $nl +
  '    items: JSON.stringify(cart)' + $nl +
  '  };')

# lastSale: impuesto should reflect totals; keep total from server if exists
Replace-RegexOnce 'cobrarVenta lastSale fields' $pos '(lastSale = \{\s*\n\s*ticketId: data\.sale_id \|\| "-",\s*\n\s*fecha: new Date\(\)\.toLocaleString\("es-CO"\),\s*\n\s*empresa: getCompanyNameForPrint\(\),\s*\n\s*cliente: payload\.cliente \|\| "MOSTRADOR",\s*\n\s*cajero: payload\.cajero \|\| "Usuario",\s*\n\s*metodo: payload\.metodo_pago \|\| "Efectivo",\s*\n\s*items: soldItems,\s*\n\s*subtotal: )subtotal(,\s*\n\s*impuesto: )0(,\s*\n\s*total: )Number\(data\.total \|\| total\)(,\s*\n\s*pago: paid,\s*\n\s*cambio: )paid - Number\(data\.total \|\| total\)' ('$1subtotal$2impuesto$3Number(data.total || total)$4paid - Number(data.total || total)')

# add aplica_iva to lastSale if not present
if($pos.Value -notmatch 'aplica_iva:'){ 
  Replace-RegexOnce 'add aplica_iva to lastSale' $pos '(metodo: payload\.metodo_pago \|\| "Efectivo",\s*\n)' ('$1' + '      aplica_iva: applyTax,' + $nl + '      iva_porcentaje: applyTax ? Math.round(TAX_RATE * 10000) / 100 : 0,' + $nl)
}

# Print renderers: toggle tax row visibility based on data.aplica_iva or current toggle
if($pos.Value -notmatch 'printImpuestoRow'){ throw 'printImpuestoRow missing (unexpected)'; }

if($pos.Value -notmatch 'const applyTax = \(data && data\.aplica_iva'){ 
  Replace-RegexOnce 'renderPrintTicket add applyTax' $pos '(function renderPrintTicket\(data\)\{\s*\n\s*const rows = document\.getElementById\("printRows"\);\s*\n\s*rows\.innerHTML = "";\s*\n)' ('$1' + '  const applyTax = (data && data.aplica_iva != null) ? !!data.aplica_iva : isTaxEnabled();' + $nl)
}

Replace-RegexOnce 'renderPrintTicket toggle tax row' $pos '(document\.getElementById\("printImpuesto"\)\.textContent = money\(data\.impuesto\);\s*\n)' ('$1' + '  const taxRowEl = document.getElementById("printImpuestoRow");' + $nl + '  if(taxRowEl) taxRowEl.style.display = applyTax ? "" : "none";' + $nl)

if($pos.Value -notmatch 'posPrintImpuestoRow'){ throw 'posPrintImpuestoRow missing (unexpected)'; }

if($pos.Value -notmatch 'const applyTax = \(data && data\.aplica_iva'){ 
  Replace-RegexOnce 'renderPrintPosTicket add applyTax' $pos '(function renderPrintPosTicket\(data\)\{\s*\n\s*const rows = document\.getElementById\("posPrintRows"\);\s*\n\s*rows\.innerHTML = "";\s*\n)' ('$1' + '  const applyTax = (data && data.aplica_iva != null) ? !!data.aplica_iva : isTaxEnabled();' + $nl)
}

Replace-RegexOnce 'renderPrintPosTicket toggle tax row' $pos '(document\.getElementById\("posPrintImpuesto"\)\.textContent = money\(data\.impuesto\);\s*\n)' ('$1' + '  const taxRowEl = document.getElementById("posPrintImpuestoRow");' + $nl + '  if(taxRowEl) taxRowEl.style.display = applyTax ? "" : "none";' + $nl)

# Load event: add listener for includeTax
if($pos.Value -notmatch 'includeTax'){ throw 'includeTax not found after insertion'; }
if($pos.Value -notmatch 'includeTax\"\)\.addEventListener'){ 
  Replace-RegexOnce 'add includeTax listener' $pos '(document\.getElementById\("autoPrintFormat"\)\.addEventListener\("change", savePrintPrefs\);\s*\n)' ('$1' + '  const taxEl = document.getElementById("includeTax");' + $nl + '  if(taxEl) taxEl.addEventListener("change", () => { savePrintPrefs(); renderTotals(); });' + $nl)
}

# Write pos.html
if($pos.Value -eq $posOrig){ throw 'pos.html sin cambios (ya estaba aplicado?)' }
[IO.File]::WriteAllBytes($posPath, $posEnc.GetBytes($pos.Value))

# ---- google-apps-script.gs ----
$gsPath = Join-Path (Get-Location) 'google-apps-script.gs'
Copy-Item $gsPath (Join-Path (Get-Location) 'google-apps-script.gs.bak-iva-2026-03-16') -Force
$gsBytes = [IO.File]::ReadAllBytes($gsPath)
$gsEnc = Get-EncodingFromBytes $gsBytes
$gs = [ref]$gsEnc.GetString($gsBytes)
$gsOrig = $gs.Value
$gsNl = if($gs.Value.Contains("`r`n")){"`r`n"} else {"`n"}

# createSale_: subtotal + impuesto + total
Replace-RegexOnce 'createSale subtotal block' $gs '(var total = 0;\s*\n\s*for \(var i = 0; i < items\.length; i\+\+\) \{\s*\n.*?total \+= items\[i\]\.cantidad \* items\[i\]\.valor_unitario;\s*\n\s*\})' (@(
  '  function toBool_(v){',
  '    var s = String(v == null ? "" : v).trim().toLowerCase();',
  '    return s === "1" || s === "true" || s === "si" || s === "sí" || s === "yes" || s === "on";',
  '  }',
  '',
  '  var subtotal = 0;',
  '  for (var i = 0; i < items.length; i++) {',
  '    if (!items[i].producto) return { ok: false, error: "Producto invalido en una linea" };',
  '    if (items[i].cantidad <= 0) return { ok: false, error: "Cantidad debe ser mayor a cero" };',
  '    if (items[i].valor_unitario < 0) return { ok: false, error: "Valor unitario invalido" };',
  '    subtotal += items[i].cantidad * items[i].valor_unitario;',
  '  }',
  '',
  '  var aplicaIva = toBool_(payload.aplica_iva || payload.incluye_iva || payload.con_iva);',
  '  var ivaPct = toNumber_(payload.iva_porcentaje);',
  '  if (ivaPct < 0) ivaPct = 0;',
  '  if (ivaPct > 100) ivaPct = 100;',
  '  var impuesto = aplicaIva && ivaPct > 0 ? (subtotal * (ivaPct / 100)) : 0;',
  '  var total = subtotal + impuesto;'
) -join $gsNl)

# sales row total should store computed total
Replace-RegexOnce 'createSale set total' $gs 'setRowValue_\(row, salesMap, \[\'total\', \'monto\', \'valor\', \'venta_total\'\], round2_\(total\)\);' 'setRowValue_(row, salesMap, [\'total\', \'monto\', \'valor\', \'venta_total\'], round2_(total));'

# Insert subtotal/impuesto/iva fields after total
if($gs.Value -notmatch "\['subtotal'"){ 
  Replace-RegexOnce 'createSale insert subtotal/impuesto fields' $gs '(setRowValue_\(row, salesMap, \[\'total\', \'monto\', \'valor\', \'venta_total\'\], round2_\(total\)\);\s*\n)' ('$1' + @(
    "  setRowValue_(row, salesMap, ['subtotal', 'base'], round2_(subtotal));",
    "  setRowValue_(row, salesMap, ['impuesto', 'iva_valor', 'iva_monto', 'valor_iva'], round2_(impuesto));",
    "  setRowValue_(row, salesMap, ['iva_porcentaje', 'iva_pct', 'iva'], round2_(ivaPct));",
    "  setRowValue_(row, salesMap, ['aplica_iva', 'incluye_iva', 'con_iva', 'iva_aplica'], aplicaIva ? 'SI' : 'NO');"
  ) -join $gsNl + $gsNl)
}

# Return includes impuesto/subtotal (optional)
if($gs.Value -notmatch 'impuesto:' ){
  Replace-RegexOnce 'createSale return add impuesto/subtotal' $gs '(return \{\s*\n\s*ok: true,\s*\n\s*sale_id: saleId,\s*\n\s*total: round2_\(total\),\s*\n\s*items: items\.length\s*\n\s*\};)' (@(
    '  return {',
    '    ok: true,',
    '    sale_id: saleId,',
    '    subtotal: round2_(subtotal),',
    '    impuesto: round2_(impuesto),',
    '    total: round2_(total),',
    '    items: items.length',
    '  };'
  ) -join $gsNl)
}

# buildSaleDetail_: add indexes and compute impuesto if available
if($gs.Value -notmatch 'subtotalIdx'){
  Replace-RegexOnce 'saleDetail add iva idx' $gs '(var totalIdx = pickIndex_\(m, \[\x27total\x27, \x27monto\x27, \x27valor\x27, \x27venta_total\x27\]\);\s*\n)' ('$1' + @(
    "  var subtotalIdx = pickIndex_(m, ['subtotal', 'base']);",
    "  var impuestoIdx = pickIndex_(m, ['impuesto', 'iva_valor', 'iva_monto', 'valor_iva']);",
    "  var ivaPctIdx = pickIndex_(m, ['iva_porcentaje', 'iva_pct', 'iva']);",
    "  var aplicaIvaIdx = pickIndex_(m, ['aplica_iva', 'incluye_iva', 'con_iva', 'iva_aplica']);"
  ) -join $gsNl + $gsNl)
}

# Replace saleDetail subtotal/total computation block to incorporate stored fields
Replace-RegexOnce 'saleDetail totals compute' $gs '(var subtotal = 0;\s*\n\s*for \(var k = 0; k < items\.length; k\+\+\) \{\s*\n\s*subtotal \+= toNumber_\(items\[k\]\.cantidad\) \* toNumber_\(items\[k\]\.valor_unitario\);\s*\n\s*\}\s*\n\s*var total = round2_\(toNumber_\(totalIdx === -1 \? subtotal : row\[totalIdx\]\)\);\s*\n\s*if \(total <= 0\) total = round2_\(subtotal\);)' (@(
  '    var subtotal = 0;',
  '    for (var k = 0; k < items.length; k++) {',
  '      subtotal += toNumber_(items[k].cantidad) * toNumber_(items[k].valor_unitario);',
  '    }',
  '',
  '    var storedSubtotal = round2_(toNumber_(subtotalIdx === -1 ? subtotal : row[subtotalIdx]));',
  '    if (storedSubtotal <= 0) storedSubtotal = round2_(subtotal);',
  '',
  '    var aplicaIva = false;',
  '    if (aplicaIvaIdx !== -1) {',
  '      var s = String(row[aplicaIvaIdx] || "").trim().toLowerCase();',
  '      aplicaIva = (s === "si" || s === "sí" || s === "true" || s === "1" || s === "on");',
  '    }',
  '',
  '    var ivaPct = round2_(toNumber_(ivaPctIdx === -1 ? 0 : row[ivaPctIdx]));',
  '    if (ivaPct < 0) ivaPct = 0;',
  '    if (ivaPct > 100) ivaPct = 100;',
  '',
  '    var impuesto = round2_(toNumber_(impuestoIdx === -1 ? 0 : row[impuestoIdx]));',
  '    if (impuesto <= 0 && aplicaIva && ivaPct > 0) {',
  '      impuesto = round2_(storedSubtotal * (ivaPct / 100));',
  '    }',
  '',
  '    var total = round2_(toNumber_(totalIdx === -1 ? (storedSubtotal + impuesto) : row[totalIdx]));',
  '    if (total <= 0) total = round2_(storedSubtotal + impuesto);'
) -join $gsNl)

# saleDetail return should include computed impuesto and subtotal
Replace-RegexOnce 'saleDetail return impuesto' $gs 'subtotal: round2_\(subtotal\),\s*\n\s*impuesto: 0,\s*\n\s*total: total,' ('subtotal: storedSubtotal,' + $gsNl + '        impuesto: impuesto,' + $gsNl + '        total: total,')

# Write gs
if($gs.Value -eq $gsOrig){ throw 'google-apps-script.gs sin cambios (ya estaba aplicado?)' }
[IO.File]::WriteAllBytes($gsPath, $gsEnc.GetBytes($gs.Value))

Write-Host 'OK: IVA opcional aplicado en pos.html y google-apps-script.gs'
