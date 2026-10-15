// Solo habla con la API del Art Institute of Chicago: fetch, response.ok y errores. Nada de DOM.

const URL_BASE = 'https://api.artic.edu/api/v1/artworks/search'
const URL_IIIF = 'https://www.artic.edu/iiif/2'

// Pedimos solo los campos que vamos a usar: la respuesta es mucho más ligera
const CAMPOS = [
  'id',
  'title',
  'artist_title',
  'date_start',
  'date_display',
  'place_of_origin',
  'image_id',
]

const POR_PAGINA = 30 // la API rechaza límites altos (con 1000 da 403)
const TIEMPO_MAXIMO = 10000 // ms; si la API no responde, abortamos

export async function buscarObras(texto) {
  const parametros = new URLSearchParams({
    q: texto,
    limit: POR_PAGINA,
    fields: CAMPOS.join(','),
  })

  let respuesta
  try {
    respuesta = await fetch(`${URL_BASE}?${parametros}`, {
      signal: AbortSignal.timeout(TIEMPO_MAXIMO),
    })
  } catch (error) {
    // fetch solo lanza si no llega a haber respuesta: sin red, CORS o tiempo agotado
    if (error.name === 'TimeoutError') {
      throw new Error('El museo tarda demasiado en responder. Inténtalo de nuevo.')
    }
    throw new Error('No se ha podido conectar con el museo. Revisa tu conexión.')
  }

  // Un 404 o un 500 NO hacen saltar el catch: hay que comprobarlo a mano
  if (!respuesta.ok) {
    throw new Error(`El museo ha respondido con un error (${respuesta.status}).`)
  }

  let json
  try {
    json = await respuesta.json()
  } catch {
    // Un 200 que no es JSON (p. ej., una página HTML de error)
    throw new Error('El museo ha devuelto datos con un formato inesperado.')
  }

  if (!Array.isArray(json?.data)) {
    throw new Error('El museo ha devuelto datos con un formato inesperado.')
  }

  return json.data
}

export function urlImagen(imageId, ancho = 843) {
  if (!imageId) return null
  return `${URL_IIIF}/${imageId}/full/${ancho},/0/default.jpg`
}
