import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardAvailability } from '@/lib/api'
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
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  Pause,
  Globe,
  Layers
} from 'lucide-react'

const COLORS_ESTADO = {
  'Activo': '#22c55e',
  'Inactivo': '#ef4444',
  'Mantenimiento': '#f59e0b',
  'Decomisionado': '#6b7280'
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280', '#3b82f6', '#8b5cf6', '#06b6d4']

interface AvailabilityStats {
  totalVMs: number
  vmsActivos: number
  vmsNoActivos: number
  porcentajeActivos: number
  porEstado: { name: string; count: number }[]
  porAmbiente: { name: string; count: number }[]
  porPais: { name: string; count: number }[]
  vmsInactivos: {
    id: number
    host: string
    nombreVM: string | null
    ip: string | null
    pais: string
    ambiente: string
    updatedAt: string
  }[]
  vmsMantenimiento: {
    id: number
    host: string
    nombreVM: string | null
    pais: string
    ambiente: string
    updatedAt: string
  }[]
  vmsDecomisionados: {
    id: number
    host: string
    nombreVM: string | null
    pais: string
    ambiente: string
    updatedAt: string
  }[]
  timeline: { periodo: string; count: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600">{payload[0].value} VMs</p>
      </div>
    )
  }
  return null
}

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
    <CardContent className="p-0">
      <div className="flex items-center">
        <div className={`${color} p-4 flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="p-4 flex-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function DashboardDisponibilidad() {
  const [stats, setStats] = useState<AvailabilityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inactivos' | 'mantenimiento' | 'decomisionados'>('inactivos')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getDashboardAvailability()
      setStats(data)
    } catch (error) {
      console.error('Error loading availability stats:', error)
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

  const estadoData = stats?.porEstado || []

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getDaysAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Disponibilidad
          </h1>
          <p className="text-gray-500 mt-1">Estado de VMs y servidores</p>
        </div>
        
        {/* Availability Status Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          (stats?.porcentajeActivos || 0) >= 80 ? 'bg-green-100' : 
          (stats?.porcentajeActivos || 0) >= 50 ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
          {(stats?.porcentajeActivos || 0) >= 80 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-bold ${
            (stats?.porcentajeActivos || 0) >= 80 ? 'text-green-600' : 
            (stats?.porcentajeActivos || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(stats?.porcentajeActivos || 0)}% Activos
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total VMs"
          value={stats?.totalVMs || 0}
          icon={Server}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Activos"
          value={stats?.vmsActivos || 0}
          icon={CheckCircle}
          color="bg-gradient-to-br from-green-500 to-green-600"
          subtitle={`${stats?.porcentajeActivos || 0}% del total`}
        />
        <StatCard
          title="Inactivos"
          value={stats?.vmsInactivos?.length || 0}
          icon={Pause}
          color="bg-gradient-to-br from-red-500 to-red-600"
        />
        <StatCard
          title="En Mantenimiento"
          value={stats?.vmsMantenimiento?.length || 0}
          icon={AlertTriangle}
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
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
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_ESTADO[entry.name as keyof typeof COLORS_ESTADO] || COLORS[index % COLORS.length]} />
                    ))}
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
                <BarChart data={(stats?.porAmbiente || []).map(e => ({ ambiente: e.name, count: e.count }))}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="ambiente" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Por País */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-500" />
              Por País
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(stats?.porPais || []).slice(0, 8).map(e => ({ pais: e.name, count: e.count }))}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="pais" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Actividad Reciente (Última actualización)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* VMs No Activos Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              VMs No Activos
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('inactivos')}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === 'inactivos' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Inactivos ({stats?.vmsInactivos?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('mantenimiento')}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === 'mantenimiento' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Mantenimiento ({stats?.vmsMantenimiento?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('decomisionados')}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === 'decomisionados' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Decomisionados ({stats?.vmsDecomisionados?.length || 0})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Host</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">VM</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">IP</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">País</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Ambiente</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'inactivos' ? (stats?.vmsInactivos || []) : 
                  activeTab === 'mantenimiento' ? (stats?.vmsMantenimiento || []) : 
                  (stats?.vmsDecomisionados || [])).slice(0, 15).map((vm, idx) => (
                  <tr key={vm.id || idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-xs">{vm.host}</td>
                    <td className="py-2 px-2">{vm.nombreVM || '-'}</td>
                    <td className="py-2 px-2 font-mono text-xs">{(vm as any).ip || '-'}</td>
                    <td className="py-2 px-2">{vm.pais}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        vm.ambiente === 'Producción' ? 'bg-red-100 text-red-700' :
                        vm.ambiente === 'Desarrollo' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {vm.ambiente}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs">
                      <span className={getDaysAgo(vm.updatedAt) > 30 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {formatDate(vm.updatedAt)}
                        {getDaysAgo(vm.updatedAt) > 0 && ` (${getDaysAgo(vm.updatedAt)} días)`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
