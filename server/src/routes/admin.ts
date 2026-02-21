import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../prisma/index'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

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

router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(usuarios)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al obtener usuarios' })
  }
})

router.post('/usuarios', async (req, res) => {
  try {
    const { email, nombre, password, rol } = req.body

    if (!email || !nombre || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }

    // Validate domain
    if (!email.toLowerCase().endsWith('@grupoalmo.com')) {
      return res.status(400).json({ message: 'Solo se permiten correos con dominio @grupoalmo.com' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const usuario = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        nombre,
        password: hashedPassword,
        rol: rol || 'editor'
      }
    })

    res.json({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
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

export default router
