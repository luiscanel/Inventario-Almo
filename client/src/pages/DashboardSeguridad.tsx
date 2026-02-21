import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardSecurity } from '@/lib/api'
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
  Shield,
  ShieldOff,
  AlertTriangle,
  Server,
  Cpu,
  Globe,
  Monitor,
  CheckCircle
} from 'lucide-react'

interface SecurityStats {
  totalVMs: number
  conAntivirus: number
  sinAntivirus: number
  porcentajeProtegido: number
  porAntivirus: { antivirus: string; count: number }[]
  vmsSinAntivirus: {
    id: number
    host: string
    nombreVM: string | null
    ip: string | null
    pais: string
    ambiente: string
    estado: string
  }[]
  porArquitectura: { arquitectura: string; count: number }[]
  porSOVersion: { soVersion: string; count: number }[]
  porSO: { sistemaOperativo: string; count: number }[]
}

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

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
    <CardContent className="p-0">
      <div className="flex items-center">
        <div className={`${color} p-4 flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="p-4 flex-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function DashboardSeguridad() {
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCritical, setShowCritical] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await getDashboardSecurity()
      setStats(data)
    } catch (error) {
      console.error('Error loading security stats:', error)
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

  const antivirusData = [
    { name: 'Protegidos', value: stats?.conAntivirus || 0 },
    { name: 'Sin Antivirus', value: stats?.sinAntivirus || 0 }
  ]

  const protectedPercentage = stats?.porcentajeProtegido || 0
  const protectionColor = protectedPercentage >= 80 ? 'text-green-600' : protectedPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Seguridad
          </h1>
          <p className="text-gray-500 mt-1">Estado de seguridad de VMs y servidores</p>
        </div>
        
        {/* Protection Status Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${protectedPercentage >= 80 ? 'bg-green-100' : protectedPercentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
          {protectedPercentage >= 80 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-bold ${protectionColor}`}>
            {protectedPercentage}% Protegido
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
          title="Con Antivirus"
          value={stats?.conAntivirus || 0}
          icon={Shield}
          color="bg-gradient-to-br from-green-500 to-green-600"
          subtitle={`${stats?.porcentajeProtegido || 0}% del total`}
        />
        <StatCard
          title="Sin Antivirus"
          value={stats?.sinAntivirus || 0}
          icon={ShieldOff}
          color="bg-gradient-to-br from-red-500 to-red-600"
          subtitle="Requiere atención"
        />
        <StatCard
          title="Arquitecturas"
          value={stats?.porArquitectura?.length || 0}
          icon={Cpu}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          subtitle="En uso"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Antivirus Coverage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Cobertura Antivirus
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
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Por Antivirus */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Distribución por Antivirus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.porAntivirus?.slice(0, 6) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="antivirus" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Arquitecturas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-500" />
              Arquitecturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.porArquitectura || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="arquitectura" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Sistema Operativo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-500" />
              Por Sistema Operativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.porSO?.slice(0, 10) || []}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="sistemaOperativo" tick={{ fontSize: 10 }} tickLine={false} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SO con Versiones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-500" />
              SO con Versiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 overflow-y-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.porSOVersion?.slice(0, 12) || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="soVersion" type="category" width={180} tick={{ fontSize: 9 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VMs Sin Antivirus - Critical Alert */}
      {(stats?.vmsSinAntivirus?.length || 0) > 0 && (
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="pb-2 bg-red-50">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              VMs Sin Antivirus ({stats?.vmsSinAntivirus?.length || 0})
            </CardTitle>
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
                    <th className="text-left py-3 px-2 font-medium text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(showCritical 
                    ? (stats?.vmsSinAntivirus || []) 
                    : (stats?.vmsSinAntivirus?.slice(0, 10) || [])
                  ).map((vm) => (
                    <tr key={vm.id} className="border-b hover:bg-red-50">
                      <td className="py-2 px-2 font-mono text-xs">{vm.host}</td>
                      <td className="py-2 px-2">{vm.nombreVM || '-'}</td>
                      <td className="py-2 px-2 font-mono text-xs">{vm.ip || '-'}</td>
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
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          vm.estado === 'Activo' ? 'bg-green-100 text-green-700' :
                          vm.estado === 'Inactivo' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {vm.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(stats?.vmsSinAntivirus?.length || 0) > 10 && !showCritical && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowCritical(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Ver todos ({stats?.vmsSinAntivirus?.length})
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Critical Alerts */}
      {(stats?.vmsSinAntivirus?.length || 0) === 0 && (
        <Card className="border-green-200">
          <CardContent className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-medium">¡Todas las VMs tienen antivirus instalado!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
