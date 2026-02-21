import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { getServidores, createServidor, updateServidor, deleteServidor, importServidores } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Servidor } from '@/types'
import { Plus, Pencil, Trash2, Search, Download, Upload, Columns2 } from 'lucide-react'
import * as XLSX from 'xlsx'

const ambientes = ['Produccion', 'Desarrollo', 'Testing', 'Staging']
const arquitecturas = ['x86_64', 'ARM64', 'x86', 'PowerPC']
const sistemasOps = ['Windows Server', 'Linux', 'VMware ESXi', 'CentOS', 'Ubuntu', 'Red Hat', 'Debian', 'Windows Server 2019', 'Windows Server 2022']
const estados = ['Activo', 'Inactivo', 'Mantenimiento', 'Decomisionado']

const emptyServidor = {
  pais: '',
  host: '',
  nombreVM: '',
  ip: '',
  cpu: 0,
  memoria: '',
  disco: '',
  ambiente: 'Produccion',
  arquitectura: 'x86_64',
  sistemaOperativo: '',
  version: '',
  antivirus: '',
  estado: 'Activo',
  responsable: ''
}

const allColumns = [
  { key: 'pais', label: 'País', default: true },
  { key: 'host', label: 'Host', default: true },
  { key: 'nombreVM', label: 'Nombre VM', default: true },
  { key: 'ip', label: 'IP', default: true },
  { key: 'cpu', label: 'CPU', default: true },
  { key: 'memoria', label: 'Memoria', default: true },
  { key: 'disco', label: 'Disco', default: true },
  { key: 'ambiente', label: 'Ambiente', default: true },
  { key: 'arquitectura', label: 'Arquitectura', default: false },
  { key: 'sistemaOperativo', label: 'S.O.', default: true },
  { key: 'version', label: 'Version O.S.', default: true },
  { key: 'antivirus', label: 'Antivirus', default: true },
  { key: 'estado', label: 'Estado', default: true },
  { key: 'responsable', label: 'Responsable', default: true },
]

export default function Inventory() {
  const [servidores, setServidores] = useState<Servidor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServidor, setEditingServidor] = useState<any>(null)
  const [formData, setFormData] = useState(emptyServidor)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [servidorToDelete, setServidorToDelete] = useState<number | null>(null)
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false)
  // Force all default columns to be visible
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'pais', 'host', 'nombreVM', 'ip', 'cpu', 'memoria', 'disco', 
    'ambiente', 'sistemaOperativo', 'version', 'antivirus', 'estado', 'responsable'
  ])
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
    } finally {
      setLoading(false)
    }
  }

  const filteredServidores = servidores.filter(s => 
    Object.values(s).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingServidor) {
        await updateServidor(editingServidor.id, formData)
        toast({ title: 'Servidor actualizado correctamente' })
      } else {
        await createServidor(formData)
        toast({ title: 'Servidor creado correctamente' })
      }
      setIsDialogOpen(false)
      setFormData(emptyServidor)
      setEditingServidor(null)
      loadServidores()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  const handleEdit = (servidor: Servidor) => {
    setEditingServidor(servidor)
    setFormData({
      pais: servidor.pais || '',
      host: servidor.host || '',
      nombreVM: servidor.nombreVM || '',
      ip: servidor.ip || '',
      cpu: servidor.cpu || 0,
      memoria: servidor.memoria || '',
      disco: servidor.disco || '',
      ambiente: servidor.ambiente || 'Produccion',
      arquitectura: servidor.arquitectura || '',
      sistemaOperativo: servidor.sistemaOperativo || '',
      version: servidor.version || '',
      antivirus: servidor.antivirus || '',
      estado: servidor.estado || 'Activo',
      responsable: servidor.responsable || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (servidorToDelete) {
      try {
        await deleteServidor(servidorToDelete)
        toast({ title: 'Servidor eliminado' })
        loadServidores()
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message })
      }
    }
    setDeleteConfirmOpen(false)
    setServidorToDelete(null)
  }

  const confirmDelete = (id: number) => {
    setServidorToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        'País': 'Colombia',
        'Host': 'SRV-COL-001',
        'Nombre VM': 'VM-WEB-01',
        'IP': '192.168.1.10',
        'CPU': 4,
        'Memoria': '16GB',
        'Disco': '500GB SSD',
        'Ambiente': 'Produccion',
        'Arquitectura': 'x86_64',
        'Sistema Operativo': 'Windows Server 2019',
        'Versión O.S': '1809',
        'Antivirus': 'Windows Defender',
        'Estado': 'Activo',
        'Responsable': 'Juan Pérez'
      }
    ]
    
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    
    const headers = ['País', 'Host', 'Nombre VM', 'IP', 'CPU', 'Memoria', 'Disco', 'Ambiente', 'Arquitectura', 'Sistema Operativo', 'Versión O.S', 'Antivirus', 'Estado', 'Responsable']
    const wscols = headers.map(() => ({ wch: 20 }))
    ws['!cols'] = wscols
    
    XLSX.writeFile(wb, 'plantilla_importacion.xlsx')
    toast({ title: 'Plantilla descargada correctamente' })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log('Excel columns:', Object.keys(jsonData[0] || {}))
      console.log('First row:', JSON.stringify(jsonData[0], null, 2))

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'El archivo está vacío' })
        return
      }

      // Flexible column matching - finds column by partial match
      const findColumn = (row: any, ...keywords: string[]) => {
        const rowKeys = Object.keys(row)
        for (const kw of keywords) {
          const found = rowKeys.find(k => k.toLowerCase().includes(kw.toLowerCase()))
          if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
            return String(row[found]).trim()
          }
        }
        return ''
      }

      // Build data object with explicit field names
      const dataToSend = jsonData.map((row: any) => {
        return {
          pais: findColumn(row, 'país', 'pais', 'PAIS'),
          host: findColumn(row, 'host'),
          nombreVM: findColumn(row, 'nombre vm', 'nombre de vm', 'vm name', 'vmname', 'version'),
          ip: findColumn(row, 'ip'),
          cpu: parseInt(String(findColumn(row, 'cpu'))) || 0,
          memoria: findColumn(row, 'memoria'),
          disco: findColumn(row, 'disco'),
          ambiente: findColumn(row, 'ambiente') || 'Produccion',
          arquitectura: findColumn(row, 'arquitectura') || 'x86_64',
          sistemaOperativo: findColumn(row, 'sistema operativo', 'so', 's.o'),
          version: findColumn(row, 'versión', 'version', 'os version'),
          antivirus: findColumn(row, 'antivirus'),
          estado: findColumn(row, 'estado') || 'Activo',
          responsable: findColumn(row, 'responsable')
        }
      })

      console.log('=== DATA TO SEND ===')
      console.log(JSON.stringify(dataToSend, null, 2))

      const result = await importServidores(dataToSend)
      toast({ title: result.message || `${result.count} servidores importados correctamente` })
      loadServidores()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      e.target.value = ''
    }
  }

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(servidores.map(s => ({
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
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
    XLSX.writeFile(wb, 'inventario_servidores.xlsx')
    toast({ title: 'Exportado a Excel correctamente' })
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'bg-green-100 text-green-800'
      case 'Inactivo': return 'bg-red-100 text-red-800'
      case 'Mantenimiento': return 'bg-yellow-100 text-yellow-800'
      case 'Decomisionado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const renderCell = (servidor: Servidor, key: string) => {
    const value = servidor[key as keyof Servidor]
    
    if (key === 'estado') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(String(value))}`}>
          {String(value)}
        </span>
      )
    }
    if (key === 'ip') {
      return <span className="font-mono text-sm">{String(value)}</span>
    }
    if (key === 'host') {
      return <span className="font-medium">{String(value)}</span>
    }
    if (value === null || value === undefined) {
      return null
    }
    return String(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario de Servidores</h1>
          <p className="text-gray-500 mt-1">Gestione el inventario de servidores físicos y virtuales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Plantilla
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="file-upload"
            />
            <Button variant="outline" type="button">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </div>
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => setColumnsDialogOpen(true)}>
            <Columns2 className="w-4 h-4 mr-2" />
            Columnas
          </Button>
          <Button onClick={() => { setFormData(emptyServidor); setEditingServidor(null); setIsDialogOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servidor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Buscar en el inventario..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {allColumns.filter(c => visibleColumns.includes(c.key)).map(col => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServidores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-gray-500">
                        No hay servidores registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServidores.map((servidor) => (
                      <TableRow key={servidor.id}>
                        {allColumns.filter(c => visibleColumns.includes(c.key)).map(col => (
                          <TableCell key={col.key}>{renderCell(servidor, col.key)}</TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(servidor)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(servidor.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingServidor ? 'Editar Servidor' : 'Nuevo Servidor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="space-y-2">
                <Label>País *</Label>
                <Input value={formData.pais} onChange={(e) => setFormData({...formData, pais: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Host *</Label>
                <Input value={formData.host} onChange={(e) => setFormData({...formData, host: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Nombre VM</Label>
                <Input value={formData.nombreVM} onChange={(e) => setFormData({...formData, nombreVM: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>IP *</Label>
                <Input value={formData.ip} onChange={(e) => setFormData({...formData, ip: e.target.value})} placeholder="192.168.1.1" required />
              </div>
              <div className="space-y-2">
                <Label>CPU *</Label>
                <Input type="number" value={formData.cpu} onChange={(e) => setFormData({...formData, cpu: parseInt(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <Label>Memoria *</Label>
                <Input value={formData.memoria} onChange={(e) => setFormData({...formData, memoria: e.target.value})} placeholder="16GB" required />
              </div>
              <div className="space-y-2">
                <Label>Disco *</Label>
                <Input value={formData.disco} onChange={(e) => setFormData({...formData, disco: e.target.value})} placeholder="500GB SSD" required />
              </div>
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select value={formData.ambiente} onValueChange={(val) => setFormData({...formData, ambiente: val as any})}>
                  <SelectTrigger><span>{formData.ambiente}</span></SelectTrigger>
                  <SelectContent>
                    {ambientes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Arquitectura</Label>
                <Select value={formData.arquitectura} onValueChange={(val) => setFormData({...formData, arquitectura: val as any})}>
                  <SelectTrigger><span>{formData.arquitectura}</span></SelectTrigger>
                  <SelectContent>
                    {arquitecturas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sistema Operativo</Label>
                <Select value={formData.sistemaOperativo} onValueChange={(val) => setFormData({...formData, sistemaOperativo: val})}>
                  <SelectTrigger><span>{formData.sistemaOperativo || 'Seleccionar...'}</span></SelectTrigger>
                  <SelectContent>
                    {sistemasOps.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Versión O.S</Label>
                <Input value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} placeholder="22.04 LTS" />
              </div>
              <div className="space-y-2">
                <Label>Antivirus</Label>
                <Input value={formData.antivirus} onChange={(e) => setFormData({...formData, antivirus: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.estado} onValueChange={(val) => setFormData({...formData, estado: val as any})}>
                  <SelectTrigger><span>{formData.estado}</span></SelectTrigger>
                  <SelectContent>
                    {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Responsable</Label>
                <Input value={formData.responsable} onChange={(e) => setFormData({...formData, responsable: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingServidor ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Está seguro de que desea eliminar este servidor? Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Columns Dialog */}
      <Dialog open={columnsDialogOpen} onOpenChange={setColumnsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Columnas visibles</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {allColumns.map(col => (
              <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="w-4 h-4"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColumnsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
