const CLAVE_USUARIOS = "gestor_usuarios_v1";
const CLAVE_SESION = "gestor_sesion_activa_v1";
const CLAVE_CACHE_COTIZACIONES = "gestor_cotizaciones_cache_v1";

const EMAILJS_PUBLIC_KEY = "qMZwedfhyH5y_dCX0";
const EMAILJS_SERVICE_ID = "service_7bdvpcu";
const EMAILJS_TEMPLATE_ID = "template_6b8eib7";

const TASAS_RESPALDO = {
  ARS: 1,
  USD: 1000,
  EUR: 1080
};

const CONFIG_MONEDAS = {
  ARS: { locale: "es-AR", currency: "ARS" },
  USD: { locale: "en-US", currency: "USD" },
  EUR: { locale: "es-ES", currency: "EUR" }
};

let modoRegistro = false;
let usuarioActivo = localStorage.getItem(CLAVE_SESION) || null;
let movimientos = [];
let presupuestoMensual = 0;
let presupuestosCategoria = {};
let notasUsuario = "";
let monedaActual = "ARS";
let tasasPorARS = { ...TASAS_RESPALDO };
let etiquetaCotizacion = "Cotización de respaldo";
let idEditando = null;
let ordenCampo = "fecha";
let ordenAsc = false;
let solicitudCodigoPendiente = null;
let intervaloReenvio = null;

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
const infoCotizacion = document.getElementById("info-cotizacion");
const selectorMoneda = document.getElementById("selector-moneda");
const btnActualizarCotizacion = document.getElementById("btn-actualizar-cotizacion");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

const camposRegistro = document.getElementById("campos-registro");
const inputCorreoRegistro = document.getElementById("auth-correo");
const btnOlvideClave = document.getElementById("btn-olvide-clave");
const panelRecuperarClave = document.getElementById("panel-recuperar-clave");
const formEnviarCodigo = document.getElementById("form-enviar-codigo");
const btnEnviarCodigo = document.getElementById("btn-enviar-codigo");
const btnReenviarCodigo = document.getElementById("btn-reenviar-codigo");
const formRestablecerCodigo = document.getElementById("form-restablecer-codigo");
const textoEstadoRecuperar = document.getElementById("texto-estado-recuperar");
const mensajeRecuperar = document.getElementById("mensaje-recuperar");
const btnCancelarRecuperar = document.getElementById("btn-cancelar-recuperar");

const btnCambiarCorreo = document.getElementById("btn-cambiar-correo");
const panelCambiarCorreo = document.getElementById("panel-cambiar-correo");
const correoActualTexto = document.getElementById("correo-actual-texto");
const formCambiarCorreo = document.getElementById("form-cambiar-correo");
const btnCancelarCorreo = document.getElementById("btn-cancelar-correo");
const mensajeCorreo = document.getElementById("mensaje-correo");

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

const formPresupuestoCat = document.getElementById("form-presupuesto-cat");
const catPresupuestoNombre = document.getElementById("cat-presupuesto-nombre");
const catPresupuestoMonto = document.getElementById("cat-presupuesto-monto");
const listaPresupuestosCat = document.getElementById("lista-presupuestos-cat");

const notasTextarea = document.getElementById("notas-usuario");
const estadoNotas = document.getElementById("estado-notas");
const btnGuardarNotas = document.getElementById("btn-guardar-notas");

const form = document.getElementById("form-movimiento");
const inputFecha = document.getElementById("fecha");
const inputMetodoPago = document.getElementById("metodo-pago");
const modoRepeticion = document.getElementById("modo-repeticion");
const cantidadRepeticiones = document.getElementById("cantidad-repeticiones");
const btnGuardarMov = document.getElementById("btn-guardar-mov");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");

const lista = document.getElementById("lista-movimientos");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroMetodo = document.getElementById("filtro-metodo");
const buscarTexto = document.getElementById("buscar-texto");
const fechaDesde = document.getElementById("fecha-desde");
const fechaHasta = document.getElementById("fecha-hasta");
const btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");

const resumenCategorias = document.getElementById("resumen-categorias");
const graficoCanvas = document.getElementById("grafico-gastos");
const graficoEvolucion = document.getElementById("grafico-evolucion");

const btnExportar = document.getElementById("btn-exportar");
const btnImportar = document.getElementById("btn-importar");
const inputImportarCsv = document.getElementById("input-importar-csv");
const btnExportarJson = document.getElementById("btn-exportar-json");
const btnImportarJson = document.getElementById("btn-importar-json");
const inputImportarJson = document.getElementById("input-importar-json");
const btnExportarXlsx = document.getElementById("btn-exportar-xlsx");
const btnExportarPdf = document.getElementById("btn-exportar-pdf");
const btnLimpiar = document.getElementById("btn-limpiar");

function generarIdUnico(offset = 0) {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000) + offset;
}

document.querySelectorAll(".btn-ojo").forEach((btn) => {
  btn.addEventListener("click", () => {
    const campo = document.getElementById(btn.dataset.objetivo);
    if (!campo) return;
    campo.type = campo.type === "password" ? "text" : "password";
  });
});

function cargarCacheCotizaciones() {
  try {
    const cache = JSON.parse(localStorage.getItem(CLAVE_CACHE_COTIZACIONES));
    if (!cache || !cache.tasasPorARS || !cache.timestamp) return false;
    const seisHoras = 6 * 60 * 60 * 1000;
    if (Date.now() - cache.timestamp > seisHoras) return false;
    tasasPorARS = { ARS: 1, ...cache.tasasPorARS };
    etiquetaCotizacion = `Actualizada (${new Date(cache.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })})`;
    return true;
  } catch {
    return false;
  }
}

async function obtenerCotizacionesExternas(forzar = false) {
  if (!forzar && cargarCacheCotizaciones()) {
    renderizarBarraCotizacion();
    return;
  }

  infoCotizacion.textContent = "Cotización: consultando API...";
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/ARS");
    if (!res.ok) throw new Error("Error de red");
    const data = await res.json();
    if (data && data.result === "success" && data.rates && data.rates.USD && data.rates.EUR) {
      tasasPorARS = {
        ARS: 1,
        USD: Number(data.rates.USD),
        EUR: Number(data.rates.EUR)
      };
      const ahora = Date.now();
      localStorage.setItem(
        CLAVE_CACHE_COTIZACIONES,
        JSON.stringify({ timestamp: ahora, tasasPorARS })
      );
      etiquetaCotizacion = `API en línea (${new Date(ahora).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })})`;
      renderizarBarraCotizacion();
      if (usuarioActivo) renderizar();
      return;
    }
    throw new Error("Respuesta inválida");
  } catch {
    tasasPorARS = {
      ARS: 1,
      USD: 1 / TASAS_RESPALDO.USD,
      EUR: 1 / TASAS_RESPALDO.EUR
    };
    etiquetaCotizacion = "Cotización de referencia local";
    renderizarBarraCotizacion();
  }
}

function convertirDesdeARS(montoARS) {
  const factor = tasasPorARS[monedaActual] || 1;
  return Number(montoARS) * factor;
}

function renderizarBarraCotizacion() {
  const usdEnArs = tasasPorARS.USD ? (1 / tasasPorARS.USD).toFixed(2) : TASAS_RESPALDO.USD;
  const eurEnArs = tasasPorARS.EUR ? (1 / tasasPorARS.EUR).toFixed(2) : TASAS_RESPALDO.EUR;
  infoCotizacion.textContent = `1 USD ≈ ${usdEnArs} ARS · 1 EUR ≈ ${eurEnArs} ARS (${etiquetaCotizacion})`;
}

btnActualizarCotizacion.addEventListener("click", () => {
  obtenerCotizacionesExternas(true);
});

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
  return String(Math.floor(100000 + Math.random() * 900000));
}

function claveMovimientosUsuario() {
  return `movimientos_${usuarioActivo}`;
}

function clavePresupuestoUsuario() {
  return `presupuesto_${usuarioActivo}`;
}

function clavePresupuestosCatUsuario() {
  return `presupuestos_cat_${usuarioActivo}`;
}

function claveNotasUsuario() {
  return `notas_${usuarioActivo}`;
}

function claveMonedaUsuario() {
  return `moneda_${usuarioActivo}`;
}

function cargarDatosUsuario() {
  const crudos = JSON.parse(localStorage.getItem(claveMovimientosUsuario())) || [];
  movimientos = crudos.map((m, idx) => ({
    id: Number(m.id) || generarIdUnico(idx),
    fecha: m.fecha || fechaHoyISO(),
    tipo: m.tipo === "ingreso" ? "ingreso" : "gasto",
    categoria: m.categoria || "General",
    metodoPago: m.metodoPago || "Efectivo",
    descripcion: m.descripcion || "",
    monto: Number(m.monto) || 0
  }));

  presupuestoMensual = Number(localStorage.getItem(clavePresupuestoUsuario())) || 0;
  inputPresupuestoMes.value = presupuestoMensual > 0 ? presupuestoMensual : "";

  presupuestosCategoria = JSON.parse(localStorage.getItem(clavePresupuestosCatUsuario())) || {};
  notasUsuario = localStorage.getItem(claveNotasUsuario()) || "";
  notasTextarea.value = notasUsuario;

  const monedaGuardada = localStorage.getItem(claveMonedaUsuario());
  monedaActual = CONFIG_MONEDAS[monedaGuardada] ? monedaGuardada : "ARS";
  selectorMoneda.value = monedaActual;
}

function guardarMovimientos() {
  localStorage.setItem(claveMovimientosUsuario(), JSON.stringify(movimientos));
}

function guardarPresupuesto() {
  localStorage.setItem(clavePresupuestoUsuario(), String(presupuestoMensual));
}

function guardarPresupuestosCategoria() {
  localStorage.setItem(clavePresupuestosCatUsuario(), JSON.stringify(presupuestosCategoria));
}

function guardarNotas() {
  notasUsuario = notasTextarea.value;
  localStorage.setItem(claveNotasUsuario(), notasUsuario);
  estadoNotas.textContent = "Notas guardadas";
}

function cancelarEdicion() {
  idEditando = null;
  btnGuardarMov.textContent = "Agregar";
  btnCancelarEdicion.classList.add("oculto");
  modoRepeticion.disabled = false;
  cantidadRepeticiones.disabled = false;
  form.reset();
  inputFecha.value = fechaHoyISO();
  inputMetodoPago.value = "Efectivo";
  cantidadRepeticiones.classList.add("oculto");
}

function actualizarVistaSesion() {
  if (usuarioActivo) {
    vistaLogin.classList.add("oculto");
    vistaApp.classList.remove("oculto");
    panelCambiarClave.classList.add("oculto");
    panelCambiarCorreo.classList.add("oculto");
    spanUsuarioActual.textContent = usuarioActivo;
    inputFecha.value = fechaHoyISO();
    cargarDatosUsuario();
    renderizarBarraCotizacion();
    renderizar();
  } else {
    cancelarEdicion();
    vistaApp.classList.add("oculto");
    vistaLogin.classList.remove("oculto");
  }
}

selectorMoneda.addEventListener("change", () => {
  monedaActual = CONFIG_MONEDAS[selectorMoneda.value] ? selectorMoneda.value : "ARS";
  localStorage.setItem(claveMonedaUsuario(), monedaActual);
  renderizar();
});

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

function detenerTemporizadorReenvio() {
  if (intervaloReenvio) {
    clearInterval(intervaloReenvio);
    intervaloReenvio = null;
  }
  btnReenviarCodigo.classList.add("oculto");
  btnReenviarCodigo.disabled = true;
}

function iniciarTemporizadorReenvio(segundos = 30) {
  detenerTemporizadorReenvio();
  let restante = segundos;
  btnReenviarCodigo.classList.remove("oculto");
  btnReenviarCodigo.disabled = true;
  btnReenviarCodigo.textContent = `Reenviar (${restante}s)`;

  intervaloReenvio = setInterval(() => {
    restante -= 1;
    if (restante <= 0) {
      clearInterval(intervaloReenvio);
      intervaloReenvio = null;
      btnReenviarCodigo.disabled = false;
      btnReenviarCodigo.textContent = "Reenviar código";
    } else {
      btnReenviarCodigo.textContent = `Reenviar (${restante}s)`;
    }
  }, 1000);
}

function resetearPanelRecuperacion() {
  detenerTemporizadorReenvio();
  solicitudCodigoPendiente = null;
  formEnviarCodigo.reset();
  formRestablecerCodigo.reset();
  formRestablecerCodigo.classList.add("oculto");
  textoEstadoRecuperar.textContent = "";
  mensajeRecuperar.textContent = "";
}

async function solicitarEnvioCodigo(usuarioInput) {
  const usuario = String(usuarioInput || "").trim().toLowerCase();
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
    iniciarTemporizadorReenvio(30);
  } catch {
    mensajeRecuperar.textContent =
      "No se pudo enviar el correo. Verifica tus claves de EmailJS y tu plantilla.";
  } finally {
    btnEnviarCodigo.disabled = false;
    btnEnviarCodigo.textContent = "Enviar código al correo";
  }
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
  await solicitarEnvioCodigo(document.getElementById("rec-usuario").value);
});

btnReenviarCodigo.addEventListener("click", async () => {
  const usuarioBase =
    (solicitudCodigoPendiente && solicitudCodigoPendiente.usuario) ||
    document.getElementById("rec-usuario").value;
  await solicitarEnvioCodigo(usuarioBase);
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

btnCambiarCorreo.addEventListener("click", () => {
  mensajeCorreo.textContent = "";
  formCambiarCorreo.reset();
  const reg = normalizarUsuario(obtenerUsuarios()[usuarioActivo]);
  correoActualTexto.textContent = reg && reg.correo
    ? `Correo actual: ${reg.correo}`
    : "No tienes un correo registrado actualmente.";
  panelCambiarCorreo.classList.toggle("oculto");
  panelCambiarClave.classList.add("oculto");
});

btnCancelarCorreo.addEventListener("click", () => {
  panelCambiarCorreo.classList.add("oculto");
  mensajeCorreo.textContent = "";
});

formCambiarCorreo.addEventListener("submit", (e) => {
  e.preventDefault();
  const nuevoCorreo = document.getElementById("correo-nuevo").value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCorreo)) {
    mensajeCorreo.textContent = "Ingresa un correo electrónico válido.";
    return;
  }

  const usuarios = obtenerUsuarios();
  const reg = normalizarUsuario(usuarios[usuarioActivo]);
  if (!reg) return;

  reg.correo = nuevoCorreo;
  usuarios[usuarioActivo] = reg;
  guardarUsuarios(usuarios);

  panelCambiarCorreo.classList.add("oculto");
  formCambiarCorreo.reset();
  alert("Correo de recuperación actualizado.");
});

btnCambiarClave.addEventListener("click", () => {
  mensajeClave.textContent = "";
  formCambiarClave.reset();
  panelCambiarClave.classList.toggle("oculto");
  panelCambiarCorreo.classList.add("oculto");
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
      `¿Seguro que quieres eliminar la cuenta "${usuarioActivo}" y todos sus datos guardados?`
    )
  ) {
    return;
  }

  const usuarios = obtenerUsuarios();
  delete usuarios[usuarioActivo];
  guardarUsuarios(usuarios);

  localStorage.removeItem(claveMovimientosUsuario());
  localStorage.removeItem(clavePresupuestoUsuario());
  localStorage.removeItem(clavePresupuestosCatUsuario());
  localStorage.removeItem(claveNotasUsuario());
  localStorage.removeItem(claveMonedaUsuario());
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

formPresupuestoCat.addEventListener("submit", (e) => {
  e.preventDefault();
  const cat = catPresupuestoNombre.value.trim();
  const tope = parseFloat(catPresupuestoMonto.value);
  if (!cat || isNaN(tope) || tope <= 0) return;

  presupuestosCategoria[cat] = tope;
  guardarPresupuestosCategoria();
  formPresupuestoCat.reset();
  renderizarPresupuestosCategoria();
});

window.eliminarTopeCategoria = function (cat) {
  delete presupuestosCategoria[cat];
  guardarPresupuestosCategoria();
  renderizarPresupuestosCategoria();
};

btnGuardarNotas.addEventListener("click", guardarNotas);
notasTextarea.addEventListener("input", () => {
  guardarNotas();
});

function formatearMonto(valorARS) {
  const cfg = CONFIG_MONEDAS[monedaActual] || CONFIG_MONEDAS.ARS;
  const convertido = convertirDesdeARS(valorARS);
  return new Intl.NumberFormat(cfg.locale, {
    style: "currency",
    currency: cfg.currency,
    maximumFractionDigits: 2
  }).format(convertido);
}

function renderizarPresupuestosCategoria() {
  const mesActualPrefix = fechaHoyISO().slice(0, 7);
  const gastosMesCat = {};

  for (const mov of movimientos) {
    if (mov.tipo === "gasto" && String(mov.fecha).slice(0, 7) === mesActualPrefix) {
      gastosMesCat[mov.categoria] = (gastosMesCat[mov.categoria] || 0) + mov.monto;
    }
  }

  const entradas = Object.entries(presupuestosCategoria);
  listaPresupuestosCat.innerHTML = "";

  if (entradas.length === 0) {
    listaPresupuestosCat.innerHTML = `<div class="texto-ayuda">Sin topes por categoría configurados.</div>`;
    return;
  }

  for (const [cat, tope] of entradas) {
    const gastado = gastosMesCat[cat] || 0;
    const porc = (gastado / tope) * 100;
    const ancho = Math.min(100, Math.max(0, porc));
    const colorBarra = porc >= 100 ? "#b83b2b" : porc >= 80 ? "#c77c14" : "#1f7a4c";

    const item = document.createElement("div");
    item.className = "item-tope-cat";
    item.innerHTML = `
      <div class="cabecera-tope">
        <span><strong>${escaparHTML(cat)}:</strong> ${formatearMonto(gastado)} / ${formatearMonto(tope)} (${porc.toFixed(0)}%)</span>
        <button type="button" class="btn-mini-borrar" onclick="eliminarTopeCategoria('${escaparHTML(cat).replace(/'/g, "\\'")}')">✕</button>
      </div>
      <div class="barra-fondo">
        <div class="barra-relleno" style="width: ${ancho}%; background-color: ${colorBarra};"></div>
      </div>
    `;
    listaPresupuestosCat.appendChild(item);
  }
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

  renderizarPresupuestosCategoria();
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
    const anchoBarra = maxValor > 0 ? Math.max(8, ((ancho - 220) * valor) / maxValor) : 8;

    ctx.fillStyle = "#2b211b";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(cat.slice(0, 14), 8, y + 16);

    ctx.fillStyle = colores[idx % colores.length];
    ctx.fillRect(115, y, anchoBarra, alturaBarra);

    ctx.fillStyle = "#2b211b";
    ctx.fillText(formatearMonto(valor), 122 + anchoBarra, y + 16);
  });
}

function renderizarGraficoEvolucion(visibles) {
  const ctx = graficoEvolucion.getContext("2d");
  const ancho = graficoEvolucion.width;
  const alto = graficoEvolucion.height;
  ctx.clearRect(0, 0, ancho, alto);

  const porMes = {};
  for (const mov of visibles) {
    const mes = String(mov.fecha).slice(0, 7);
    if (!mes) continue;
    if (!porMes[mes]) porMes[mes] = { ingreso: 0, gasto: 0 };
    if (mov.tipo === "ingreso") porMes[mes].ingreso += mov.monto;
    else porMes[mes].gasto += mov.monto;
  }

  const mesesOrdenados = Object.keys(porMes).sort().slice(-5);
  if (mesesOrdenados.length === 0) {
    ctx.fillStyle = "#6b5a50";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("Sin movimientos mensuales para graficar.", 16, 40);
    return;
  }

  const maxMonto = Math.max(
    1,
    ...mesesOrdenados.flatMap((m) => [porMes[m].ingreso, porMes[m].gasto])
  );

  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = "#1f7a4c";
  ctx.fillRect(14, 10, 12, 12);
  ctx.fillStyle = "#2b211b";
  ctx.fillText("Ingresos", 32, 20);

  ctx.fillStyle = "#b83b2b";
  ctx.fillRect(105, 10, 12, 12);
  ctx.fillStyle = "#2b211b";
  ctx.fillText("Gastos", 123, 20);

  const baseY = alto - 34;
  const maxAltura = alto - 75;
  const grupoAncho = (ancho - 40) / mesesOrdenados.length;

  mesesOrdenados.forEach((mes, i) => {
    const xBase = 24 + i * grupoAncho;
    const ing = porMes[mes].ingreso;
    const gas = porMes[mes].gasto;

    const altIng = (ing / maxMonto) * maxAltura;
    const altGas = (gas / maxMonto) * maxAltura;
    const anchoCol = Math.min(24, Math.max(10, grupoAncho * 0.28));

    ctx.fillStyle = "#1f7a4c";
    ctx.fillRect(xBase, baseY - altIng, anchoCol, altIng);

    ctx.fillStyle = "#b83b2b";
    ctx.fillRect(xBase + anchoCol + 4, baseY - altGas, anchoCol, altGas);

    ctx.fillStyle = "#2b211b";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(mes, xBase, baseY + 16);
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

function obtenerMovimientosFiltradosOrdenados() {
  const tipoSel = filtroTipo.value;
  const catSel = filtroCategoria.value;
  const metodoSel = filtroMetodo.value;
  const consulta = buscarTexto.value.trim().toLowerCase();
  const desde = fechaDesde.value;
  const hasta = fechaHasta.value;

  const filtrados = movimientos.filter((m) => {
    const coincideTipo = tipoSel === "todos" || m.tipo === tipoSel;
    const coincideCat = catSel === "todas" || m.categoria === catSel;
    const coincideMetodo = metodoSel === "todos" || m.metodoPago === metodoSel;
    const coincideTexto =
      !consulta ||
      m.descripcion.toLowerCase().includes(consulta) ||
      m.categoria.toLowerCase().includes(consulta) ||
      m.metodoPago.toLowerCase().includes(consulta);
    const coincideDesde = !desde || m.fecha >= desde;
    const coincideHasta = !hasta || m.fecha <= hasta;
    return (
      coincideTipo &&
      coincideCat &&
      coincideMetodo &&
      coincideTexto &&
      coincideDesde &&
      coincideHasta
    );
  });

  return ordenarMovimientos(filtrados);
}

function renderizar() {
  actualizarFiltroCategorias();
  renderizarPresupuestoYComparativa();

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

  const visibles = obtenerMovimientosFiltradosOrdenados();

  renderizarResumenCategorias(visibles);
  renderizarGraficoGastos(visibles);
  renderizarGraficoEvolucion(visibles);
  lista.innerHTML = "";

  if (visibles.length === 0) {
    const mensaje =
      movimientos.length === 0
        ? "Todavía no hay movimientos registrados."
        : "No se encontraron movimientos con los filtros actuales.";
    lista.innerHTML = `<tr><td colspan="7" class="fila-vacia">${mensaje}</td></tr>`;
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
      <td>${escaparHTML(mov.metodoPago)}</td>
      <td>${escaparHTML(mov.descripcion)}</td>
      <td class="${mov.tipo === "ingreso" ? "texto-ingreso" : "texto-gasto"}">${formatearMonto(mov.monto)}</td>
      <td>
        <div class="celda-acciones">
          <button type="button" class="btn-editar" data-accion="editar" data-id="${mov.id}">Editar</button>
          <button type="button" class="btn-borrar" data-accion="eliminar" data-id="${mov.id}">Eliminar</button>
        </div>
      </td>
    `;
    lista.appendChild(fila);
  }
}

function iniciarEdicionPorId(id) {
  const idBuscado = Number(id);
  const mov = movimientos.find((m) => Number(m.id) === idBuscado);
  if (!mov) return;

  idEditando = mov.id;
  document.getElementById("tipo").value = mov.tipo;
  inputFecha.value = mov.fecha;
  document.getElementById("categoria").value = mov.categoria;
  inputMetodoPago.value = mov.metodoPago || "Efectivo";
  document.getElementById("descripcion").value = mov.descripcion;
  document.getElementById("monto").value = mov.monto;

  modoRepeticion.value = "unico";
  modoRepeticion.disabled = true;
  cantidadRepeticiones.classList.add("oculto");
  cantidadRepeticiones.disabled = true;

  btnGuardarMov.textContent = "Guardar cambios";
  btnCancelarEdicion.classList.remove("oculto");
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function eliminarMovimientoPorId(id) {
  const idBuscado = Number(id);
  if (!confirm("¿Seguro que quieres eliminar este movimiento?")) return;
  if (Number(idEditando) === idBuscado) {
    cancelarEdicion();
  }
  movimientos = movimientos.filter((m) => Number(m.id) !== idBuscado);
  guardarMovimientos();
  renderizar();
}

lista.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-accion][data-id]");
  if (!btn) return;
  const accion = btn.dataset.accion;
  const id = btn.dataset.id;
  if (accion === "editar") {
    iniciarEdicionPorId(id);
  } else if (accion === "eliminar") {
    eliminarMovimientoPorId(id);
  }
});

btnCancelarEdicion.addEventListener("click", cancelarEdicion);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const fecha = inputFecha.value || fechaHoyISO();
  const categoria = document.getElementById("categoria").value.trim();
  const metodoPago = inputMetodoPago.value || "Efectivo";
  const descripcion = document.getElementById("descripcion").value.trim();
  const monto = parseFloat(document.getElementById("monto").value);

  if (!categoria || !descripcion || isNaN(monto) || monto <= 0) return;

  if (idEditando !== null) {
    movimientos = movimientos.map((m) =>
      Number(m.id) === Number(idEditando)
        ? { ...m, tipo, fecha, categoria, metodoPago, descripcion, monto }
        : m
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
        id: generarIdUnico(i),
        fecha: sumarMesesAFecha(fecha, i),
        tipo,
        categoria,
        metodoPago,
        descripcion: descFinal,
        monto
      });
    }

    movimientos = [...nuevos.reverse(), ...movimientos];
    form.reset();
    inputFecha.value = fechaHoyISO();
    inputMetodoPago.value = "Efectivo";
    modoRepeticion.value = "unico";
    cantidadRepeticiones.classList.add("oculto");
  }

  guardarMovimientos();
  renderizar();
});

filtroTipo.addEventListener("change", renderizar);
filtroCategoria.addEventListener("change", renderizar);
filtroMetodo.addEventListener("change", renderizar);
buscarTexto.addEventListener("input", renderizar);
fechaDesde.addEventListener("change", renderizar);
fechaHasta.addEventListener("change", renderizar);

btnLimpiarFiltros.addEventListener("click", () => {
  filtroTipo.value = "todos";
  filtroCategoria.value = "todas";
  filtroMetodo.value = "todos";
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
  const encabezados = ["ID", "Fecha", "Tipo", "Categoria", "MetodoPago", "Descripcion", "MontoARS"];
  const filas = movimientos.map((m) => [
    m.id,
    `"${String(m.fecha).replace(/"/g, '""')}"`,
    m.tipo,
    `"${String(m.categoria).replace(/"/g, '""')}"`,
    `"${String(m.metodoPago).replace(/"/g, '""')}"`,
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

      const tieneMetodo = cols.length >= 7;
      const tieneFecha = cols.length >= 6;

      const fecha = tieneFecha ? cols[1].trim() || fechaHoyISO() : fechaHoyISO();
      const tipoRaw = (tieneFecha ? cols[2] : cols[1]).trim().toLowerCase();
      const categoria = (tieneFecha ? cols[3] : cols[2]).trim() || "General";
      const metodoPago = tieneMetodo ? cols[4].trim() || "Efectivo" : "Efectivo";
      const descripcion = (tieneMetodo ? cols[5] : tieneFecha ? cols[4] : cols[3]).trim();
      const monto = parseFloat((tieneMetodo ? cols[6] : tieneFecha ? cols[5] : cols[4]).trim());

      const tipo = tipoRaw === "ingreso" ? "ingreso" : "gasto";
      if (!descripcion || isNaN(monto) || monto <= 0) continue;

      importados.push({
        id: generarIdUnico(i),
        fecha,
        tipo,
        categoria,
        metodoPago,
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
    moneda: monedaActual,
    presupuestoMensual,
    presupuestosCategoria,
    notas: notasTextarea.value,
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
          id: generarIdUnico(idx),
          fecha: m.fecha || fechaHoyISO(),
          tipo: m.tipo === "ingreso" ? "ingreso" : "gasto",
          categoria: String(m.categoria || "General").trim() || "General",
          metodoPago: String(m.metodoPago || "Efectivo").trim() || "Efectivo",
          descripcion: String(m.descripcion).trim(),
          monto: Number(m.monto)
        }));

      if (validos.length === 0) {
        alert("El archivo JSON no contiene movimientos válidos.");
        return;
      }

      if (!Array.isArray(datos)) {
        if (Number(datos.presupuestoMensual) > 0) {
          presupuestoMensual = Number(datos.presupuestoMensual);
          inputPresupuestoMes.value = presupuestoMensual;
          guardarPresupuesto();
        }
        if (datos.presupuestosCategoria && typeof datos.presupuestosCategoria === "object") {
          presupuestosCategoria = { ...presupuestosCategoria, ...datos.presupuestosCategoria };
          guardarPresupuestosCategoria();
        }
        if (typeof datos.notas === "string" && datos.notas.trim() !== "") {
          notasTextarea.value = datos.notas;
          guardarNotas();
        }
        if (CONFIG_MONEDAS[datos.moneda]) {
          monedaActual = datos.moneda;
          selectorMoneda.value = monedaActual;
          localStorage.setItem(claveMonedaUsuario(), monedaActual);
        }
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

btnExportarXlsx.addEventListener("click", () => {
  if (!window.XLSX) {
    alert("No se pudo cargar la librería de Excel (SheetJS). Revisa tu conexión.");
    return;
  }

  const filas = movimientos.map((m) => ({
    Fecha: m.fecha,
    Tipo: m.tipo === "ingreso" ? "Ingreso" : "Gasto",
    Categoria: m.categoria,
    MetodoPago: m.metodoPago,
    Descripcion: m.descripcion,
    MontoARS: m.monto,
    MontoConvertido: Number(convertirDesdeARS(m.monto).toFixed(2)),
    MonedaVista: monedaActual
  }));

  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Movimientos");
  XLSX.writeFile(libro, `movimientos_${usuarioActivo}_${fechaHoyISO()}.xlsx`);
});

btnExportarPdf.addEventListener("click", () => {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("No se pudo cargar la librería de PDF (jsPDF). Revisa tu conexión.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margenX = 40;
  let y = 50;

  let ingresos = 0;
  let gastos = 0;
  for (const m of movimientos) {
    if (m.tipo === "ingreso") ingresos += m.monto;
    else gastos += m.monto;
  }

  doc.setFontSize(16);
  doc.text(`Reporte de Movimientos - ${usuarioActivo}`, margenX, y);
  y += 22;

  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${fechaHoyISO()} · Moneda: ${monedaActual}`, margenX, y);
  y += 18;
  doc.text(
    `Ingresos: ${formatearMonto(ingresos)} | Gastos: ${formatearMonto(gastos)} | Saldo: ${formatearMonto(
      ingresos - gastos
    )}`,
    margenX,
    y
  );
  y += 26;

  doc.setFontSize(11);
  doc.text("Movimientos (según filtros activos):", margenX, y);
  y += 16;

  doc.setFontSize(9);
  const visibles = obtenerMovimientosFiltradosOrdenados().slice(0, 45);
  if (visibles.length === 0) {
    doc.text("Sin movimientos para mostrar.", margenX, y);
  } else {
    for (const m of visibles) {
      if (y > 780) {
        doc.addPage();
        y = 50;
      }
      const linea = `${m.fecha} | ${m.tipo.toUpperCase()} | ${m.categoria} | ${m.metodoPago} | ${
        m.descripcion
      } | ${formatearMonto(m.monto)}`;
      doc.text(linea.slice(0, 105), margenX, y);
      y += 14;
    }
  }

  doc.save(`reporte_${usuarioActivo}_${fechaHoyISO()}.pdf`);
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
obtenerCotizacionesExternas(false);