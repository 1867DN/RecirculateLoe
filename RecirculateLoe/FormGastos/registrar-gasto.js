// registrar-gasto.js
document.addEventListener('DOMContentLoaded', () => {
  const $form = document.getElementById('gasto-form');
  if (!$form) return;

  // Helpers
  const $ = (sel) => document.querySelector(sel);
  const val = (id) => document.getElementById(id)?.value?.trim() ?? '';
  const n = (v) => isNaN(+v) ? 0 : +v;
  const fmt = (x) => Math.round((+x + Number.EPSILON) * 100) / 100;

  const $itemsWrap = $('#items-wrap');
  const $addItem   = $('#add-item');
  const $iva       = $('#iva');
  const $impSimple = $('#importe-simple');
  const $totalPrev = $('#total-preview');

  // --- UI: agregar/quitar ítems
  const addItemRow = (desc = '', qty = '', unit = '') => {
    const row = document.createElement('div');
    row.setAttribute('data-item-row', '');
    row.className = 'item-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 100px 140px 36px';
    row.style.gap = '8px';
    row.style.margin = '6px 0';

    row.innerHTML = `
      <input data-item-desc placeholder="detalle" value="${desc}">
      <input data-item-qty  type="number" min="0" step="1"   placeholder="cant." value="${qty}">
      <input data-item-unit type="number" min="0" step="0.01" placeholder="unitario" value="${unit}">
      <button type="button" data-item-del title="Quitar">✕</button>
    `;
    $itemsWrap.appendChild(row);
  };

  $addItem.addEventListener('click', () => addItemRow());

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-item-del]');
    if (!btn) return;
    btn.closest('[data-item-row]')?.remove();
    recalcPreview();
  });

  // --- leer ítems
  const readItems = () => {
    const rows = $itemsWrap.querySelectorAll('[data-item-row]');
    const items = [];
    rows.forEach(r => {
      const desc = r.querySelector('[data-item-desc]')?.value.trim();
      const qty  = n(r.querySelector('[data-item-qty]')?.value);
      const unit = n(r.querySelector('[data-item-unit]')?.value);
      if (desc && qty > 0 && unit >= 0) items.push({ desc, cantidad: qty, unitario: unit });
    });
    return items;
  };

  // --- preview
  const recalcPreview = () => {
    const iva = n($iva.value);
    const items = readItems();
    let subtotal = 0;

    if (items.length) {
      subtotal = items.reduce((acc, it) => acc + it.cantidad * it.unitario, 0);
    } else {
      subtotal = n($impSimple.value);
    }
    const total = fmt(subtotal + subtotal * iva / 100);
    $totalPrev.value = `$ ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  document.addEventListener('input', (e) => {
    if (
      e.target.matches('#iva, #importe-simple') ||
      e.target.closest('[data-item-row]')
    ) recalcPreview();
  });

  // --- validación
  const setErr = (id, msg) => { const n = document.getElementById(id); if (n) n.textContent = msg || ''; };
  const clearErrors = () => ['e-proveedor','e-concepto','e-fecha','e-metodo','e-estado','e-items','e-global'].forEach(id => setErr(id, ''));

  const validate = () => {
    clearErrors();
    let ok = true;

    if (!val('proveedor')) { setErr('e-proveedor','Ingrese el proveedor'); ok = false; }
    if (!val('concepto'))  { setErr('e-concepto','Ingrese el concepto'); ok = false; }
    if (!val('fecha'))     { setErr('e-fecha','Seleccione una fecha'); ok = false; }
    if (!val('metodo'))    { setErr('e-metodo','Seleccione el método'); ok = false; }
    if (!val('estado'))    { setErr('e-estado','Seleccione el estado'); ok = false; }

    const items = readItems();
    const simple = n(val('importe-simple'));
    if (!items.length && simple <= 0) {
      setErr('e-items','Cargue al menos 1 ítem válido o un Importe simple > 0');
      ok = false;
    }
    return ok;
  };

  // === ID PROGRESIVO ===========================================
  const TMP_KEY = 'gastos_tmp';
  const SEQ_KEY = 'gastos_seq';
  const DEFAULT_BASELINE = 3; // los 3 gastos fijos de ejemplo

  const getCurrentSeq = () => {
    // Si ya hay secuencia guardada, úsala
    let seq = parseInt(sessionStorage.getItem(SEQ_KEY) || '0', 10);
    if (seq > 0) return seq;

    // Si no, inicializala considerando:
    // - baseline (3 fijos)
    // - temporales existentes
    const temps = JSON.parse(sessionStorage.getItem(TMP_KEY) || '[]');
    const maxTmp = temps.reduce((m,g) => {
      const num = parseInt(String(g.id || '').replace(/\D/g,''), 10) || 0;
      return Math.max(m, num);
    }, 0);

    seq = Math.max(DEFAULT_BASELINE, maxTmp);
    sessionStorage.setItem(SEQ_KEY, String(seq));
    return seq;
  };

  const getNextSeq = () => {
    const current = getCurrentSeq() + 1;
    sessionStorage.setItem(SEQ_KEY, String(current));
    return current;
  };
  // =============================================================

  // --- submit
  $form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) {
      setErr('e-global', '⚠️ Revise los campos marcados.');
      return;
    }
    setErr('e-global', '');

    const proveedor    = val('proveedor');
    const concepto     = val('concepto');
    const fecha        = val('fecha'); // yyyy-mm-dd
    const metodoPago   = val('metodo');
    const estado       = val('estado');
    const categoria    = val('categoria');
    const centroCostos = val('centro');
    const compTipo     = val('comp-tipo');
    const compNro      = val('comp-nro');
    const ivaPorc      = n(val('iva'));
    const items        = readItems();

    let subtotal = 0;
    if (items.length) {
      subtotal = items.reduce((acc, it) => acc + it.cantidad * it.unitario, 0);
    } else {
      subtotal = n(val('importe-simple'));
    }
    const iva   = fmt(subtotal * ivaPorc / 100);
    const total = fmt(subtotal + iva);

    // 👉 ID progresivo como TMP-004, TMP-005, ...
    const seq = getNextSeq();
    const id  = `TMP-${String(seq).padStart(3,'0')}`;

    const nuevo = {
      id,
      proveedor, concepto, fecha,
      metodoPago, estado,
      categoria, centroCostos,
      comprobante: { tipo: compTipo, numero: compNro },
      items,
      ivaPorc,
      subtotal: fmt(subtotal),
      iva,
      total,
      temp: true
    };

    const arr = JSON.parse(sessionStorage.getItem(TMP_KEY) || '[]');
    arr.push(nuevo);
    sessionStorage.setItem(TMP_KEY, JSON.stringify(arr));

    window.location.href = 'gastos.html';
  });

  // al cargar, una fila para que veas el formato
  addItemRow();
  recalcPreview();
});
