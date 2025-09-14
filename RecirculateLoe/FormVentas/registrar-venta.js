document.addEventListener('DOMContentLoaded', () => {
  const $form = document.getElementById('form-venta');
  const $ok   = document.getElementById('mensaje-exito');

  // Helpers seguros para LS
  const getLS = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  };
  const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

  $form.addEventListener('submit', (e) => {
    e.preventDefault();

    // limpiar errores previos
    $form.querySelectorAll('.error-msg').forEach(n => (n.textContent = ''));
    $ok.style.display = 'none';

    const cliente = document.getElementById('cliente').value.trim();
    const producto = document.getElementById('producto').value.trim();
    const cantidad = parseInt(document.getElementById('cantidad').value, 10);
    const metodo   = document.getElementById('metodo').value;
    const fechaISO = document.getElementById('fecha').value;

    let valido = true;

    if (!cliente) {
      document.querySelector('#cliente + .error-msg').textContent = 'Ingrese el nombre del cliente';
      valido = false;
    }
    if (!producto) {
      document.querySelector('#producto + .error-msg').textContent = 'Ingrese el producto';
      valido = false;
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      document.querySelector('#cantidad + .error-msg').textContent = 'Cantidad debe ser mayor a 0';
      valido = false;
    }
    if (!metodo) {
      document.querySelector('#metodo + .error-msg').textContent = 'Seleccione un método de pago';
      valido = false;
    }
    if (!fechaISO) {
      document.querySelector('#fecha + .error-msg').textContent = 'Seleccione una fecha válida';
      valido = false;
    }

    if (!valido) return;

    // construir fecha estilo "5 sep"
    const fechaObj = new Date(fechaISO + 'T00:00:00');
    const fechaHumana = `${fechaObj.getDate()} ${meses[fechaObj.getMonth()]}`;

    // id incremental
    const seq = getLS('ventas_seq', 1);
    const id = seq; // guardamos número; el panel lo formatea con padStart si quiere

    const venta = {
      id,
      fecha: fechaHumana,
      hora: '',                 // (opcional) podrías capturar hora real si querés
      cliente,
      producto,
      cantidad,
      metodo,
      total: null,              // sin precio por ahora → el panel muestra "—"
      pago: 'Recibido',
      envio: 'Por enviar',
      imagen: 'Images/Chaqueta.jpg' // demo (ajustá si tu ruta difiere)
    };

    // guardar en LS
    const ventas = getLS('ventas', []);
    ventas.push(venta);
    setLS('ventas', ventas);
    setLS('ventas_seq', seq + 1);

    // feedback y reset
    $ok.style.display = 'block';
    $form.reset();

    // redirigir al panel después de un instante
    setTimeout(() => { window.location.href = 'ventas.html'; }, 600);
  });
});
