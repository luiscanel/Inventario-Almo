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

const COLORS_ESTADO = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280']
const COLORS_PAIS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#14b8a6']

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
  totalFisico: number
  porPaisFisico: { pais: string; count: number }[]
  porCategoria: { categoria: string; count: number }[]
  porMarca: { marca: string; count: number }[]
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
    <CardContent className="p-0">
      <div className="flex items-center">
        <div className={`${color} p-4 flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="p-4 flex-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600">{payload[0].value} servidores</p>
      </div>
    )
  }
  return null
}

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
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Estado de VMs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadoData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {estadoData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_ESTADO[index % COLORS_ESTADO.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Antivirus Donut */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  Antivirus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={antivirusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#f97316" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Por Ambiente */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Por Ambiente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porAmbiente || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="ambiente" type="category" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por País */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-500" />
                  VMs por País
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porPais || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="pais" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats?.porPais?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PAIS[index % COLORS_PAIS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Por Sistema Operativo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-500" />
                  Por Sistema Operativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porSO || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="so" tick={{ fontSize: 10 }} tickLine={false} angle={-45} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
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
                  <Globe className="w-5 h-5 text-cyan-500" />
                  Equipos por País
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porPaisFisico || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="pais" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Por Categoría */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-pink-500" />
                  Por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriaData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {categoriaData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PAIS[index % COLORS_PAIS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Por Marca */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-500" />
                  Equipos por Marca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.porMarca?.slice(0, 10) || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                      <XAxis dataKey="marca" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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
