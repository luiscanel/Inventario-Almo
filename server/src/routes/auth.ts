import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma/index'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'inventario-almo-secret-key-2024'

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' })
    }

    // Validate domain
    if (!email.toLowerCase().endsWith('@grupoalmo.com')) {
      return res.status(400).json({ message: 'Solo se permiten usuarios con dominio @grupoalmo.com' })
    }

    const usuario = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        usuarioRoles: {
          include: {
            rol: {
              include: {
                permisos: true
              }
            }
          }
        }
      }
    })

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    if (!usuario.activo) {
      return res.status(401).json({ message: 'Usuario inactivo' })
    }

    const validPassword = await bcrypt.compare(password, usuario.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    // Extraer permisos únicos
    const permisosSet = new Set<string>()
    const permisos: { modulo: string; accion: string }[] = []

    for (const ur of usuario.usuarioRoles) {
      for (const p of ur.rol.permisos) {
        const key = `${p.modulo}_${p.accion}`
        if (!permisosSet.has(key)) {
          permisosSet.add(key)
          permisos.push({ modulo: p.modulo, accion: p.accion })
        }
      }
    }

    // Extraer nombres de roles
    const roles = usuario.usuarioRoles.map(ur => ur.rol.nombre)

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        roles,
        permisos
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

export default router
