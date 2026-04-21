'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { VentaRubro } from '@/hooks/useDashboardData'

const COLORS = ['#851919', '#ca8a04', '#2563eb', '#16a34a', '#7c3aed', '#0891b2']

interface Props {
  data: VentaRubro[]
  isLoading: boolean
}

function formatARS(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value)
}

export function VentasPorRubroChart({ data, isLoading }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Ventas por rubro</h3>
      {isLoading ? (
        <div className="h-56 animate-pulse rounded-lg bg-gray-100" />
      ) : data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-400">
          Sin datos para el período seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={224}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="total"
              nameKey="label"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [formatARS(Number(value)), name]}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value, entry) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const item = data.find((d) => d.label === value) ?? (entry.payload as any)
                return (
                  <span className="text-xs text-gray-700">
                    {value} — {item?.porcentaje ?? 0}%
                  </span>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
