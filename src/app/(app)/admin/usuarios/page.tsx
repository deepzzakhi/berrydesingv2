'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { Usuario, RolUsuario } from '@/types/producto'
import { formatDate } from '@/lib/utils'
import { Users, RefreshCw, ShieldCheck, Edit, AlertCircle, CheckCircle } from 'lucide-react'

const ROL_LABELS: Record<RolUsuario, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  consulta: 'Solo lectura',
}

const ROL_BADGE_CLASS: Record<RolUsuario, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  operador: 'bg-blue-100 text-blue-800 border-blue-200',
  consulta: 'bg-gray-100 text-gray-600 border-gray-200',
}

interface EditForm {
  nombre: string
  email: string
  password: string
  confirmPassword: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [form, setForm] = useState<EditForm>({ nombre: '', email: '', password: '', confirmPassword: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [isSavingForm, setIsSavingForm] = useState(false)

  async function fetchUsuarios() {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dbErr } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: true })

      if (dbErr) throw dbErr
      setUsuarios(data ?? [])
    } catch {
      setError('No se pudieron cargar los usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [])

  async function updateRolActivo(id: string, updates: Partial<Pick<Usuario, 'rol' | 'activo'>>) {
    setSavingId(id)
    try {
      const supabase = createClient()
      const { error: dbErr } = await supabase
        .from('usuarios')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (dbErr) throw dbErr
      setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)))
    } catch {
      alert('Error al actualizar el usuario')
    } finally {
      setSavingId(null)
    }
  }

  function openEditModal(usuario: Usuario) {
    setEditingUser(usuario)
    setForm({ nombre: usuario.nombre ?? '', email: usuario.email, password: '', confirmPassword: '' })
    setFormError(null)
    setFormSuccess(false)
  }

  async function handleSaveForm(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (form.password && form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.password && form.password !== form.confirmPassword) {
      setFormError('Las contraseñas no coinciden.')
      return
    }

    const body: Record<string, string> = {}
    if (form.nombre !== (editingUser?.nombre ?? '')) body.nombre = form.nombre
    if (form.email !== editingUser?.email) body.email = form.email
    if (form.password) body.password = form.password

    if (Object.keys(body).length === 0) {
      setFormError('No hay cambios para guardar.')
      return
    }

    setIsSavingForm(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${editingUser!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json.error ?? 'Error al guardar')
        return
      }
      setFormSuccess(true)
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editingUser!.id
            ? { ...u, nombre: form.nombre, email: form.email }
            : u
        )
      )
      setTimeout(() => setEditingUser(null), 1500)
    } catch {
      setFormError('Error inesperado. Intentá de nuevo.')
    } finally {
      setIsSavingForm(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Administración de usuarios" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#851919]" />
            <h2 className="text-sm font-medium text-gray-700">
              Gestión de accesos al sistema
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsuarios}>
            <RefreshCw size={14} />
            Actualizar
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">Sin usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Rol</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Registrado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{usuario.nombre ?? 'Sin nombre'}</p>
                        <p className="text-xs text-gray-500">{usuario.email}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={usuario.rol}
                        onChange={(e) => updateRolActivo(usuario.id, { rol: e.target.value as RolUsuario })}
                        disabled={savingId === usuario.id}
                        className="h-8 rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919]"
                      >
                        <option value="admin">Administrador</option>
                        <option value="operador">Operador</option>
                        <option value="consulta">Solo lectura</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => updateRolActivo(usuario.id, { activo: !usuario.activo })}
                        disabled={savingId === usuario.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          usuario.activo
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${usuario.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(usuario.created_at)}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEditModal(usuario)}
                          title="Editar usuario"
                        >
                          <Edit size={14} />
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

      {/* Modal de edición */}
      <Modal
        open={!!editingUser}
        onOpenChange={(open) => { if (!open) setEditingUser(null) }}
        title="Editar usuario"
        description={editingUser?.email}
        size="sm"
      >
        {formSuccess ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-green-600" />
            <p className="text-sm text-green-700">Cambios guardados correctamente.</p>
          </div>
        ) : (
          <form onSubmit={handleSaveForm} className="space-y-4">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre completo"
              disabled={isSavingForm}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="usuario@email.com"
              disabled={isSavingForm}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Dejar vacío para no cambiar"
              helperText="Mínimo 6 caracteres"
              disabled={isSavingForm}
            />
            {form.password && (
              <Input
                label="Confirmar contraseña"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                disabled={isSavingForm}
              />
            )}

            {formError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={isSavingForm}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" isLoading={isSavingForm}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
