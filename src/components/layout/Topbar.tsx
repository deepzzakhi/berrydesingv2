'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Bell } from 'lucide-react'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'BD'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-[#851919]" />
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications placeholder */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <Bell size={18} />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#851919] text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {user?.email?.split('@')[0] ?? 'Usuario'}
            </p>
            <p className="text-xs text-gray-400 leading-tight">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
