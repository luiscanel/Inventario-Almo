import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma/index'
import { config } from '../config/index.js'
import { validate, loginSchema } from '../validations/index.js'
import { createAuditLog, getRequestInfo } from '../services/auditLogService.js'

const router = Router()

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body

    const usuario = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        usuarioRoles: {
          include: {
            rol: {
              include: {
                permisos: { include: { modulo: true } },
                roles: { include: { modulo: true } }
              }
            }
          }
        }
      }
    })

    if (!usuario) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      })
    }

    if (!usuario.activo) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario inactivo',
        code: 'USER_INACTIVE'
      })
    }

    const validPassword = await bcrypt.compare(password, usuario.password)
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      })
    }

    // Extraer permisos únicos (de roles -> módulos -> permisos)
    const permisosSet = new Set<string>()
    const permisos: { modulo: string; accion: string }[] = []
    const modulosSet = new Set<string>()
    const modulos: string[] = []

    for (const ur of usuario.usuarioRoles) {
      // Extraer módulos del rol
      for (const rm of ur.rol.roles || []) {
        if (!modulosSet.has(rm.modulo.nombre)) {
          modulosSet.add(rm.modulo.nombre)
          modulos.push(rm.modulo.nombre)
        }
      }
      // Extraer permisos del rol
      for (const p of ur.rol.permisos || []) {
        const key = `${p.modulo.nombre}_${p.accion}`
        if (!permisosSet.has(key)) {
          permisosSet.add(key)
          permisos.push({ modulo: p.modulo.nombre, accion: p.accion })
        }
      }
    }

    // Extraer nombres de roles
    const roles = usuario.usuarioRoles.map(ur => ur.rol.nombre)

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        roles,
        modulos,
        permisos
      }
    })

    // Audit log de login
    createAuditLog({
      usuarioId: usuario.id,
      usuario: usuario.email,
      accion: 'login',
      entidad: 'User',
      entidadId: usuario.id,
      ...getRequestInfo(req)
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      code: 'SERVER_ERROR'
    })
  }
})

export default router
