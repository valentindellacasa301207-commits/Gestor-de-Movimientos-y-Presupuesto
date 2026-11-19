const CLAVE_USUARIOS = "gestor_usuarios_v1";
const CLAVE_SESION = "gestor_sesion_activa_v1";

let modoRegistro = false;
let usuarioActivo = localStorage.getItem(CLAVE_SESION) || null;
let movimientos = [];

const vistaLogin = document.getElementById("vista-login");
const vistaApp = document.getElementById("vista-app");
const tituloAuth = document.getElementById("titulo-auth");
const formAuth = document.getElementById("form-auth");
const btnAuthSubmit = document.getElementById("btn-auth-submit");
const btnCambiarModo = document.getElementById("btn-cambiar-modo");
const mensajeAuth = document.getElementById("mensaje-auth");
const spanUsuarioActual = document.getElementById("usuario-actual");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

const form = document.getElementById("form-movimiento");
const lista = document.getElementById("lista-movimientos");
const filtroTipo = document.getElementById("filtro-tipo");
const btnExportar = document.getElementById("btn-exportar");
const btnLimpiar = document.getElementById("btn-limpiar");

async function hashClave(texto) {
  const datos = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function obtenerUsuarios() {
  return JSON.parse(localStorage.getItem(CLAVE_USUARIOS)) || {};
}

function guardarUsuarios(usuarios) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

function claveMovimientosUsuario() {
  return `movimientos_${usuarioActivo}`;
}

function cargarMovimientos() {
  movimientos = JSON.parse(localStorage.getItem(claveMovimientosUsuario())) || [];
}

function guardarMovimientos() {
  localStorage.setItem(claveMovimientosUsuario(), JSON.stringify(movimientos));
}

function actualizarVistaSesion() {
  if (usuarioActivo) {
    vistaLogin.classList.add("oculto");
    vistaApp.classList.remove("oculto");
    spanUsuarioActual.textContent = usuarioActivo;
    cargarMovimientos();
    renderizar();
  } else {
    vistaApp.classList.add("oculto");
    vistaLogin.classList.remove("oculto");
  }
}

btnCambiarModo.addEventListener("click", () => {
  modoRegistro = !modoRegistro;
  mensajeAuth.textContent = "";
  tituloAuth.textContent = modoRegistro ? "Crear Cuenta" : "Iniciar Sesión";
  btnAuthSubmit.textContent = modoRegistro ? "Registrarse" : "Entrar";
  btnCambiarModo.textContent = modoRegistro
    ? "¿Ya tienes cuenta? Inicia sesión"
    : "¿No tienes cuenta? Regístrate";
});

formAuth.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("auth-usuario").value.trim().toLowerCase();
  const clave = document.getElementById("auth-clave").value;

  if (!usuario || clave.length < 4) {
    mensajeAuth.textContent = "Usa un usuario válido y una contraseña de al menos 4 caracteres.";
    return;
  }

  const usuarios = obtenerUsuarios();
  const claveHasheada = await hashClave(clave);

  if (modoRegistro) {
    if (usuarios[usuario]) {
      mensajeAuth.textContent = "Ese nombre de usuario ya existe.";
      return;
    }
    usuarios[usuario] = claveHasheada;
    guardarUsuarios(usuarios);
  } else {
    if (!usuarios[usuario] || usuarios[usuario] !== claveHasheada) {
      mensajeAuth.textContent = "Usuario o contraseña incorrectos.";
      return;
    }
  }

  usuarioActivo = usuario;
  localStorage.setItem(CLAVE_SESION, usuarioActivo);
  formAuth.reset();
  mensajeAuth.textContent = "";
  actualizarVistaSesion();
});

btnCerrarSesion.addEventListener("click", () => {
  usuarioActivo = null;
  localStorage.removeItem(CLAVE_SESION);
  actualizarVistaSesion();
});

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
  guardarMovimientos();
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

  guardarMovimientos();
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
  enlace.download = `movimientos_${usuarioActivo}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
});

btnLimpiar.addEventListener("click", () => {
  movimientos = [];
  guardarMovimientos();
  renderizar();
});

actualizarVistaSesion();