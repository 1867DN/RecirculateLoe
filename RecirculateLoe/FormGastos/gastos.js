// gastos.js
document.addEventListener('DOMContentLoaded', () => {
  const $tbody       = document.getElementById('gastos-body');
  const $footerTotal = document.getElementById('gastos-total');
  const $footerCount = document.getElementById('gastos-count');
  const $search      = document.getElementById('buscar-gastos');
  if (!$tbody) return;

  // --- Gastos fijos de ejemplo (siempre vuelven al recargar)
  const DEFAULT_GASTOS = [
    {
      id: 'FIX-001',
      proveedor: 'Textil Norte',
      concepto: 'Compra de telas',
      fecha: '2025-09-09',
      metodoPago: 'Transferencia',
      estado: 'Pagado',
      categoria: 'Materia prima',
      centroCostos: 'Producción',
      comprobante: { tipo: 'Factura A', numero: '0001-00012300' },
      items: [{ desc: 'Telas microfibra', cantidad: 10, unitario: 12000 }],
      ivaPorc: 21, subtotal: 120000, iva: 25200, total: 145200,
      temp: false
    },
    {
      id: 'FIX-002',
      proveedor: 'Logística Sur',
      concepto: 'Envíos septiembre',
      fecha: '2025-09-11',
      metodoPago: 'MercadoPago',
      estado: 'Pendiente',
      categoria: 'Logística',
      centroCostos: 'Distribución',
      comprobante: { tipo: 'Factura B', numero: '0003-00004500' },
      items: [{ desc: 'Envios AMBA', cantidad: 1, unitario: 35500 }],
      ivaPorc: 0, subtotal: 35500, iva: 0, total: 35500,
      temp: false
    },
    {
      id: 'FIX-003',
      proveedor: 'Imprenta Andina',
      concepto: 'Etiquetas y packaging',
      fecha: '2025-09-12',
      metodoPago: 'Efectivo',
      estado: 'Pagado',
      categoria: 'Servicios',
      centroCostos: 'Marketing',
      comprobante: { tipo: 'Recibo', numero: '0007-00000880' },
      items: [{ desc: 'Etiquetas x1000', cantidad: 1, unitario: 18900 }],
      ivaPorc: 0, subtotal: 18900, iva: 0, total: 18900,
      temp: false
    }
  ];

  // --- Temporales (solo esta pestaña)
  const TMP_KEY = 'gastos_tmp';
  const getTemps = () => JSON.parse(sessionStorage.getItem(TMP_KEY) || '[]');
  const setTemps = (arr) => sessionStorage.setItem(TMP_KEY, JSON.stringify(arr));

  // --- Ocultados de ejemplo (sólo mientras no recargues)
  const hiddenFixed = new Set();

  const fmtMon = (n) => `$ ${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const fmtFechaCorta = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day:'numeric', month:'short' });
  const fmtFechaLarga = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' });

  const rowHTML = (g) => {
    const chip = g.estado === 'Pagado'
      ? `<span class="estado pago">✓ Pagado</span>`
      : `<span class="estado env io">⏳ Pendiente</span>`;

    const conceptoCell = `${g.concepto} <button class="toggle-detalle" aria-label="Ver detalle">˄</button>`;

    const itemsTable = (g.items && g.items.length) ? `
      <table class="mini">
        <thead><tr><th>Ítem</th><th>Cant.</th><th>Unit.</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${g.items.map(it => `
            <tr>
              <td>${it.desc}</td>
              <td>${it.cantidad}</td>
              <td>${fmtMon(it.unitario)}</td>
              <td>${fmtMon(it.cantidad * it.unitario)}</td>
            </tr>`).join('')}
        </tbody>
      </table>` : `<em>Sin ítems (se usó importe simple)</em>`;

    return `
      <tr data-id="${g.id}">
        <td><a href="#">#${String((g.id || '').replace(/\D/g,'')).padStart(3,'0')}</a></td>
        <td>${fmtFechaCorta(g.fecha)}</td>
        <td>${g.proveedor}</td>
        <td>${conceptoCell}</td>
        <td>${fmtMon(g.total)}</td>
        <td>${g.metodoPago || '--'}</td>
        <td>${chip}</td>
        <td class="acciones">
          <button class="accion-btn" data-action="archivar" title="Archivar">📝</button>
          <button class="accion-btn" data-action="editar"   title="Editar">✏️</button>
          <button class="accion-btn" data-action="borrar"   title="Borrar">🗑️</button>
        </td>
      </tr>
      <tr class="detalle-row">
        <td colspan="8">
          <div class="detalle-contenido">
            <div class="detalle-grid">
              <div><strong>Proveedor:</strong></div><div>${g.proveedor}</div>
              <div><strong>Concepto:</strong></div><div>${g.concepto}</div>
              <div><strong>Fecha:</strong></div><div>${fmtFechaLarga(g.fecha)}</div>
              <div><strong>Método de pago:</strong></div><div>${g.metodoPago || '--'}</div>
              <div><strong>Estado:</strong></div><div>${g.estado}</div>
              <div><strong>Categoría:</strong></div><div>${g.categoria || '--'}</div>
              <div><strong>Centro de costos:</strong></div><div>${g.centroCostos || '--'}</div>
              <div><strong>Comprobante:</strong></div><div>${g.comprobante?.tipo || '--'} ${g.comprobante?.numero || ''}</div>
            </div>
            <hr />
            ${itemsTable}
            <div class="totales">
              <div><strong>Subtotal:</strong> ${fmtMon(g.subtotal)}</div>
              <div><strong>IVA (${g.ivaPorc}%):</strong> ${fmtMon(g.iva)}</div>
              <div><strong>Total:</strong> ${fmtMon(g.total)}</div>
            </div>
          </div>
        </td>
      </tr>
    `;
  };

  const render = () => {
    const temps = getTemps();
    const base = DEFAULT_GASTOS.filter(g => !hiddenFixed.has(g.id));
    const full  = [...base, ...temps];

    const q = ($search?.value || '').toLowerCase();
    const filtered = full.filter(g =>
      [g.proveedor, g.concepto, g.metodoPago, g.estado, g.categoria]
        .filter(Boolean)
        .some(v => v.toLowerCase().includes(q))
    );

    $tbody.innerHTML = filtered.map(rowHTML).join('');

    const total = filtered.reduce((acc, g) => acc + (g.total || 0), 0);
    if ($footerTotal)  $footerTotal.textContent = `Total importe: ${fmtMon(total)}`;
    if ($footerCount)  $footerCount.textContent = `Mostrando ${filtered.length}-${full.length} gastos`;
  };

  // Delegación de eventos
  $tbody.addEventListener('click', (e) => {
    const $t = e.target;

    // Toggle detalle
    const tog = $t.closest('.toggle-detalle');
    if (tog) {
      const fila = tog.closest('tr');
      const det = fila?.nextElementSibling;
      if (det && det.classList.contains('detalle-row')) {
        const visible = det.classList.toggle('visible');
        det.style.display = visible ? 'table-row' : 'none';
        tog.textContent = visible ? '˅' : '˄';
      }
      return;
    }

    // Acciones
    const btn = $t.closest('.accion-btn');
    if (!btn) return;

    const id = btn.closest('tr')?.dataset.id;
    const action = btn.dataset.action;
    if (!id) return;

    if (action === 'borrar') {
      // si es temporal -> se borra de sessionStorage; si es fijo -> se oculta hasta recargar
      const temps = getTemps();
      const idx = temps.findIndex(g => g.id === id);
      if (idx >= 0) {
        if (!confirm('¿Borrar este gasto?')) return;
        temps.splice(idx, 1);
        setTemps(temps);
      } else {
        if (!confirm('¿Borrar este gasto de ejemplo? (volverá al recargar)')) return;
        hiddenFixed.add(id);
      }
      render();
      return;
    }

    if (action === 'archivar') {
      alert('Acción “archivar” (demo).');
      return;
    }
    if (action === 'editar') {
      alert('Acción “editar” (demo).');
      return;
    }
  });

  $search?.addEventListener('input', render);

  // primer render
  render();
});
