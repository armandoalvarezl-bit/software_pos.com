const fs = require('fs');
const path = 'c:/POS/pos.html';
let s = fs.readFileSync(path, 'utf8');

const newStyle = `PLACEHOLDER_STYLE`;
const newBodyPrefix = `PLACEHOLDER_BODY`;
const helpers = `PLACEHOLDER_HELPERS`;

s = s.replace(/<style>[\s\S]*?<\/style>/, newStyle);
s = s.replace(/<body>[\s\S]*?<section class="print-ticket" id="printTicket">/, newBodyPrefix);
s = s.replace('let zxingLib = null;','let zxingLib = null;\nlet selectedCategory = "all";');
s = s.replace('function money(v){', helpers + '\nfunction money(v){');
s = s.replace(/async function loadCatalog\(\)\{[\s\S]*?\n\}/, `PLACEHOLDER_LOADCAT`);
s = s.replace(/const updateSuggestions = debounce\(function\(\)\{[\s\S]*?\}, 120\);/, `PLACEHOLDER_UPDATESUGG`);
s = s.replace(/function selectSuggestion\(p\)\{[\s\S]*?\n\}/, `PLACEHOLDER_SELECT`);
s = s.replace(/function renderCart\(\)\{[\s\S]*?\n\}/, `PLACEHOLDER_RENDERCART`);
s = s.replace(/function renderTotals\(\)\{[\s\S]*?\n\}/, `PLACEHOLDER_RENDERTOTALS`);
s = s.replace(/function limpiarVenta\(\)\{[\s\S]*?\n\}/, `PLACEHOLDER_LIMPIAR`);
fs.writeFileSync(path, s, 'utf8');
console.log('ok');
