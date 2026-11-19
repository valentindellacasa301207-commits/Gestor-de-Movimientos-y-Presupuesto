const CLAVE_USUARIOS = "gestor_usuarios_v1";
const CLAVE_SESION = "gestor_sesion_activa_v1";

let modoRegistro = false;
let usuarioActivo = localStorage.getItem(CLAVE_SESION) || null;
let movimientos = [];
let idEditando = null;

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
const inputFecha = document.getElementById("fecha");
const btnGuardarMov = document.getElementById("btn-guardar-mov");
const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
const lista = document.getElementById("lista-movimientos");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroCategoria = document.getElementById("filtro-categoria");
const buscarTexto = document.getElementById("buscar-texto");
const resumenCategorias = document.getElementById("resumen-categorias");
const btnExportar = document.getElementById("btn-exportar");
const btnImportar = document.getElementById("btn-importar");
const inputImportarCsv = document.getElementById("input-importar-csv");
const btnLimpiar = document.getElementById("btn-limpiar");

function fechaHoyISO() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
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

function claveMovimientosUsuario() {
  return `movimientos_${usuarioActivo}`;
}

function cargarMovimientos() {
  const crudos = JSON.parse(localStorage.getItem(claveMovimientosUsuario())) || [];
  movimientos = crudos.map((m) => ({
    id: m.id || Date.now() + Math.random(),
    fecha: m.fecha || fechaHoyISO(),
    tipo: m.tipo === "ingreso" ? "ingreso" : "gasto",
    categoria: m.categoria || "General",
    descripcion: m.descripcion || "",
    monto: Number(m.monto) || 0
  }));
}

function guardarMovimientos() {
  localStorage.setItem(claveMovimientosUsuario(), JSON.stringify(movimientos));
}

function cancelarEdicion() {
  idEditando = null;
  btnGuardarMov.textContent = "Agregar";
  btnCancelarEdicion.classList.add("oculto");
  form.reset();
  inputFecha.value = fechaHoyISO();
}

function actualizarVistaSesion() {
  if (usuarioActivo) {
    vistaLogin.classList.add("oculto");
    vistaApp.classList.remove("oculto");
    spanUsuarioActual.textContent = usuarioActivo;
    inputFecha.value = fechaHoyISO();
    cargarMovimientos();
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
});

formAuth.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("auth-usuario").value.trim().toLowerCase();
  const clave = document.getElementById("auth-clave").value;

  if (!/^[a-z0-9._-]{3,20}$/.test(usuario)) {
    mensajeAuth.textContent = "El usuario debe tener entre 3 y 20 caracteres sin espacios.";
    return;
  }

  if (clave.length < 4) {
    mensajeAuth.textContent = "La contraseña debe tener al menos 4 caracteres.";
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

function renderizar() {
  actualizarFiltroCategorias();

  const tipoSel = filtroTipo.value;
  const catSel = filtroCategoria.value;
  const consulta = buscarTexto.value.trim().toLowerCase();

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

  const visibles = movimientos.filter((m) => {
    const coincideTipo = tipoSel === "todos" || m.tipo === tipoSel;
    const coincideCat = catSel === "todas" || m.categoria === catSel;
    const coincideTexto =
      !consulta ||
      m.descripcion.toLowerCase().includes(consulta) ||
      m.categoria.toLowerCase().includes(consulta);
    return coincideTipo && coincideCat && coincideTexto;
  });

  renderizarResumenCategorias(visibles);
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
    movimientos.unshift({
      id: Date.now(),
      fecha,
      tipo,
      categoria,
      descripcion,
      monto
    });
    form.reset();
    inputFecha.value = fechaHoyISO();
  }

  guardarMovimientos();
  renderizar();
});

filtroTipo.addEventListener("change", renderizar);
filtroCategoria.addEventListener("change", renderizar);
buscarTexto.addEventListener("input", renderizar);

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
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `movimientos_${usuarioActivo}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
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

      // Soporta tanto el formato con Fecha (6 columnas) como el anterior sin Fecha (5 columnas)
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

btnLimpiar.addEventListener("click", () => {
  if (movimientos.length === 0) return;
  if (!confirm("¿Seguro que quieres borrar todos los movimientos de este usuario?")) return;
  cancelarEdicion();
  movimientos = [];
  guardarMovimientos();
  renderizar();
});

actualizarVistaSesion();