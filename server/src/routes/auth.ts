import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = Router()
const prisma = new PrismaClient()
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
      where: { email: email.toLowerCase() }
    })

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const validPassword = await bcrypt.compare(password, usuario.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

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
        rol: usuario.rol
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

export default router
