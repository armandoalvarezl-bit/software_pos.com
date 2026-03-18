const CFG = {
  sheets: {
    users: 'Usuarios',
    sales: 'Ventas',
    inventory: 'Inventario',
    orders: 'Pedidos',
    clients: 'Clientes',
    recipes: 'Recetas',
    settings: 'Configuracion',
    licenses: 'Licencias',
    cash_closes: 'Cierres_Caja'
  }
};

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = String(params.action || '').toLowerCase();
  var empresa = String(params.empresa || '').trim();

  if (action === 'dashboard') {
    return asJson(buildDashboardPayload_(empresa));
  }
  if (action === 'add_inventory') return asJson(addInventoryItem_(params));
  if (action === 'update_inventory') return asJson(updateInventoryItem_(params));
  if (action === 'delete_inventory') return asJson(deleteInventoryItem_(params));
  if (action === 'pos_catalog') return asJson(buildPosCatalog_(empresa));
  if (action === 'create_sale') return asJson(createSale_(params));
  if (action === 'cash_close') return asJson(buildCashClose_(empresa, String(params.cajero || '').trim(), String(params.fecha || '').trim()));
  if (action === 'sale_detail') return asJson(buildSaleDetail_(empresa, String(params.id_venta || params.sale_id || params.id || '').trim()));
  if (action === 'sales') return asJson(buildSalesPayload_(empresa));
  if (action === 'inventory') return asJson(buildInventoryPayload_(empresa));
  if (action === 'reports') return asJson(buildReportsPayload_(empresa, params));
  if (action === 'invoices') return asJson(buildInvoicesPayload_(empresa, params));
  if (action === 'recover_password') return asJson(recoverPassword_(params));
  if (action === 'clients') return asJson(buildClientsPayload_(empresa));
  if (action === 'add_client') return asJson(addClient_(params));
  if (action === 'update_client') return asJson(updateClient_(params));
  if (action === 'delete_client') return asJson(deleteClient_(params));
  if (action === 'recipes') return asJson(buildRecipesPayload_(empresa));
  if (action === 'add_recipe') return asJson(addRecipe_(params));
  if (action === 'update_recipe') return asJson(updateRecipe_(params));
  if (action === 'delete_recipe') return asJson(deleteRecipe_(params));
  if (action === 'settings') return asJson(getSettings_(empresa));
  if (action === 'save_settings') return asJson(saveSettings_(params));
  if (action === 'activate_license') return asJson(activateLicense_(params));

  if (action === 'health') {
    return asJson({
      ok: true,
      service: 'farmapos-webapp',
      timestamp: new Date().toISOString()
    });
  }

  // Keep login compatibility with existing index.html
  return asJson(getLegacyUsersMatrix_());
}

function doPost(e) {
  var payload = parsePostPayload_(e);
  var action = String(payload.action || '').toLowerCase();

  if (action === 'add_inventory') {
    return asJson(addInventoryItem_(payload));
  }
  if (action === 'update_inventory') {
    return asJson(updateInventoryItem_(payload));
  }
  if (action === 'delete_inventory') {
    return asJson(deleteInventoryItem_(payload));
  }
  if (action === 'create_sale') {
    return asJson(createSale_(payload));
  }
  if (action === 'register_cash_close') {
    return asJson(registerCashClose_(payload));
  }
  if (action === 'recover_password') {
    return asJson(recoverPassword_(payload));
  }
  if (action === 'add_client') return asJson(addClient_(payload));
  if (action === 'update_client') return asJson(updateClient_(payload));
  if (action === 'delete_client') return asJson(deleteClient_(payload));
  if (action === 'add_recipe') return asJson(addRecipe_(payload));
  if (action === 'update_recipe') return asJson(updateRecipe_(payload));
  if (action === 'delete_recipe') return asJson(deleteRecipe_(payload));
  if (action === 'save_settings') return asJson(saveSettings_(payload));
  if (action === 'activate_license') return asJson(activateLicense_(payload));

  return asJson({
    ok: false,
    error: 'Accion POST no soportada'
  });
}

function asJson(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getLegacyUsersMatrix_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getUsersSheet_(ss);

  if (!sh) {
    return [['Nombre Completo', 'Usuario', 'Contrasena', 'Rol', 'Estado']];
  }

  var values = sh.getDataRange().getValues();
  return values && values.length ? values : [['Nombre Completo', 'Usuario', 'Contrasena', 'Rol', 'Estado']];
}

function getUsersSheet_(ss) {
  var candidates = [
    CFG.sheets.users,
    'Usuarios_POS',
    'UsuariosPOS',
    'Usuarios Pos',
    'Usuarios'
  ];

  for (var i = 0; i < candidates.length; i++) {
    var sh = ss.getSheetByName(candidates[i]);
    if (sh) return sh;
  }
  return null;
}

function recoverPassword_(payload) {
  var usuario = String(payload.usuario || '').trim().toLowerCase();
  var empresa = String(payload.empresa || '').trim().toLowerCase();

  if (!usuario) {
    return { ok: false, error: 'Usuario es obligatorio' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getUsersSheet_(ss);
  if (!sh) return { ok: false, error: 'No existe hoja de usuarios' };

  var values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return { ok: false, error: 'No hay usuarios registrados' };

  var headers = values[0].map(function (h) { return normalizeKey_(h); });
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) map[headers[i]] = i;
  }

  var usuarioIdx = pickIndex_(map, ['usuario', 'user', 'login']);
  var passIdx = pickIndex_(map, ['contrasena', 'contraseÃ±a', 'clave', 'password', 'pass']);
  var empresaIdx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);
  var estadoIdx = pickIndex_(map, ['estado', 'status']);

  if (usuarioIdx === -1 || passIdx === -1) {
    return { ok: false, error: 'Columnas usuario/contrasena no encontradas en hoja usuarios' };
  }

  for (var r = 1; r < values.length; r++) {
    var rowUser = String(values[r][usuarioIdx] || '').trim().toLowerCase();
    if (!rowUser || rowUser !== usuario) continue;

    if (empresa && empresaIdx !== -1) {
      var rowEmpresa = String(values[r][empresaIdx] || '').trim().toLowerCase();
      if (rowEmpresa && rowEmpresa !== empresa) continue;
    }

    if (estadoIdx !== -1) {
      var estado = String(values[r][estadoIdx] || '').trim().toLowerCase();
      if (estado && estado !== 'activo') {
        return { ok: false, error: 'Usuario inactivo. Contacta al administrador.' };
      }
    }

    var tempPass = generateTempPassword_();
    sh.getRange(r + 1, passIdx + 1).setValue(tempPass);

    return {
      ok: true,
      message: 'Contrasena temporal generada',
      usuario: rowUser,
      temporary_password: tempPass
    };
  }

  return { ok: false, error: 'Usuario no encontrado' };
}

function generateTempPassword_() {
  var seed = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMddHHmm');
  var rand = Math.floor(Math.random() * 900 + 100);
  return 'Tmp' + seed + '*' + rand;
}

function getLicensesSheet_(ss) {
  var candidates = [
    CFG.sheets.licenses,
    'Licencias',
    'Licencia',
    'Licenses',
    'Planes'
  ];
  for (var i = 0; i < candidates.length; i++) {
    var sh = ss.getSheetByName(candidates[i]);
    if (sh) return sh;
  }
  return null;
}

function activateLicense_(payload) {
  var code = String(payload.codigo || payload.code || payload.license_code || '').trim();
  var empresa = String(payload.empresa || '').trim();
  var usuario = String(payload.usuario || '').trim();
  var requestedMonths = toNumber_(payload.plan_meses || payload.meses || payload.months);

  if (!code) return { ok: false, error: 'Codigo de licencia es obligatorio' };

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = getLicensesSheet_(ss);
  if (!sh) return { ok: false, error: 'No existe hoja de licencias' };

  var values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return { ok: false, error: 'No hay licencias registradas' };

  var headers = values[0].map(function (h) { return normalizeKey_(h); });
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) map[headers[i]] = i;
  }

  var codeIdx = pickIndex_(map, ['codigo', 'codigo_licencia', 'license_code', 'clave']);
  var estadoIdx = pickIndex_(map, ['estado', 'status', 'situacion']);
  var planIdx = pickIndex_(map, ['plan', 'tipo_plan', 'licencia']);
  var monthsIdx = pickIndex_(map, ['plan_meses', 'meses', 'duracion_meses', 'licencia_meses']);
  var empresaIdx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);
  var usuarioIdx = pickIndex_(map, ['usuario', 'cliente', 'asignado_a']);
  var startIdx = pickIndex_(map, ['fecha_inicio', 'inicio', 'activada_el', 'licencia_inicio']);
  var endIdx = pickIndex_(map, ['fecha_fin', 'fin', 'vence_el', 'licencia_fin', 'vencimiento']);

  if (codeIdx === -1) return { ok: false, error: 'Columna de codigo no encontrada en hoja Licencias' };

  var wantedCode = code.toLowerCase();
  var rowNumber = -1;
  for (var r = 1; r < values.length; r++) {
    var rowCode = String(values[r][codeIdx] || '').trim().toLowerCase();
    if (rowCode && rowCode === wantedCode) {
      rowNumber = r + 1;
      break;
    }
  }
  if (rowNumber === -1) return { ok: false, error: 'Codigo de licencia no valido' };

  var row = sh.getRange(rowNumber, 1, 1, sh.getLastColumn()).getValues()[0];
  var estado = String(estadoIdx === -1 ? '' : row[estadoIdx] || '').trim().toLowerCase();
  if (estado && (estado === 'usada' || estado === 'utilizada' || estado === 'vencida' || estado === 'anulada' || estado === 'bloqueada' || estado === 'inactiva')) {
    return { ok: false, error: 'Licencia no disponible (' + estado + ')' };
  }

  var planName = String(planIdx === -1 ? '' : row[planIdx] || '').trim();
  var planMonths = toNumber_(monthsIdx === -1 ? 0 : row[monthsIdx]);
  if (!planMonths && planName) {
    var p = planName.toLowerCase();
    if (p.indexOf('12') !== -1 || p.indexOf('anual') !== -1 || p.indexOf('ano') !== -1 || p.indexOf('aÃ±o') !== -1) planMonths = 12;
    else if (p.indexOf('6') !== -1 || p.indexOf('semes') !== -1) planMonths = 6;
    else if (p.indexOf('3') !== -1 || p.indexOf('trimes') !== -1) planMonths = 3;
  }
  if (!planMonths && requestedMonths > 0) planMonths = requestedMonths;
  if (!planMonths) return { ok: false, error: 'La licencia no tiene duracion configurada en meses' };
  if (requestedMonths > 0 && planMonths !== requestedMonths) {
    return { ok: false, error: 'El codigo no corresponde al plan seleccionado' };
  }

  var start = stripTime_(new Date());
  var end = new Date(start.getFullYear(), start.getMonth() + planMonths, start.getDate());
  var days = Math.ceil((end.getTime() - start.getTime()) / 86400000);

  if (empresaIdx !== -1) row[empresaIdx] = empresa;
  if (usuarioIdx !== -1) row[usuarioIdx] = usuario;
  if (startIdx !== -1) row[startIdx] = start;
  if (endIdx !== -1) row[endIdx] = end;
  if (estadoIdx !== -1) row[estadoIdx] = 'Activa';
  sh.getRange(rowNumber, 1, 1, sh.getLastColumn()).setValues([row]);

  return {
    ok: true,
    message: 'Licencia activada correctamente',
    license: {
      code: code,
      plan: planName || (planMonths + ' meses'),
      months: planMonths,
      start: formatDateIso_(start),
      end: formatDateIso_(end),
      days: days
    }
  };
}

function buildDashboardPayload_(empresa) {
  var empresaFilter = normalizeEmpresaFilter_(empresa);
  var salesData = readSheetObjects_(CFG.sheets.sales);
  var invData = readSheetObjects_(CFG.sheets.inventory);
  var ordersData = readSheetObjects_(CFG.sheets.orders);
  // Keep dashboard totals consistent with ventas.html (action=sales): strict company filtering.
  var salesRows = filterByEmpresa_(salesData.rows, salesData.map, empresaFilter);
  var inventoryRows = filterByEmpresa_(invData.rows, invData.map, empresaFilter);
  var orderRows = filterByEmpresa_(ordersData.rows, ordersData.map, empresaFilter);

  var metrics = computeMetrics_(salesRows, salesData.map, inventoryRows, invData.map);
  var weeklySales = computeWeeklySales_(salesRows, salesData.map);
  var alerts = computeAlerts_(inventoryRows, invData.map, orderRows, ordersData.map);
  var priorityProducts = computePriorityProducts_(inventoryRows, invData.map);

  return {
    metrics: metrics,
    weeklySales: weeklySales,
    alerts: alerts,
    priorityProducts: priorityProducts
  };
}

function buildSalesPayload_(empresa) {
  var salesData = readSheetObjects_(CFG.sheets.sales);
  var salesRows = filterByEmpresa_(salesData.rows, salesData.map, empresa);
  var m = salesData.map;

  var idIdx = pickIndex_(m, ['id_venta', 'venta_id', 'id']);
  var dateIdx = pickIndex_(m, ['fecha', 'fecha_venta', 'created_at']);
  var totalIdx = pickIndex_(m, ['total', 'monto', 'valor', 'venta_total']);
  var payIdx = pickIndex_(m, ['metodo_pago', 'pago', 'medio_pago']);
  var clientIdx = pickIndex_(m, ['cliente', 'paciente', 'nombre_cliente']);

  var today = stripTime_(new Date());
  var totalToday = 0;
  var ticketsToday = 0;

  salesRows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (d && isSameDate_(d, today)) {
      totalToday += toNumber_(totalIdx === -1 ? 0 : r[totalIdx]);
      ticketsToday += 1;
    }
  });

  var rows = salesRows.map(function (r) {
    return {
      fecha: formatDateIso_(parseDate_(dateIdx === -1 ? null : r[dateIdx]) || new Date()),
      id_venta: String(idIdx === -1 ? '' : r[idIdx] || ''),
      cliente: String(clientIdx === -1 ? 'Mostrador' : r[clientIdx] || 'Mostrador'),
      metodo_pago: String(payIdx === -1 ? 'Efectivo' : r[payIdx] || 'Efectivo'),
      total: round2_(toNumber_(totalIdx === -1 ? 0 : r[totalIdx]))
    };
  });

  rows.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });

  return {
    totalToday: round2_(totalToday),
    ticketsToday: ticketsToday,
    rows: rows.slice(0, 30)
  };
}

function buildInvoicesPayload_(empresa, params) {
  var empresaFilter = normalizeEmpresaFilter_(empresa);
  var salesData = readSheetObjects_(CFG.sheets.sales);
  var salesRows = filterByEmpresa_(salesData.rows, salesData.map, empresaFilter);
  var m = salesData.map;
  var range = resolveReportsRange_(params);
  var from = range.from;
  var to = range.to;

  var idIdx = pickIndex_(m, ['id_venta', 'venta_id', 'id']);
  var dateIdx = pickIndex_(m, ['fecha', 'fecha_venta', 'created_at']);
  var totalIdx = pickIndex_(m, ['total', 'monto', 'valor', 'venta_total']);
  var payIdx = pickIndex_(m, ['metodo_pago', 'pago', 'medio_pago']);
  var clientIdx = pickIndex_(m, ['cliente', 'paciente', 'nombre_cliente']);
  var cashierIdx = pickIndex_(m, ['cajero', 'usuario', 'vendedor']);

  var wantedCashier = String((params && (params.cajero || params.usuario)) || '').trim().toLowerCase();

  var limit = 500;
  if (params && params.limit != null) {
    var parsed = Math.floor(toNumber_(params.limit));
    if (parsed > 0) limit = Math.min(parsed, 2000);
  }

  var summary = { tickets: 0, total_sales: 0, cash: 0, card: 0, transfer: 0 };
  var outRows = [];

  salesRows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (!d || d < from || d > to) return;

    var rowCashier = String(cashierIdx === -1 ? '' : r[cashierIdx] || '').trim().toLowerCase();
    if (wantedCashier && rowCashier && rowCashier !== wantedCashier) return;

    var total = round2_(toNumber_(totalIdx === -1 ? 0 : r[totalIdx]));
    var pay = String(payIdx === -1 ? 'Efectivo' : r[payIdx] || 'Efectivo');
    var payNorm = pay.toLowerCase();

    summary.total_sales += total;
    summary.tickets += 1;
    if (payNorm.indexOf('efectivo') !== -1) summary.cash += total;
    else if (payNorm.indexOf('tarjeta') !== -1) summary.card += total;
    else summary.transfer += total;

    outRows.push({
      fecha: formatDateIso_(d),
      id_venta: String(idIdx === -1 ? '' : r[idIdx] || ''),
      cliente: String(clientIdx === -1 ? 'Mostrador' : r[clientIdx] || 'Mostrador'),
      cajero: String(cashierIdx === -1 ? '' : r[cashierIdx] || ''),
      metodo_pago: pay,
      total: total
    });
  });

  outRows.sort(function (a, b) {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    return a.id_venta < b.id_venta ? 1 : -1;
  });

  summary.total_sales = round2_(summary.total_sales);
  summary.cash = round2_(summary.cash);
  summary.card = round2_(summary.card);
  summary.transfer = round2_(summary.transfer);

  var limited = outRows.slice(0, limit);
  return {
    ok: true,
    range: { from: formatDateIso_(from), to: formatDateIso_(to) },
    summary: summary,
    total_rows: outRows.length,
    rows: limited,
    has_more: outRows.length > limited.length
  };
}

function buildInventoryPayload_(empresa) {
  var invData = readSheetObjects_(CFG.sheets.inventory);
  var rows = filterByEmpresa_(invData.rows, invData.map, empresa);
  var m = invData.map;

  var productIdx = pickIndex_(m, ['producto', 'nombre', 'medicamento']);
  var lotIdx = pickIndex_(m, ['lote', 'batch']);
  var stockIdx = pickIndex_(m, ['stock', 'existencia', 'cantidad']);
  var minIdx = pickIndex_(m, ['stock_min', 'min_stock', 'minimo']);
  var expIdx = pickIndex_(m, ['vencimiento', 'fecha_vencimiento', 'expires']);
  var priceIdx = pickIndex_(m, ['precio_venta', 'precio', 'pvp']);

  var today = stripTime_(new Date());
  var limitDate = new Date(today);
  limitDate.setDate(today.getDate() + 30);

  var critical = 0;
  var expiring = 0;

  var outRows = rows.map(function (r) {
    var stock = toNumber_(stockIdx === -1 ? 0 : r[stockIdx]);
    var min = toNumber_(minIdx === -1 ? 5 : r[minIdx]);
    var expDate = parseDate_(expIdx === -1 ? null : r[expIdx]);
    var level = 'ok';
    var estado = 'Normal';

    if (stock <= min) {
      critical += 1;
      level = stock <= 0 ? 'danger' : 'warn';
      estado = stock <= 0 ? 'Sin stock' : 'Stock bajo';
    }

    if (expDate && expDate >= today && expDate <= limitDate) {
      expiring += 1;
      if (level === 'ok') {
        level = 'warn';
        estado = 'Por vencer';
      }
    }

    return {
      producto: String(productIdx === -1 ? 'Producto' : r[productIdx] || 'Producto'),
      lote: String(lotIdx === -1 ? '-' : r[lotIdx] || '-'),
      stock: stock,
      stock_min: min,
      precio_venta: round2_(toNumber_(priceIdx === -1 ? 0 : r[priceIdx])),
      vencimiento: expDate ? formatDateIso_(expDate) : '-',
      estado: estado,
      level: level
    };
  });

  return {
    summary: {
      totalProducts: rows.length,
      criticalStock: critical,
      expiringCount: expiring
    },
    rows: outRows.slice(0, 120)
  };
}

function buildReportsPayload_(empresa, params) {
  var empresaFilter = normalizeEmpresaFilter_(empresa);
  var salesData = readSheetObjects_(CFG.sheets.sales);
  var invData = readSheetObjects_(CFG.sheets.inventory);

  // Keep reports totals consistent with ventas.html (action=sales): strict company filtering.
  var salesRows = filterByEmpresa_(salesData.rows, salesData.map, empresaFilter);
  var invRows = filterByEmpresa_(invData.rows, invData.map, empresaFilter);

  var m = salesData.map;
  var totalIdx = pickIndex_(m, ['total', 'monto', 'valor', 'venta_total']);
  var dateIdx = pickIndex_(m, ['fecha', 'fecha_venta', 'created_at']);
  var payIdx = pickIndex_(m, ['metodo_pago', 'pago', 'medio_pago']);
  var range = resolveReportsRange_(params);
  var from = range.from;
  var to = range.to;

  var totalSales = 0;
  var totalTickets = 0;
  var paymentMap = {};
  var dailyMap = {};

  salesRows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (!d || d < from || d > to) return;

    var amount = toNumber_(totalIdx === -1 ? 0 : r[totalIdx]);
    totalSales += amount;
    totalTickets += 1;

    var p = String(payIdx === -1 ? 'Efectivo' : r[payIdx] || 'Efectivo');
    paymentMap[p] = (paymentMap[p] || 0) + amount;
    var key = formatDateIso_(d);
    dailyMap[key] = (dailyMap[key] || 0) + amount;
  });

  var paymentBreakdown = Object.keys(paymentMap).map(function (k) {
    return { metodo: k, monto: round2_(paymentMap[k]) };
  }).sort(function (a, b) { return b.monto - a.monto; });

  var topProducts = computeTopProductsFromInventory_(invRows, invData.map);
  if (!topProducts.length) topProducts = computeTopProductsFromSalesRange_(salesRows, salesData.map, from, to);
  var inventory = computeReportInventorySummary_(invRows, invData.map);
  var dailySales = buildDailySalesSeries_(from, to, dailyMap);

  return {
    summary: {
      monthSales: round2_(totalSales),
      monthTickets: totalTickets,
      avgTicket: round2_(totalTickets ? totalSales / totalTickets : 0)
    },
    range: {
      from: formatDateIso_(from),
      to: formatDateIso_(to)
    },
    inventory: inventory,
    paymentBreakdown: paymentBreakdown.slice(0, 6),
    topProducts: topProducts.slice(0, 8),
    dailySales: dailySales
  };
}

function resolveReportsRange_(params) {
  var now = stripTime_(new Date());
  var preset = String((params && params.range) || 'month').toLowerCase();
  var from = null;
  var to = null;

  if (preset === 'custom') {
    from = parseDate_(params && params.from ? params.from : null);
    to = parseDate_(params && params.to ? params.to : null);
  }

  if (!from || !to) {
    if (preset === 'today') {
      from = now;
      to = now;
    } else if (preset === '7d') {
      to = now;
      from = new Date(now);
      from.setDate(now.getDate() - 6);
    } else if (preset === '30d') {
      to = now;
      from = new Date(now);
      from.setDate(now.getDate() - 29);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = now;
    }
  }

  if (from > to) {
    var tmp = from;
    from = to;
    to = tmp;
  }

  return { from: stripTime_(from), to: stripTime_(to) };
}

function buildDailySalesSeries_(from, to, dailyMap) {
  var out = [];
  var cursor = new Date(from);
  while (cursor <= to) {
    var key = formatDateIso_(cursor);
    out.push({ fecha: key, total: round2_(dailyMap[key] || 0) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function computeReportInventorySummary_(rows, map) {
  var productIdx = pickIndex_(map, ['producto', 'nombre', 'medicamento']);
  var stockIdx = pickIndex_(map, ['stock', 'existencia', 'cantidad']);
  var priceIdx = pickIndex_(map, ['precio_venta', 'precio', 'pvp']);

  var skuMap = {};
  var totalUnits = 0;
  var stockValue = 0;

  rows.forEach(function (r) {
    var product = String(productIdx === -1 ? '' : r[productIdx] || '').trim().toLowerCase();
    var stock = toNumber_(stockIdx === -1 ? 0 : r[stockIdx]);
    var price = toNumber_(priceIdx === -1 ? 0 : r[priceIdx]);
    if (product) skuMap[product] = true;
    totalUnits += stock;
    stockValue += (stock * price);
  });

  return {
    totalSkus: Object.keys(skuMap).length,
    totalUnits: round2_(totalUnits),
    stockValue: round2_(stockValue)
  };
}

function computeTopProductsFromSalesRange_(salesRows, salesMap, fromDate, toDate) {
  var dateIdx = pickIndex_(salesMap, ['fecha', 'fecha_venta', 'created_at']);
  var detailIdx = pickIndex_(salesMap, ['detalle_json', 'detalle', 'items']);
  var productIdx = pickIndex_(salesMap, ['producto', 'nombre', 'medicamento']);
  var qtyIdx = pickIndex_(salesMap, ['cantidad', 'cant', 'unidades']);

  var totals = {};

  salesRows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (!d || d < fromDate || d > toDate) return;

    var detailRaw = detailIdx === -1 ? null : r[detailIdx];
    var parsed = parseSaleItems_(detailRaw);
    if (parsed.length) {
      parsed.forEach(function (it) {
        var name = String(it.producto || '').trim();
        if (!name) return;
        totals[name] = (totals[name] || 0) + toNumber_(it.cantidad);
      });
      return;
    }

    var singleName = String(productIdx === -1 ? '' : r[productIdx] || '').trim();
    if (!singleName) return;
    var singleQty = toNumber_(qtyIdx === -1 ? 1 : r[qtyIdx]);
    totals[singleName] = (totals[singleName] || 0) + (singleQty > 0 ? singleQty : 1);
  });

  return Object.keys(totals).map(function (k) {
    return { producto: k, unidades: Math.round(totals[k]) };
  }).sort(function (a, b) {
    return b.unidades - a.unidades;
  });
}

function filterByEmpresaIncludeGlobal_(rows, map, empresa) {
  if (!empresa) return rows;

  var idx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);
  if (idx === -1) return rows;

  var wanted = String(empresa).trim().toLowerCase();
  var filtered = rows.filter(function (r) {
    var val = String(r[idx] || '').trim().toLowerCase();
    // Include rows for current empresa and also global rows without empresa.
    return !val || val === wanted;
  });

  // If nothing matches, fallback to all rows so report doesn't show false zero.
  return filtered.length ? filtered : rows;
}

function computeTopProductsFromSales_(salesRows, salesMap, year, month) {
  var dateIdx = pickIndex_(salesMap, ['fecha', 'fecha_venta', 'created_at']);
  var detailIdx = pickIndex_(salesMap, ['detalle_json', 'detalle', 'items']);
  var productIdx = pickIndex_(salesMap, ['producto', 'nombre', 'medicamento']);
  var qtyIdx = pickIndex_(salesMap, ['cantidad', 'cant', 'unidades']);

  var totals = {};

  salesRows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) return;

    // Prefer detail JSON saved by POS (multiple items per sale)
    var detailRaw = detailIdx === -1 ? null : r[detailIdx];
    var parsed = parseSaleItems_(detailRaw);
    if (parsed.length) {
      parsed.forEach(function (it) {
        var name = String(it.producto || '').trim();
        if (!name) return;
        totals[name] = (totals[name] || 0) + toNumber_(it.cantidad);
      });
      return;
    }

    // Fallback for legacy rows with one product per row
    var singleName = String(productIdx === -1 ? '' : r[productIdx] || '').trim();
    if (!singleName) return;
    var singleQty = toNumber_(qtyIdx === -1 ? 1 : r[qtyIdx]);
    totals[singleName] = (totals[singleName] || 0) + (singleQty > 0 ? singleQty : 1);
  });

  return Object.keys(totals).map(function (k) {
    return { producto: k, unidades: Math.round(totals[k]) };
  }).sort(function (a, b) {
    return b.unidades - a.unidades;
  });
}

function computeTopProductsFromInventory_(rows, map) {
  var productIdx = pickIndex_(map, ['producto', 'nombre', 'medicamento']);
  var stockIdx = pickIndex_(map, ['stock', 'existencia', 'cantidad']);

  var grouped = {};
  rows.forEach(function (r) {
    var product = String(productIdx === -1 ? 'Producto' : r[productIdx] || 'Producto').trim();
    if (!product) return;
    var key = product.toLowerCase();
    var stock = toNumber_(stockIdx === -1 ? 0 : r[stockIdx]);
    if (!grouped[key]) grouped[key] = { producto: product, unidades: 0 };
    grouped[key].unidades += stock;
  });

  var list = Object.keys(grouped).map(function (k) {
    return { producto: grouped[k].producto, unidades: round2_(grouped[k].unidades) };
  });
  list.sort(function (a, b) { return b.unidades - a.unidades; });
  if (!list.length) return [{ producto: 'Sin productos', unidades: 0 }];
  return list;
}

function parsePostPayload_(e) {
  if (!e) return {};

  if (e.postData && e.postData.contents) {
    var raw = String(e.postData.contents || '').trim();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (err) {
      // ignore and fallback
    }
  }

  return e.parameter || {};
}

function addInventoryItem_(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CFG.sheets.inventory);
  if (!sh) {
    return { ok: false, error: 'No existe la hoja Inventario' };
  }

  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var headerMap = {};
  for (var i = 0; i < headers.length; i++) {
    headerMap[normalizeKey_(headers[i])] = i;
  }

  var validation = validateInventoryPayload_(payload, false);
  if (!validation.ok) return validation;
  var producto = validation.producto;

  var row = new Array(headers.length);
  for (var j = 0; j < row.length; j++) row[j] = '';

  setRowValue_(row, headerMap, ['empresa', 'dominio', 'tenant'], String(payload.empresa || '').trim());
  setRowValue_(row, headerMap, ['producto', 'nombre', 'medicamento'], producto);
  setRowValue_(row, headerMap, ['lote', 'batch'], validation.lote);
  setRowValue_(row, headerMap, ['stock', 'existencia', 'cantidad'], validation.stock);
  setRowValue_(row, headerMap, ['stock_min', 'min_stock', 'minimo'], validation.stockMin);
  setRowValue_(row, headerMap, ['vencimiento', 'fecha_vencimiento', 'expires'], validation.vencimiento);
  setRowValue_(row, headerMap, ['precio_venta', 'precio', 'pvp'], validation.precioVenta);

  sh.appendRow(row);

  return {
    ok: true,
    message: 'Producto agregado',
    producto: producto
  };
}

function updateInventoryItem_(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CFG.sheets.inventory);
  if (!sh) return { ok: false, error: 'No existe la hoja Inventario' };

  var validation = validateInventoryPayload_(payload, true);
  if (!validation.ok) return validation;

  var key = getInventoryKey_(payload, validation);
  if (!key.ok) return key;

  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var headerMap = {};
  for (var i = 0; i < headers.length; i++) headerMap[normalizeKey_(headers[i])] = i;

  var rowNumber = findInventoryRowNumber_(sh, headerMap, key.empresa, key.producto, key.lote);
  if (rowNumber === -1) return { ok: false, error: 'Producto no encontrado para editar' };

  var rowValues = sh.getRange(rowNumber, 1, 1, sh.getLastColumn()).getValues()[0];
  setRowValue_(rowValues, headerMap, ['empresa', 'dominio', 'tenant'], key.empresa);
  setRowValue_(rowValues, headerMap, ['producto', 'nombre', 'medicamento'], validation.producto);
  setRowValue_(rowValues, headerMap, ['lote', 'batch'], validation.lote);
  setRowValue_(rowValues, headerMap, ['stock', 'existencia', 'cantidad'], validation.stock);
  setRowValue_(rowValues, headerMap, ['stock_min', 'min_stock', 'minimo'], validation.stockMin);
  setRowValue_(rowValues, headerMap, ['vencimiento', 'fecha_vencimiento', 'expires'], validation.vencimiento);
  setRowValue_(rowValues, headerMap, ['precio_venta', 'precio', 'pvp'], validation.precioVenta);

  sh.getRange(rowNumber, 1, 1, sh.getLastColumn()).setValues([rowValues]);

  return {
    ok: true,
    message: 'Producto actualizado',
    producto: validation.producto
  };
}

function deleteInventoryItem_(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CFG.sheets.inventory);
  if (!sh) return { ok: false, error: 'No existe la hoja Inventario' };

  var validation = validateInventoryPayload_(payload, true);
  var key = getInventoryKey_(payload, validation.ok ? validation : {});
  if (!key.ok) return key;

  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var headerMap = {};
  for (var i = 0; i < headers.length; i++) headerMap[normalizeKey_(headers[i])] = i;

  var rowNumber = findInventoryRowNumber_(sh, headerMap, key.empresa, key.producto, key.lote);
  if (rowNumber === -1) return { ok: false, error: 'Producto no encontrado para eliminar' };

  sh.deleteRow(rowNumber);
  return { ok: true, message: 'Producto eliminado' };
}

function getInventoryKey_(payload, normalized) {
  var empresa = String(payload.empresa || '').trim();
  var producto = String(payload.original_producto || payload.producto || normalized.producto || '').trim();
  var lote = String(payload.original_lote || payload.lote || normalized.lote || '').trim();

  if (!producto) return { ok: false, error: 'Producto es obligatorio' };
  if (!lote) return { ok: false, error: 'Lote es obligatorio' };
  return { ok: true, empresa: empresa, producto: producto, lote: lote };
}

function findInventoryRowNumber_(sheet, headerMap, empresa, producto, lote) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return -1;

  var empresaIdx = pickIndex_(headerMap, ['empresa', 'dominio', 'tenant']);
  var productIdx = pickIndex_(headerMap, ['producto', 'nombre', 'medicamento']);
  var lotIdx = pickIndex_(headerMap, ['lote', 'batch']);
  if (productIdx === -1 || lotIdx === -1) return -1;

  var wantedEmpresa = String(empresa || '').trim().toLowerCase();
  var wantedProducto = String(producto || '').trim().toLowerCase();
  var wantedLote = String(lote || '').trim().toLowerCase();

  // 1) Exact match: empresa + producto + lote
  for (var i = 1; i < values.length; i++) {
    var rowEmpresa = empresaIdx === -1 ? '' : String(values[i][empresaIdx] || '').trim().toLowerCase();
    var rowProduct = String(values[i][productIdx] || '').trim().toLowerCase();
    var rowLote = String(values[i][lotIdx] || '').trim().toLowerCase();
    if (rowProduct === wantedProducto && rowLote === wantedLote) {
      if (!wantedEmpresa || empresaIdx === -1 || rowEmpresa === wantedEmpresa) return i + 1;
    }
  }

  // 2) Fallback for old rows with missing/different empresa
  for (var j = 1; j < values.length; j++) {
    var rowProduct2 = String(values[j][productIdx] || '').trim().toLowerCase();
    var rowLote2 = String(values[j][lotIdx] || '').trim().toLowerCase();
    if (rowProduct2 === wantedProducto && rowLote2 === wantedLote) return j + 1;
  }

  return -1;
}

function validateInventoryPayload_(payload, forUpdate) {
  var producto = String(payload.producto || '').trim();
  var lote = String(payload.lote || '').trim();
  var stock = toNumber_(payload.stock);
  var stockMin = toNumber_(payload.stock_min || payload.minimo);
  var precioVenta = toNumber_(payload.precio_venta || payload.precio);
  var vencimiento = String(payload.vencimiento || '').trim();

  if (!forUpdate || producto) {
    if (!producto) return { ok: false, error: 'Producto es obligatorio' };
  }
  if (!forUpdate || lote) {
    if (!lote) return { ok: false, error: 'Lote es obligatorio' };
  }
  if (stock < 0) return { ok: false, error: 'Stock no puede ser negativo' };
  if (stockMin < 0) return { ok: false, error: 'Stock minimo no puede ser negativo' };
  if (precioVenta < 0) return { ok: false, error: 'Precio no puede ser negativo' };
  if (vencimiento && !parseDate_(vencimiento)) return { ok: false, error: 'Fecha de vencimiento invalida' };

  return {
    ok: true,
    producto: producto,
    lote: lote,
    stock: stock,
    stockMin: stockMin,
    precioVenta: precioVenta,
    vencimiento: vencimiento
  };
}

function buildPosCatalog_(empresa) {
  var invData = readSheetObjects_(CFG.sheets.inventory);
  var rows = filterByEmpresa_(invData.rows, invData.map, empresa);
  var m = invData.map;

  var productIdx = pickIndex_(m, ['producto', 'nombre', 'medicamento']);
  var stockIdx = pickIndex_(m, ['stock', 'existencia', 'cantidad']);
  var priceIdx = pickIndex_(m, ['precio_venta', 'precio', 'pvp']);
  var codeIdx = pickIndex_(m, ['codigo', 'codigo_barras', 'barcode', 'sku']);

  var grouped = {};
  rows.forEach(function (r) {
    var product = String(productIdx === -1 ? '' : r[productIdx] || '').trim();
    if (!product) return;
    var stock = toNumber_(stockIdx === -1 ? 0 : r[stockIdx]);
    var price = round2_(toNumber_(priceIdx === -1 ? 0 : r[priceIdx]));
    var code = String(codeIdx === -1 ? '' : r[codeIdx] || '').trim();
    if (!grouped[product]) grouped[product] = { producto: product, stock: 0, precio_venta: 0 };
    grouped[product].stock += stock;
    if (grouped[product].precio_venta <= 0 && price > 0) grouped[product].precio_venta = price;
    if (!grouped[product].codigo && code) grouped[product].codigo = code;
  });

  return {
    ok: true,
    rows: Object.keys(grouped).map(function (k) { return grouped[k]; }).sort(function (a, b) {
      return a.producto > b.producto ? 1 : -1;
    })
  };
}

function createSale_(payload) {
  var empresa = String(payload.empresa || '').trim();
  var items = parseSaleItems_(payload.items);
  var metodoPago = String(payload.metodo_pago || payload.pago || 'Efectivo').trim();
  var cliente = String(payload.cliente || 'Mostrador').trim();
  var cajero = String(payload.cajero || '').trim();
  var fecha = payload.fecha ? new Date(payload.fecha) : new Date();

  if (!items.length) return { ok: false, error: 'No hay productos para vender' };
  if (isNaN(fecha.getTime())) fecha = new Date();

  var total = 0;
  for (var i = 0; i < items.length; i++) {
    if (!items[i].producto) return { ok: false, error: 'Producto invalido en una linea' };
    if (items[i].cantidad <= 0) return { ok: false, error: 'Cantidad debe ser mayor a cero' };
    if (items[i].valor_unitario < 0) return { ok: false, error: 'Valor unitario invalido' };
    total += items[i].cantidad * items[i].valor_unitario;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invSheet = ss.getSheetByName(CFG.sheets.inventory);
  var salesSheet = ss.getSheetByName(CFG.sheets.sales);
  if (!invSheet) return { ok: false, error: 'No existe hoja Inventario' };
  if (!salesSheet) return { ok: false, error: 'No existe hoja Ventas' };

  var invHeaders = invSheet.getRange(1, 1, 1, invSheet.getLastColumn()).getValues()[0];
  var invMap = {};
  for (var j = 0; j < invHeaders.length; j++) invMap[normalizeKey_(invHeaders[j])] = j;

  // Validate stock first
  for (var k = 0; k < items.length; k++) {
    var available = getAvailableStockByProduct_(invSheet, invMap, empresa, items[k].producto);
    if (available < items[k].cantidad) {
      return { ok: false, error: 'Stock insuficiente para ' + items[k].producto + '. Disponible: ' + available };
    }
  }

  // Deduct stock using FEFO-ish order by expiry (oldest first)
  for (var d = 0; d < items.length; d++) {
    deductInventoryByProduct_(invSheet, invMap, empresa, items[d].producto, items[d].cantidad);
  }

  var salesHeaders = salesSheet.getRange(1, 1, 1, salesSheet.getLastColumn()).getValues()[0];
  var salesMap = {};
  for (var z = 0; z < salesHeaders.length; z++) salesMap[normalizeKey_(salesHeaders[z])] = z;

  var row = new Array(salesHeaders.length);
  for (var a = 0; a < row.length; a++) row[a] = '';

  var saleId = 'V-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  setRowValue_(row, salesMap, ['empresa', 'dominio', 'tenant'], empresa);
  setRowValue_(row, salesMap, ['id_venta', 'venta_id', 'id'], saleId);
  setRowValue_(row, salesMap, ['fecha', 'fecha_venta', 'created_at'], fecha);
  setRowValue_(row, salesMap, ['total', 'monto', 'valor', 'venta_total'], round2_(total));
  setRowValue_(row, salesMap, ['metodo_pago', 'pago', 'medio_pago'], metodoPago);
  setRowValue_(row, salesMap, ['cliente', 'paciente', 'nombre_cliente'], cliente);
  setRowValue_(row, salesMap, ['cajero', 'usuario', 'vendedor'], cajero);
  setRowValue_(row, salesMap, ['detalle', 'items', 'detalle_json'], JSON.stringify(items));
  salesSheet.appendRow(row);

  return {
    ok: true,
    sale_id: saleId,
    total: round2_(total),
    items: items.length
  };
}

function parseSaleItems_(raw) {
  if (!raw) return [];
  var arr = [];
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch (e) {
      arr = [];
    }
  } else if (Object.prototype.toString.call(raw) === '[object Array]') {
    arr = raw;
  }
  if (!arr || !arr.length) return [];

  return arr.map(function (it) {
    return {
      producto: String(it.producto || it.desc || '').trim(),
      cantidad: toNumber_(it.cantidad || it.cant),
      valor_unitario: toNumber_(it.valor_unitario || it.valor || it.val)
    };
  }).filter(function (it) { return it.producto; });
}

function getAvailableStockByProduct_(sheet, map, empresa, producto) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return 0;

  var empresaIdx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);
  var productIdx = pickIndex_(map, ['producto', 'nombre', 'medicamento']);
  var stockIdx = pickIndex_(map, ['stock', 'existencia', 'cantidad']);
  if (productIdx === -1 || stockIdx === -1) return 0;

  var total = 0;
  // Use the same normalization used for headers so accents/spaces/case won't block sales.
  var wantedEmpresaKey = normalizeKey_(empresa);
  var wantedProductoKey = normalizeKey_(producto);
  for (var i = 1; i < values.length; i++) {
    var rowEmpresaKey = empresaIdx === -1 ? '' : normalizeKey_(values[i][empresaIdx]);
    var rowProductoKey = normalizeKey_(values[i][productIdx]);
    if (rowProductoKey !== wantedProductoKey) continue;
    // If the row has an empresa value, it must match the requested empresa.
    if (wantedEmpresaKey && empresaIdx !== -1 && rowEmpresaKey && rowEmpresaKey !== wantedEmpresaKey) continue;
    total += toNumber_(values[i][stockIdx]);
  }
  return total;
}

function deductInventoryByProduct_(sheet, map, empresa, producto, quantity) {
  var values = sheet.getDataRange().getValues();
  var empresaIdx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);
  var productIdx = pickIndex_(map, ['producto', 'nombre', 'medicamento']);
  var stockIdx = pickIndex_(map, ['stock', 'existencia', 'cantidad']);
  var expIdx = pickIndex_(map, ['vencimiento', 'fecha_vencimiento', 'expires']);
  if (productIdx === -1 || stockIdx === -1) return;

  var wantedEmpresaKey = normalizeKey_(empresa);
  var wantedProductoKey = normalizeKey_(producto);
  var candidates = [];

  for (var i = 1; i < values.length; i++) {
    var rowEmpresaKey = empresaIdx === -1 ? '' : normalizeKey_(values[i][empresaIdx]);
    var rowProductoKey = normalizeKey_(values[i][productIdx]);
    if (rowProductoKey !== wantedProductoKey) continue;
    if (wantedEmpresaKey && empresaIdx !== -1 && rowEmpresaKey && rowEmpresaKey !== wantedEmpresaKey) continue;

    var stock = toNumber_(values[i][stockIdx]);
    if (stock <= 0) continue;
    var exp = expIdx === -1 ? null : parseDate_(values[i][expIdx]);
    candidates.push({ rowNumber: i + 1, stock: stock, expMs: exp ? exp.getTime() : 9999999999999 });
  }

  candidates.sort(function (a, b) { return a.expMs - b.expMs; });
  var pending = quantity;
  for (var c = 0; c < candidates.length && pending > 0; c++) {
    var take = Math.min(candidates[c].stock, pending);
    var newStock = candidates[c].stock - take;
    sheet.getRange(candidates[c].rowNumber, stockIdx + 1).setValue(newStock);
    pending -= take;
  }
}

function buildCashClose_(empresa, cajero, fecha) {
  var salesData = readSheetObjects_(CFG.sheets.sales);
  var rows = filterByEmpresa_(salesData.rows, salesData.map, empresa);
  var m = salesData.map;

  var idIdx = pickIndex_(m, ['id_venta', 'venta_id', 'id']);
  var dateIdx = pickIndex_(m, ['fecha', 'fecha_venta', 'created_at']);
  var totalIdx = pickIndex_(m, ['total', 'monto', 'valor', 'venta_total']);
  var payIdx = pickIndex_(m, ['metodo_pago', 'pago', 'medio_pago']);
  var cajIdx = pickIndex_(m, ['cajero', 'usuario', 'vendedor']);
  var cliIdx = pickIndex_(m, ['cliente', 'paciente', 'nombre_cliente']);

  var baseDate = fecha ? parseDate_(fecha) : stripTime_(new Date());
  if (!baseDate) baseDate = stripTime_(new Date());
  var wantedCajero = String(cajero || '').trim().toLowerCase();

  var summary = {
    date: formatDateIso_(baseDate),
    total_sales: 0,
    tickets: 0,
    cash: 0,
    card: 0,
    transfer: 0
  };
  var sales = [];

  rows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (!d || !isSameDate_(d, baseDate)) return;

    var rowCajero = String(cajIdx === -1 ? '' : r[cajIdx] || '').trim().toLowerCase();
    if (wantedCajero && rowCajero && rowCajero !== wantedCajero) return;

    var total = round2_(toNumber_(totalIdx === -1 ? 0 : r[totalIdx]));
    var pay = String(payIdx === -1 ? 'efectivo' : r[payIdx] || 'efectivo').toLowerCase();

    summary.total_sales += total;
    summary.tickets += 1;
    if (pay.indexOf('efectivo') !== -1) summary.cash += total;
    else if (pay.indexOf('tarjeta') !== -1) summary.card += total;
    else summary.transfer += total;

    sales.push({
      id_venta: String(idIdx === -1 ? '' : r[idIdx] || ''),
      fecha: formatDateIso_(d),
      cliente: String(cliIdx === -1 ? 'Mostrador' : r[cliIdx] || 'Mostrador'),
      metodo_pago: String(payIdx === -1 ? 'Efectivo' : r[payIdx] || 'Efectivo'),
      total: total
    });
  });

  sales.sort(function (a, b) { return a.id_venta < b.id_venta ? 1 : -1; });

  summary.total_sales = round2_(summary.total_sales);
  summary.cash = round2_(summary.cash);
  summary.card = round2_(summary.card);
  summary.transfer = round2_(summary.transfer);

  return {
    ok: true,
    summary: summary,
    rows: sales.slice(0, 20)
  };
}

function registerCashClose_(payload) {
  var empresa = String(payload.empresa || '').trim();
  var cajero = String(payload.cajero || payload.usuario || payload.vendedor || '').trim();
  var fecha = String(payload.fecha || '').trim();

  if (!cajero) return { ok: false, error: 'cajero es obligatorio' };

  var expected = buildCashClose_(empresa, cajero, fecha);
  if (!expected || !expected.ok || !expected.summary) {
    return { ok: false, error: 'No se pudo calcular el cierre' };
  }

  var s = expected.summary;
  var countedCash = toNumber_(payload.contado_efectivo || payload.efectivo_contado || payload.cash_counted);
  var countedCard = toNumber_(payload.contado_tarjeta || payload.tarjeta_contado || payload.card_counted);
  var countedTransfer = toNumber_(payload.contado_transferencia || payload.transfer_contado || payload.transfer_counted);
  var nota = String(payload.nota || payload.observacion || '').trim();

  // If the client only provides cash count, keep non-cash values equal to expected.
  if (!isFinite(countedCash)) countedCash = toNumber_(s.cash);
  if (!isFinite(countedCard)) countedCard = toNumber_(s.card);
  if (!isFinite(countedTransfer)) countedTransfer = toNumber_(s.transfer);

  countedCash = round2_(countedCash);
  countedCard = round2_(countedCard);
  countedTransfer = round2_(countedTransfer);

  var expCash = toNumber_(s.cash);
  var expCard = toNumber_(s.card);
  var expTransfer = toNumber_(s.transfer);
  var expTotal = toNumber_(s.total_sales);

  var diffCash = round2_(countedCash - expCash);
  var diffCard = round2_(countedCard - expCard);
  var diffTransfer = round2_(countedTransfer - expTransfer);
  var countedTotal = round2_(countedCash + countedCard + countedTransfer);
  var diffTotal = round2_(countedTotal - expTotal);

  var sheet = ensureSheetWithHeaders_(CFG.sheets.cash_closes, [
    'id_cierre',
    'timestamp',
    'fecha',
    'empresa',
    'cajero',
    'tickets',
    'total_ventas',
    'ventas_efectivo',
    'ventas_tarjeta',
    'ventas_transferencia',
    'contado_efectivo',
    'contado_tarjeta',
    'contado_transferencia',
    'dif_efectivo',
    'dif_tarjeta',
    'dif_transferencia',
    'dif_total',
    'nota'
  ]);

  var map = getSheetHeaderMap_(sheet);
  var row = makeEmptyRow_(sheet.getLastColumn());
  var closeId = generateId_('CC');
  var now = new Date();

  setRowValue_(row, map, ['id_cierre', 'id'], closeId);
  setRowValue_(row, map, ['timestamp', 'fecha_registro'], now.toISOString());
  setRowValue_(row, map, ['fecha'], String(s.date || fecha || '').trim());
  setRowValue_(row, map, ['empresa', 'dominio', 'tenant'], empresa);
  setRowValue_(row, map, ['cajero', 'usuario', 'vendedor'], cajero);
  setRowValue_(row, map, ['tickets'], Math.round(toNumber_(s.tickets)));
  setRowValue_(row, map, ['total_ventas', 'total_sales'], round2_(expTotal));
  setRowValue_(row, map, ['ventas_efectivo', 'cash'], round2_(expCash));
  setRowValue_(row, map, ['ventas_tarjeta', 'card'], round2_(expCard));
  setRowValue_(row, map, ['ventas_transferencia', 'transfer'], round2_(expTransfer));
  setRowValue_(row, map, ['contado_efectivo'], countedCash);
  setRowValue_(row, map, ['contado_tarjeta'], countedCard);
  setRowValue_(row, map, ['contado_transferencia'], countedTransfer);
  setRowValue_(row, map, ['dif_efectivo'], diffCash);
  setRowValue_(row, map, ['dif_tarjeta'], diffCard);
  setRowValue_(row, map, ['dif_transferencia'], diffTransfer);
  setRowValue_(row, map, ['dif_total'], diffTotal);
  setRowValue_(row, map, ['nota', 'observacion'], nota);

  sheet.appendRow(row);

  return {
    ok: true,
    close_id: closeId,
    expected: s,
    counted: { cash: countedCash, card: countedCard, transfer: countedTransfer, total: countedTotal },
    diff: { cash: diffCash, card: diffCard, transfer: diffTransfer, total: diffTotal }
  };
}

function buildSaleDetail_(empresa, saleId) {
  var wantedId = String(saleId || '').trim().toLowerCase();
  if (!wantedId) return { ok: false, error: 'id_venta es obligatorio' };

  var salesData = readSheetObjects_(CFG.sheets.sales);
  var rows = salesData.rows || [];
  var m = salesData.map || {};

  var idIdx = pickIndex_(m, ['id_venta', 'venta_id', 'id']);
  var dateIdx = pickIndex_(m, ['fecha', 'fecha_venta', 'created_at']);
  var totalIdx = pickIndex_(m, ['total', 'monto', 'valor', 'venta_total']);
  var payIdx = pickIndex_(m, ['metodo_pago', 'pago', 'medio_pago']);
  var clientIdx = pickIndex_(m, ['cliente', 'paciente', 'nombre_cliente']);
  var cashierIdx = pickIndex_(m, ['cajero', 'usuario', 'vendedor']);
  var detailIdx = pickIndex_(m, ['detalle', 'items', 'detalle_json']);
  var productIdx = pickIndex_(m, ['producto', 'nombre', 'medicamento']);
  var qtyIdx = pickIndex_(m, ['cantidad', 'cant', 'unidades']);
  var unitIdx = pickIndex_(m, ['valor_unitario', 'precio_unitario', 'precio', 'valor']);
  var empresaIdx = pickIndex_(m, ['empresa', 'dominio', 'tenant']);

  var wantedEmpresa = String(empresa || '').trim().toLowerCase();

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var rowId = String(idIdx === -1 ? '' : row[idIdx] || '').trim().toLowerCase();
    if (!rowId || rowId !== wantedId) continue;

    if (wantedEmpresa && empresaIdx !== -1) {
      var rowEmpresa = String(row[empresaIdx] || '').trim().toLowerCase();
      if (rowEmpresa && rowEmpresa !== wantedEmpresa) continue;
    }

    var items = parseSaleItems_(detailIdx === -1 ? null : row[detailIdx]);

    // Fallback for legacy rows where detail JSON was not saved.
    if (!items.length && productIdx !== -1) {
      var singleName = String(row[productIdx] || '').trim();
      if (singleName) {
        var singleQty = toNumber_(qtyIdx === -1 ? 1 : row[qtyIdx]);
        var singleUnit = toNumber_(unitIdx === -1 ? 0 : row[unitIdx]);
        if (singleQty <= 0) singleQty = 1;
        items.push({
          producto: singleName,
          cantidad: singleQty,
          valor_unitario: singleUnit
        });
      }
    }

    var subtotal = 0;
    for (var k = 0; k < items.length; k++) {
      subtotal += toNumber_(items[k].cantidad) * toNumber_(items[k].valor_unitario);
    }

    var total = round2_(toNumber_(totalIdx === -1 ? subtotal : row[totalIdx]));
    if (total <= 0) total = round2_(subtotal);

    // Absolute fallback so printable copy is never empty.
    if (!items.length && total > 0) {
      items.push({
        producto: 'Productos varios',
        cantidad: 1,
        valor_unitario: total
      });
      subtotal = total;
    }

    var d = parseDate_(dateIdx === -1 ? null : row[dateIdx]);
    return {
      ok: true,
      sale: {
        id_venta: String(idIdx === -1 ? '' : row[idIdx] || ''),
        empresa: String(empresaIdx === -1 ? empresa || '' : row[empresaIdx] || empresa || ''),
        fecha: d ? formatDateIso_(d) : formatDateIso_(stripTime_(new Date())),
        cliente: String(clientIdx === -1 ? 'Mostrador' : row[clientIdx] || 'Mostrador'),
        cajero: String(cashierIdx === -1 ? '' : row[cashierIdx] || ''),
        metodo_pago: String(payIdx === -1 ? 'Efectivo' : row[payIdx] || 'Efectivo'),
        subtotal: round2_(subtotal),
        impuesto: 0,
        total: total,
        items: items
      }
    };
  }

  return { ok: false, error: 'Venta no encontrada' };
}

function buildClientsPayload_(empresa) {
  var data = readSheetObjects_(CFG.sheets.clients);
  var rows = filterByEmpresaIncludeGlobal_(data.rows, data.map, empresa);
  var m = data.map;

  var idIdx = pickIndex_(m, ['id_cliente', 'id', 'codigo']);
  var nameIdx = pickIndex_(m, ['nombre', 'nombre_completo', 'cliente']);
  var docIdx = pickIndex_(m, ['documento', 'cedula', 'nit']);
  var phoneIdx = pickIndex_(m, ['telefono', 'celular', 'movil']);
  var emailIdx = pickIndex_(m, ['email', 'correo', 'mail']);
  var statusIdx = pickIndex_(m, ['estado', 'status']);

  var out = rows.map(function (r) {
    return {
      id_cliente: String(idIdx === -1 ? '' : r[idIdx] || ''),
      nombre: String(nameIdx === -1 ? '' : r[nameIdx] || ''),
      documento: String(docIdx === -1 ? '' : r[docIdx] || ''),
      telefono: String(phoneIdx === -1 ? '' : r[phoneIdx] || ''),
      email: String(emailIdx === -1 ? '' : r[emailIdx] || ''),
      estado: String(statusIdx === -1 ? 'Activo' : r[statusIdx] || 'Activo')
    };
  }).filter(function (r) { return r.nombre; });

  out.sort(function (a, b) { return a.nombre > b.nombre ? 1 : -1; });
  return { ok: true, rows: out };
}

function addClient_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.clients, ['empresa', 'id_cliente', 'nombre', 'documento', 'telefono', 'email', 'estado']);
  var map = getSheetHeaderMap_(sheet);

  var nombre = String(payload.nombre || '').trim();
  if (!nombre) return { ok: false, error: 'Nombre es obligatorio' };

  var idCliente = String(payload.id_cliente || generateId_('C')).trim();
  var row = makeEmptyRow_(sheet.getLastColumn());
  setRowValue_(row, map, ['empresa', 'dominio', 'tenant'], String(payload.empresa || '').trim());
  setRowValue_(row, map, ['id_cliente', 'id', 'codigo'], idCliente);
  setRowValue_(row, map, ['nombre', 'nombre_completo', 'cliente'], nombre);
  setRowValue_(row, map, ['documento', 'cedula', 'nit'], String(payload.documento || '').trim());
  setRowValue_(row, map, ['telefono', 'celular', 'movil'], String(payload.telefono || '').trim());
  setRowValue_(row, map, ['email', 'correo', 'mail'], String(payload.email || '').trim());
  setRowValue_(row, map, ['estado', 'status'], String(payload.estado || 'Activo').trim() || 'Activo');
  sheet.appendRow(row);
  return { ok: true, id_cliente: idCliente, message: 'Cliente agregado' };
}

function updateClient_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.clients, ['empresa', 'id_cliente', 'nombre', 'documento', 'telefono', 'email', 'estado']);
  var map = getSheetHeaderMap_(sheet);
  var idCliente = String(payload.id_cliente || payload.id || '').trim();
  if (!idCliente) return { ok: false, error: 'id_cliente es obligatorio' };

  var rowNumber = findRowById_(sheet, map, ['id_cliente', 'id', 'codigo'], idCliente);
  if (rowNumber === -1) return { ok: false, error: 'Cliente no encontrado' };

  var row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (payload.nombre != null) setRowValue_(row, map, ['nombre', 'nombre_completo', 'cliente'], String(payload.nombre || '').trim());
  if (payload.documento != null) setRowValue_(row, map, ['documento', 'cedula', 'nit'], String(payload.documento || '').trim());
  if (payload.telefono != null) setRowValue_(row, map, ['telefono', 'celular', 'movil'], String(payload.telefono || '').trim());
  if (payload.email != null) setRowValue_(row, map, ['email', 'correo', 'mail'], String(payload.email || '').trim());
  if (payload.estado != null) setRowValue_(row, map, ['estado', 'status'], String(payload.estado || 'Activo').trim() || 'Activo');
  sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).setValues([row]);
  return { ok: true, id_cliente: idCliente, message: 'Cliente actualizado' };
}

function deleteClient_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.clients, ['empresa', 'id_cliente', 'nombre', 'documento', 'telefono', 'email', 'estado']);
  var map = getSheetHeaderMap_(sheet);
  var idCliente = String(payload.id_cliente || payload.id || '').trim();
  if (!idCliente) return { ok: false, error: 'id_cliente es obligatorio' };
  var rowNumber = findRowById_(sheet, map, ['id_cliente', 'id', 'codigo'], idCliente);
  if (rowNumber === -1) return { ok: false, error: 'Cliente no encontrado' };
  sheet.deleteRow(rowNumber);
  return { ok: true, message: 'Cliente eliminado' };
}

function buildRecipesPayload_(empresa) {
  var data = readSheetObjects_(CFG.sheets.recipes);
  var rows = filterByEmpresaIncludeGlobal_(data.rows, data.map, empresa);
  var m = data.map;

  var idIdx = pickIndex_(m, ['id_receta', 'id', 'codigo']);
  var dateIdx = pickIndex_(m, ['fecha', 'fecha_receta', 'created_at']);
  var clientIdx = pickIndex_(m, ['cliente', 'paciente', 'nombre_cliente']);
  var doctorIdx = pickIndex_(m, ['medico', 'doctor', 'profesional']);
  var detailIdx = pickIndex_(m, ['detalle', 'observaciones', 'descripcion']);
  var statusIdx = pickIndex_(m, ['estado', 'status']);

  var out = rows.map(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    return {
      id_receta: String(idIdx === -1 ? '' : r[idIdx] || ''),
      fecha: d ? formatDateIso_(d) : '',
      cliente: String(clientIdx === -1 ? '' : r[clientIdx] || ''),
      medico: String(doctorIdx === -1 ? '' : r[doctorIdx] || ''),
      detalle: String(detailIdx === -1 ? '' : r[detailIdx] || ''),
      estado: String(statusIdx === -1 ? 'Activa' : r[statusIdx] || 'Activa')
    };
  }).filter(function (r) { return r.cliente || r.detalle; });

  out.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });
  return { ok: true, rows: out };
}

function addRecipe_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.recipes, ['empresa', 'id_receta', 'fecha', 'cliente', 'medico', 'detalle', 'estado']);
  var map = getSheetHeaderMap_(sheet);
  var cliente = String(payload.cliente || '').trim();
  if (!cliente) return { ok: false, error: 'Cliente es obligatorio' };
  var idReceta = String(payload.id_receta || generateId_('R')).trim();
  var row = makeEmptyRow_(sheet.getLastColumn());
  setRowValue_(row, map, ['empresa', 'dominio', 'tenant'], String(payload.empresa || '').trim());
  setRowValue_(row, map, ['id_receta', 'id', 'codigo'], idReceta);
  setRowValue_(row, map, ['fecha', 'fecha_receta', 'created_at'], payload.fecha ? new Date(payload.fecha) : new Date());
  setRowValue_(row, map, ['cliente', 'paciente', 'nombre_cliente'], cliente);
  setRowValue_(row, map, ['medico', 'doctor', 'profesional'], String(payload.medico || '').trim());
  setRowValue_(row, map, ['detalle', 'observaciones', 'descripcion'], String(payload.detalle || '').trim());
  setRowValue_(row, map, ['estado', 'status'], String(payload.estado || 'Activa').trim() || 'Activa');
  sheet.appendRow(row);
  return { ok: true, id_receta: idReceta, message: 'Receta agregada' };
}

function updateRecipe_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.recipes, ['empresa', 'id_receta', 'fecha', 'cliente', 'medico', 'detalle', 'estado']);
  var map = getSheetHeaderMap_(sheet);
  var idReceta = String(payload.id_receta || payload.id || '').trim();
  if (!idReceta) return { ok: false, error: 'id_receta es obligatorio' };
  var rowNumber = findRowById_(sheet, map, ['id_receta', 'id', 'codigo'], idReceta);
  if (rowNumber === -1) return { ok: false, error: 'Receta no encontrada' };

  var row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (payload.fecha != null) setRowValue_(row, map, ['fecha', 'fecha_receta', 'created_at'], payload.fecha ? new Date(payload.fecha) : new Date());
  if (payload.cliente != null) setRowValue_(row, map, ['cliente', 'paciente', 'nombre_cliente'], String(payload.cliente || '').trim());
  if (payload.medico != null) setRowValue_(row, map, ['medico', 'doctor', 'profesional'], String(payload.medico || '').trim());
  if (payload.detalle != null) setRowValue_(row, map, ['detalle', 'observaciones', 'descripcion'], String(payload.detalle || '').trim());
  if (payload.estado != null) setRowValue_(row, map, ['estado', 'status'], String(payload.estado || 'Activa').trim() || 'Activa');
  sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).setValues([row]);
  return { ok: true, id_receta: idReceta, message: 'Receta actualizada' };
}

function deleteRecipe_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.recipes, ['empresa', 'id_receta', 'fecha', 'cliente', 'medico', 'detalle', 'estado']);
  var map = getSheetHeaderMap_(sheet);
  var idReceta = String(payload.id_receta || payload.id || '').trim();
  if (!idReceta) return { ok: false, error: 'id_receta es obligatorio' };
  var rowNumber = findRowById_(sheet, map, ['id_receta', 'id', 'codigo'], idReceta);
  if (rowNumber === -1) return { ok: false, error: 'Receta no encontrada' };
  sheet.deleteRow(rowNumber);
  return { ok: true, message: 'Receta eliminada' };
}

function getSettings_(empresa) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.settings, [
    'empresa', 'nombre_empresa', 'nit', 'telefono', 'email', 'direccion',
    'iva_porcentaje', 'stock_min_default', 'caja_activa', 'nota_ticket'
  ]);
  var map = getSheetHeaderMap_(sheet);
  var values = sheet.getDataRange().getValues();
  var wanted = String(empresa || '').trim().toLowerCase();
  var empresaIdx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);

  var row = null;
  for (var i = 1; i < values.length; i++) {
    var rowEmp = empresaIdx === -1 ? '' : String(values[i][empresaIdx] || '').trim().toLowerCase();
    if (!wanted || rowEmp === wanted || !rowEmp) { row = values[i]; if (rowEmp === wanted) break; }
  }

  var out = {
    empresa: empresa || '',
    nombre_empresa: '',
    nit: '',
    telefono: '',
    email: '',
    direccion: '',
    iva_porcentaje: 0,
    stock_min_default: 0,
    caja_activa: 'Caja #1',
    nota_ticket: 'Gracias por su compra'
  };

  if (row) {
    out.nombre_empresa = String(getByKeys_(row, map, ['nombre_empresa', 'empresa_nombre']) || '');
    out.nit = String(getByKeys_(row, map, ['nit']) || '');
    out.telefono = String(getByKeys_(row, map, ['telefono', 'celular']) || '');
    out.email = String(getByKeys_(row, map, ['email', 'correo']) || '');
    out.direccion = String(getByKeys_(row, map, ['direccion']) || '');
    out.iva_porcentaje = toNumber_(getByKeys_(row, map, ['iva_porcentaje', 'iva']));
    out.stock_min_default = toNumber_(getByKeys_(row, map, ['stock_min_default', 'minimo_stock']));
    out.caja_activa = String(getByKeys_(row, map, ['caja_activa', 'caja']) || out.caja_activa);
    out.nota_ticket = String(getByKeys_(row, map, ['nota_ticket', 'observacion']) || out.nota_ticket);
  }

  return { ok: true, settings: out };
}

function saveSettings_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.settings, [
    'empresa', 'nombre_empresa', 'nit', 'telefono', 'email', 'direccion',
    'iva_porcentaje', 'stock_min_default', 'caja_activa', 'nota_ticket'
  ]);
  var map = getSheetHeaderMap_(sheet);
  var empresa = String(payload.empresa || '').trim();
  if (!empresa) return { ok: false, error: 'Empresa es obligatoria' };

  var empresaIdx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);
  var values = sheet.getDataRange().getValues();
  var wanted = empresa.toLowerCase();
  var rowNumber = -1;
  for (var i = 1; i < values.length; i++) {
    var rowEmp = empresaIdx === -1 ? '' : String(values[i][empresaIdx] || '').trim().toLowerCase();
    if (rowEmp === wanted) { rowNumber = i + 1; break; }
  }

  var row = rowNumber === -1 ? makeEmptyRow_(sheet.getLastColumn()) : sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  setRowValue_(row, map, ['empresa', 'dominio', 'tenant'], empresa);
  setRowValue_(row, map, ['nombre_empresa', 'empresa_nombre'], String(payload.nombre_empresa || '').trim());
  setRowValue_(row, map, ['nit'], String(payload.nit || '').trim());
  setRowValue_(row, map, ['telefono', 'celular'], String(payload.telefono || '').trim());
  setRowValue_(row, map, ['email', 'correo'], String(payload.email || '').trim());
  setRowValue_(row, map, ['direccion'], String(payload.direccion || '').trim());
  setRowValue_(row, map, ['iva_porcentaje', 'iva'], toNumber_(payload.iva_porcentaje));
  setRowValue_(row, map, ['stock_min_default', 'minimo_stock'], toNumber_(payload.stock_min_default));
  setRowValue_(row, map, ['caja_activa', 'caja'], String(payload.caja_activa || '').trim());
  setRowValue_(row, map, ['nota_ticket', 'observacion'], String(payload.nota_ticket || '').trim());

  if (rowNumber === -1) sheet.appendRow(row);
  else sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).setValues([row]);

  return { ok: true, message: 'Configuracion guardada' };
}

function getByKeys_(row, map, keys) {
  var idx = pickIndex_(map, keys);
  return idx === -1 ? '' : row[idx];
}

function ensureSheetWithHeaders_(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function getSheetHeaderMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) map[normalizeKey_(headers[i])] = i;
  return map;
}

function makeEmptyRow_(len) {
  var row = new Array(len);
  for (var i = 0; i < len; i++) row[i] = '';
  return row;
}

function findRowById_(sheet, map, idKeys, idValue) {
  var idx = pickIndex_(map, idKeys);
  if (idx === -1) return -1;
  var values = sheet.getDataRange().getValues();
  var wanted = String(idValue || '').trim().toLowerCase();
  for (var i = 1; i < values.length; i++) {
    var val = String(values[i][idx] || '').trim().toLowerCase();
    if (val && val === wanted) return i + 1;
  }
  return -1;
}

function generateId_(prefix) {
  return String(prefix || 'ID') + '-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
}

function setRowValue_(row, headerMap, keys, value) {
  var idx = pickIndex_(headerMap, keys);
  if (idx !== -1) row[idx] = value;
}

function readSheetObjects_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return { rows: [], map: {} };

  var values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return { rows: [], map: {} };

  var headers = values[0].map(function (h) { return normalizeKey_(h); });
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    if (headers[i]) map[headers[i]] = i;
  }

  var rows = values.slice(1);
  return { rows: rows, map: map };
}

function filterByEmpresa_(rows, map, empresa) {
  var empresaFilter = normalizeEmpresaFilter_(empresa);
  if (!empresaFilter) return rows;

  var idx = pickIndex_(map, ['empresa', 'dominio', 'tenant']);
  if (idx === -1) return rows;

  var wanted = String(empresaFilter).trim().toLowerCase();
  return rows.filter(function (r) {
    return String(r[idx] || '').trim().toLowerCase() === wanted;
  });
}

function normalizeEmpresaFilter_(empresa) {
  var raw = String(empresa || '').trim();
  if (!raw) return '';
  // Some clients may send URL-encoded values (or even double-encoded like "%2520").
  // Apps Script decodes query params once; we decode again (safely) when patterns remain.
  raw = raw.replace(/\+/g, ' ');
  try {
    for (var i = 0; i < 3 && /%[0-9a-fA-F]{2}/.test(raw); i++) {
      var decoded = decodeURIComponent(raw);
      if (decoded === raw) break;
      raw = decoded;
    }
  } catch (err) {
    // Keep raw as-is if decoding fails.
  }
  raw = String(raw || '').trim();
  var normalized = raw.toLowerCase();
  // Common UI defaults should behave as "no company filter".
  if (normalized === 'general' || normalized === 'sede principal' || normalized === 'todas' || normalized === 'todos') {
    return '';
  }
  return raw;
}

function computeMetrics_(salesRows, salesMap, inventoryRows, invMap) {
  var today = stripTime_(new Date());
  var yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  var salesIdx = pickIndex_(salesMap, ['total', 'monto', 'valor', 'venta_total']);
  var dateIdx = pickIndex_(salesMap, ['fecha', 'fecha_venta', 'created_at']);

  var salesToday = 0;
  var ticketsToday = 0;
  var salesYesterday = 0;

  salesRows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (!d) return;

    var amount = toNumber_(salesIdx === -1 ? 0 : r[salesIdx]);
    if (isSameDate_(d, today)) {
      salesToday += amount;
      ticketsToday += 1;
    } else if (isSameDate_(d, yesterday)) {
      salesYesterday += amount;
    }
  });

  var lowStockCount = 0;
  var expiringCount = 0;

  var stockIdx = pickIndex_(invMap, ['stock', 'existencia', 'cantidad']);
  var minIdx = pickIndex_(invMap, ['stock_min', 'min_stock', 'minimo']);
  var expIdx = pickIndex_(invMap, ['vencimiento', 'fecha_vencimiento', 'expires']);

  var limitDate = new Date(today);
  limitDate.setDate(today.getDate() + 30);

  inventoryRows.forEach(function (r) {
    var stock = toNumber_(stockIdx === -1 ? 0 : r[stockIdx]);
    var min = toNumber_(minIdx === -1 ? 5 : r[minIdx]);
    if (stock <= min) lowStockCount += 1;

    var expDate = parseDate_(expIdx === -1 ? null : r[expIdx]);
    if (expDate && expDate >= today && expDate <= limitDate) {
      expiringCount += 1;
    }
  });

  var ticketAverage = ticketsToday ? (salesToday / ticketsToday) : 0;
  var pct = salesYesterday > 0 ? ((salesToday - salesYesterday) / salesYesterday) * 100 : 0;

  return {
    salesToday: round2_(salesToday),
    salesChange: formatPercentLabel_(pct),
    tickets: ticketsToday,
    ticketAverage: round2_(ticketAverage),
    lowStock: lowStockCount,
    lowStockMessage: lowStockCount > 0 ? 'Requiere reposicion' : 'Sin alertas',
    expiring30: expiringCount,
    expiringMessage: expiringCount > 0 ? 'Accion recomendada' : 'Sin alertas'
  };
}

function computeWeeklySales_(salesRows, salesMap) {
  var labels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  var dateIdx = pickIndex_(salesMap, ['fecha', 'fecha_venta', 'created_at']);
  var salesIdx = pickIndex_(salesMap, ['total', 'monto', 'valor', 'venta_total']);

  var now = stripTime_(new Date());
  var start = new Date(now);
  start.setDate(now.getDate() - 6);

  var sumsByDay = [0, 0, 0, 0, 0, 0, 0];

  salesRows.forEach(function (r) {
    var d = parseDate_(dateIdx === -1 ? null : r[dateIdx]);
    if (!d) return;
    var dd = stripTime_(d);
    if (dd < start || dd > now) return;

    var amount = toNumber_(salesIdx === -1 ? 0 : r[salesIdx]);
    sumsByDay[dd.getDay()] += amount;
  });

  var max = Math.max.apply(null, sumsByDay.concat([1]));

  var ordered = [];
  for (var i = 6; i >= 0; i--) {
    var d2 = new Date(now);
    d2.setDate(now.getDate() - i);
    var dow = d2.getDay();
    ordered.push({
      day: labels[dow],
      value: Math.round((sumsByDay[dow] / max) * 100)
    });
  }

  return ordered;
}

function computeAlerts_(inventoryRows, invMap, orderRows, orderMap) {
  var alerts = [];

  var productIdx = pickIndex_(invMap, ['producto', 'nombre', 'medicamento']);
  var stockIdx = pickIndex_(invMap, ['stock', 'existencia', 'cantidad']);
  var minIdx = pickIndex_(invMap, ['stock_min', 'min_stock', 'minimo']);
  var expIdx = pickIndex_(invMap, ['vencimiento', 'fecha_vencimiento', 'expires']);

  var today = stripTime_(new Date());
  var limitDate = new Date(today);
  limitDate.setDate(today.getDate() + 30);

  inventoryRows.forEach(function (r) {
    var product = String(productIdx === -1 ? 'Producto' : r[productIdx] || 'Producto');
    var stock = toNumber_(stockIdx === -1 ? 0 : r[stockIdx]);
    var min = toNumber_(minIdx === -1 ? 5 : r[minIdx]);

    if (stock <= min) {
      alerts.push({
        text: product + ' (stock bajo)',
        tag: String(stock) + ' und',
        level: stock <= 0 ? 'danger' : 'warn'
      });
    }

    var expDate = parseDate_(expIdx === -1 ? null : r[expIdx]);
    if (expDate && expDate >= today && expDate <= limitDate) {
      var days = daysDiff_(today, expDate);
      alerts.push({
        text: product + ' vence en ' + days + ' dias',
        tag: 'Vence pronto',
        level: days <= 7 ? 'danger' : 'warn'
      });
    }
  });

  var orderNumIdx = pickIndex_(orderMap, ['pedido', 'numero_pedido', 'id']);
  var orderStatusIdx = pickIndex_(orderMap, ['estado', 'status']);

  for (var i = 0; i < orderRows.length; i++) {
    var status = String(orderStatusIdx === -1 ? '' : orderRows[i][orderStatusIdx] || '').toLowerCase();
    if (status === 'confirmado' || status === 'en camino' || status === 'aprobado') {
      var orderNum = String(orderNumIdx === -1 ? (i + 1) : (orderRows[i][orderNumIdx] || (i + 1)));
      alerts.push({
        text: 'Pedido #' + orderNum + ' confirmado por proveedor',
        tag: 'En camino',
        level: 'ok'
      });
      break;
    }
  }

  if (!alerts.length) {
    alerts.push({ text: 'Sin alertas operativas', tag: 'Estable', level: 'ok' });
  }

  return alerts.slice(0, 6);
}

function computePriorityProducts_(inventoryRows, invMap) {
  var productIdx = pickIndex_(invMap, ['producto', 'nombre', 'medicamento']);
  var lotIdx = pickIndex_(invMap, ['lote', 'batch']);
  var stockIdx = pickIndex_(invMap, ['stock', 'existencia', 'cantidad']);
  var minIdx = pickIndex_(invMap, ['stock_min', 'min_stock', 'minimo']);
  var expIdx = pickIndex_(invMap, ['vencimiento', 'fecha_vencimiento', 'expires']);

  var today = stripTime_(new Date());

  var ranked = inventoryRows.map(function (r) {
    var product = String(productIdx === -1 ? 'Producto' : r[productIdx] || 'Producto');
    var lot = String(lotIdx === -1 ? '-' : r[lotIdx] || '-');
    var stock = toNumber_(stockIdx === -1 ? 0 : r[stockIdx]);
    var min = toNumber_(minIdx === -1 ? 5 : r[minIdx]);
    var expDate = parseDate_(expIdx === -1 ? null : r[expIdx]);

    var daysToExpire = expDate ? daysDiff_(today, expDate) : 9999;
    var stockGap = Math.max(0, min - stock);
    var score = (stockGap * 20) + (daysToExpire < 0 ? 200 : Math.max(0, 120 - daysToExpire));

    var level = 'ok';
    var status = 'Normal';

    if (stock <= 0) {
      level = 'danger';
      status = 'Sin stock';
    } else if (stock <= min || daysToExpire <= 15) {
      level = 'danger';
      status = 'Critico';
    } else if (daysToExpire <= 30 || stock <= (min + 3)) {
      level = 'warn';
      status = 'Rotacion alta';
    }

    return {
      product: product,
      lot: lot,
      stock: stock,
      expires: expDate ? formatDateIso_(expDate) : '-',
      status: status,
      level: level,
      score: score
    };
  });

  ranked.sort(function (a, b) { return b.score - a.score; });

  var out = ranked.slice(0, 8).map(function (p) {
    return {
      product: p.product,
      lot: p.lot,
      stock: p.stock,
      expires: p.expires,
      status: p.status,
      level: p.level
    };
  });

  if (!out.length) {
    out.push({
      product: 'Sin productos',
      lot: '-',
      stock: 0,
      expires: '-',
      status: 'Normal',
      level: 'ok'
    });
  }

  return out;
}

function pickIndex_(map, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = normalizeKey_(keys[i]);
    if (Object.prototype.hasOwnProperty.call(map, k)) return map[k];
  }
  return -1;
}

function normalizeKey_(v) {
  return String(v || '')
    .toLowerCase()
    .trim()
    .replace(/[\u00C0-\u00C5]/g, 'a')
    .replace(/[\u00C8-\u00CB]/g, 'e')
    .replace(/[\u00CC-\u00CF]/g, 'i')
    .replace(/[\u00D2-\u00D6]/g, 'o')
    .replace(/[\u00D9-\u00DC]/g, 'u')
    .replace(/[\u00D1]/g, 'n')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toNumber_(v) {
  if (typeof v === 'number') return v;
  if (v == null || v === '') return 0;
  var s = String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  var n = Number(s);
  return isNaN(n) ? 0 : n;
}

function parseDate_(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) return stripTime_(v);

  var d = new Date(v);
  if (!isNaN(d)) return stripTime_(d);

  var s = String(v);
  var parts = s.split(/[\/-]/);
  if (parts.length === 3) {
    var a = Number(parts[0]);
    var b = Number(parts[1]);
    var c = Number(parts[2]);

    if (a > 31) return stripTime_(new Date(a, b - 1, c));
    if (c > 31) return stripTime_(new Date(c, b - 1, a));
  }

  return null;
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDate_(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function daysDiff_(fromDate, toDate) {
  var ms = stripTime_(toDate).getTime() - stripTime_(fromDate).getTime();
  return Math.ceil(ms / 86400000);
}

function formatDateIso_(d) {
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

function formatPercentLabel_(pct) {
  var val = Math.round(Math.abs(pct));
  if (!isFinite(val) || isNaN(val)) val = 0;
  var sign = pct >= 0 ? '+' : '-';
  return sign + val + '% vs ayer';
}

function round2_(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}


function buildOrdersPayload_(empresa) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.orders, ['empresa', 'id_pedido', 'fecha', 'lab', 'contacto', 'producto', 'codigo', 'referencia', 'cantidad', 'monto', 'stock_actual', 'fecha_envio', 'fecha_entrega', 'estado', 'notas']);
  var map = getSheetHeaderMap_(sheet);
  var values = sheet.getDataRange().getValues();
  var empresaFilter = normalizeEmpresaFilter_(empresa);
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowEmpresa = String(getByKeys_(row, map, ['empresa', 'dominio', 'tenant']) || '').trim();
    if (empresaFilter && normalizeEmpresaFilter_(rowEmpresa) !== empresaFilter) continue;
    out.push({
      empresa: rowEmpresa,
      id_pedido: String(getByKeys_(row, map, ['id_pedido', 'id', 'codigo']) || ''),
      fecha: formatDateIso_(parseDate_(getByKeys_(row, map, ['fecha', 'created_at']))),
      lab: String(getByKeys_(row, map, ['lab', 'laboratorio', 'proveedor']) || ''),
      contacto: String(getByKeys_(row, map, ['contacto', 'asesor']) || ''),
      producto: String(getByKeys_(row, map, ['producto', 'nombre', 'medicamento']) || ''),
      codigo: String(getByKeys_(row, map, ['codigo', 'barcode']) || ''),
      referencia: String(getByKeys_(row, map, ['referencia', 'detalle']) || ''),
      cantidad: toNumber_(getByKeys_(row, map, ['cantidad', 'unidades'])),
      monto: toNumber_(getByKeys_(row, map, ['monto', 'total', 'valor'])),
      stock_actual: toNumber_(getByKeys_(row, map, ['stock_actual', 'stock'])),
      fecha_envio: formatDateIso_(parseDate_(getByKeys_(row, map, ['fecha_envio', 'envio']))),
      fecha_entrega: formatDateIso_(parseDate_(getByKeys_(row, map, ['fecha_entrega', 'entrega']))),
      estado: String(getByKeys_(row, map, ['estado', 'status']) || 'pendiente'),
      notas: String(getByKeys_(row, map, ['notas', 'detalle', 'observaciones']) || '')
    });
  }
  return { ok: true, rows: out };
}

function addOrder_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.orders, ['empresa', 'id_pedido', 'fecha', 'lab', 'contacto', 'producto', 'codigo', 'referencia', 'cantidad', 'monto', 'stock_actual', 'fecha_envio', 'fecha_entrega', 'estado', 'notas']);
  var map = getSheetHeaderMap_(sheet);
  var lab = String(payload.lab || payload.laboratorio || '').trim();
  var producto = String(payload.producto || '').trim();
  if (!lab) return { ok: false, error: 'Laboratorio es obligatorio' };
  if (!producto) return { ok: false, error: 'Producto es obligatorio' };
  var idPedido = String(payload.id_pedido || generateId_('P')).trim();
  var row = makeEmptyRow_(sheet.getLastColumn());
  setRowValue_(row, map, ['empresa', 'dominio', 'tenant'], String(payload.empresa || '').trim());
  setRowValue_(row, map, ['id_pedido', 'id', 'codigo'], idPedido);
  setRowValue_(row, map, ['fecha', 'created_at'], new Date());
  setRowValue_(row, map, ['lab', 'laboratorio', 'proveedor'], lab);
  setRowValue_(row, map, ['contacto', 'asesor'], String(payload.contacto || '').trim());
  setRowValue_(row, map, ['producto', 'nombre', 'medicamento'], producto);
  setRowValue_(row, map, ['codigo', 'barcode'], String(payload.codigo || '').trim());
  setRowValue_(row, map, ['referencia', 'detalle'], String(payload.referencia || '').trim());
  setRowValue_(row, map, ['cantidad', 'unidades'], toNumber_(payload.cantidad));
  setRowValue_(row, map, ['monto', 'total', 'valor'], toNumber_(payload.monto));
  setRowValue_(row, map, ['stock_actual', 'stock'], toNumber_(payload.stock_actual));
  setRowValue_(row, map, ['fecha_envio', 'envio'], payload.fecha_envio ? new Date(payload.fecha_envio) : '');
  setRowValue_(row, map, ['fecha_entrega', 'entrega'], payload.fecha_entrega ? new Date(payload.fecha_entrega) : '');
  setRowValue_(row, map, ['estado', 'status'], String(payload.estado || 'pendiente').trim() || 'pendiente');
  setRowValue_(row, map, ['notas', 'detalle', 'observaciones'], String(payload.notas || '').trim());
  sheet.appendRow(row);
  return { ok: true, id_pedido: idPedido, message: 'Pedido agregado' };
}

function updateOrder_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.orders, ['empresa', 'id_pedido', 'fecha', 'lab', 'contacto', 'producto', 'codigo', 'referencia', 'cantidad', 'monto', 'stock_actual', 'fecha_envio', 'fecha_entrega', 'estado', 'notas']);
  var map = getSheetHeaderMap_(sheet);
  var idPedido = String(payload.id_pedido || payload.id || '').trim();
  if (!idPedido) return { ok: false, error: 'id_pedido es obligatorio' };
  var rowNumber = findRowById_(sheet, map, ['id_pedido', 'id', 'codigo'], idPedido);
  if (rowNumber === -1) return { ok: false, error: 'Pedido no encontrado' };
  var row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (payload.lab != null) setRowValue_(row, map, ['lab', 'laboratorio', 'proveedor'], String(payload.lab || '').trim());
  if (payload.contacto != null) setRowValue_(row, map, ['contacto', 'asesor'], String(payload.contacto || '').trim());
  if (payload.producto != null) setRowValue_(row, map, ['producto', 'nombre', 'medicamento'], String(payload.producto || '').trim());
  if (payload.codigo != null) setRowValue_(row, map, ['codigo', 'barcode'], String(payload.codigo || '').trim());
  if (payload.referencia != null) setRowValue_(row, map, ['referencia', 'detalle'], String(payload.referencia || '').trim());
  if (payload.cantidad != null) setRowValue_(row, map, ['cantidad', 'unidades'], toNumber_(payload.cantidad));
  if (payload.monto != null) setRowValue_(row, map, ['monto', 'total', 'valor'], toNumber_(payload.monto));
  if (payload.stock_actual != null) setRowValue_(row, map, ['stock_actual', 'stock'], toNumber_(payload.stock_actual));
  if (payload.fecha_envio != null) setRowValue_(row, map, ['fecha_envio', 'envio'], payload.fecha_envio ? new Date(payload.fecha_envio) : '');
  if (payload.fecha_entrega != null) setRowValue_(row, map, ['fecha_entrega', 'entrega'], payload.fecha_entrega ? new Date(payload.fecha_entrega) : '');
  if (payload.estado != null) setRowValue_(row, map, ['estado', 'status'], String(payload.estado || 'pendiente').trim() || 'pendiente');
  if (payload.notas != null) setRowValue_(row, map, ['notas', 'detalle', 'observaciones'], String(payload.notas || '').trim());
  sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).setValues([row]);
  return { ok: true, id_pedido: idPedido, message: 'Pedido actualizado' };
}

function deleteOrder_(payload) {
  var sheet = ensureSheetWithHeaders_(CFG.sheets.orders, ['empresa', 'id_pedido', 'fecha', 'lab', 'contacto', 'producto', 'codigo', 'referencia', 'cantidad', 'monto', 'stock_actual', 'fecha_envio', 'fecha_entrega', 'estado', 'notas']);
  var map = getSheetHeaderMap_(sheet);
  var idPedido = String(payload.id_pedido || payload.id || '').trim();
  if (!idPedido) return { ok: false, error: 'id_pedido es obligatorio' };
  var rowNumber = findRowById_(sheet, map, ['id_pedido', 'id', 'codigo'], idPedido);
  if (rowNumber === -1) return { ok: false, error: 'Pedido no encontrado' };
  sheet.deleteRow(rowNumber);
  return { ok: true, message: 'Pedido eliminado' };
}
