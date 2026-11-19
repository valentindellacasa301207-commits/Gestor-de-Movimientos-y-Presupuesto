const CLAVE_STORAGE = "movimientos_app_v1";
let movimientos = JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || [];

const form = document.getElementById("form-movimiento");
const lista = document.getElementById("lista-movimientos");
const filtroTipo = document.getElementById("filtro-tipo");
const btnExportar = document.getElementById("btn-exportar");
const btnLimpiar = document.getElementById("btn-limpiar");

function guardar() {
  localStorage.setItem(CLAVE_STORAGE, JSON.stringify(movimientos));
}

function formatearMonto(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(valor);
}

function renderizar() {
  const filtro = filtroTipo.value;
  lista.innerHTML = "";

  let ingresos = 0;
  let gastos = 0;

  for (const mov of movimientos) {
    if (mov.tipo === "ingreso") {
      ingresos += mov.monto;
    } else {
      gastos += mov.monto;
    }
  }

  document.getElementById("total-ingresos").textContent = formatearMonto(ingresos);
  document.getElementById("total-gastos").textContent = formatearMonto(gastos);
  document.getElementById("saldo-neto").textContent = formatearMonto(ingresos - gastos);

  const visibles = movimientos.filter((m) => filtro === "todos" || m.tipo === filtro);

  for (const mov of visibles) {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${mov.tipo === "ingreso" ? "Ingreso" : "Gasto"}</td>
      <td>${mov.categoria}</td>
      <td>${mov.descripcion}</td>
      <td>${formatearMonto(mov.monto)}</td>
      <td><button class="btn-borrar" onclick="eliminarMovimiento(${mov.id})">Eliminar</button></td>
    `;
    lista.appendChild(fila);
  }
}

window.eliminarMovimiento = function (id) {
  movimientos = movimientos.filter((m) => m.id !== id);
  guardar();
  renderizar();
};

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const categoria = document.getElementById("categoria").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const monto = parseFloat(document.getElementById("monto").value);

  if (!categoria || !descripcion || isNaN(monto) || monto <= 0) return;

  movimientos.unshift({
    id: Date.now(),
    tipo,
    categoria,
    descripcion,
    monto
  });

  guardar();
  renderizar();
  form.reset();
});

filtroTipo.addEventListener("change", renderizar);

btnExportar.addEventListener("click", () => {
  const encabezados = ["ID", "Tipo", "Categoria", "Descripcion", "Monto"];
  const filas = movimientos.map((m) => [
    m.id,
    m.tipo,
    `"${m.categoria.replace(/"/g, '""')}"`,
    `"${m.descripcion.replace(/"/g, '""')}"`,
    m.monto
  ]);

  const csv = [encabezados.join(","), ...filas.map((f) => f.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "movimientos.csv";
  enlace.click();
  URL.revokeObjectURL(url);
});

btnLimpiar.addEventListener("click", () => {
  movimientos = [];
  guardar();
  renderizar();
});

renderizar();