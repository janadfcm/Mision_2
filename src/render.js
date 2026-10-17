// Solo pinta en el DOM: createElement + textContent, nunca innerHTML con datos de la API.

import { urlImagen } from './api.js'
import { nombreSiglo } from './datos.js'

const URL_FICHA = 'https://www.artic.edu/artworks'

// Atajo para crear un elemento con clase y texto; el texto siempre va por textContent
function crear(etiqueta, { clase, texto } = {}) {
  const elemento = document.createElement(etiqueta)
  if (clase) elemento.className = clase
  if (texto !== undefined) elemento.textContent = texto
  return elemento
}

// ---------- Estados: cargando, error, sin resultados ----------

export function pintarCargando(contenedor, texto) {
  const parrafo = crear('p', { clase: 'cargando', texto: `Buscando «${texto}» en el museo…` })
  contenedor.replaceChildren(parrafo)
}

export function pintarError(contenedor, mensaje, alReintentar) {
  const parrafo = crear('p', { clase: 'error', texto: mensaje })
  const boton = crear('button', { texto: 'Reintentar' })
  boton.type = 'button'
  boton.addEventListener('click', alReintentar)
  contenedor.replaceChildren(parrafo, boton)
}

export function pintarVacio(contenedor, mensaje) {
  contenedor.replaceChildren(crear('p', { clase: 'vacio', texto: mensaje }))
}

export function limpiar(...contenedores) {
  contenedores.forEach((contenedor) => contenedor.replaceChildren())
}

// ---------- Tarjetas de obras ----------

// Hueco en lugar de la imagen: la obra no tiene, o no ha cargado.
// Si hay miniatura (lqip), se ve ampliada y difuminada detrás del aviso.
function crearSinImagen(obra) {
  if (obra.miniatura === null) {
    return crear('div', { clase: 'sin-imagen', texto: 'Sin imagen' })
  }

  const hueco = crear('div', { clase: 'sin-imagen con-miniatura' })
  const miniatura = crear('img', { clase: 'miniatura' })
  miniatura.src = obra.miniatura
  miniatura.alt = '' // decorativa: el aviso de texto ya lo explica
  hueco.append(miniatura, crear('span', { texto: 'Imagen no disponible' }))
  return hueco
}

function crearImagen(obra) {
  if (obra.imageId === null) return crearSinImagen(obra)

  const imagen = crear('img')
  imagen.src = urlImagen(obra.imageId)
  imagen.alt = `${obra.titulo}, de ${obra.artista}`
  imagen.loading = 'lazy' // solo se descarga al acercarse a la pantalla
  // Si el servidor de imágenes falla, cambiamos la imagen rota por el hueco
  imagen.addEventListener('error', () => imagen.replaceWith(crearSinImagen(obra)), { once: true })
  return imagen
}

function crearTarjeta(obra) {
  const tarjeta = crear('article', { clase: 'obra' })

  const enlace = crear('a', { texto: obra.titulo })
  enlace.href = `${URL_FICHA}/${obra.id}`
  enlace.target = '_blank'
  enlace.rel = 'noopener noreferrer'

  const titulo = crear('h3')
  titulo.append(enlace)

  tarjeta.append(
    crearImagen(obra),
    titulo,
    crear('p', { clase: 'artista', texto: obra.artista }),
    crear('p', { clase: 'detalle', texto: `${obra.fecha} · ${obra.origen}` }),
  )
  return tarjeta
}

export function pintarObras(contenedor, obras, totalSinFiltrar, desdeCache = false) {
  const resumen = crear('p', {
    clase: 'resumen',
    texto: `Mostrando ${obras.length} de ${totalSinFiltrar} obras${desdeCache ? ' · desde la caché' : ''}`,
  })
  const rejilla = crear('div', { clase: 'rejilla' })
  rejilla.append(...obras.map(crearTarjeta))
  contenedor.replaceChildren(resumen, rejilla)
}

// ---------- Estadísticas ----------

function crearDato(etiqueta, valor) {
  const fila = crear('li')
  fila.append(crear('strong', { texto: `${etiqueta}: ` }), valor)
  return fila
}

function crearBarrasPorSiglo(porSiglo) {
  const maximo = Math.max(...porSiglo.map(({ cantidad }) => cantidad))
  const lista = crear('ul', { clase: 'barras' })

  lista.append(
    ...porSiglo.map(({ siglo, cantidad }) => {
      const fila = crear('li')
      const barra = crear('span', { clase: 'barra' })
      barra.style.width = `${(cantidad / maximo) * 100}%`
      fila.append(crear('span', { clase: 'etiqueta', texto: siglo }), barra, crear('span', { texto: cantidad }))
      return fila
    }),
  )
  return lista
}

export function pintarEstadisticas(contenedor, estadisticas) {
  if (estadisticas === null) {
    contenedor.replaceChildren()
    return
  }

  const { total, conImagen, porSiglo, artistaTop, masAntigua } = estadisticas

  const datos = crear('ul', { clase: 'datos' })
  datos.append(
    crearDato('Obras', `${total} (${conImagen} con imagen)`),
    crearDato(
      'Artista más repetido',
      artistaTop ? `${artistaTop[0]} (${artistaTop[1]})` : 'Ninguno identificado',
    ),
    crearDato(
      'Obra más antigua',
      masAntigua ? `${masAntigua.titulo} (${masAntigua.fecha})` : 'Sin fechas conocidas',
    ),
  )

  contenedor.replaceChildren(
    crear('h2', { texto: 'Tu sala en cifras' }),
    datos,
    crear('h3', { texto: 'Obras por siglo' }),
    crearBarrasPorSiglo(porSiglo),
  )
}

// ---------- Opciones de los filtros ----------

function crearOpcion(valor, texto) {
  const opcion = crear('option', { texto })
  opcion.value = valor
  return opcion
}

export function pintarOpcionesFiltro(selectSiglo, selectOrigen, { siglos, origenes }) {
  selectSiglo.replaceChildren(
    crearOpcion('', 'Todos'),
    ...siglos.map((siglo) => crearOpcion(String(siglo), nombreSiglo(siglo))),
  )
  selectOrigen.replaceChildren(
    crearOpcion('', 'Todos'),
    ...origenes.map((origen) => crearOpcion(origen, origen)),
  )
}
