import { Router } from 'express'
import { prisma } from '../prisma/index'
import { authMiddleware } from '../middleware/auth'
import { validate, inventarioCloudSchema, inventarioCloudUpdateSchema, inventarioCloudImportSchema, bulkDeleteSchema } from '../validations/index.js'

const router = Router()

router.use(authMiddleware)

// Obtener todos los items
router.get('/', async (req, res) => {
  try {
    const items = await prisma.inventarioCloud.findMany({
      orderBy: { id: 'desc' }
    })
    res.json({ success: true, data: items })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener inventario cloud',
      code: 'FETCH_ERROR'
    })
  }
})

// Crear item
router.post('/', validate(inventarioCloudSchema), async (req, res) => {
  try {
    const item = await prisma.inventarioCloud.create({
      data: req.body
    })
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear item',
      code: 'CREATE_ERROR'
    })
  }
})

// Actualizar item
router.put('/:id', validate(inventarioCloudUpdateSchema), async (req, res) => {
  try {
    const { id } = req.params
    const item = await prisma.inventarioCloud.update({
      where: { id: parseInt(id) },
      data: req.body
    })
    res.json({ success: true, data: item })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar item',
      code: 'UPDATE_ERROR'
    })
  }
})

// Eliminar item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.inventarioCloud.delete({
      where: { id: parseInt(id) }
    })
    res.json({ success: true, message: 'Item eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar item',
      code: 'DELETE_ERROR'
    })
  }
})

// Eliminación masiva
router.post('/bulk-delete', validate(bulkDeleteSchema), async (req, res) => {
  try {
    const { ids } = req.body
    
    const numericIds = ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
    
    await prisma.inventarioCloud.deleteMany({
      where: { id: { in: numericIds } }
    })
    res.json({ success: true, message: `${numericIds.length} instancias eliminadas` })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error en eliminación masiva',
      code: 'BULK_DELETE_ERROR'
    })
  }
})

// Importar items
router.post('/import', validate(inventarioCloudImportSchema), async (req, res) => {
  try {
    const { items } = req.body

    const str = (v: any) => {
      if (v === null || v === undefined) return null
      const trimmed = String(v).trim()
      return trimmed || null
    }

    const num = (v: any) => {
      if (v === null || v === undefined) return null
      const parsed = parseInt(String(v))
      return isNaN(parsed) ? null : parsed
    }

    const dataToInsert = items.map((s: any) => ({
      tenant: str(s.tenant),
      nube: str(s.nube),
      instanceName: str(s.instanceName),
      ipPublica: str(s.ipPublica) || str(s.IPPublica),
      ipPrivada: str(s.ipPrivada) || str(s.IPPrivada),
      instanceType: str(s.instanceType) || str(s.InstanceType),
      cpu: num(s.cpu) || num(s.Cpu),
      ram: str(s.ram) || str(s.Ram),
      storageGib: str(s.storageGib) || str(s['Storage GiB']),
      sistemaOperativo: str(s.sistemaOperativo) || str(s['Sistema Operativo']),
      costoUsd: str(s.costoUsd) || str(s['Costo US$']),
      hostName: str(s.hostName) || str(s.HostName),
      responsable: str(s.responsable) || str(s.Responsable),
      modoUso: str(s.modoUso) || str(s['Modo USO']),
      service: str(s.service) || str(s.Service)
    }))

    // Filtrar items válidos
    const validData = dataToInsert.filter((s: any) => s.instanceName || s.ipPublica || s.ipPrivada)
    
    if (validData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay items válidos para importar',
        code: 'NO_VALID_ITEMS'
      })
    }

    let created = 0
    let skipped = 0

    for (const item of validData) {
      try {
        await prisma.inventarioCloud.create({ data: item })
        created++
      } catch (e: any) {
        skipped++
      }
    }

    res.json({ 
      success: true, 
      message: `${created} instancias importadas correctamente`, 
      count: created, 
      skipped 
    })
  } catch (error: any) {
    console.error('Error importing:', error)
    res.status(500).json({ 
      success: false, 
      message: `Error al importar: ${error.message}`,
      code: 'IMPORT_ERROR'
    })
  }
})

export default router
