$ErrorActionPreference = 'Stop'

$path = Join-Path (Get-Location) 'google-apps-script.gs'
Copy-Item $path ($path + '.bak-iva-safe-2026-03-16') -Force

$bytes = [IO.File]::ReadAllBytes($path)
function Get-EncodingFromBytes([byte[]]$b){
  if($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF){ return New-Object System.Text.UTF8Encoding($true) }
  if($b.Length -ge 2 -and $b[0] -eq 0xFF -and $b[1] -eq 0xFE){ return New-Object System.Text.UnicodeEncoding($false,$true) }
  if($b.Length -ge 2 -and $b[0] -eq 0xFE -and $b[1] -eq 0xFF){ return New-Object System.Text.UnicodeEncoding($true,$true) }
  return New-Object System.Text.UTF8Encoding($false)
}
$enc = Get-EncodingFromBytes $bytes
$text = $enc.GetString($bytes)
$nl = if($text.Contains("`r`n")){"`r`n"} else {"`n"}

function MustReplace([string]$label,[string]$needle,[string]$repl){
  if($script:text.IndexOf($needle,[StringComparison]::Ordinal) -lt 0){ throw "No encontre: $label" }
  $script:text = $script:text.Replace($needle,$repl)
}

# --- createSale_ totals block ---
$oldTotals = @(
"  var total = 0;",
"  for (var i = 0; i < items.length; i++) {",
"    if (!items[i].producto) return { ok: false, error: 'Producto invalido en una linea' };",
"    if (items[i].cantidad <= 0) return { ok: false, error: 'Cantidad debe ser mayor a cero' };",
"    if (items[i].valor_unitario < 0) return { ok: false, error: 'Valor unitario invalido' };",
"    total += items[i].cantidad * items[i].valor_unitario;",
"  }"
) -join $nl

$newTotals = @(
"  function toBool_(v) {",
"    var s = String(v == null ? '' : v).trim().toLowerCase();",
"    return s === '1' || s === 'true' || s === 'si' || s === 'sí' || s === 'yes' || s === 'on';",
"  }",
"",
"  var subtotal = 0;",
"  for (var i = 0; i < items.length; i++) {",
"    if (!items[i].producto) return { ok: false, error: 'Producto invalido en una linea' };",
"    if (items[i].cantidad <= 0) return { ok: false, error: 'Cantidad debe ser mayor a cero' };",
"    if (items[i].valor_unitario < 0) return { ok: false, error: 'Valor unitario invalido' };",
"    subtotal += items[i].cantidad * items[i].valor_unitario;",
"  }",
"",
"  var aplicaIva = toBool_(payload.aplica_iva || payload.incluye_iva || payload.con_iva);",
"  var ivaPct = toNumber_(payload.iva_porcentaje);",
"  if (ivaPct < 0) ivaPct = 0;",
"  if (ivaPct > 100) ivaPct = 100;",
"  var impuesto = aplicaIva && ivaPct > 0 ? (subtotal * (ivaPct / 100)) : 0;",
"  var total = subtotal + impuesto;"
) -join $nl

MustReplace 'createSale totals block' $oldTotals $newTotals

# --- createSale_ setRowValue total + extras ---
$oldSetTotal = "  setRowValue_(row, salesMap, ['total', 'monto', 'valor', 'venta_total'], round2_(total));"
if($script:text -notmatch "\['subtotal'" ){
  $newSetTotal = @(
    $oldSetTotal,
    "  setRowValue_(row, salesMap, ['subtotal', 'base'], round2_(subtotal));",
    "  setRowValue_(row, salesMap, ['impuesto', 'iva_valor', 'iva_monto', 'valor_iva'], round2_(impuesto));",
    "  setRowValue_(row, salesMap, ['iva_porcentaje', 'iva_pct', 'iva'], round2_(ivaPct));",
    "  setRowValue_(row, salesMap, ['aplica_iva', 'incluye_iva', 'con_iva', 'iva_aplica'], aplicaIva ? 'SI' : 'NO');"
  ) -join $nl
  MustReplace 'createSale insert fields after total' $oldSetTotal $newSetTotal
}

# --- createSale_ return object ---
$oldReturn = @(
"  return {",
"    ok: true,",
"    sale_id: saleId,",
"    total: round2_(total),",
"    items: items.length",
"  };"
) -join $nl

$newReturn = @(
"  return {",
"    ok: true,",
"    sale_id: saleId,",
"    subtotal: round2_(subtotal),",
"    impuesto: round2_(impuesto),",
"    aplica_iva: aplicaIva,",
"    iva_porcentaje: round2_(ivaPct),",
"    total: round2_(total),",
"    items: items.length",
"  };"
) -join $nl

MustReplace 'createSale return' $oldReturn $newReturn

# --- buildSaleDetail_ add indices after totalIdx ---
$oldTotalIdxLine = "  var totalIdx = pickIndex_(m, ['total', 'monto', 'valor', 'venta_total']);"
if($script:text.IndexOf('var subtotalIdx = pickIndex_', [StringComparison]::Ordinal) -lt 0){
  $newIdxBlock = @(
    $oldTotalIdxLine,
    "  var subtotalIdx = pickIndex_(m, ['subtotal', 'base']);",
    "  var impuestoIdx = pickIndex_(m, ['impuesto', 'iva_valor', 'iva_monto', 'valor_iva']);",
    "  var ivaPctIdx = pickIndex_(m, ['iva_porcentaje', 'iva_pct', 'iva']);",
    "  var aplicaIvaIdx = pickIndex_(m, ['aplica_iva', 'incluye_iva', 'con_iva', 'iva_aplica']);"
  ) -join $nl
  MustReplace 'saleDetail add idx' $oldTotalIdxLine $newIdxBlock
}

# --- buildSaleDetail_ totals computation ---
$oldDetailTotals = @(
"    var subtotal = 0;",
"    for (var k = 0; k < items.length; k++) {",
"      subtotal += toNumber_(items[k].cantidad) * toNumber_(items[k].valor_unitario);",
"    }",
"",
"    var total = round2_(toNumber_(totalIdx === -1 ? subtotal : row[totalIdx]));",
"    if (total <= 0) total = round2_(subtotal);"
) -join $nl

$newDetailTotals = @(
"    var subtotal = 0;",
"    for (var k = 0; k < items.length; k++) {",
"      subtotal += toNumber_(items[k].cantidad) * toNumber_(items[k].valor_unitario);",
"    }",
"",
"    var storedSubtotal = round2_(toNumber_(subtotalIdx === -1 ? subtotal : row[subtotalIdx]));",
"    if (storedSubtotal <= 0) storedSubtotal = round2_(subtotal);",
"",
"    var aplicaIva = false;",
"    if (aplicaIvaIdx !== -1) {",
"      var s = String(row[aplicaIvaIdx] || '').trim().toLowerCase();",
"      aplicaIva = (s === 'si' || s === 'sí' || s === 'true' || s === '1' || s === 'on');",
"    }",
"",
"    var ivaPct = round2_(toNumber_(ivaPctIdx === -1 ? 0 : row[ivaPctIdx]));",
"    if (ivaPct < 0) ivaPct = 0;",
"    if (ivaPct > 100) ivaPct = 100;",
"",
"    var impuesto = round2_(toNumber_(impuestoIdx === -1 ? 0 : row[impuestoIdx]));",
"    if (impuesto <= 0 && aplicaIva && ivaPct > 0) {",
"      impuesto = round2_(storedSubtotal * (ivaPct / 100));",
"    }",
"",
"    var total = round2_(toNumber_(totalIdx === -1 ? (storedSubtotal + impuesto) : row[totalIdx]));",
"    if (total <= 0) total = round2_(storedSubtotal + impuesto);"
) -join $nl

MustReplace 'saleDetail totals block' $oldDetailTotals $newDetailTotals

# --- buildSaleDetail_ return sale fields ---
$oldSaleFields = @(
"        subtotal: round2_(subtotal),",
"        impuesto: 0,",
"        total: total,"
) -join $nl

$newSaleFields = @(
"        subtotal: storedSubtotal,",
"        impuesto: impuesto,",
"        aplica_iva: aplicaIva,",
"        iva_porcentaje: ivaPct,",
"        total: total,"
) -join $nl

MustReplace 'saleDetail return fields' $oldSaleFields $newSaleFields

[IO.File]::WriteAllBytes($path, $enc.GetBytes($script:text))
Write-Host 'OK: google-apps-script.gs parcheado (IVA opcional seguro)'
