import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { getServidores } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Servidor } from '@/types'
import { FileText, Download, Mail, Calendar } from 'lucide-react'
import * as XLSX from 'xlsx'

type ReportType = 'completo' | 'ambiente' | 'pais' | 'sin-antivirus' | 'produccion' | 'estado'

export default function Reports() {
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [reportType, setReportType] = useState<ReportType>('completo')
  const [filterValue, setFilterValue] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadServidores()
  }, [])

  const loadServidores = async () => {
    try {
      const data = await getServidores()
      setServidores(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const getFilteredData = () => {
    const data = servidores || []
    switch (reportType) {
      case 'ambiente':
        if (!filterValue) return data
        return data.filter((s: Servidor) => (s.ambiente || '').toLowerCase().trim() === filterValue.toLowerCase().trim())
      case 'pais':
        if (!filterValue) return data
        return data.filter((s: Servidor) => (s.pais || '').toLowerCase().trim() === filterValue.toLowerCase().trim())
      case 'sin-antivirus':
        return data.filter((s: Servidor) => !s.antivirus || (s.antivirus || '').trim() === '' || s.antivirus.toLowerCase() === 'ninguno')
      case 'produccion':
        return data.filter((s: Servidor) => (s.ambiente || '').toLowerCase().trim() === 'produccion')
      case 'estado':
        if (!filterValue) return data
        return data.filter((s: Servidor) => (s.estado || '').toLowerCase().trim() === filterValue.toLowerCase().trim())
      default:
        return data
    }
  }

  const getReportTitle = () => {
    switch (reportType) {
      case 'completo': return 'Informe Completo de Inventario'
      case 'ambiente': return `Informe de Servidores - ${filterValue}`
      case 'pais': return `Informe de Servidores - ${filterValue}`
      case 'sin-antivirus': return 'Informe de Servidores Sin Antivirus'
      case 'produccion': return 'Informe de Servidores de Producción'
      case 'estado': return `Informe de Servidores - ${filterValue}`
      default: return 'Informe de Inventario'
    }
  }

  const exportToExcel = () => {
    setLoading(true)
    const data = getFilteredData()
    const ws = XLSX.utils.json_to_sheet(data.map(s => ({
      'País': s.pais,
      'Host': s.host,
      'Nombre VM': s.nombreVM,
      'IP': s.ip,
      'CPU': s.cpu,
      'Memoria': s.memoria,
      'Disco': s.disco,
      'Ambiente': s.ambiente,
      'Arquitectura': s.arquitectura,
      'Sistema Operativo': s.sistemaOperativo,
      'Versión O.S': s.version,
      'Antivirus': s.antivirus,
      'Estado': s.estado,
      'Responsable': s.responsable
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Informe')
    XLSX.writeFile(wb, `informe_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast({ title: 'Informe Excel generado correctamente' })
    setLoading(false)
  }

  const exportToCSV = () => {
    setLoading(true)
    const data = getFilteredData()
    const headers = ['País', 'Host', 'Nombre VM', 'IP', 'CPU', 'Memoria', 'Disco', 'Ambiente', 'Arquitectura', 'S.O.', 'Versión', 'Antivirus', 'Estado', 'Responsable']
    const rows = data.map(s => [
      s.pais, s.host, s.nombreVM, s.ip, s.cpu, s.memoria, s.disco, s.ambiente, s.arquitectura, s.sistemaOperativo, s.version, s.antivirus, s.estado, s.responsable
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe_${reportType}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast({ title: 'Informe CSV generado correctamente' })
    setLoading(false)
  }

  const uniquePaises = [...new Set((servidores || []).map(s => s.pais).filter(Boolean))]
  const uniqueAmbientes = [...new Set((servidores || []).map(s => s.ambiente).filter(Boolean))]
  const uniqueEstados = [...new Set((servidores || []).map(s => s.estado).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Informes</h1>
        <p className="text-gray-500 mt-1">Genere informes del inventario de servidores</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Configuración de Informe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Informe</Label>
              <Select value={reportType} onValueChange={(v) => { setReportType(v as ReportType); setFilterValue(''); }}>
                <SelectTrigger><span>{reportType === 'completo' ? 'Informe Completo' : reportType === 'ambiente' ? 'Por Ambiente' : reportType === 'pais' ? 'Por País' : reportType === 'sin-antivirus' ? 'Sin Antivirus' : reportType === 'produccion' ? 'Producción' : 'Por Estado'}</span></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completo">Informe Completo</SelectItem>
                  <SelectItem value="ambiente">Por Ambiente</SelectItem>
                  <SelectItem value="pais">Por País</SelectItem>
                  <SelectItem value="sin-antivirus">Sin Antivirus</SelectItem>
                  <SelectItem value="produccion">Servidores de Producción</SelectItem>
                  <SelectItem value="estado">Por Estado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(reportType === 'ambiente' || reportType === 'pais' || reportType === 'estado') && (
              <div className="space-y-2">
                <Label>Filtro</Label>
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger><span>{filterValue || 'Seleccionar...'}</span></SelectTrigger>
                  <SelectContent>
                    {reportType === 'ambiente' && uniqueAmbientes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    {reportType === 'pais' && uniquePaises.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    {reportType === 'estado' && uniqueEstados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha: {new Date().toLocaleDateString('es-CO')}
              </p>
              <p className="text-sm font-medium">
                Total de registros: <span className="text-primary">{getFilteredData().length}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview & Export */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
              <h3 className="font-bold text-lg mb-4">{getReportTitle()}</h3>
              <div className="overflow-auto max-h-[250px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Host</th>
                      <th className="text-left p-2">IP</th>
                      <th className="text-left p-2">Ambiente</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().slice(0, 10).map((s, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{s.host}</td>
                        <td className="p-2 font-mono">{s.ip}</td>
                        <td className="p-2">{s.ambiente}</td>
                        <td className="p-2">{s.estado}</td>
                        <td className="p-2">{s.responsable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getFilteredData().length > 10 && (
                  <p className="text-center text-gray-500 py-2">... y {getFilteredData().length - 10} más</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={exportToExcel} disabled={loading} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button onClick={exportToCSV} disabled={loading} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Informes Programados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <h4 className="font-medium">Informe Diario</h4>
              <p className="text-sm text-gray-500 mt-1">Se envía diariamente a las 8:00 AM</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <h4 className="font-medium">Informe Semanal</h4>
              <p className="text-sm text-gray-500 mt-1">Se envía cada lunes a las 8:00 AM</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <h4 className="font-medium">Informe Mensual</h4>
              <p className="text-sm text-gray-500 mt-1">Se envía el primer día de cada mes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
