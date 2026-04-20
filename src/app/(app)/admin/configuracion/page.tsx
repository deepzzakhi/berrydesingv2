'use client'

import { useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTiposProducto } from '@/hooks/useTiposProducto'
import { useEstadosProducto } from '@/hooks/useEstadosProducto'
import { Settings, Package, Tag, Plus, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'

export default function ConfiguracionPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Configuración del sistema" />
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <TiposProductoSection />
        <EstadosProductoSection />
      </div>
    </div>
  )
}

function TiposProductoSection() {
  const { tipos, isLoading, mutate } = useTiposProducto()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ codigo: '', nombre: '', requiere_medida: false, orden: 0 })
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/config/tipos-producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      await mutate()
      setShowForm(false)
      setForm({ codigo: '', nombre: '', requiere_medida: false, orden: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-[#853f9a]" />
          <h2 className="text-sm font-semibold text-gray-900">Tipos de producto</h2>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-[#853f9a]">
            {tipos.length}
          </span>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} />
          Nuevo tipo
        </Button>
      </div>

      {showForm && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código (ej: bolso)"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              placeholder="solo_minusculas"
            />
            <Input
              label="Nombre visible"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Bolso de tela"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requiere_medida}
                onChange={(e) => setForm({ ...form, requiere_medida: e.target.checked })}
                className="rounded border-gray-300 text-[#853f9a]"
              />
              Requiere medida
            </label>
            <Input
              label="Orden"
              type="number"
              value={String(form.orden)}
              onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} isLoading={saving}>
              <Check size={14} /> Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              <X size={14} /> Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <div className="animate-pulse space-y-2 p-4">
            {[1,2,3,4].map(i => <div key={i} className="h-10 rounded bg-gray-100" />)}
          </div>
        ) : tipos.map((tipo) => (
          <div key={tipo.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{tipo.nombre}</p>
              <p className="text-xs text-gray-400 font-mono">{tipo.codigo}</p>
            </div>
            <div className="flex items-center gap-3">
              {tipo.requiere_medida && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  requiere medida
                </span>
              )}
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                activo
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EstadosProductoSection() {
  const { estados, isLoading, mutate } = useEstadosProducto()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ codigo: '', nombre: '', color: '#6b7280', es_terminal: false, transiciones: '' })
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        transiciones: form.transiciones.split(',').map(s => s.trim()).filter(Boolean),
        badge_class: 'bg-gray-100 text-gray-600 border-gray-200',
        orden: estados.length + 1,
      }
      const res = await fetch('/api/config/estados-producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      await mutate()
      setShowForm(false)
      setForm({ codigo: '', nombre: '', color: '#6b7280', es_terminal: false, transiciones: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-[#853f9a]" />
          <h2 className="text-sm font-semibold text-gray-900">Estados de producto</h2>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-[#853f9a]">
            {estados.length}
          </span>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} />
          Nuevo estado
        </Button>
      </div>

      {showForm && (
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código (ej: danado)"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              placeholder="solo_minusculas"
            />
            <Input
              label="Nombre visible"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Dañado"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Color:</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.es_terminal}
                onChange={(e) => setForm({ ...form, es_terminal: e.target.checked })}
                className="rounded border-gray-300 text-[#853f9a]"
              />
              Estado terminal (sin más transiciones)
            </label>
          </div>
          <Input
            label="Transiciones permitidas (separadas por coma)"
            value={form.transiciones}
            onChange={(e) => setForm({ ...form, transiciones: e.target.value })}
            placeholder="ej: stock, descartado"
            helperText="Códigos de estados a los que puede pasar"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} isLoading={saving}>
              <Check size={14} /> Guardar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              <X size={14} /> Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {isLoading ? (
          <div className="animate-pulse space-y-2 p-4">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-gray-100" />)}
          </div>
        ) : estados.map((estado) => (
          <div key={estado.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: estado.color }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{estado.nombre}</p>
                <p className="text-xs text-gray-400 font-mono">{estado.codigo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {estado.transiciones.length > 0 && (
                <span className="text-xs text-gray-400">
                  → {estado.transiciones.join(', ')}
                </span>
              )}
              {estado.es_terminal && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  terminal
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
