'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { parsearCSVBondareaDesdeArchivo, type FilaBondarea } from '@/lib/bondarea/parser'
import { cn } from '@/lib/utils'

export function ImportadorCSV() {
  const [isDragging, setIsDragging] = useState(false)
  const [filas, setFilas] = useState<FilaBondarea[]>([])
  const [archivo, setArchivo] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [resultadoImportacion, setResultadoImportacion] = useState<{
    importados: number
    errores: number
  } | null>(null)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const procesarArchivo = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorGlobal('Solo se aceptan archivos CSV')
      return
    }

    setIsParsing(true)
    setErrorGlobal(null)
    setResultadoImportacion(null)
    setArchivo(file)

    try {
      const resultado = await parsearCSVBondareaDesdeArchivo(file)
      setFilas(resultado.filas)
    } catch (err) {
      setErrorGlobal(err instanceof Error ? err.message : 'Error al procesar el archivo')
    } finally {
      setIsParsing(false)
    }
  }, [])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) procesarArchivo(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
  }

  function limpiar() {
    setFilas([])
    setArchivo(null)
    setResultadoImportacion(null)
    setErrorGlobal(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function confirmarImportacion() {
    const filasValidas = filas.filter((f) => f._valida)
    if (filasValidas.length === 0) {
      setErrorGlobal('No hay filas válidas para importar')
      return
    }

    setIsLoading(true)
    setErrorGlobal(null)

    try {
      const res = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filas: filasValidas }),
      })

      const body = await res.json()

      if (!res.ok) {
        throw new Error(body.error ?? 'Error al importar')
      }

      setResultadoImportacion({
        importados: body.importados ?? filasValidas.length,
        errores: body.errores ?? 0,
      })
      setFilas([])
      setArchivo(null)
    } catch (err) {
      setErrorGlobal(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setIsLoading(false)
    }
  }

  const filasValidas = filas.filter((f) => f._valida)
  const filasInvalidas = filas.filter((f) => !f._valida)

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {filas.length === 0 && !resultadoImportacion && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-[#853f9a] bg-purple-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          )}
        >
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full transition-colors',
              isDragging ? 'bg-purple-100' : 'bg-gray-200'
            )}
          >
            <Upload
              size={28}
              className={isDragging ? 'text-[#853f9a]' : 'text-gray-400'}
            />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">
              {isParsing ? 'Procesando...' : 'Arrastrá tu archivo CSV aquí'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              o hacé clic para seleccionar un archivo
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Columnas esperadas: orden_bondarea, cliente, codigo_tela, tipo, medida, cantidad, notas
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Resultado de importación */}
      {resultadoImportacion && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle size={40} className="mx-auto text-green-600" />
          <p className="mt-3 text-lg font-semibold text-green-800">
            Importación completada
          </p>
          <p className="mt-1 text-sm text-green-700">
            {resultadoImportacion.importados} reservas importadas correctamente
            {resultadoImportacion.errores > 0 &&
              ` · ${resultadoImportacion.errores} con errores`}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={limpiar}
          >
            Importar otro archivo
          </Button>
        </div>
      )}

      {/* Error global */}
      {errorGlobal && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{errorGlobal}</p>
          <button
            onClick={() => setErrorGlobal(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Preview table */}
      {filas.length > 0 && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                <span className="font-semibold">{archivo?.name}</span>
                {' · '}{filas.length} filas
                {' · '}<span className="text-green-700 font-semibold">{filasValidas.length} válidas</span>
                {filasInvalidas.length > 0 && (
                  <> · <span className="text-red-700 font-semibold">{filasInvalidas.length} con errores</span></>
                )}
              </span>
            </div>
            <button
              onClick={limpiar}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <X size={12} />
              Descartar
            </button>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">#</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Orden</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Cliente</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Código tela</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Tipo</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Medida</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase text-gray-500">Cantidad</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filas.map((fila, idx) => (
                    <tr
                      key={idx}
                      className={fila._valida ? 'bg-white' : 'bg-red-50'}
                    >
                      <td className="px-3 py-2 text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{fila.orden_bondarea || '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{fila.cliente || '-'}</td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">{fila.codigo_tela || '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{fila.tipo || '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{fila.medida || '-'}</td>
                      <td className="px-3 py-2 text-center text-xs text-gray-700">{fila.cantidad}</td>
                      <td className="px-3 py-2">
                        {fila._valida ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            <CheckCircle size={10} />
                            OK
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 cursor-help"
                            title={fila._errores.join(', ')}
                          >
                            <AlertCircle size={10} />
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error details */}
          {filasInvalidas.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Filas con errores ({filasInvalidas.length})
              </p>
              <ul className="space-y-1">
                {filasInvalidas.map((fila, idx) => (
                  <li key={idx} className="text-xs text-red-700">
                    Fila {filas.indexOf(fila) + 1}: {fila._errores.join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Se importarán <span className="font-semibold text-gray-800">{filasValidas.length}</span> reservas
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={limpiar} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={confirmarImportacion}
                isLoading={isLoading}
                disabled={filasValidas.length === 0}
              >
                Confirmar importación ({filasValidas.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
