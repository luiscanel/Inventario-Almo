import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma/index'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { validate, createUserSchema, updateUserSchema, createRolSchema, updateRolSchema } from '../validations/index.js'

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
    res.json({ 
      success: true, 
      data: roles.map(r => ({
        ...r,
        usuariosCount: r.usuarios.length
      }))
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener roles',
      code: 'FETCH_ERROR'
    })
  }
})

// Get all permisos
router.get('/permisos', async (req, res) => {
  try {
    const permisos = await prisma.permiso.findMany({
      orderBy: [{ modulo: 'asc' }, { accion: 'asc' }]
    })
    
    const grouped: Record<string, string[]> = {}
    permisos.forEach(p => {
      if (!grouped[p.modulo]) grouped[p.modulo] = []
      grouped[p.modulo].push(p.accion)
    })
    
    res.json({ success: true, data: { permisos, grouped } })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener permisos',
      code: 'FETCH_ERROR'
    })
  }
})

// Create rol
router.post('/roles', validate(createRolSchema), async (req, res) => {
  try {
    const { nombre, descripcion, permisos } = req.body

    const existing = await prisma.rol.findUnique({ where: { nombre } })
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya existe un rol con ese nombre',
        code: 'DUPLICATE_ROLE'
      })
    }

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

    res.status(201).json({ success: true, data: rol })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear rol',
      code: 'CREATE_ERROR'
    })
  }
})

// Update rol
router.put('/roles/:id', validate(updateRolSchema), async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, descripcion, permisos } = req.body

    const rolActual = await prisma.rol.findUnique({ 
      where: { id: parseInt(id) },
      include: { permisos: true }
    })

    if (!rolActual) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rol no encontrado',
        code: 'NOT_FOUND'
      })
    }

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

    res.json({ success: true, data: rol })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar rol',
      code: 'UPDATE_ERROR'
    })
  }
})

// Delete rol
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const usuariosConRol = await prisma.usuarioRol.count({
      where: { rolId: parseInt(id) }
    })

    if (usuariosConRol > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar un rol que tiene usuarios asignados',
        code: 'ROLE_IN_USE'
      })
    }

    await prisma.rol.delete({ where: { id: parseInt(id) } })
    res.json({ success: true, message: 'Rol eliminado correctamente' })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar rol',
      code: 'DELETE_ERROR'
    })
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
    
    res.json({ 
      success: true, 
      data: usuarios.map(u => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        activo: u.activo,
        createdAt: u.createdAt,
        roles: u.usuarioRoles.map(ur => ur.rol.nombre)
      }))
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios',
      code: 'FETCH_ERROR'
    })
  }
})

// Create usuario
router.post('/usuarios', validate(createUserSchema), async (req, res) => {
  try {
    const { email, nombre, password, rol, activo } = req.body

    const hashedPassword = await bcrypt.hash(password, 12) // Más iteraciones = más seguro

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

    res.status(201).json({
      success: true,
      data: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: usuario.activo,
        createdAt: usuario.createdAt
      }
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false, 
        message: 'El email ya está registrado',
        code: 'DUPLICATE_EMAIL'
      })
    }
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear usuario',
      code: 'CREATE_ERROR'
    })
  }
})

// Update usuario
router.put('/usuarios/:id', validate(updateUserSchema), async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, rol, activo, password } = req.body

    const usuarioActual = await prisma.user.findUnique({ 
      where: { id: parseInt(id) }
    })

    if (!usuarioActual) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado',
        code: 'NOT_FOUND'
      })
    }

    const updateData: any = {}
    if (nombre) updateData.nombre = nombre
    if (typeof activo === 'boolean') updateData.activo = activo
    if (rol) updateData.rol = rol
    if (password) updateData.password = await bcrypt.hash(password, 12)

    if (rol) {
      const rolEncontrado = await prisma.rol.findUnique({ where: { nombre: rol } })
      if (rolEncontrado) {
        await prisma.usuarioRol.deleteMany({ where: { usuarioId: parseInt(id) } })
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
      success: true,
      data: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: usuario.activo,
        createdAt: usuario.createdAt
      }
    })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar usuario',
      code: 'UPDATE_ERROR'
    })
  }
})

// Delete usuario
router.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const userId = (req as any).user?.id
    if (userId === parseInt(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'No puedes eliminarte a ti mismo',
        code: 'SELF_DELETE'
      })
    }

    await prisma.user.delete({ where: { id: parseInt(id) } })
    res.json({ success: true, message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar usuario',
      code: 'DELETE_ERROR'
    })
  }
})

// ============================================
// OTROS
// ============================================

// Delete all servidores
router.delete('/servidores', async (req, res) => {
  try {
    await prisma.servidor.deleteMany({})
    res.json({ success: true, message: 'Todos los servidores eliminados' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar servidores',
      code: 'DELETE_ERROR'
    })
  }
})

export default router
