'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Package, AlertCircle, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password` }
      )
      if (resetError) {
        setError(resetError.message)
        return
      }
      setSent(true)
    } catch {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#851919] shadow-lg">
            <Package size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#851919]">Berry Design</h1>
            <p className="text-sm text-gray-500">Sistema de gestión de stock</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recuperar contraseña</h2>
            <p className="mt-1 text-sm text-gray-500">
              Te enviamos un link para resetear tu contraseña.
            </p>
          </div>

          {sent ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
              <CheckCircle size={15} className="mt-0.5 shrink-0 text-green-600" />
              <p className="text-sm text-green-700">
                Revisá tu email. Si la cuenta existe, recibirás un link en los próximos minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                disabled={isLoading}
              />

              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                size="lg"
              >
                Enviar link de recuperación
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            <Link href="/login" className="font-medium text-[#851919] hover:underline">
              Volver al login
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400">
          Berry Design · Stock Manager · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
