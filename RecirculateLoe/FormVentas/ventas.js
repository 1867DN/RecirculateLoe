// ventas.js — actualiza el pie "Mostrando X-Y ventas de Z" y quita el badge del título
document.addEventListener('DOMContentLoaded', () => {
  const tbody =
    document.querySelector('.ventas-table tbody') ||
    document.getElementById('ventas-body');
  if (!tbody) return;

  const footerInfo = document.querySelector('.footer-info');
  // si existe un <span class="badge"> en el título, lo dejamos vacío
  const badge = document.querySelector('.header .badge');
  if (badge) badge.textContent = '';

  // ---------- Helpers LS ----------
  const getLS = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  };
  const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ---------- Render ----------
  const fmtCurrency = (n) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    const num = typeof n === 'number' ? n : Number(n);
    if (Number.isNaN(num)) return '—';
    return num.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
  };

  const renderVenta = (v) => {
    const idStr = String(v.id ?? '').padStart(3, '0');

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td><a href="#">#${idStr || '—'}</a></td>
      <td>${v.fecha || '—'}${v.hora ? `<br><small>${v.hora}</small>` : ''}</td>
      <td>${v.cliente || '—'}</td>
      <td>
        <img src="${v.imagen || 'Images/Chaqueta.jpg'}" alt="${v.producto || 'Producto'}" class="producto-img">
        <button type="button" class="toggle-detalle" aria-expanded="false">˄</button>
      </td>
      <td>${fmtCurrency(v.total)}</td>
      <td>${v.metodo || '—'}</td>
      <td><span class="estado pago">✔ ${v.pago || 'Recibido'}</span></td>
      <td><span class="estado envio">🚚 ${v.envio || 'Por enviar'}</span></td>
      <td class="acciones">
        <button class="accion-btn" data-action="archivar" title="Archivar venta">🧾</button>
        <button class="accion-btn" data-action="editar"   title="Editar venta">✏️</button>
        <button class="accion-btn" data-action="borrar"   title="Borrar venta">🗑️</button>
      </td>
    `;
    const det = document.createElement('tr');
    det.className = 'detalle-row';
    det.style.display = 'none';
    det.innerHTML = `
      <td colspan="9">
        <div class="detalle-contenido">
          <div class="detalle-grid">
            <div><strong>Nombre:</strong></div>
            <div>${v.producto || '—'}</div>
            <div><strong>Cantidad:</strong></div>
            <div>${v.cantidad ?? '—'}</div>
            <div><strong>Método de pago:</strong></div>
            <div>${v.metodo || '—'}</div>
          </div>
        </div>
      </td>
    `;

    if (v.id !== undefined && v.id !== null) {
      fila.dataset.vId = String(v.id);
      det.dataset.vId = String(v.id);
    }

    tbody.appendChild(fila);
    tbody.appendChild(det);
  };

  // ---------- Contadores (pie) ----------
  function filasPrincipales() {
    return Array.from(tbody.querySelectorAll('tr:not(.detalle-row)'));
  }
  function esVisibleFila(tr) {
    // visible = no display none + está en el flujo
    return tr.offsetParent !== null;
  }
  function actualizarPie() {
    if (!footerInfo) return;
    const todas = filasPrincipales();
    const mostradas = todas.filter(esVisibleFila);
    const y = todas.length;         // total de filas principales
    const x = mostradas.length;     // cuántas se muestran (para filtros futuros)
    // Formato que pediste: "Mostrando X-Y ventas de Y"
    footerInfo.textContent = `Mostrando ${x}-${y} ventas`;
  }

  // ---------- Cargar ventas desde LS (si hay) ----------
  const ventasLS = getLS('ventas', []);
  ventasLS.forEach(renderVenta);

  // ---------- Delegación (toggle + acciones) ----------
  tbody.addEventListener('click', (event) => {
    // Toggle detalle
    const toggle = event.target.closest('.toggle-detalle');
    if (toggle) {
      event.preventDefault();
      const filaVenta = toggle.closest('tr');
      if (!filaVenta) return;
      const filaDetalle = filaVenta.nextElementSibling;
      if (!filaDetalle || !filaDetalle.classList.contains('detalle-row')) return;

      const visible = filaDetalle.style.display === 'table-row';
      filaDetalle.style.display = visible ? 'none' : 'table-row';
      filaDetalle.classList.toggle('visible', !visible);
      toggle.textContent = visible ? '˄' : '˅';
      toggle.setAttribute('aria-expanded', (!visible).toString());
      return;
    }

    // Acciones
    const btn = event.target.closest('.accion-btn');
    if (btn) {
      event.preventDefault();
      let accion = btn.dataset.action;
      if (!accion) {
        const hint = (btn.title || btn.getAttribute('aria-label') || btn.textContent || '').toLowerCase();
        if (hint.includes('archiv')) accion = 'archivar';
        else if (hint.includes('edit') || hint.includes('✏')) accion = 'editar';
        else if (hint.includes('borr') || hint.includes('elimin') || hint.includes('🗑')) accion = 'borrar';
      }

      if (accion === 'archivar') {
        alert('Archivar venta (demo UI).');
        return;
      }
      if (accion === 'editar') {
        alert('Editar venta (demo UI).');
        return;
      }
      if (accion === 'borrar') {
        if (!confirm('¿Seguro que deseas borrar esta venta?')) return;
        const fila = btn.closest('tr');
        if (!fila) return;
        const id = fila.dataset.vId;
        const siguiente = fila.nextElementSibling;

        // Remover en UI
        fila.remove();
        if (siguiente && siguiente.classList.contains('detalle-row')) siguiente.remove();

        // Remover del LS si corresponde
        if (id) {
          const actuales = getLS('ventas', []);
          const filtradas = actuales.filter(v => String(v.id) !== String(id));
          setLS('ventas', filtradas);
        }

        actualizarPie();
        return;
      }
    }
  });

  // --------- Inicial: contar también las ventas hardcodeadas del HTML ---------
  actualizarPie();
});
