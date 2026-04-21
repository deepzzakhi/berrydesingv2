'use client'

import { useEffect, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { createClient } from '@/lib/supabase/client'
import { BadgeEstado } from '@/components/ui/Badge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Usuario, RolUsuario } from '@/types/producto'
import { formatDate } from '@/lib/utils'
import { Users, RefreshCw, ShieldCheck, Eye, Edit } from 'lucide-react'

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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

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
    } catch (err) {
      setError('No se pudieron cargar los usuarios')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function updateUsuario(id: string, updates: Partial<Pick<Usuario, 'rol' | 'activo'>>) {
    setSavingId(id)
    try {
      const supabase = createClient()
      const { error: dbErr } = await supabase
        .from('usuarios')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (dbErr) throw dbErr
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
      )
    } catch (err) {
      console.error(err)
      alert('Error al actualizar el usuario')
    } finally {
      setSavingId(null)
      setEditingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Administración de usuarios" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header */}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Registrado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {usuario.nombre ?? 'Sin nombre'}
                        </p>
                        <p className="text-xs text-gray-500">{usuario.email}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {editingId === usuario.id ? (
                        <select
                          defaultValue={usuario.rol}
                          onChange={(e) => {
                            updateUsuario(usuario.id, { rol: e.target.value as RolUsuario })
                          }}
                          disabled={savingId === usuario.id}
                          className="h-8 rounded border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#851919]"
                        >
                          <option value="admin">Administrador</option>
                          <option value="operador">Operador</option>
                          <option value="consulta">Solo lectura</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROL_BADGE_CLASS[usuario.rol]}`}
                        >
                          {ROL_LABELS[usuario.rol]}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          updateUsuario(usuario.id, { activo: !usuario.activo })
                        }
                        disabled={savingId === usuario.id}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                          usuario.activo
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${usuario.activo ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(usuario.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setEditingId(editingId === usuario.id ? null : usuario.id)
                          }
                          title="Editar rol"
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
    </div>
  )
}
