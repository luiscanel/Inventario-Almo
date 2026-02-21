import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardPhysical } from '@/lib/api'
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
  HardDrive,
  Package,
  CheckCircle,
  Globe,
  Layers,
  Cpu,
  User,
  Calendar,
  Network
} from 'lucide-react'

const COLORS_ESTADO = {
  'En uso': '#22c55e',
  'Disponible': '#3b82f6',
  'Dañado': '#ef4444',
  'Dado de baja': '#6b7280'
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#ec4899', '#14b8a6']

interface PhysicalStats {
  totalEquipos: number
  porEstado: { estado: string; count: number }[]
  porCategoria: { categoria: string; count: number }[]
  porMarca: { marca: string; count: number }[]
  porPais: { pais: string; count: number }[]
  porResponsable: { responsable: string; count: number }[]
  porModelo: { modelo: string; count: number }[]
  garantiaProxima: {
    id: number
    equipo: string | null
    modelo: string | null
    serie: string | null
    garantia: string
    responsable: string | null
    pais: string
  }[]
  garantiaVencida: {
    id: number
    equipo: string | null
    modelo: string | null
    serie: string | null
    garantia: string
    responsable: string | null
    pais: string
  }[]
  conIp: number
  sinIp: number
  conIlo: number
  sinIlo: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-gray-600">{payload[0].value} equipos</p>
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

export default function DashboardInventarioFisico() {
  const [stats, setStats] = useState<PhysicalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'garantia' | 'ip'>('garantia')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getDashboardPhysical()
      setStats(data)
    } catch (error) {
      console.error('Error loading physical stats:', error)
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

  const estadoData = stats?.porEstado?.map(e => ({
    name: e.estado,
    value: e.count
  })) || []

  const ipData = [
    { name: 'Con IP', value: stats?.conIp || 0 },
    { name: 'Sin IP', value: stats?.sinIp || 0 }
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const diff = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Inventario Físico
          </h1>
          <p className="text-gray-500 mt-1">Estado detallado de equipos físicos</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Equipos"
          value={stats?.totalEquipos || 0}
          icon={HardDrive}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Categorías"
          value={stats?.porCategoria?.length || 0}
          icon={Package}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Marcas"
          value={stats?.porMarca?.length || 0}
          icon={Layers}
          color="bg-gradient-to-br from-pink-500 to-pink-600"
        />
        <StatCard
          title="Responsables"
          value={stats?.porResponsable?.length || 0}
          icon={User}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Estado de Equipos
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

        {/* Por Categoría */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              Por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.porCategoria || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="categoria" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
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
                <BarChart data={stats?.porPais?.slice(0, 8) || []}>
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Marca */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-500" />
              Por Marca (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.porMarca?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="marca" tick={{ fontSize: 10 }} tickLine={false} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* IP Address Coverage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-500" />
              Cobertura de IP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ipData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Garantías */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Gestión de Garantías
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('garantia')}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === 'garantia' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Próximas a vencer ({stats?.garantiaProxima?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('ip')}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === 'ip' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Vencidas ({stats?.garantiaVencida?.length || 0})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Equipo</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Modelo</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Serie</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Responsable</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">País</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'garantia' ? (stats?.garantiaProxima || []) : (stats?.garantiaVencida || [])).slice(0, 15).map((eq, idx) => (
                  <tr key={eq.id || idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">{eq.equipo || '-'}</td>
                    <td className="py-2 px-2">{eq.modelo || '-'}</td>
                    <td className="py-2 px-2 font-mono text-xs">{eq.serie || '-'}</td>
                    <td className="py-2 px-2">{eq.responsable || '-'}</td>
                    <td className="py-2 px-2">{eq.pais}</td>
                    <td className="py-2 px-2">
                      {activeTab === 'garantia' ? (
                        <span className={`px-2 py-1 rounded text-xs ${
                          getDaysUntil(eq.garantia) <= 30 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {formatDate(eq.garantia)} ({getDaysUntil(eq.garantia)} días)
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                          {formatDate(eq.garantia)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {(activeTab === 'garantia' ? (stats?.garantiaProxima || []) : (stats?.garantiaVencida || [])).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      {activeTab === 'garantia' ? 'No hay garantías próximas a vencer' : 'No hay garantías vencidas'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
