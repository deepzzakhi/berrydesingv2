'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ArrowLeft, ArrowRight, Check, AlertCircle } from 'lucide-react'
import type { TipoProducto } from '@/types/producto'

const TIPO_OPTIONS = [
  { value: 'matera', label: 'Matera' },
  { value: 'porta_anteojos', label: 'Porta anteojos' },
  { value: 'cubre_bidon', label: 'Cubre bidón' },
  { value: 'alfombra_vinilica', label: 'Alfombra vinílica' },
]

export default function NuevoProductoPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [codigoTela, setCodigoTela] = useState('')
  const [tipo, setTipo] = useState<TipoProducto | ''>('')
  const [fotoUrl, setFotoUrl] = useState('')

  // Step 2
  const [medida, setMedida] = useState('')
  const [cantidad, setCantidad] = useState('0')
  const [observaciones, setObservaciones] = useState('')

  function validateStep1() {
    if (!codigoTela.trim()) return 'El código de tela es obligatorio'
    if (!tipo) return 'El tipo de producto es obligatorio'
    return null
  }

  function goToStep2() {
    const err = validateStep1()
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_tela: codigoTela.trim(),
          tipo,
          medida: medida.trim() || null,
          cantidad: parseInt(cantidad, 10) || 0,
          foto_url: fotoUrl.trim() || null,
          observaciones: observaciones.trim() || null,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        throw new Error(body.error ?? 'Error al crear el producto')
      }

      router.push('/inventario')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Nuevo producto" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-xl">
          {/* Back link */}
          <button
            onClick={() => (step === 1 ? router.back() : setStep(1))}
            className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={16} />
            {step === 1 ? 'Volver al inventario' : 'Volver al paso 1'}
          </button>

          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step >= 1 ? 'bg-[#853f9a] text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <div className="flex-1 h-0.5 bg-gray-200">
              <div
                className="h-full bg-[#853f9a] transition-all"
                style={{ width: step >= 2 ? '100%' : '0%' }}
              />
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step >= 2 ? 'bg-[#853f9a] text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Datos principales</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Información requerida del producto
                  </p>
                </div>

                <Input
                  label="Código de tela"
                  required
                  value={codigoTela}
                  onChange={(e) => setCodigoTela(e.target.value)}
                  placeholder="Ej: 27/0001"
                  helperText="Formato: NN/NNNN"
                />

                <Select
                  label="Tipo de producto"
                  required
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoProducto)}
                  options={TIPO_OPTIONS}
                  placeholder="Seleccioná un tipo"
                />

                <Input
                  label="URL de foto (opcional)"
                  type="url"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="https://..."
                />

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button className="w-full" onClick={goToStep2}>
                  Siguiente
                  <ArrowRight size={16} />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Datos adicionales</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Información opcional del producto
                  </p>
                </div>

                {tipo === 'alfombra_vinilica' && (
                  <Input
                    label="Medida"
                    value={medida}
                    onChange={(e) => setMedida(e.target.value)}
                    placeholder="Ej: 120x180cm"
                    helperText="Requerido para alfombras vinílicas"
                  />
                )}

                <Input
                  label="Cantidad inicial"
                  type="number"
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  helperText="Unidades disponibles al momento del ingreso"
                />

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    placeholder="Notas sobre la tela o el producto..."
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#853f9a] focus:border-transparent resize-none transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    Atrás
                  </Button>
                  <Button type="submit" className="flex-1" isLoading={isLoading}>
                    Crear producto
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
