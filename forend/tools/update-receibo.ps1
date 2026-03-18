$ErrorActionPreference = 'Stop'

$path = Join-Path (Get-Location) 'pos.html'
$backup = Join-Path (Get-Location) 'pos.html.bak-receibo-2026-03-16'
Copy-Item $path $backup -Force

$bytes = [IO.File]::ReadAllBytes($path)

function Get-EncodingFromBytes([byte[]]$b){
  if($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF){ return New-Object System.Text.UTF8Encoding($true) }
  if($b.Length -ge 2 -and $b[0] -eq 0xFF -and $b[1] -eq 0xFE){ return New-Object System.Text.UnicodeEncoding($false,$true) }
  if($b.Length -ge 2 -and $b[0] -eq 0xFE -and $b[1] -eq 0xFF){ return New-Object System.Text.UnicodeEncoding($true,$true) }
  return New-Object System.Text.UTF8Encoding($false)
}

$enc = Get-EncodingFromBytes $bytes
$content = $enc.GetString($bytes)
$orig = $content
$nl = if($content.Contains("`r`n")){"`r`n"} else {"`n"}

function Replace-Literal([string]$label, [string]$needle, [string]$repl){
  if(-not $script:content.Contains($needle)){
    throw "No encontre el patron literal: $label"
  }
  $script:content = $script:content.Replace($needle, $repl)
}

# 1) Ajustes de caja POS/cierre (padding + tipografia + bordes)
Replace-Literal 'pos padding' 'padding:3.5mm 3mm;' 'padding:3mm 2.5mm;'

$oldFontBlock = @(
  '    font-family:Arial,Helvetica,sans-serif;'
  '    font-size:14px;'
  '    line-height:1.35;'
  '    border:1px solid #111;'
  '    border-radius:2px;'
) -join $nl

$newFontBlock = @(
  '    font-family:"Courier New",ui-monospace,monospace;'
  '    font-size:12px;'
  '    line-height:1.25;'
  '    border:none;'
  '    border-radius:0;'
) -join $nl

Replace-Literal 'pos font block' $oldFontBlock $newFontBlock

# 2) Encabezados y separadores (solo en @media print / POS)
Replace-Literal 'kicker text' '<div class="pos-kicker">Comprobante de venta</div>' '<div class="pos-kicker">Factura de venta</div>'

Replace-Literal 'pos items border' '  .pos-items{margin:6px 0;border-top:1px dashed #444;border-bottom:1px dashed #444;padding:6px 0}' '  .pos-items{margin:6px 0;border-top:1px dashed #222;border-bottom:1px dashed #222;padding:6px 0}'

# Inserta estilos para tabla (sin romper .pos-item del cierre)
$needleMeta = '  .pos-item-meta{display:flex;justify-content:space-between;color:#111;font-size:11.5px}'
if($content.Contains($needleMeta) -and ($content -notmatch '\.pos-items-head\{')){
  $insert = @(
    $needleMeta,
    '  .pos-items-head{display:grid;grid-template-columns:12mm 1fr 18mm 20mm;gap:2mm;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.6px;padding:0 0 4px;border-bottom:1px dotted #444;margin-bottom:4px}',
    '  .pos-row{display:grid;grid-template-columns:12mm 1fr 18mm 20mm;gap:2mm;padding:2px 0;break-inside:avoid}',
    '  .pos-row .right{text-align:right}',
    '  .pos-row .desc{overflow-wrap:anywhere;word-break:break-word}',
    '  .pos-items-empty{padding:4px 0;font-weight:700;text-align:center}'
  ) -join $nl
  $content = $content.Replace($needleMeta, $insert)
}

# 3) HTML: cambia el detalle de POS a cabecera + filas
$content = [Regex]::Replace(
  $content,
  '(?s)<div class="pos-section">Detalle</div>\s*<div class="pos-items" id="posPrintRows"></div>',
  '<div class="pos-section">Detalle</div>' + $nl +
  '      <div class="pos-items" aria-label="Detalle de productos">' + $nl +
  '        <div class="pos-items-head" aria-hidden="true">' + $nl +
  '          <div class="right">Cant</div>' + $nl +
  '          <div>Descripcion</div>' + $nl +
  '          <div class="right">V. unit</div>' + $nl +
  '          <div class="right">Importe</div>' + $nl +
  '        </div>' + $nl +
  '        <div id="posPrintRows"></div>' + $nl +
  '      </div>',
  1
)

# 4) JS: renderPrintPosTicket -> filas en columnas
$content = [Regex]::Replace(
  $content,
  '(?s)rows\.innerHTML \+= `<div class="pos-item">\s*<div class="pos-item-name">\$\{it\.producto \|\| "-"\}</div>\s*<div class="pos-item-meta">\s*<span>\$\{qty\.toLocaleString\("es-CO"\)\} x \$\{money\(unit\)\}</span>\s*<strong>\$\{money\(sub\)\}</strong>\s*</div>\s*</div>`;',
  'rows.innerHTML += `<div class="pos-row">' + $nl +
  '      <div class="right">${qty.toLocaleString("es-CO")}</div>' + $nl +
  '      <div class="desc">${escapeHtml_(it.producto || "-")}</div>' + $nl +
  '      <div class="right">${money(unit)}</div>' + $nl +
  '      <div class="right">${money(sub)}</div>' + $nl +
  '    </div>`;',
  1
)

$content = $content.Replace(
  'rows.innerHTML = "<div class=''pos-item''>Sin productos.</div>";',
  'rows.innerHTML = "<div class=''pos-items-empty''>Sin productos.</div>";'
)

if($content -eq $orig){
  throw 'No hubo cambios aplicados (archivo igual al original).'
}

[IO.File]::WriteAllBytes($path, $enc.GetBytes($content))
Write-Host "OK: recibo POS actualizado. Backup -> $backup"
