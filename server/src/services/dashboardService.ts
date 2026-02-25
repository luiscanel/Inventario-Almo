import { prisma } from '../prisma/index'

// Tipos para estadísticas
interface CountByKey {
  [key: string]: number
}

interface ServidorBasic {
  id: number
  host: string
  nombreVM: string | null
  ip: string | null
  pais: string | null
  ambiente: string | null
  estado: string | null
  antivirus?: string | null
  arquitectura?: string | null
  sistemaOperativo?: string | null
  version?: string | null
  cpu?: number | null
  memoria?: number | null
  disco?: number | null
  responsable?: string | null
  createdAt?: Date
  updatedAt?: Date
}

// Funciones utilitarias
function groupBy<T extends Record<string, any>>(items: T[], key: keyof T): CountByKey {
  return items.reduce((acc, item) => {
    const value = String(item[key] || 'No especificado')
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {} as CountByKey)
}

function toSortedArray(countByKey: CountByKey): { name: string; count: number }[] {
  return Object.entries(countByKey)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function calculatePercentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

// Parsea valores que pueden venir como string (ej: "60 GB", "8") a número
function parseToNumber(value: any): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Eliminar "GB", "GB", espacios, etc y convertir a número
    const num = parseFloat(value.replace(/[^\d.]/g, ''))
    return isNaN(num) ? 0 : num
  }
  return 0
}

// Servicio de Seguridad
export async function getSecurityStats() {
  const servidores = await prisma.servidor.findMany()

  // Antivirus grouping
  const antivirusCounts = groupBy(servidores, 'antivirus')
  const porAntivirus = toSortedArray(antivirusCounts).map(item => ({
    antivirus: item.name || 'Sin antivirus',
    count: item.count
  }))

  // VMs sin antivirus
  const vmsSinAntivirus = servidores
    .filter(s => !s.antivirus?.trim())
    .map(s => ({
      id: s.id,
      host: s.host,
      nombreVM: s.nombreVM,
      ip: s.ip,
      pais: s.pais,
      ambiente: s.ambiente,
      estado: s.estado
    }))

  // Arquitecturas
  const porArquitectura = toSortedArray(groupBy(servidores, 'arquitectura'))

  // Sistemas Operativos
  const porSO = toSortedArray(groupBy(servidores, 'sistemaOperativo'))

  // SO por país
  const soPorPais: Record<string, CountByKey> = {}
  servidores.forEach(s => {
    const pais = s.pais || 'Sin país'
    const so = s.sistemaOperativo || 'No especificado'
    if (!soPorPais[pais]) soPorPais[pais] = {}
    soPorPais[pais][so] = (soPorPais[pais][so] || 0) + 1
  })

  const porPaisYSistema = Object.entries(soPorPais).map(([pais, sos]) => ({
    pais,
    sistemas: toSortedArray(sos)
  }))

  const totalVMs = servidores.length
  const conAntivirus = totalVMs - vmsSinAntivirus.length

  return {
    totalVMs,
    conAntivirus,
    sinAntivirus: vmsSinAntivirus.length,
    porcentajeProtegido: calculatePercentage(conAntivirus, totalVMs),
    porAntivirus,
    vmsSinAntivirus,
    porArquitectura,
    porSO,
    porPaisYSistema
  }
}

// Servicio de Recursos
export async function getResourcesStats() {
  const servidores = await prisma.servidor.findMany()
  
  const serversWithResources = servidores.filter(s => parseToNumber(s.cpu) > 0 || parseToNumber(s.memoria) > 0 || parseToNumber(s.disco) > 0)
  
  const cpuValues = serversWithResources.map(s => parseToNumber(s.cpu))
  const memValues = serversWithResources.map(s => parseToNumber(s.memoria))
  const diskValues = serversWithResources.map(s => parseToNumber(s.disco))

  const stats = {
    cpu: {
      avg: cpuValues.length ? Math.round(cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length) : 0,
      max: Math.max(...cpuValues, 0),
      min: Math.min(...cpuValues.filter(v => v > 0), 0)
    },
    memoria: {
      avg: memValues.length ? Math.round(memValues.reduce((a, b) => a + b, 0) / memValues.length) : 0,
      max: Math.max(...memValues, 0)
    },
    disco: {
      total: diskValues.reduce((a, b) => a + b, 0),
      avg: diskValues.length ? Math.round(diskValues.reduce((a, b) => a + b, 0) / diskValues.length) : 0
    }
  }

  // Ranges
  const cpuRanges = [
    { range: '1-2 CPU', min: 1, max: 2 },
    { range: '3-4 CPU', min: 3, max: 4 },
    { range: '5-8 CPU', min: 5, max: 8 },
    { range: '9-16 CPU', min: 9, max: 16 },
    { range: '>16 CPU', min: 17, max: Infinity }
  ]

  const porCpuRango = cpuRanges.map(r => ({
    range: r.range,
    count: serversWithResources.filter(s => {
      const cpu = parseToNumber(s.cpu)
      return r.max === Infinity ? cpu > r.min : cpu >= r.min && cpu <= r.max
    }).length
  })).filter(r => r.count > 0)

  const memRanges = [
    { range: '1-4 GB', min: 1, max: 4 },
    { range: '5-8 GB', min: 5, max: 8 },
    { range: '9-16 GB', min: 9, max: 16 },
    { range: '17-32 GB', min: 17, max: 32 },
    { range: '33-64 GB', min: 33, max: 64 },
    { range: '>64 GB', min: 65, max: Infinity }
  ]

  const porMemoriaRango = memRanges.map(r => ({
    range: r.range,
    count: serversWithResources.filter(s => {
      const mem = parseToNumber(s.memoria)
      return r.max === Infinity ? mem > r.min : mem >= r.min && mem <= r.max
    }).length
  })).filter(r => r.count > 0)

  // Por ambiente
  const porAmbiente = Object.entries(groupBy(servidores, 'ambiente')).map(([ambiente, count]) => {
    const servers = servidores.filter(s => s.ambiente === ambiente)
    return {
      ambiente,
      cpu: Math.round(servers.reduce((a, s) => a + parseToNumber(s.cpu), 0)),
      memoria: Math.round(servers.reduce((a, s) => a + parseToNumber(s.memoria), 0)),
      disco: Math.round(servers.reduce((a, s) => a + parseToNumber(s.disco), 0)),
      count
    }
  })

  // Por país
  const porPais = Object.entries(groupBy(servidores, 'pais')).map(([pais, count]) => {
    const servers = servidores.filter(s => s.pais === pais)
    return {
      pais,
      cpu: Math.round(servers.reduce((a, s) => a + parseToNumber(s.cpu), 0)),
      memoria: Math.round(servers.reduce((a, s) => a + parseToNumber(s.memoria), 0)),
      disco: Math.round(servers.reduce((a, s) => a + parseToNumber(s.disco), 0)),
      count
    }
  })

  // Top servers
  const topCpu = [...servidores]
    .filter(s => parseToNumber(s.cpu) > 0)
    .sort((a, b) => parseToNumber(b.cpu) - parseToNumber(a.cpu))
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      host: s.host,
      nombreVM: s.nombreVM,
      cpu: parseToNumber(s.cpu),
      pais: s.pais,
      ambiente: s.ambiente,
      estado: s.estado
    }))

  const topMemoria = [...servidores]
    .filter(s => parseToNumber(s.memoria) > 0)
    .sort((a, b) => parseToNumber(b.memoria) - parseToNumber(a.memoria))
    .slice(0, 10)
    .map(s => ({
      host: s.host,
      nombreVM: s.nombreVM,
      memoria: parseToNumber(s.memoria),
      pais: s.pais,
      ambiente: s.ambiente,
      estado: s.estado
    }))

  const topDisco = [...servidores]
    .filter(s => parseToNumber(s.disco) > 0)
    .sort((a, b) => parseToNumber(b.disco) - parseToNumber(a.disco))
    .slice(0, 10)
    .map(s => ({
      host: s.host,
      nombreVM: s.nombreVM,
      disco: parseToNumber(s.disco),
      pais: s.pais,
      ambiente: s.ambiente
    }))

  return {
    totalVMs: servidores.length,
    conRecursos: serversWithResources.length,
    stats,
    porCpuRango,
    porMemoriaRango,
    porAmbiente,
    porPais,
    topCpu,
    topMemoria,
    topDisco
  }
}

// Servicio de Disponibilidad
export async function getAvailabilityStats() {
  const servidores = await prisma.servidor.findMany({
    orderBy: { updatedAt: 'desc' }
  })

  const porEstado = toSortedArray(groupBy(servidores, 'estado'))
  const porAmbiente = toSortedArray(groupBy(servidores, 'ambiente'))
  const porPais = toSortedArray(groupBy(servidores, 'pais'))

  const vmsInactivos = servidores
    .filter(s => s.estado === 'Inactivo')
    .map(s => ({
      id: s.id,
      host: s.host,
      nombreVM: s.nombreVM,
      ip: s.ip,
      pais: s.pais,
      ambiente: s.ambiente,
      updatedAt: s.updatedAt
    }))

  const vmsMantenimiento = servidores
    .filter(s => s.estado === 'Mantenimiento')
    .map(s => ({
      id: s.id,
      host: s.host,
      nombreVM: s.nombreVM,
      pais: s.pais,
      ambiente: s.ambiente,
      updatedAt: s.updatedAt
    }))

  const vmsDecomisionados = servidores
    .filter(s => s.estado === 'Decomisionado')
    .map(s => ({
      id: s.id,
      host: s.host,
      nombreVM: s.nombreVM,
      pais: s.pais,
      ambiente: s.ambiente,
      updatedAt: s.updatedAt
    }))

  // Timeline de estados
  const timeline: Record<string, CountByKey> = {}
  servidores.forEach(s => {
    const mes = s.updatedAt ? new Date(s.updatedAt).toISOString().slice(0, 7) : 'Sin fecha'
    if (!timeline[mes]) timeline[mes] = {}
    timeline[mes][s.estado] = (timeline[mes][s.estado] || 0) + 1
  })

  const timelineData = Object.entries(timeline)
    .map(([periodo, estados]) => ({
      periodo,
      count: Object.values(estados).reduce((a, b) => a + b, 0),
      ...estados
    }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .slice(-12)

  // Calcular stats
  const vmsActivos = servidores.filter(s => s.estado === 'Activo').length
  const vmsNoActivos = servidores.length - vmsActivos
  const porcentajeActivos = servidores.length > 0 
    ? Math.round((vmsActivos / servidores.length) * 100) 
    : 0

  return {
    totalVMs: servidores.length,
    vmsActivos,
    vmsNoActivos,
    porcentajeActivos,
    porEstado,
    porAmbiente,
    porPais,
    vmsInactivos,
    vmsMantenimiento,
    vmsDecomisionados,
    timeline: timelineData,
    ultimaActualizacion: servidores[0]?.updatedAt
  }
}

// Servicio de Inventario Físico
export async function getPhysicalStats() {
  const equipos = await prisma.inventarioFisico.findMany()

  const porEstado = toSortedArray(groupBy(equipos, 'estado'))
  const porCategoria = toSortedArray(groupBy(equipos, 'categoria'))
  const porMarca = toSortedArray(groupBy(equipos, 'marca'))
  const porPais = toSortedArray(groupBy(equipos, 'pais'))
  const porResponsable = toSortedArray(groupBy(equipos, 'responsable'))
  const porModelo = toSortedArray(groupBy(equipos, 'modelo'))

  // Equipos con garantía expirada
  const hoy = new Date()
  const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Función para parsear fecha de garantía
  const parseGarantia = (g: string | null): Date | null => {
    if (!g || g === 'Sin Garantia' || g === 'n/a' || g.trim() === '') return null
    const date = new Date(g)
    return isNaN(date.getTime()) ? null : date
  }

  const garantiaProxima = equipos
    .filter(e => {
      const fecha = parseGarantia(e.garantia)
      return fecha && fecha > hoy && fecha <= treintaDias
    })
    .map(e => ({
      id: e.id,
      equipo: e.equipo,
      modelo: e.modelo,
      serie: e.serie,
      garantia: e.garantia!,
      responsable: e.responsable,
      pais: e.pais
    }))

  const garantiaVencida = equipos
    .filter(e => {
      const fecha = parseGarantia(e.garantia)
      return fecha && fecha <= hoy
    })
    .map(e => ({
      id: e.id,
      equipo: e.equipo,
      modelo: e.modelo,
      serie: e.serie,
      garantia: e.garantia!,
      responsable: e.responsable,
      pais: e.pais
    }))

  // Cobertura de IP
  const conIP = equipos.filter(e => e.direccionIp && e.direccionIp.trim()).length
  const sinIP = equipos.length - conIP

  // Cobertura de ILO
  const conIlo = equipos.filter(e => e.ilo && e.ilo.trim()).length
  const sinIlo = equipos.length - conIlo

  return {
    totalEquipos: equipos.length,
    porEstado,
    porCategoria,
    porMarca,
    porPais,
    porResponsable,
    porModelo,
    garantiaProxima,
    garantiaVencida,
    conIp: conIP,
    sinIp: sinIP,
    conIlo,
    sinIlo
  }
}

// Servicio de Responsables
export async function getResponsablesStats() {
  const servidores = await prisma.servidor.findMany()
  const equiposFisicos = await prisma.inventarioFisico.findMany()

  // Combinar responsables de VMs y equipos físicos
  const allResponsables = new Map<string, {
    totalVMs: number
    vmsActivos: number
    vmsInactivos: number
    vmsMantenimiento: number
    totalEquipos: number
    paises: string[]
    categorias: string[]
  }>()

  // Procesar VMs (servidores)
  servidores.forEach(s => {
    const resp = s.responsable || 'Sin asignar'
    if (!allResponsables.has(resp)) {
      allResponsables.set(resp, {
        totalVMs: 0,
        vmsActivos: 0,
        vmsInactivos: 0,
        vmsMantenimiento: 0,
        totalEquipos: 0,
        paises: [],
        categorias: []
      })
    }
    const data = allResponsables.get(resp)!
    data.totalVMs++
    if (s.estado === 'Activo') data.vmsActivos++
    if (s.estado === 'Inactivo') data.vmsInactivos++
    if (s.estado === 'Mantenimiento') data.vmsMantenimiento++
    if (s.pais && !data.paises.includes(s.pais)) data.paises.push(s.pais)
  })

  // Procesar equipos físicos
  equiposFisicos.forEach(e => {
    const resp = e.responsable || 'Sin asignar'
    if (!allResponsables.has(resp)) {
      allResponsables.set(resp, {
        totalVMs: 0,
        vmsActivos: 0,
        vmsInactivos: 0,
        vmsMantenimiento: 0,
        totalEquipos: 0,
        paises: [],
        categorias: []
      })
    }
    const data = allResponsables.get(resp)!
    data.totalEquipos++
    if (e.pais && !data.paises.includes(e.pais)) data.paises.push(e.pais)
    if (e.categoria && !data.categorias.includes(e.categoria)) data.categorias.push(e.categoria)
  })

  // Calcular estadísticas
  const responsablesCombinados = Array.from(allResponsables.entries())
    .map(([responsable, data]) => ({
      responsable,
      totalVMs: data.totalVMs,
      vmsActivos: data.vmsActivos,
      vmsInactivos: data.vmsInactivos,
      vmsMantenimiento: data.vmsMantenimiento,
      totalEquipos: data.totalEquipos,
      paises: data.paises,
      categorias: data.categorias
    }))
    .sort((a, b) => (b.totalVMs + b.totalEquipos) - (a.totalVMs + a.totalEquipos))

  const listaResponsables = responsablesCombinados.map(r => r.responsable)

  // Calcular VMs con responsable
  const vmsConResponsable = servidores.filter(s => s.responsable).length
  const equiposConResponsable = equiposFisicos.filter(e => e.responsable).length

  return {
    totalVMs: servidores.length,
    totalEquipos: equiposFisicos.length,
    vmsConResponsable,
    equiposConResponsable,
    porcentajeVMsConResponsable: servidores.length > 0 ? Math.round((vmsConResponsable / servidores.length) * 100) : 0,
    porcentajeEquiposConResponsable: equiposFisicos.length > 0 ? Math.round((equiposConResponsable / equiposFisicos.length) * 100) : 0,
    responsablesCombinados,
    listaResponsables
  }
}
