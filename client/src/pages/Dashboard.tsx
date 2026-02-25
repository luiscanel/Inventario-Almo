import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardStats } from '@/lib/api'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { 
  Server, 
  Shield, 
  ShieldOff, 
  HardDrive,
  Monitor,
  Globe,
  Cpu,
  Database,
  Activity,
  Layers
} from 'lucide-react'

const COLORS_ESTADO = ['#10b981', '#ef4444', '#f59e0b', '#6b7280']
const COLORS_PAIS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#14b8a6']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm px-4 py-3 shadow-2xl rounded-xl border border-slate-700/50">
        <p className="text-slate-200 font-medium text-sm">{label}</p>
        <p className="text-blue-400 text-lg font-bold">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

interface Stats {
  totalVMs: number
  vmsActivos: number
  vmsInactivos: number
  vmsMantenimiento: number
  vmsDecomisionados: number
  conAntivirus: number
  sinAntivirus: number
  porPais: { pais: string; count: number }[]
  porAmbiente: { ambiente: string; count: number }[]
  porEstado: { estado: string; count: number }[]
  porSO: { so: string; count: number }[]
  porSOConVersion: { so: string; count: number }[]
  totalFisico: number
  porPaisFisico: { pais: string; count: number }[]
  porCategoria: { categoria: string; count: number }[]
  porMarca: { marca: string; count: number }[]
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group border-0">
    <CardContent className="p-0">
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 ${color} opacity-90`}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
        <div className="relative flex items-center p-5">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4 flex-1">
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)



export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'vms' | 'fisico'>('vms')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const estadoData = stats?.porEstado.map(e => ({
    name: e.estado,
    value: e.count
  })) || []

  const antivirusData = [
    { name: 'Con Antivirus', value: stats?.conAntivirus || 0 },
    { name: 'Sin Antivirus', value: stats?.sinAntivirus || 0 }
  ]

  const categoriaData = stats?.porCategoria.map(c => ({
    name: c.categoria,
    value: c.count
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Resumen del inventario de Grupo Almo</p>
        </div>
        
        {/* Tab Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('vms')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'vms' 
                ? 'bg-white shadow text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            VMs
          </button>
          <button
            onClick={() => setActiveTab('fisico')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'fisico' 
                ? 'bg-white shadow text-purple-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Físico
          </button>
        </div>
      </div>

      {activeTab === 'vms' ? (
        <>
          {/* KPI Cards - VMs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total VMs" value={stats?.totalVMs || 0} icon={Server} color="bg-gradient-to-br from-blue-500 to-blue-600" />
            <StatCard title="Activos" value={stats?.vmsActivos || 0} icon={Activity} color="bg-gradient-to-br from-green-500 to-green-600" />
            <StatCard title="Inactivos" value={stats?.vmsInactivos || 0} icon={Server} color="bg-gradient-to-br from-red-500 to-red-600" />
            <StatCard title="Mantenimiento" value={stats?.vmsMantenimiento || 0} icon={Server} color="bg-gradient-to-br from-yellow-500 to-yellow-600" />
            <StatCard title="Con Antivirus" value={stats?.conAntivirus || 0} icon={Shield} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
            <StatCard title="Sin Antivirus" value={stats?.sinAntivirus || 0} icon={ShieldOff} color="bg-gradient-to-br from-orange-500 to-orange-600" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estado Pie Chart */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  Estado de VMs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {COLORS_ESTADO.map((color, index) => (
                          <linearGradient key={index} id={`grad-estado-${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={color} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={estadoData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {estadoData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#grad-estado-${index})`} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center -mt-4">
                    <p className="text-3xl font-bold text-slate-700">{estadoData.reduce((a, b) => a + b.value, 0)}</p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Antivirus Donut */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  Antivirus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="grad-av-1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="grad-av-2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={antivirusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="url(#grad-av-1)" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                        <Cell fill="url(#grad-av-2)" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center -mt-4">
                    <p className="text-3xl font-bold text-slate-700">{antivirusData.reduce((a, b) => a + b.value, 0)}</p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Por Ambiente */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  Por Ambiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porAmbiente || []} layout="vertical">
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="ambiente" type="category" width={80} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="count" fill="url(#barGrad)" radius={[0, 6, 6, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por País */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  VMs por País
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porPais || []}>
                      <defs>
                        <linearGradient id="barGradPais" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="pais" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="count" fill="url(#barGradPais)" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        {stats?.porPais?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#barGradPais)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Por Sistema Operativo */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                    <Database className="w-4 h-4 text-white" />
                  </div>
                  Por Sistema Operativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porSO || []}>
                      <defs>
                        <linearGradient id="barGradSO" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="so" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="count" fill="url(#barGradSO)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Por Sistema Operativo con Versión */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Database className="w-4 h-4 text-white" />
                  </div>
                  SO con Versión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porSOConVersion?.slice(0, 15) || []}>
                      <defs>
                        <linearGradient id="barGradSOVersion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="so" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="count" fill="url(#barGradSOVersion)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* KPIs Físico */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Equipos" value={stats?.totalFisico || 0} icon={HardDrive} color="bg-gradient-to-br from-purple-500 to-purple-600" />
            <StatCard title="Por País" value={stats?.porPaisFisico?.length || 0} icon={Globe} color="bg-gradient-to-br from-cyan-500 to-cyan-600" />
            <StatCard title="Categorías" value={stats?.porCategoria?.length || 0} icon={Layers} color="bg-gradient-to-br from-pink-500 to-pink-600" />
            <StatCard title="Marcas" value={stats?.porMarca?.length || 0} icon={Cpu} color="bg-gradient-to-br from-amber-500 to-amber-600" />
          </div>

          {/* Charts Físico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por País */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  Equipos por País
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porPaisFisico || []}>
                      <defs>
                        <linearGradient id="barGradFisico" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="pais" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="count" fill="url(#barGradFisico)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Por Categoría */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  Por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {COLORS_PAIS.map((color, index) => (
                          <linearGradient key={index} id={`grad-cat-${index}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={color} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={categoriaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoriaData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#grad-cat-${index})`} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center -mt-4">
                    <p className="text-3xl font-bold text-slate-700">{categoriaData.reduce((a, b) => a + b.value, 0)}</p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Por Marca */}
            <Card className="lg:col-span-2 hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  Equipos por Marca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porMarca?.slice(0, 10) || []}>
                      <defs>
                        <linearGradient id="barGradMarca" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="marca" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="count" fill="url(#barGradMarca)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
