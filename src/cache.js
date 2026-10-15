// (Bonus) Caché de búsquedas en localStorage.

const PREFIJO = 'museo-de-bolsillo:'
const CADUCIDAD = 24 * 60 * 60 * 1000 // 24 h en ms: la colección del museo cambia poco

// "Cat " y "cat" son la misma búsqueda
function clave(texto) {
  return PREFIJO + texto.trim().toLowerCase()
}

// Devuelve las obras guardadas o null si no hay, han caducado o están corruptas
export function leerCache(texto) {
  try {
    const guardado = localStorage.getItem(clave(texto))
    if (guardado === null) return null

    const { fecha, obras } = JSON.parse(guardado)
    const caducado = typeof fecha !== 'number' || Date.now() - fecha > CADUCIDAD

    if (caducado || !Array.isArray(obras)) {
      localStorage.removeItem(clave(texto))
      return null
    }
    return obras
  } catch {
    // JSON roto o localStorage bloqueado (modo privado, permisos): sin caché, sin romper la app
    return null
  }
}

export function guardarCache(texto, obras) {
  try {
    localStorage.setItem(clave(texto), JSON.stringify({ fecha: Date.now(), obras }))
  } catch {
    // Sin espacio o localStorage bloqueado: la caché es opcional, seguimos sin ella
  }
}
