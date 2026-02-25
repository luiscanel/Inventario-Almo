import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Server, 
  HardDrive,
  FileText, 
  Users, 
  LogOut,
  Menu,
  X,
  Shield,
  Cpu,
  Activity,
  User,
  Cloud
} from 'lucide-react'
import { useState } from 'react'

// Definición de módulos con sus permisos requeridos
// Si no tiene permiso, igual se muestra pero podría redireccionar
const modulos = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', permiso: null },
  { to: '/inventory', icon: Server, label: 'Inv. Onpremise', permiso: { modulo: 'inventario_servidores', accion: 'ver' } },
  { to: '/inventario-cloud', icon: Cloud, label: 'Inv. Cloud', permiso: { modulo: 'inventario_cloud', accion: 'ver' } },
  { to: '/inventario-fisico', icon: HardDrive, label: 'Inventario Físico', permiso: { modulo: 'inventario_fisico', accion: 'ver' } },
  { to: '/seguridad', icon: Shield, label: 'Seguridad', permiso: null },
  { to: '/recursos', icon: Cpu, label: 'Recursos', permiso: null },
  { to: '/disponibilidad', icon: Activity, label: 'Disponibilidad', permiso: null },
  { to: '/inventario-fisico-detalle', icon: HardDrive, label: 'Inv. Físico Detalle', permiso: { modulo: 'inventario_fisico', accion: 'ver' } },
  { to: '/responsables', icon: User, label: 'Responsables', permiso: null },
  { to: '/reports', icon: FileText, label: 'Informes', permiso: { modulo: 'informes', accion: 'ver' } },
  { to: '/admin', icon: Users, label: 'Admin', permiso: { modulo: 'admin', accion: 'ver' } },
]

export default function Layout() {
  const { user, logout, permisos, tienePermiso } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Solo filtrar si ya tenemos permisos cargados, si no mostrar todo
  const navItems = permisos.length > 0 
    ? modulos.filter(m => !m.permiso || tienePermiso(m.permiso.modulo, m.permiso.accion))
    : modulos

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Inventario Almo</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
              end={item.to === '/'}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>


      </aside>

      <div className="lg:ml-64">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1 lg:flex-none" />
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.rol || 'Usuario'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full px-3"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
