// =====================================================
//  Disney API · Personajes de Mulan
//  Documentación: https://disneyapi.dev/docs/
// =====================================================

// 1) Dirección base de la API
const API_URL = "https://api.disneyapi.dev";

// 2) Referencias a elementos del HTML
const grilla = document.getElementById("grilla");
const estado = document.getElementById("estado");
const buscador = document.getElementById("buscador");
const botonesFiltro = document.querySelectorAll(".filtro");
const detalle = document.getElementById("detalle");
const detalleContenido = document.getElementById("detalle-contenido");
const botonCerrar = document.getElementById("cerrar");

// Las tres películas que nos interesan (con el nombre exacto que usa la API)
const PELICULAS = ["Mulan (1998 film)", "Mulan II", "Mulan (2020 film)"];

// Acá guardamos todos los personajes cuando llegan de la API
let personajes = [];
let filtroActual = "todas";

// Imagen de reemplazo si alguna foto no carga
const SIN_IMAGEN = "https://placehold.co/300x300/ffd6d1/c8102e?text=Sin+imagen";

// -----------------------------------------------------
// 3) Pedir los personajes a la API
//    GET /character?films=Mulan&pageSize=100
// -----------------------------------------------------
async function cargarPersonajes() {
  try {
    const respuesta = await fetch(`${API_URL}/character?films=Mulan&pageSize=100`);

    // Si el servidor responde con error (404, 500...), lo avisamos
    if (!respuesta.ok) {
      throw new Error(`La API respondió con estado ${respuesta.status}`);
    }

    const json = await respuesta.json();
    // La API devuelve { info: {...}, data: [ ...personajes ] }

    // La búsqueda "Mulan" trae también personajes de otras películas
    // (por ejemplo "Dragons"), así que nos quedamos solo con las 3 pelis.
    personajes = json.data.filter((p) =>
      p.films.some((film) => PELICULAS.includes(film))
    );

    mostrarPersonajes();
  } catch (error) {
    estado.textContent = "No se pudieron cargar los personajes 😢 " + error.message;
    console.error(error);
  }
}

// -----------------------------------------------------
// 4) Dibujar las tarjetas en pantalla
// -----------------------------------------------------
function mostrarPersonajes() {
  const texto = buscador.value.toLowerCase();

  // Aplicamos el filtro de película y el del buscador
  const visibles = personajes.filter((p) => {
    const coincidePeli = filtroActual === "todas" || p.films.includes(filtroActual);
    const coincideNombre = p.name.toLowerCase().includes(texto);
    return coincidePeli && coincideNombre;
  });

  grilla.innerHTML = ""; // limpiamos lo anterior

  if (visibles.length === 0) {
    estado.textContent = "No hay personajes que coincidan.";
    return;
  }
  estado.textContent = `${visibles.length} personajes encontrados`;

  visibles.forEach((personaje) => {
    const tarjeta = document.createElement("button");
    tarjeta.className = "tarjeta";

    // Etiquetas solo de las películas de Mulan donde aparece
    const etiquetas = personaje.films
      .filter((film) => PELICULAS.includes(film))
      .map((film) => `<span class="etiqueta">${nombreCorto(film)}</span>`)
      .join("");

    tarjeta.innerHTML = `
      <img src="${personaje.imageUrl || SIN_IMAGEN}" alt="${personaje.name}"
           loading="lazy" referrerpolicy="no-referrer">
      <div class="tarjeta__info">
        <h2 class="tarjeta__nombre">${personaje.name}</h2>
        <div class="etiquetas">${etiquetas}</div>
      </div>
    `;

    // Si la imagen falla, ponemos la de reemplazo
    tarjeta.querySelector("img").onerror = (e) => (e.target.src = SIN_IMAGEN);

    // Al hacer clic, pedimos el detalle de ESE personaje por su id
    tarjeta.addEventListener("click", () => verDetalle(personaje._id));

    grilla.appendChild(tarjeta);
  });
}

// -----------------------------------------------------
// 5) Segundo endpoint: un personaje por id
//    GET /character/:id
// -----------------------------------------------------
async function verDetalle(id) {
  detalleContenido.innerHTML = "<p>Cargando...</p>";
  detalle.showModal();

  try {
    const respuesta = await fetch(`${API_URL}/character/${id}`);
    const json = await respuesta.json();
    const p = json.data; // acá data es un solo objeto, no una lista

    detalleContenido.innerHTML = `
      <img src="${p.imageUrl || SIN_IMAGEN}" alt="${p.name}" referrerpolicy="no-referrer">
      <h2>${p.name}</h2>
      ${lista("Películas", p.films)}
      ${lista("Series", p.tvShows)}
      ${lista("Videojuegos", p.videoGames)}
      ${lista("Atracciones en parques", p.parkAttractions)}
    `;
  } catch (error) {
    detalleContenido.innerHTML = "<p>No se pudo cargar el detalle.</p>";
  }
}

// Arma una lista <ul> solo si el arreglo tiene elementos
function lista(titulo, items) {
  if (!items || items.length === 0) return "";
  return `<h3>${titulo}</h3><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

// "Mulan (1998 film)" -> "1998", etc.
function nombreCorto(film) {
  if (film === "Mulan II") return "Mulan II";
  return film.replace("Mulan (", "").replace(" film)", "");
}

// -----------------------------------------------------
// 6) Eventos
// -----------------------------------------------------
botonesFiltro.forEach((boton) => {
  boton.addEventListener("click", () => {
    botonesFiltro.forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");
    filtroActual = boton.dataset.film;
    mostrarPersonajes();
  });
});

buscador.addEventListener("input", mostrarPersonajes);
botonCerrar.addEventListener("click", () => detalle.close());

// ¡Arrancamos!
cargarPersonajes();
