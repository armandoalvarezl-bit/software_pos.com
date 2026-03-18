$ErrorActionPreference = 'Stop'

$path = Join-Path (Get-Location) 'google-apps-script.gs'
Copy-Item $path ($path + '.bak-iva-2026-03-16') -Force

$text = [IO.File]::ReadAllText($path)
if($text.Contains("`r`n")){$nl="`r`n"} else {$nl="`n"}

function Replace-Once([string]$label, [string]$pattern, [string]$repl){
  $re = New-Object System.Text.RegularExpressions.Regex($pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  $m = $re.Match($script:text)
  if(-not $m.Success){ throw "No encontre patron: $label" }
  $script:text = $re.Replace($script:text, $repl, 1)
}

# 1) createSale_: calcular subtotal + IVA opcional
$newTotalsBlock = @(
'  function toBool_(v) {',
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
'  var total = subtotal + impuesto;',
''
) -join $nl

Replace-Once 'createSale totals loop' '(\s*)var total = 0;[\s\S]*?\n\s*\}\s*\n\s*\n\s*var ss\s*=' ('$1' + $newTotalsBlock + '$&')

# 2) Guardar campos extra (si existen columnas)
$insertAfterTotal = @(
"setRowValue_(row, salesMap, ['total', 'monto', 'valor', 'venta_total'], round2_(total));",
"  setRowValue_(row, salesMap, ['subtotal', 'base'], round2_(subtotal));",
"  setRowValue_(row, salesMap, ['impuesto', 'iva_valor', 'iva_monto', 'valor_iva'], round2_(impuesto));",
"  setRowValue_(row, salesMap, ['iva_porcentaje', 'iva_pct', 'iva'], round2_(ivaPct));",
"  setRowValue_(row, salesMap, ['aplica_iva', 'incluye_iva', 'con_iva', 'iva_aplica'], aplicaIva ? 'SI' : 'NO');"
) -join $nl

Replace-Once 'createSale insert fields after total' "setRowValue_\(row, salesMap, \['total', 'monto', 'valor', 'venta_total'\], round2_\(total\)\);" $insertAfterTotal

# 3) Response incluye subtotal/impuesto
$newReturn = @(
'  return {',
'    ok: true,',
'    sale_id: saleId,',
'    subtotal: round2_(subtotal),',
'    impuesto: round2_(impuesto),',
'    total: round2_(total),',
'    items: items.length',
'  };'
) -join $nl

Replace-Once 'createSale return object' 'return\s*\{[\s\S]*?items:\s*items\.length[\s\S]*?\};' $newReturn

# 4) buildSaleDetail_: indices extra
Replace-Once 'saleDetail add indices' "var totalIdx = pickIndex_\(m, \['total', 'monto', 'valor', 'venta_total'\]\);" (@(
"var totalIdx = pickIndex_(m, ['total', 'monto', 'valor', 'venta_total']);",
"  var subtotalIdx = pickIndex_(m, ['subtotal', 'base']);",
"  var impuestoIdx = pickIndex_(m, ['impuesto', 'iva_valor', 'iva_monto', 'valor_iva']);",
"  var ivaPctIdx = pickIndex_(m, ['iva_porcentaje', 'iva_pct', 'iva']);",
"  var aplicaIvaIdx = pickIndex_(m, ['aplica_iva', 'incluye_iva', 'con_iva', 'iva_aplica']);"
) -join $nl)

# 5) buildSaleDetail_: cálculo subtotal/IVA/total
$newSaleTotals = @(
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
) -join $nl

Replace-Once 'saleDetail totals block' 'var subtotal = 0;[\s\S]*?if \(total <= 0\) total = round2_\(subtotal\);' $newSaleTotals

# 6) buildSaleDetail_: salida incluye impuesto (antes era 0)
Replace-Once 'saleDetail return fields' 'subtotal:\s*round2_\(subtotal\),\s*\n\s*impuesto:\s*0,' ('subtotal: storedSubtotal,' + $nl + '        impuesto: impuesto,' + $nl + '        aplica_iva: aplicaIva,' + $nl + '        iva_porcentaje: ivaPct,')

[IO.File]::WriteAllText($path, $text)
Write-Host 'OK: google-apps-script.gs actualizado (IVA opcional)'

