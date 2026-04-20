import Papa from 'papaparse'

export interface FilaBondarea {
  orden_bondarea: string
  cliente: string
  codigo_tela: string
  tipo: string
  medida: string | null
  cantidad: number
  notas: string | null
  // validation state (populated by parsearCSVBondarea)
  _valida: boolean
  _errores: string[]
}

export interface ResultadoParseoBondarea {
  filas: FilaBondarea[]
  filasValidas: FilaBondarea[]
  filasInvalidas: FilaBondarea[]
  totalFilas: number
}

const TIPOS_VALIDOS = ['matera', 'porta_anteojos', 'cubre_bidon', 'alfombra_vinilica']

function normalizarTipo(valor: string): string {
  const mapa: Record<string, string> = {
    matera: 'matera',
    'porta anteojos': 'porta_anteojos',
    porta_anteojos: 'porta_anteojos',
    'portaanteojos': 'porta_anteojos',
    'cubre bidon': 'cubre_bidon',
    'cubre bidón': 'cubre_bidon',
    cubre_bidon: 'cubre_bidon',
    'alfombra vinilica': 'alfombra_vinilica',
    'alfombra vinílica': 'alfombra_vinilica',
    alfombra_vinilica: 'alfombra_vinilica',
  }
  return mapa[valor.toLowerCase().trim()] ?? valor.toLowerCase().trim()
}

function validarFila(raw: Record<string, string>): FilaBondarea {
  const errores: string[] = []

  const orden_bondarea = (raw['orden_bondarea'] ?? raw['orden'] ?? '').trim()
  const cliente = (raw['cliente'] ?? '').trim()
  const codigo_tela = (raw['codigo_tela'] ?? raw['codigo'] ?? '').trim()
  const tipoRaw = (raw['tipo'] ?? '').trim()
  const tipo = normalizarTipo(tipoRaw)
  const medidaRaw = (raw['medida'] ?? '').trim()
  const medida = medidaRaw || null
  const cantidadRaw = (raw['cantidad'] ?? '').trim()
  const cantidad = parseInt(cantidadRaw, 10)
  const notas = (raw['notas'] ?? '').trim() || null

  if (!orden_bondarea) errores.push('Número de orden vacío')
  if (!cliente) errores.push('Cliente vacío')
  if (!codigo_tela) errores.push('Código de tela vacío')
  if (!tipoRaw) {
    errores.push('Tipo de producto vacío')
  } else if (!TIPOS_VALIDOS.includes(tipo)) {
    errores.push(`Tipo "${tipoRaw}" no reconocido`)
  }
  if (isNaN(cantidad) || cantidad < 0) {
    errores.push('Cantidad inválida')
  }
  if (tipo === 'alfombra_vinilica' && !medida) {
    errores.push('La alfombra vinílica requiere medida')
  }

  return {
    orden_bondarea,
    cliente,
    codigo_tela,
    tipo,
    medida,
    cantidad: isNaN(cantidad) ? 0 : cantidad,
    notas,
    _valida: errores.length === 0,
    _errores: errores,
  }
}

export function parsearCSVBondarea(contenido: string): ResultadoParseoBondarea {
  const resultado = Papa.parse<Record<string, string>>(contenido, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim().replace(/\s+/g, '_'),
  })

  const filas: FilaBondarea[] = resultado.data.map(validarFila)
  const filasValidas = filas.filter((f) => f._valida)
  const filasInvalidas = filas.filter((f) => !f._valida)

  return {
    filas,
    filasValidas,
    filasInvalidas,
    totalFilas: filas.length,
  }
}

export function parsearCSVBondareaDesdeArchivo(
  archivo: File
): Promise<ResultadoParseoBondarea> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(archivo, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (results) => {
        const filas: FilaBondarea[] = results.data.map(validarFila)
        const filasValidas = filas.filter((f) => f._valida)
        const filasInvalidas = filas.filter((f) => !f._valida)
        resolve({
          filas,
          filasValidas,
          filasInvalidas,
          totalFilas: filas.length,
        })
      },
      error: (error: Error) => {
        reject(new Error(`Error al parsear CSV: ${error.message}`))
      },
    })
  })
}
