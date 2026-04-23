import { AuthGuard } from '@/components/layout/AuthGuard'
import { Sidebar } from '@/components/layout/Sidebar'
import { SWRProvider } from '@/components/providers/SWRProvider'
import { CarritoProvider } from '@/context/CarritoContext'
import { CarritoPanel } from '@/components/carrito/CarritoPanel'
import { CarritoBoton } from '@/components/carrito/CarritoBoton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <AuthGuard>
        <CarritoProvider>
          <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
          <CarritoBoton />
          <CarritoPanel />
        </CarritoProvider>
      </AuthGuard>
    </SWRProvider>
  )
}
