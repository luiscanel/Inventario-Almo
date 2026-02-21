import { Router } from 'express'
import { prisma } from '../prisma/index'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const items = await prisma.inventarioFisico.findMany({
      orderBy: { id: 'desc' }
    })
    res.json(items)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al obtener inventario físico' })
  }
})

router.post('/', async (req, res) => {
  try {
    const item = await prisma.inventarioFisico.create({
      data: req.body
    })
    res.json(item)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al crear item' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const item = await prisma.inventarioFisico.update({
      where: { id: parseInt(id) },
      data: req.body
    })
    res.json(item)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al actualizar item' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.inventarioFisico.delete({
      where: { id: parseInt(id) }
    })
    res.json({ message: 'Item eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al eliminar item' })
  }
})

router.post('/import', async (req, res) => {
  try {
    const items = req.body.items as Array<{
      pais?: string
      categoria?: string
      marca?: string
      modelo?: string
      serie?: string
      inventario?: string
      estado?: string
      responsable?: string
      observaciones?: string
      equipo?: string
      direccionIp?: string
      ilo?: string
      descripcion?: string
      serial?: string
      sistemaOperativo?: string
      garantia?: string
    }>

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No se encontraron items para importar' })
    }

    const str = (v: any) => v === null || v === undefined ? null : String(v).trim() || null

    const dataToInsert = items.map(s => ({
      pais: str(s.pais) || 'Colombia',
      categoria: str(s.categoria) || 'Servidor',
      marca: str(s.marca) || 'Dell',
      modelo: str(s.modelo),
      serie: str(s.serie),
      inventario: str(s.inventario),
      estado: str(s.estado) || 'Activo',
      responsable: str(s.responsable),
      observaciones: str(s.observaciones) || str(s.descripcion),
      equipo: str(s.equipo),
      direccionIp: str(s.direccionIp),
      ilo: str(s.ilo),
      serial: str(s.serial),
      sistemaOperativo: str(s.sistemaOperativo),
      garantia: str(s.garantia)
    }))

    console.log('Inserting inventario fisico:', JSON.stringify(dataToInsert, null, 2))

    const validData = dataToInsert.filter(s => s.equipo || s.direccionIp || s.serie)
    
    if (validData.length === 0) {
      return res.status(400).json({ message: 'No hay items válidos para importar' })
    }

    let created = 0
    for (const item of validData) {
      try {
        await prisma.inventarioFisico.create({ data: item })
        created++
      } catch (e) {
        console.log(`Skipping duplicate: ${item.equipo}`)
      }
    }

    res.json({ message: `${created} items importados correctamente`, count: created, skipped: validData.length - created })
  } catch (error: any) {
    console.error('Error importing:', error)
    res.status(500).json({ message: `Error al importar: ${error.message}` })
  }
})

export default router
