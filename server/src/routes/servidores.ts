import { Router } from 'express'
import { prisma } from '../prisma/index'
import { authMiddleware } from '../middleware/auth'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const servidores = await prisma.servidor.findMany({
      orderBy: { id: 'desc' }
    })
    res.json(servidores)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al obtener servidores' })
  }
})

router.post('/', async (req, res) => {
  try {
    const servidor = await prisma.servidor.create({
      data: req.body
    })
    res.json(servidor)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al crear servidor' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const servidor = await prisma.servidor.update({
      where: { id: parseInt(id) },
      data: req.body
    })
    res.json(servidor)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al actualizar servidor' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.servidor.delete({
      where: { id: parseInt(id) }
    })
    res.json({ message: 'Servidor eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error al eliminar servidor' })
  }
})

// Eliminación masiva
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body as { ids: number[] }
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' })
    }
    await prisma.servidor.deleteMany({
      where: { id: { in: ids } }
    })
    res.json({ message: `${ids.length} servidores eliminados` })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ message: 'Error en eliminación masiva' })
  }
})

// Importar múltiples servidores
router.post('/import', async (req, res) => {
  try {
    console.log('=== RAW BODY ===')
    console.log(JSON.stringify(req.body, null, 2))
    
    const servidores = req.body.servidores as Array<{
      pais?: string
      host?: string
      nombreVM?: string
      ip?: string
      cpu?: number
      memoria?: string
      disco?: string
      ambiente?: string
      arquitectura?: string
      sistemaOperativo?: string
      version?: string
      antivirus?: string
      estado?: string
      responsable?: string
    }>

    if (!Array.isArray(servidores) || servidores.length === 0) {
      return res.status(400).json({ message: 'No se encontraron servidores para importar' })
    }

    console.log('=== FIRST SERVER RAW ===')
    console.log(JSON.stringify(servidores[0], null, 2))

    const dataToInsert = servidores.map(s => {
      const str = (v: any) => v === null || v === undefined ? null : String(v).trim() || null
      const server = s as any
      
      // Handle case variations for nombreVM and version
      const nombreVM = server.nombreVM || server.nombreVm || server.nombrevm || null
      const version = server.version || server.versionOs || server.versionos || null

      // Función para parsear y redondear números
      const parseNumber = (v: any): string => {
        if (v === null || v === undefined) return null
        const num = parseFloat(String(v).replace(/[^0-9.]/g, ''))
        if (isNaN(num)) return null
        return Math.round(num).toString()
      }

      return {
        pais: str(server.pais) || 'Colombia',
        host: str(server.host) || '',
        nombreVM: str(nombreVM),
        ip: str(server.ip),
        cpu: parseInt(String(server.cpu)) || 0,
        memoria: parseNumber(server.memoria),
        disco: parseNumber(server.disco),
        ambiente: str(server.ambiente) || 'Produccion',
        arquitectura: str(s.arquitectura) || 'x86_64',
        sistemaOperativo: str(s.sistemaOperativo),
        version: str(version),
        antivirus: str(s.antivirus),
        estado: str(s.estado) || 'Activo',
        responsable: str(s.responsable)
      }
    })

    console.log('Inserting data:', JSON.stringify(dataToInsert, null, 2))

    // Filtrar registros con IP vacía o nula
    const validData = dataToInsert.filter(s => s.ip)
    
    if (validData.length === 0) {
      return res.status(400).json({ message: 'No hay servidores con IP válida para importar' })
    }

    // Obtener IPs existentes
    const existingServers = await prisma.servidor.findMany({
      where: { ip: { in: validData.map(s => s.ip!) } },
      select: { ip: true }
    })
    const existingIPs = new Set(existingServers.map(s => s.ip))

    // Filtrar duplicados
    const newData = validData.filter(s => !existingIPs.has(s.ip!))

    if (newData.length === 0) {
      return res.status(400).json({ message: 'Todos los servidores ya existen en la base de datos' })
    }

    // Insertar uno por uno para SQLite
    let created = 0
    for (const server of newData) {
      try {
        await prisma.servidor.create({ data: server })
        created++
      } catch (e: any) {
        console.log(`Skipping duplicate: ${server.ip}`)
      }
    }

    res.json({ message: `${created} servidores importados correctamente`, count: created, skipped: validData.length - created })
  } catch (error: any) {
    console.error('Error importing:', error)
    res.status(500).json({ message: `Error al importar servidores: ${error.message}` })
  }
})

export default router
