'use client'

import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import type { Cliente } from '@/types/producto'
import { Users, UserPlus, Search, Edit, Trash2, X, Check, Phone, MapPin, Mail, FileText, RefreshCw } from 'lucide-react'

const EMPTY_FORM = {
  nombre: '', apellido: '', telefono: '', direccion: '', email: '', dni: '', notas: '',
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState<Cliente | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchClientes = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.set('busqueda', busqueda)
      const res = await fetch(`/api/clientes?${params}`)
      const json = await res.json()
      setClientes(json.data ?? [])
      setTotal(json.total ?? 0)
    } finally {
      setIsLoading(false)
    }
  }, [busqueda])

  useEffect(() => {
    const t = setTimeout(fetchClientes, 300)
    return () => clearTimeout(t)
  }, [fetchClientes])

  function abrirNuevo() {
    setEditingCliente(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function abrirEditar(cliente: Cliente) {
    setEditingCliente(cliente)
    setForm({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono ?? '',
      direccion: cliente.direccion ?? '',
      email: cliente.email ?? '',
      dni: cliente.dni ?? '',
      notas: cliente.notas ?? '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes'
      const method = editingCliente ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setFormError(json.error ?? 'Error al guardar'); return }
      setModalOpen(false)
      fetchClientes()
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await fetch(`/api/clientes/${confirmDelete.id}`, { method: 'DELETE' })
      setConfirmDelete(null)
      fetchClientes()
    } finally {
      setDeleting(false)
    }
  }

  function campo(key: keyof typeof EMPTY_FORM, label: string, props?: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <input
          {...props}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919]"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Clientes" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono..."
              className="w-full h-9 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={fetchClientes}><RefreshCw size={14} /></Button>
            <Button size="sm" onClick={abrirNuevo}><UserPlus size={14} /> Nuevo cliente</Button>
          </div>
        </div>

        <p className="text-sm text-gray-500">{isLoading ? 'Cargando...' : `${total} cliente${total !== 1 ? 's' : ''}`}</p>

        {/* Tabla */}
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-200" />)}
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={40} className="text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No hay clientes</p>
            <p className="text-xs text-gray-400 mt-1">Los clientes se crean al confirmar una compra o manualmente.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Cliente', 'Contacto', 'Dirección', 'DNI', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{c.nombre} {c.apellido}</p>
                      {c.notas && <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.notas}</p>}
                    </td>
                    <td className="px-4 py-3 space-y-0.5">
                      {c.telefono && (
                        <p className="text-xs text-gray-600 flex items-center gap-1"><Phone size={11} className="text-gray-400" />{c.telefono}</p>
                      )}
                      {c.email && (
                        <p className="text-xs text-gray-600 flex items-center gap-1"><Mail size={11} className="text-gray-400" />{c.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.direccion ? (
                        <p className="text-xs text-gray-600 flex items-center gap-1 max-w-[200px]">
                          <MapPin size={11} className="text-gray-400 shrink-0" />{c.direccion}
                        </p>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.dni ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" onClick={() => abrirEditar(c)} title="Editar">
                          <Edit size={14} />
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => setConfirmDelete(c)} title="Eliminar"
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                {editingCliente ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-3 px-6 py-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {campo('nombre', 'Nombre *', { required: true, placeholder: 'María' })}
                {campo('apellido', 'Apellido *', { required: true, placeholder: 'García' })}
              </div>
              {campo('telefono', 'Teléfono', { type: 'tel', placeholder: '+54 9 11 1234-5678' })}
              {campo('email', 'Email', { type: 'email', placeholder: 'mail@ejemplo.com' })}
              {campo('direccion', 'Dirección', { placeholder: 'Av. Corrientes 1234, CABA' })}
              {campo('dni', 'DNI', { placeholder: '12.345.678' })}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700 flex items-center gap-1"><FileText size={11} /> Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                  rows={2}
                  maxLength={500}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#851919]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" isLoading={saving}>
                  <Check size={14} /> {editingCliente ? 'Guardar cambios' : 'Crear cliente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Eliminar cliente</h3>
            <p className="text-sm text-gray-600">
              ¿Seguro que querés eliminar a <strong>{confirmDelete.nombre} {confirmDelete.apellido}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1" isLoading={deleting} onClick={handleEliminar}>
                <Trash2 size={14} /> Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
