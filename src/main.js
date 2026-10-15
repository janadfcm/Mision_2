// Punto de entrada: escucha los eventos y coordina api → datos → render (cargando, error, vacío, resultados).
import './style.css'
import { buscarObras } from './api.js'
import { prepararObras, filtrarObras, opcionesDeFiltro, calcularEstadisticas } from './datos.js'
import {
  pintarCargando,
  pintarError,
  pintarVacio,
  limpiar,
  pintarObras,
  pintarEstadisticas,
  pintarOpcionesFiltro,
} from './render.js'

const formulario = document.querySelector('#buscador')
const campoBusqueda = document.querySelector('#busqueda')
const seccionFiltros = document.querySelector('#filtros')
const filtroImagen = document.querySelector('#filtro-imagen')
const filtroSiglo = document.querySelector('#filtro-siglo')
const filtroOrigen = document.querySelector('#filtro-origen')
const seccionEstado = document.querySelector('#estado')
const seccionEstadisticas = document.querySelector('#estadisticas')
const seccionResultados = document.querySelector('#resultados')

// Obras de la última búsqueda, ya preparadas; los filtros trabajan sobre ellas sin volver a pedirlas
let obrasActuales = []

// Si el usuario lanza una búsqueda antes de que termine la anterior, la respuesta
// vieja puede llegar después que la nueva. Numeramos las búsquedas e ignoramos las antiguas.
let ultimaBusqueda = 0

async function buscar(texto) {
  const tema = texto.trim()
  if (tema === '') {
    pintarVacio(seccionEstado, 'Escribe un tema para empezar (por ejemplo, «cat»).')
    return
  }

  const numero = ++ultimaBusqueda
  seccionFiltros.hidden = true
  limpiar(seccionEstadisticas, seccionResultados)
  pintarCargando(seccionEstado, tema)

  let obras
  try {
    obras = prepararObras(await buscarObras(tema))
  } catch (error) {
    if (numero !== ultimaBusqueda) return
    pintarError(seccionEstado, error.message, () => buscar(tema))
    return
  }
  if (numero !== ultimaBusqueda) return

  if (obras.length === 0) {
    pintarVacio(seccionEstado, `No hay obras sobre «${tema}». Prueba con otra palabra en inglés.`)
    return
  }

  obrasActuales = obras
  filtroImagen.checked = false
  pintarOpcionesFiltro(filtroSiglo, filtroOrigen, opcionesDeFiltro(obrasActuales))
  seccionFiltros.hidden = false
  mostrar()
}

function leerFiltros() {
  return {
    soloConImagen: filtroImagen.checked,
    // El value de un <select> es siempre un string: "" significa "Todos"
    siglo: filtroSiglo.value === '' ? null : Number(filtroSiglo.value),
    origen: filtroOrigen.value === '' ? null : filtroOrigen.value,
  }
}

// Pinta las obras actuales aplicando los filtros (sin nueva petición a la API)
function mostrar() {
  const visibles = filtrarObras(obrasActuales, leerFiltros())

  if (visibles.length === 0) {
    pintarVacio(seccionEstado, 'Ninguna obra cumple estos filtros.')
    limpiar(seccionResultados)
  } else {
    limpiar(seccionEstado)
    pintarObras(seccionResultados, visibles, obrasActuales.length)
  }
  pintarEstadisticas(seccionEstadisticas, calcularEstadisticas(visibles))
}

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault() // sin esto, el formulario recarga la página
  buscar(campoBusqueda.value)
})

// Delegación: un solo listener en la sección para los tres filtros
seccionFiltros.addEventListener('change', mostrar)
