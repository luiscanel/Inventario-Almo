import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
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
import { getUsuarios, createUsuario } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Users, Plus, Shield, UserCheck } from 'lucide-react'

interface Usuario {
  id: number
  email: string
  nombre: string
  rol: 'admin' | 'editor' | 'viewer'
  activo: boolean
  createdAt: string
}

export default function Admin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: '',
    rol: 'editor' as 'admin' | 'editor' | 'viewer'
  })
  const { toast } = useToast()

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email.toLowerCase().endsWith('@grupoalmo.com')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Solo se permiten correos con dominio @grupoalmo.com' })
      return
    }

    try {
      await createUsuario(formData)
      toast({ title: 'Usuario creado correctamente' })
      setIsDialogOpen(false)
      setFormData({ email: '', nombre: '', password: '', rol: 'editor' })
      loadUsuarios()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    }
  }

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.rol === 'admin').length,
    activos: usuarios.filter(u => u.activo).length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administración</h1>
          <p className="text-gray-500 mt-1">Gestión de usuarios y permisos</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Usuarios</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Administradores</p>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Usuarios Activos</p>
              <p className="text-2xl font-bold">{stats.activos}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nombre}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolColor(usuario.rol)}`}>
                        {usuario.rol === 'admin' ? 'Administrador' : usuario.rol === 'editor' ? 'Editor' : 'Visor'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(usuario.createdAt).toLocaleDateString('es-CO')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input 
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email (debe ser @grupoalmo.com)</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="usuario@grupoalmo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={formData.rol} onValueChange={(v) => setFormData({...formData, rol: v as any})}>
                  <SelectTrigger><span>{formData.rol === 'admin' ? 'Administrador' : formData.rol === 'editor' ? 'Editor' : 'Visor'}</span></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Visor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear Usuario</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
