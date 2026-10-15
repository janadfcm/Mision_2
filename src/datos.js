// Lógica pura sobre los datos (map, filter, reduce). Sin fetch y sin DOM.

// Si no hay coincidencias, la API no devuelve 0 resultados: rellena con obras
// al azar con un _score de ~0,00002. Las coincidencias reales tienen >= 2.
const UMBRAL_RELEVANCIA = 1

const SIN_TITULO = 'Sin título'
const ARTISTA_DESCONOCIDO = 'Artista desconocido'
const SIN_FECHA = 'Fecha desconocida'
const SIN_ORIGEN = 'Origen desconocido'

// Convierte un texto que puede venir null, vacío o con espacios en un valor seguro
function textoONulo(valor) {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null
}

// De la obra tal como llega de la API a la forma que usa la app
export function normalizarObra(obra) {
  const anio = Number.isFinite(obra.date_start) ? obra.date_start : null

  return {
    id: obra.id,
    titulo: textoONulo(obra.title) ?? SIN_TITULO,
    artista: textoONulo(obra.artist_title) ?? ARTISTA_DESCONOCIDO,
    fecha: textoONulo(obra.date_display) ?? SIN_FECHA,
    anio,
    siglo: calcularSiglo(anio),
    origen: textoONulo(obra.place_of_origin) ?? SIN_ORIGEN,
    imageId: textoONulo(obra.image_id),
  }
}

// Descarta el relleno de la API y normaliza lo que queda
export function prepararObras(obrasApi) {
  return obrasApi
    .filter((obra) => obra._score >= UMBRAL_RELEVANCIA)
    .map(normalizarObra)
}

// Siglo como número: 1889 → 19, -664 → -7 (a. C.), null → null.
// El año 0 no existe en el calendario; si llega, lo tratamos como siglo I.
export function calcularSiglo(anio) {
  if (anio === null) return null
  if (anio > 0) return Math.ceil(anio / 100)
  if (anio < 0) return -Math.ceil(-anio / 100)
  return 1
}

const ROMANOS = [
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

function aRomano(numero) {
  return ROMANOS.reduce((resultado, [valor, letras]) => {
    const veces = Math.floor(numero / valor)
    numero -= veces * valor
    return resultado + letras.repeat(veces)
  }, '')
}

// 19 → "s. XIX", -7 → "s. VII a. C.", null → "Fecha desconocida"
export function nombreSiglo(siglo) {
  if (siglo === null) return SIN_FECHA
  const romano = aRomano(Math.abs(siglo))
  return siglo < 0 ? `s. ${romano} a. C.` : `s. ${romano}`
}

// filtros: { soloConImagen: boolean, siglo: number | null, origen: string | null }
export function filtrarObras(obras, filtros) {
  return obras
    .filter((obra) => !filtros.soloConImagen || obra.imageId !== null)
    .filter((obra) => filtros.siglo === null || obra.siglo === filtros.siglo)
    .filter((obra) => filtros.origen === null || obra.origen === filtros.origen)
}

// Valores distintos para rellenar los desplegables de filtros
export function opcionesDeFiltro(obras) {
  const siglos = [...new Set(obras.map((obra) => obra.siglo))]
    .filter((siglo) => siglo !== null)
    .sort((a, b) => a - b)

  const origenes = [...new Set(obras.map((obra) => obra.origen))]
    .filter((origen) => origen !== SIN_ORIGEN)
    .sort((a, b) => a.localeCompare(b))

  return { siglos, origenes }
}

export function calcularEstadisticas(obras) {
  if (obras.length === 0) return null

  const conImagen = obras.filter((obra) => obra.imageId !== null).length

  // [{ siglo: "s. XIX", cantidad: 4 }, ...] en orden cronológico; sin fecha, al final
  const cuentaPorSiglo = obras.reduce(
    (mapa, obra) => mapa.set(obra.siglo, (mapa.get(obra.siglo) ?? 0) + 1),
    new Map(),
  )
  const porSiglo = [...cuentaPorSiglo]
    .sort(([a], [b]) => (a ?? Infinity) - (b ?? Infinity))
    .map(([siglo, cantidad]) => ({ siglo: nombreSiglo(siglo), cantidad }))

  const porArtista = obras
    .filter((obra) => obra.artista !== ARTISTA_DESCONOCIDO)
    .reduce((cuenta, obra) => {
      cuenta[obra.artista] = (cuenta[obra.artista] ?? 0) + 1
      return cuenta
    }, {})

  // [nombre, veces] con más obras; null si ninguna tiene artista conocido
  const artistaTop = Object.entries(porArtista).reduce(
    (mejor, actual) => (mejor === null || actual[1] > mejor[1] ? actual : mejor),
    null,
  )

  const masAntigua = obras
    .filter((obra) => obra.anio !== null)
    .reduce((antigua, obra) => (antigua === null || obra.anio < antigua.anio ? obra : antigua), null)

  return { total: obras.length, conImagen, porSiglo, artistaTop, masAntigua }
}
