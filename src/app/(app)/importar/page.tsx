import { Topbar } from '@/components/layout/Topbar'
import { ImportadorCSV } from '@/components/importar/ImportadorCSV'

export default function ImportarPage() {
  return (
    <div className="flex flex-col h-full">
      <Topbar title="Importar desde Bondarea" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h2 className="text-sm font-semibold text-blue-900">Importación de órdenes Bondarea</h2>
            <p className="mt-1 text-xs text-blue-700">
              Subí un archivo CSV exportado desde Bondarea para registrar múltiples reservas de forma masiva.
              Las columnas esperadas son: <code className="bg-blue-100 px-1 rounded">orden_bondarea</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">cliente</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">codigo_tela</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">tipo</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">medida</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">cantidad</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">notas</code>
            </p>
          </div>

          <ImportadorCSV />
        </div>
      </div>
    </div>
  )
}
