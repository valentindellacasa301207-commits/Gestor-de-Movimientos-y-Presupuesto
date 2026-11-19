const CLAVE_USUARIOS = "gestor_usuarios_v1";
const CLAVE_SESION = "gestor_sesion_activa_v1";

const EMAILJS_PUBLIC_KEY = "qMZwedfhyH5y_dCX0";
const EMAILJS_SERVICE_ID = "service_7bdvpcu"; //[cite: 2]
const EMAILJS_TEMPLATE_ID = "template_6b8eib7"; //[cite: 3]

let modoRegistro = false;
let usuarioActivo = localStorage.getItem(CLAVE_SESION) || null;
let movimientos = [];
let presupuestoMensual = 0;
let idEditando = null;
let ordenCampo = "fecha";
let ordenAsc = false;
let solicitudCodigoPendiente = null;

if (window.emailjs && !EMAILJS_PUBLIC_KEY.startsWith("TU_")) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

const vistaLogin = document.getElementById("vista-login");
const vistaApp = document.getElementById("vista-app");
const tituloAuth = document.getElementById("titulo-auth");
const formAuth = document.getElementById("form-auth");
const btnAuthSubmit = document.getElementById("btn-auth-submit");
const btnCambiarModo = document.getElementById("btn-cambiar-modo");
const mensajeAuth = document.getElementById("mensaje-auth");
const spanUsuarioActual = document.getElementById("usuario-actual");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

const camposRegistro = document.getElementById("campos-registro");
const inputCorreoRegistro = document.getElementById("auth-correo");
const btnOlvideClave = document.getElementById("btn-olvide-clave");
const panelRecuperarClave = document.getElementById("panel-recuperar-clave");
const formEnviarCodigo = document.getElementById("form-enviar-codigo");
const btnEnviarCodigo = document.getElementById("btn-enviar-codigo");
const formRestablecerCodigo = document.getElementById("form-restablecer-codigo");
const textoEstadoRecuperar = document.getElementById("texto-estado-recuperar");
const mensajeRecuperar = document.getElementById("mensaje-recuperar");
const btnCancelarRecuperar = document.getElementById("btn-cancelar-recuperar");

const btnCambiarClave = document.getElementById("btn-cambiar-clave");
const panelCambiarClave = document.getElementById("panel-cambiar-clave");
const formCambiarClave = document.getElementById("form-cambiar-clave");
const btnCancelarClave = document.getElementById("btn-cancelar-clave");
const mensajeClave = document.getElementById("mensaje-clave");
const btnEliminarCuenta = document.getElementById("btn-eliminar-cuenta");

const formPresupuesto = document.getElementById("form-presupuesto");
const inputPresupuestoMes = document.getElementById("input-presupuesto-mes");
const textoPresupuesto = document.getElementById("texto-presupuesto");
const barraProgreso = document.getElementById("barra-progreso");
const alertaPresupuesto = document.getElementById("alerta-presupuesto");
const comparativaMensual = document.getElementById("comparativa-mensual");

const form = document.getElementById("form-movimiento");
const inputFecha = document.getElementById("fecha");
const modoRepeticion = document.getElementById("modo-repeticion");
const cantidadRepeticiones = document.getElementById("cantidad-repeticiones");
const btnGuardarMov = document.getElementById("btn-guardar-mov");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");

const lista = document.getElementById("lista-movimientos");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroCategoria = document.getElementById("filtro-categoria");
const buscarTexto = document.getElementById("buscar-texto");
const fechaDesde = document.getElementById("fecha-desde");
const fechaHasta = document.getElementById("fecha-hasta");
const btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");

const resumenCategorias = document.getElementById("resumen-categorias");
const graficoCanvas = document.getElementById("grafico-gastos");

const btnExportar = document.getElementById("btn-exportar");
const btnImportar = document.getElementById("btn-importar");
const inputImportarCsv = document.getElementById("input-importar-csv");
const btnExportarJson = document.getElementById("btn-exportar-json");
const btnImportarJson = document.getElementById("btn-importar-json");
const inputImportarJson = document.getElementById("input-importar-json");
const btnLimpiar = document.getElementById("btn-limpiar");

function fechaHoyISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function sumarMesesAFecha(fechaISO, mesesASumar) {
  const partes = fechaISO.split("-").map(Number);
  if (partes.length !== 3 || partes.some(isNaN)) return fechaHoyISO();
  const [anio, mes, dia] = partes;
  const indiceMesObjetivo = mes - 1 + mesesASumar;
  const anioObjetivo = anio + Math.floor(indiceMesObjetivo / 12);
  const mesObjetivo = ((indiceMesObjetivo % 12) + 12) % 12;
  const ultimoDiaMes = new Date(anioObjetivo, mesObjetivo + 1, 0).getDate();
  const diaAjustado = Math.min(dia, ultimoDiaMes);
  return `${anioObjetivo}-${String(mesObjetivo + 1).padStart(2, "0")}-${String(diaAjustado).padStart(2, "0")}`;
}

function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function normalizarUsuario(registro) {
  if (!registro) return null;
  if (typeof registro === "string") {
    return { claveHash: registro, correo: "" };
  }
  return registro;
}

function enmascararCorreo(correo) {
  if (!correo || !correo.includes("@")) return "";
  const [nombre, dominio] = correo.split("@");
  const visible = nombre.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, nombre.length - 2))}@${dominio}`;
}

function generarCodigoSeisDigitos() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

function claveMovimientosUsuario() {
  return `movimientos_${usuarioActivo}`;
}

function clavePresupuestoUsuario() {
  return `presupuesto_${usuarioActivo}`;
}

function cargarDatosUsuario() {
  const crudos = JSON.parse(localStorage.getItem(claveMovimientosUsuario())) || [];
  movimientos = crudos.map((m) => ({
    id: m.id || Date.now() + Math.random(),
    fecha: m.fecha || fechaHoyISO(),
    tipo: m.tipo === "ingreso" ? "ingreso" : "gasto",
    categoria: m.categoria || "General",
    descripcion: m.descripcion || "",
    monto: Number(m.monto) || 0
  }));

  presupuestoMensual = Number(localStorage.getItem(clavePresupuestoUsuario())) || 0;
  inputPresupuestoMes.value = presupuestoMensual > 0 ? presupuestoMensual : "";
}

function guardarMovimientos() {
  localStorage.setItem(claveMovimientosUsuario(), JSON.stringify(movimientos));
}

function guardarPresupuesto() {
  localStorage.setItem(clavePresupuestoUsuario(), String(presupuestoMensual));
}

function cancelarEdicion() {
  idEditando = null;
  btnGuardarMov.textContent = "Agregar";
  btnCancelarEdicion.classList.add("oculto");
  modoRepeticion.disabled = false;
  cantidadRepeticiones.disabled = false;
  form.reset();
  inputFecha.value = fechaHoyISO();
  cantidadRepeticiones.classList.add("oculto");
}

function actualizarVistaSesion() {
  if (usuarioActivo) {
    vistaLogin.classList.add("oculto");
    vistaApp.classList.remove("oculto");
    panelCambiarClave.classList.add("oculto");
    spanUsuarioActual.textContent = usuarioActivo;
    inputFecha.value = fechaHoyISO();
    cargarDatosUsuario();
    renderizar();
  } else {
    cancelarEdicion();
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

  if (modoRegistro) {
    camposRegistro.classList.remove("oculto");
    panelRecuperarClave.classList.add("oculto");
    inputCorreoRegistro.required = true;
  } else {
    camposRegistro.classList.add("oculto");
    inputCorreoRegistro.required = false;
  }
});

formAuth.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("auth-usuario").value.trim().toLowerCase();
  const clave = document.getElementById("auth-clave").value;
  const correo = inputCorreoRegistro.value.trim().toLowerCase();

  if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) {
    mensajeAuth.textContent = "El usuario debe tener entre 3 y 20 caracteres sin espacios.";
    return;
  }

  if (clave.length < 4) {
    mensajeAuth.textContent = "La contraseña debe tener al menos 4 caracteres.";
    return;
  }

  if (modoRegistro && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    mensajeAuth.textContent = "Ingresa un correo electrónico válido para poder recuperar tu cuenta.";
    return;
  }

  const usuarios = obtenerUsuarios();
  const claveHasheada = await hashClave(clave);

  if (modoRegistro) {
    if (usuarios[usuario]) {
      mensajeAuth.textContent = "Ese nombre de usuario ya existe.";
      return;
    }
    usuarios[usuario] = {
      claveHash: claveHasheada,
      correo
    };
    guardarUsuarios(usuarios);
  } else {
    const actual = normalizarUsuario(usuarios[usuario]);
    if (!actual || actual.claveHash !== claveHasheada) {
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

function resetearPanelRecuperacion() {
  solicitudCodigoPendiente = null;
  formEnviarCodigo.reset();
  formRestablecerCodigo.reset();
  formRestablecerCodigo.classList.add("oculto");
  textoEstadoRecuperar.textContent = "";
  mensajeRecuperar.textContent = "";
}

btnOlvideClave.addEventListener("click", () => {
  mensajeAuth.textContent = "";
  resetearPanelRecuperacion();
  panelRecuperarClave.classList.toggle("oculto");
});

btnCancelarRecuperar.addEventListener("click", () => {
  resetearPanelRecuperacion();
  panelRecuperarClave.classList.add("oculto");
});

formEnviarCodigo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("rec-usuario").value.trim().toLowerCase();
  mensajeRecuperar.textContent = "";
  textoEstadoRecuperar.textContent = "";

  const usuarios = obtenerUsuarios();
  const reg = normalizarUsuario(usuarios[usuario]);

  if (!reg) {
    mensajeRecuperar.textContent = "No existe una cuenta con ese nombre de usuario.";
    return;
  }

  if (!reg.correo) {
    mensajeRecuperar.textContent = "Esta cuenta no tiene un correo registrado para enviar códigos.";
    return;
  }

  if (
    !window.emailjs ||
    EMAILJS_PUBLIC_KEY.startsWith("TU_") ||
    EMAILJS_SERVICE_ID.startsWith("TU_") ||
    EMAILJS_TEMPLATE_ID.startsWith("TU_")
  ) {
    mensajeRecuperar.textContent =
      "Falta configurar EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID y EMAILJS_TEMPLATE_ID en app.js.";
    return;
  }

  const codigo = generarCodigoSeisDigitos();
  const expiraEn = Date.now() + 10 * 60 * 1000;

  btnEnviarCodigo.disabled = true;
  btnEnviarCodigo.textContent = "Enviando...";

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: reg.correo,
      usuario,
      codigo
    });

    solicitudCodigoPendiente = { usuario, codigo, expiraEn };
    formRestablecerCodigo.classList.remove("oculto");
    textoEstadoRecuperar.textContent = `Enviamos un código de 6 dígitos a ${enmascararCorreo(
      reg.correo
    )}. Vence en 10 minutos.`;
  } catch {
    mensajeRecuperar.textContent =
      "No se pudo enviar el correo. Verifica tus claves de EmailJS y tu plantilla.";
  } finally {
    btnEnviarCodigo.disabled = false;
    btnEnviarCodigo.textContent = "Enviar código al correo";
  }
});

formRestablecerCodigo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigoIngresado = document.getElementById("rec-codigo").value.trim();
  const nuevaClave = document.getElementById("rec-nueva-clave").value;
  mensajeRecuperar.textContent = "";

  if (!solicitudCodigoPendiente) {
    mensajeRecuperar.textContent = "Primero solicita el envío del código a tu correo.";
    return;
  }

  if (Date.now() > solicitudCodigoPendiente.expiraEn) {
    solicitudCodigoPendiente = null;
    mensajeRecuperar.textContent = "El código expiró. Solicita uno nuevo.";
    return;
  }

  if (codigoIngresado !== solicitudCodigoPendiente.codigo) {
    mensajeRecuperar.textContent = "El código ingresado no es correcto.";
    return;
  }

  if (nuevaClave.length < 4) {
    mensajeRecuperar.textContent = "La nueva contraseña debe tener al menos 4 caracteres.";
    return;
  }

  const usuarios = obtenerUsuarios();
  const reg = normalizarUsuario(usuarios[solicitudCodigoPendiente.usuario]);
  if (!reg) {
    mensajeRecuperar.textContent = "No se encontró el usuario.";
    return;
  }

  reg.claveHash = await hashClave(nuevaClave);
  usuarios[solicitudCodigoPendiente.usuario] = reg;
  guardarUsuarios(usuarios);

  resetearPanelRecuperacion();
  panelRecuperarClave.classList.add("oculto");
  alert("Contraseña restablecida con éxito. Ya puedes iniciar sesión.");
});

btnCerrarSesion.addEventListener("click", () => {
  usuarioActivo = null;
  localStorage.removeItem(CLAVE_SESION);
  actualizarVistaSesion();
});

btnCambiarClave.addEventListener("click", () => {
  mensajeClave.textContent = "";
  formCambiarClave.reset();
  panelCambiarClave.classList.toggle("oculto");
});

btnCancelarClave.addEventListener("click", () => {
  panelCambiarClave.classList.add("oculto");
  mensajeClave.textContent = "";
});

formCambiarClave.addEventListener("submit", async (e) => {
  e.preventDefault();
  const actual = document.getElementById("clave-actual").value;
  const nueva = document.getElementById("clave-nueva").value;

  if (nueva.length < 4) {
    mensajeClave.textContent = "La nueva contraseña debe tener al menos 4 caracteres.";
    return;
  }

  const usuarios = obtenerUsuarios();
  const reg = normalizarUsuario(usuarios[usuarioActivo]);
  const hashActual = await hashClave(actual);

  if (!reg || reg.claveHash !== hashActual) {
    mensajeClave.textContent = "La contraseña actual es incorrecta.";
    return;
  }

  reg.claveHash = await hashClave(nueva);
  usuarios[usuarioActivo] = reg;
  guardarUsuarios(usuarios);
  panelCambiarClave.classList.add("oculto");
  formCambiarClave.reset();
  alert("Contraseña actualizada correctamente.");
});

btnEliminarCuenta.addEventListener("click", () => {
  if (
    !confirm(
      `¿Seguro que quieres eliminar la cuenta "${usuarioActivo}" y todos sus movimientos y presupuestos?`
    )
  ) {
    return;
  }

  const usuarios = obtenerUsuarios();
  delete usuarios[usuarioActivo];
  guardarUsuarios(usuarios);

  localStorage.removeItem(claveMovimientosUsuario());
  localStorage.removeItem(clavePresupuestoUsuario());
  localStorage.removeItem(CLAVE_SESION);

  usuarioActivo = null;
  actualizarVistaSesion();
});

modoRepeticion.addEventListener("change", () => {
  if (modoRepeticion.value === "unico") {
    cantidadRepeticiones.classList.add("oculto");
  } else {
    cantidadRepeticiones.classList.remove("oculto");
  }
});

formPresupuesto.addEventListener("submit", (e) => {
  e.preventDefault();
  const valor = parseFloat(inputPresupuestoMes.value);
  presupuestoMensual = !isNaN(valor) && valor > 0 ? valor : 0;
  guardarPresupuesto();
  renderizarPresupuestoYComparativa();
});

function formatearMonto(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(valor);
}

function renderizarPresupuestoYComparativa() {
  const hoyISO = fechaHoyISO();
  const mesActualPrefix = hoyISO.slice(0, 7);
  const [anioHoy, mesHoy] = hoyISO.split("-").map(Number);
  const anteriorMes = mesHoy === 1 ? 12 : mesHoy - 1;
  const anteriorAnio = mesHoy === 1 ? anioHoy - 1 : anioHoy;
  const mesAnteriorPrefix = `${anteriorAnio}-${String(anteriorMes).padStart(2, "0")}`;

  let gastoMesActual = 0;
  let ingresoMesActual = 0;
  let gastoMesAnterior = 0;

  for (const mov of movimientos) {
    const prefijo = String(mov.fecha).slice(0, 7);
    if (prefijo === mesActualPrefix) {
      if (mov.tipo === "gasto") gastoMesActual += mov.monto;
      if (mov.tipo === "ingreso") ingresoMesActual += mov.monto;
    } else if (prefijo === mesAnteriorPrefix && mov.tipo === "gasto") {
      gastoMesAnterior += mov.monto;
    }
  }

  if (presupuestoMensual > 0) {
    const porcentaje = (gastoMesActual / presupuestoMensual) * 100;
    const anchoBarra = Math.min(100, Math.max(0, porcentaje));
    barraProgreso.style.width = `${anchoBarra}%`;
    textoPresupuesto.textContent = `Gastado en ${mesActualPrefix}: ${formatearMonto(
      gastoMesActual
    )} de ${formatearMonto(presupuestoMensual)} (${porcentaje.toFixed(1)}%)`;

    if (porcentaje >= 100) {
      barraProgreso.style.backgroundColor = "#b83b2b";
      alertaPresupuesto.textContent = "¡Superaste tu presupuesto mensual!";
    } else if (porcentaje >= 80) {
      barraProgreso.style.backgroundColor = "#c77c14";
      alertaPresupuesto.textContent = "Atención: estás cerca del límite mensual (80% o más).";
    } else {
      barraProgreso.style.backgroundColor = "#1f7a4c";
      alertaPresupuesto.textContent = "";
    }
  } else {
    barraProgreso.style.width = "0%";
    textoPresupuesto.textContent = `Gastado en ${mesActualPrefix}: ${formatearMonto(
      gastoMesActual
    )} (sin límite configurado).`;
    alertaPresupuesto.textContent = "";
  }

  let diferenciaTexto = "Sin gastos registrados el mes anterior para comparar.";
  if (gastoMesAnterior > 0) {
    const diffPorc = ((gastoMesActual - gastoMesAnterior) / gastoMesAnterior) * 100;
    const signo = diffPorc >= 0 ? "+" : "";
    diferenciaTexto = `Variación vs. mes anterior: ${signo}${diffPorc.toFixed(1)}%`;
  }

  comparativaMensual.innerHTML = `
    <div><strong>Mes actual (${mesActualPrefix}):</strong> Gastos ${formatearMonto(
      gastoMesActual
    )} · Ingresos ${formatearMonto(ingresoMesActual)}</div>
    <div><strong>Mes anterior (${mesAnteriorPrefix}):</strong> Gastos ${formatearMonto(
      gastoMesAnterior
    )}</div>
    <div class="texto-ayuda">${escaparHTML(diferenciaTexto)}</div>
  `;
}

function actualizarFiltroCategorias() {
  const seleccionAnterior = filtroCategoria.value;
  const categoriasUnicas = [...new Set(movimientos.map((m) => m.categoria))].sort((a, b) =>
    a.localeCompare(b, "es")
  );

  filtroCategoria.innerHTML = `<option value="todas">Todas las categorías</option>`;
  for (const cat of categoriasUnicas) {
    const opcion = document.createElement("option");
    opcion.value = cat;
    opcion.textContent = cat;
    filtroCategoria.appendChild(opcion);
  }

  if (categoriasUnicas.includes(seleccionAnterior)) {
    filtroCategoria.value = seleccionAnterior;
  } else {
    filtroCategoria.value = "todas";
  }
}

function renderizarResumenCategorias(visibles) {
  resumenCategorias.innerHTML = "";
  if (visibles.length === 0) {
    resumenCategorias.innerHTML = `<span class="chip">Sin datos para mostrar</span>`;
    return;
  }

  const acumulador = {};
  for (const mov of visibles) {
    if (!acumulador[mov.categoria]) {
      acumulador[mov.categoria] = 0;
    }
    acumulador[mov.categoria] += mov.tipo === "ingreso" ? mov.monto : -mov.monto;
  }

  for (const [cat, total] of Object.entries(acumulador)) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<strong>${escaparHTML(cat)}:</strong> ${formatearMonto(total)}`;
    resumenCategorias.appendChild(chip);
  }
}

function renderizarGraficoGastos(visibles) {
  const ctx = graficoCanvas.getContext("2d");
  const ancho = graficoCanvas.width;
  const alto = graficoCanvas.height;
  ctx.clearRect(0, 0, ancho, alto);

  const gastosPorCat = {};
  for (const mov of visibles) {
    if (mov.tipo === "gasto") {
      gastosPorCat[mov.categoria] = (gastosPorCat[mov.categoria] || 0) + mov.monto;
    }
  }

  const entradas = Object.entries(gastosPorCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (entradas.length === 0) {
    ctx.fillStyle = "#6b5a50";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("No hay gastos en la selección actual para graficar.", 16, 40);
    return;
  }

  const maxValor = Math.max(...entradas.map(([, val]) => val));
  const colores = ["#e07a3f", "#c86428", "#b83b2b", "#d99b52", "#8c4a27", "#e8a87c"];
  const alturaBarra = 24;
  const espacio = 10;
  const inicioY = 14;

  entradas.forEach(([cat, valor], idx) => {
    const y = inicioY + idx * (alturaBarra + espacio);
    const anchoBarra = maxValor > 0 ? Math.max(8, ((ancho - 190) * valor) / maxValor) : 8;

    ctx.fillStyle = "#2b211b";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(cat.slice(0, 14), 8, y + 16);

    ctx.fillStyle = colores[idx % colores.length];
    ctx.fillRect(115, y, anchoBarra, alturaBarra);

    ctx.fillStyle = "#2b211b";
    ctx.fillText(formatearMonto(valor), 122 + anchoBarra, y + 16);
  });
}

function ordenarMovimientos(arr) {
  const copia = [...arr];
  copia.sort((a, b) => {
    let cmp = 0;
    if (ordenCampo === "monto") {
      cmp = a.monto - b.monto;
    } else if (ordenCampo === "categoria") {
      cmp = a.categoria.localeCompare(b.categoria, "es");
    } else {
      cmp = String(a.fecha).localeCompare(String(b.fecha));
    }
    return ordenAsc ? cmp : -cmp;
  });
  return copia;
}

document.querySelectorAll(".btn-orden").forEach((btn) => {
  btn.addEventListener("click", () => {
    const campo = btn.dataset.campo;
    if (ordenCampo === campo) {
      ordenAsc = !ordenAsc;
    } else {
      ordenCampo = campo;
      ordenAsc = campo === "categoria";
    }
    renderizar();
  });
});

function renderizar() {
  actualizarFiltroCategorias();
  renderizarPresupuestoYComparativa();

  const tipoSel = filtroTipo.value;
  const catSel = filtroCategoria.value;
  const consulta = buscarTexto.value.trim().toLowerCase();
  const desde = fechaDesde.value;
  const hasta = fechaHasta.value;

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

  const filtrados = movimientos.filter((m) => {
    const coincideTipo = tipoSel === "todos" || m.tipo === tipoSel;
    const coincideCat = catSel === "todas" || m.categoria === catSel;
    const coincideTexto =
      !consulta ||
      m.descripcion.toLowerCase().includes(consulta) ||
      m.categoria.toLowerCase().includes(consulta);
    const coincideDesde = !desde || m.fecha >= desde;
    const coincideHasta = !hasta || m.fecha <= hasta;
    return coincideTipo && coincideCat && coincideTexto && coincideDesde && coincideHasta;
  });

  const visibles = ordenarMovimientos(filtrados);

  renderizarResumenCategorias(visibles);
  renderizarGraficoGastos(visibles);
  lista.innerHTML = "";

  if (visibles.length === 0) {
    const mensaje =
      movimientos.length === 0
        ? "Todavía no hay movimientos registrados."
        : "No se encontraron movimientos con los filtros actuales.";
    lista.innerHTML = `<tr><td colspan="6" class="fila-vacia">${mensaje}</td></tr>`;
    return;
  }

  for (const mov of visibles) {
    const fila = document.createElement("tr");
    const claseEtiqueta = mov.tipo === "ingreso" ? "etiqueta-ingreso" : "etiqueta-gasto";
    const textoTipo = mov.tipo === "ingreso" ? "Ingreso" : "Gasto";

    fila.innerHTML = `
      <td>${escaparHTML(mov.fecha)}</td>
      <td><span class="etiqueta-tipo ${claseEtiqueta}">${textoTipo}</span></td>
      <td>${escaparHTML(mov.categoria)}</td>
      <td>${escaparHTML(mov.descripcion)}</td>
      <td class="${mov.tipo === "ingreso" ? "texto-ingreso" : "texto-gasto"}">${formatearMonto(mov.monto)}</td>
      <td>
        <div class="celda-acciones">
          <button type="button" class="btn-editar" onclick="iniciarEdicion(${mov.id})">Editar</button>
          <button type="button" class="btn-borrar" onclick="eliminarMovimiento(${mov.id})">Eliminar</button>
        </div>
      </td>
    `;
    lista.appendChild(fila);
  }
}

window.iniciarEdicion = function (id) {
  const mov = movimientos.find((m) => m.id === id);
  if (!mov) return;

  idEditando = mov.id;
  document.getElementById("tipo").value = mov.tipo;
  inputFecha.value = mov.fecha;
  document.getElementById("categoria").value = mov.categoria;
  document.getElementById("descripcion").value = mov.descripcion;
  document.getElementById("monto").value = mov.monto;

  modoRepeticion.value = "unico";
  modoRepeticion.disabled = true;
  cantidadRepeticiones.classList.add("oculto");
  cantidadRepeticiones.disabled = true;

  btnGuardarMov.textContent = "Guardar cambios";
  btnCancelarEdicion.classList.remove("oculto");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
};

btnCancelarEdicion.addEventListener("click", cancelarEdicion);

window.eliminarMovimiento = function (id) {
  if (!confirm("¿Seguro que quieres eliminar este movimiento?")) return;
  if (idEditando === id) {
    cancelarEdicion();
  }
  movimientos = movimientos.filter((m) => m.id !== id);
  guardarMovimientos();
  renderizar();
};

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const fecha = inputFecha.value || fechaHoyISO();
  const categoria = document.getElementById("categoria").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const monto = parseFloat(document.getElementById("monto").value);

  if (!categoria || !descripcion || isNaN(monto) || monto <= 0) return;

  if (idEditando !== null) {
    movimientos = movimientos.map((m) =>
      m.id === idEditando ? { ...m, tipo, fecha, categoria, descripcion, monto } : m
    );
    cancelarEdicion();
  } else {
    const repModo = modoRepeticion.value;
    const totalRep =
      repModo === "unico"
        ? 1
        : Math.min(60, Math.max(2, parseInt(cantidadRepeticiones.value, 10) || 2));

    const nuevos = [];
    for (let i = 0; i < totalRep; i++) {
      let descFinal = descripcion;
      if (repModo === "cuotas") {
        descFinal = `${descripcion} (Cuota ${i + 1}/${totalRep})`;
      } else if (repModo === "recurrente" && totalRep > 1) {
        descFinal = `${descripcion} (Mes ${i + 1}/${totalRep})`;
      }

      nuevos.push({
        id: Date.now() + i,
        fecha: sumarMesesAFecha(fecha, i),
        tipo,
        categoria,
        descripcion: descFinal,
        monto
      });
    }

    movimientos = [...nuevos.reverse(), ...movimientos];
    form.reset();
    inputFecha.value = fechaHoyISO();
    modoRepeticion.value = "unico";
    cantidadRepeticiones.classList.add("oculto");
  }

  guardarMovimientos();
  renderizar();
});

filtroTipo.addEventListener("change", renderizar);
filtroCategoria.addEventListener("change", renderizar);
buscarTexto.addEventListener("input", renderizar);
fechaDesde.addEventListener("change", renderizar);
fechaHasta.addEventListener("change", renderizar);

btnLimpiarFiltros.addEventListener("click", () => {
  filtroTipo.value = "todos";
  filtroCategoria.value = "todas";
  buscarTexto.value = "";
  fechaDesde.value = "";
  fechaHasta.value = "";
  renderizar();
});

function descargarArchivo(contenido, nombreArchivo, tipoMime) {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}

btnExportar.addEventListener("click", () => {
  const encabezados = ["ID", "Fecha", "Tipo", "Categoria", "Descripcion", "Monto"];
  const filas = movimientos.map((m) => [
    m.id,
    `"${String(m.fecha).replace(/"/g, '""')}"`,
    m.tipo,
    `"${String(m.categoria).replace(/"/g, '""')}"`,
    `"${String(m.descripcion).replace(/"/g, '""')}"`,
    m.monto
  ]);

  const csv = [encabezados.join(","), ...filas.map((f) => f.join(","))].join("\n");
  descargarArchivo(csv, `movimientos_${usuarioActivo}.csv`, "text/csv;charset=utf-8;");
});

btnImportar.addEventListener("click", () => {
  inputImportarCsv.click();
});

function parsearLineaCSV(linea) {
  const resultado = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    if (char === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (char === "," && !entreComillas) {
      resultado.push(actual);
      actual = "";
    } else {
      actual += char;
    }
  }
  resultado.push(actual);
  return resultado;
}

inputImportarCsv.addEventListener("change", (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (evento) => {
    const lineas = String(evento.target.result || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lineas.length < 2) {
      alert("El archivo CSV no tiene movimientos para importar.");
      return;
    }

    const importados = [];
    for (let i = 1; i < lineas.length; i++) {
      const cols = parsearLineaCSV(lineas[i]);
      if (cols.length < 5) continue;

      const tieneFecha = cols.length >= 6;
      const fecha = tieneFecha ? cols[1].trim() || fechaHoyISO() : fechaHoyISO();
      const tipoRaw = (tieneFecha ? cols[2] : cols[1]).trim().toLowerCase();
      const categoria = (tieneFecha ? cols[3] : cols[2]).trim() || "General";
      const descripcion = (tieneFecha ? cols[4] : cols[3]).trim();
      const monto = parseFloat((tieneFecha ? cols[5] : cols[4]).trim());

      const tipo = tipoRaw === "ingreso" ? "ingreso" : "gasto";
      if (!descripcion || isNaN(monto) || monto <= 0) continue;

      importados.push({
        id: Date.now() + i,
        fecha,
        tipo,
        categoria,
        descripcion,
        monto
      });
    }

    if (importados.length === 0) {
      alert("No se pudieron leer filas válidas del CSV.");
      return;
    }

    movimientos = [...importados, ...movimientos];
    guardarMovimientos();
    renderizar();
    alert(`Se importaron ${importados.length} movimiento(s).`);
  };

  lector.readAsText(archivo, "utf-8");
  inputImportarCsv.value = "";
});

btnExportarJson.addEventListener("click", () => {
  const respaldo = {
    usuario: usuarioActivo,
    exportadoEn: new Date().toISOString(),
    presupuestoMensual,
    movimientos
  };
  descargarArchivo(
    JSON.stringify(respaldo, null, 2),
    `respaldo_${usuarioActivo}.json`,
    "application/json;charset=utf-8;"
  );
});

btnImportarJson.addEventListener("click", () => {
  inputImportarJson.click();
});

inputImportarJson.addEventListener("change", (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (evento) => {
    try {
      const datos = JSON.parse(String(evento.target.result || "{}"));
      const listaOrigen = Array.isArray(datos)
        ? datos
        : Array.isArray(datos.movimientos)
          ? datos.movimientos
          : [];

      const validos = listaOrigen
        .filter((m) => m && Number(m.monto) > 0 && String(m.descripcion || "").trim() !== "")
        .map((m, idx) => ({
          id: Date.now() + idx,
          fecha: m.fecha || fechaHoyISO(),
          tipo: m.tipo === "ingreso" ? "ingreso" : "gasto",
          categoria: String(m.categoria || "General").trim() || "General",
          descripcion: String(m.descripcion).trim(),
          monto: Number(m.monto)
        }));

      if (validos.length === 0) {
        alert("El archivo JSON no contiene movimientos válidos.");
        return;
      }

      if (!Array.isArray(datos) && Number(datos.presupuestoMensual) > 0) {
        presupuestoMensual = Number(datos.presupuestoMensual);
        inputPresupuestoMes.value = presupuestoMensual;
        guardarPresupuesto();
      }

      movimientos = [...validos, ...movimientos];
      guardarMovimientos();
      renderizar();
      alert(`Se importaron ${validos.length} movimiento(s) desde JSON.`);
    } catch {
      alert("No se pudo leer el archivo JSON. Verifica que tenga un formato válido.");
    }
  };

  lector.readAsText(archivo, "utf-8");
  inputImportarJson.value = "";
});

btnLimpiar.addEventListener("click", () => {
  if (movimientos.length === 0) return;
  if (!confirm("¿Seguro que quieres borrar todos los movimientos de este usuario?")) return;
  cancelarEdicion();
  movimientos = [];
  guardarMovimientos();
  renderizar();
});

actualizarVistaSesion();