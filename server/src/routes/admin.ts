import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma/index'
import { authMiddleware, requireAdmin } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)
router.use(requireAdmin)

// ============================================
// ROLES
// ============================================

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await prisma.rol.findMany({
      include: {
        permisos: true,
        usuarios: true
      },
      orderBy: { nombre: 'asc' }
    })
    res.json(roles.map(r => ({
      ...r,
      usuariosCount: r.usuarios.length
    })))
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al obtener roles' })
  }
})

// Get all permisos
router.get('/permisos', async (req, res) => {
  try {
    const permisos = await prisma.permiso.findMany({
      orderBy: [{ modulo: 'asc' }, { accion: 'asc' }]
    })
    
    // Agrupar por módulo
    const grouped: Record<string, string[]> = {}
    permisos.forEach(p => {
      if (!grouped[p.modulo]) grouped[p.modulo] = []
      grouped[p.modulo].push(p.accion)
    })
    
    res.json({ permisos, grouped })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al obtener permisos' })
  }
})

// Create rol
router.post('/roles', async (req, res) => {
  try {
    const { nombre, descripcion, permisos } = req.body

    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del rol es requerido' })
    }

    // Verificar si existe
    const existing = await prisma.rol.findUnique({ where: { nombre } })
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un rol con ese nombre' })
    }

    // Buscar permisos usando OR
    const permisosConditions = permisos?.map((p: string) => {
      const [modulo, accion] = p.split('_')
      return { modulo, accion }
    }) || []
    
    const permisosData = permisosConditions.length > 0 
      ? await prisma.permiso.findMany({ 
          where: { OR: permisosConditions }
        })
      : []

    const rol = await prisma.rol.create({
      data: {
        nombre,
        descripcion: descripcion || '',
        permisos: permisosData.length ? { connect: permisosData.map(p => ({ id: p.id })) } : undefined
      },
      include: { permisos: true }
    })

    res.json(rol)
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al crear rol' })
  }
})

// Update rol
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, permisos } = req.body

    const rolActual = await prisma.rol.findUnique({ 
      where: { id: parseInt(id) },
      include: { permisos: true }
    })

    if (!rolActual) {
      return res.status(404).json({ message: 'Rol no encontrado' })
    }

    // Buscar permisos usando OR
    let permisosData: any[] = []
    if (permisos?.length) {
      const permisosConditions = permisos.map((p: string) => {
        const [modulo, accion] = p.split('_')
        return { modulo, accion }
      })
      permisosData = await prisma.permiso.findMany({ 
        where: { OR: permisosConditions }
      })
    }

    // Actualizar
    const rol = await prisma.rol.update({
      where: { id: parseInt(id) },
      data: {
        nombre: nombre || rolActual.nombre,
        descripcion: descripcion ?? rolActual.descripcion,
        permisos: { 
          set: permisosData.map(p => ({ id: p.id }))
        }
      },
      include: { permisos: true }
    })

    res.json(rol)
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al actualizar rol' })
  }
})

// Delete rol
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar si hay usuarios con este rol
    const usuariosConRol = await prisma.usuarioRol.count({
      where: { rolId: parseInt(id) }
    })

    if (usuariosConRol > 0) {
      return res.status(400).json({ message: 'No se puede eliminar un rol que tiene usuarios asignados' })
    }

    await prisma.rol.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Rol eliminado correctamente' })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al eliminar rol' })
  }
})

// ============================================
// USUARIOS
// ============================================

// Get all usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      include: {
        usuarioRoles: {
          include: { rol: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(usuarios.map(u => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      activo: u.activo,
      createdAt: u.createdAt,
      roles: u.usuarioRoles.map(ur => ur.rol.nombre)
    })))
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al obtener usuarios' })
  }
})

// Create usuario
router.post('/usuarios', async (req, res) => {
  try {
    const { email, nombre, password, rol, activo } = req.body

    if (!email || !nombre || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    if (!email.toLowerCase().endsWith('@grupoalmo.com')) {
      return res.status(400).json({ message: 'Solo se permiten correos con dominio @grupoalmo.com' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Buscar el rol
    const rolEncontrado = await prisma.rol.findUnique({
      where: { nombre: rol || 'soporte' }
    })

    const usuario = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        nombre,
        password: hashedPassword,
        rol: rol || 'soporte',
        activo: activo !== false,
        usuarioRoles: rolEncontrado ? {
          create: { rolId: rolEncontrado.id }
        } : undefined
      }
    })

    res.json({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo,
      createdAt: usuario.createdAt
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'El email ya está registrado' })
    }
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al crear usuario' })
  }
})

// Update usuario
router.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, rol, activo, password } = req.body

    const usuarioActual = await prisma.user.findUnique({ 
      where: { id: parseInt(id) }
    })

    if (!usuarioActual) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const updateData: any = {}
    if (nombre) updateData.nombre = nombre
    if (typeof activo === 'boolean') updateData.activo = activo
    if (rol) updateData.rol = rol
    if (password) updateData.password = await bcrypt.hash(password, 10)

    // Actualizar rol en tabla relacional si se proporcionó
    if (rol) {
      const rolEncontrado = await prisma.rol.findUnique({ where: { nombre: rol } })
      if (rolEncontrado) {
        // Eliminar roles anteriores
        await prisma.usuarioRol.deleteMany({ where: { usuarioId: parseInt(id) } })
        // Crear nuevo rol
        await prisma.usuarioRol.create({
          data: { usuarioId: parseInt(id), rolId: rolEncontrado.id }
        })
      }
    }

    const usuario = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    res.json({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      activo: usuario.activo,
      createdAt: usuario.createdAt
    })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al actualizar usuario' })
  }
})

// Delete usuario
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // No permitir eliminarse a sí mismo
    const userId = (req as any).user?.id
    if (userId === parseInt(id)) {
      return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' })
    }

    await prisma.user.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al eliminar usuario' })
  }
})

// ============================================
// OTROS
// ============================================

// Delete all servidores
router.delete('/servidores', async (req, res) => {
  try {
    await prisma.servidor.deleteMany({})
    res.json({ message: 'Todos los servidores eliminados' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al eliminar servidores' })
  }
})

export default router
