// Tipos centralizados para el API
export interface Servidor {
  id: number
  pais: string
  host: string
  nombreVM: string | null
  ip: string | null
  cpu: number | null
  memoria: string | null
  disco: string | null
  ambiente: string
  arquitectura: string | null
  sistemaOperativo: string | null
  version: string | null
  antivirus: string | null
  estado: string
  responsable: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Usuario {
  id: number
  email: string
  nombre: string
  rol: 'admin' | 'editor' | 'viewer'
  activo: boolean
  createdAt: string
}

export interface InventarioFisico {
  id: number
  pais: string
  categoria: string
  marca: string
  modelo: string | null
  serie: string | null
  inventario: string | null
  estado: string
  responsable: string | null
  observaciones: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  total: number
  activos: number
  inactivos: number
  mantenimiento: number
  decomisionados: number
  porPais: { pais: string; count: number }[]
  porAmbiente: { ambiente: string; count: number }[]
  porEstado: { estado: string; count: number }[]
  porSO: { so: string; count: number }[]
}

export interface SecurityStats {
  totalVMs: number
  conAntivirus: number
  sinAntivirus: number
  porcentajeProtegido: number
  porAntivirus: { antivirus: string; count: number }[]
  vmsSinAntivirus: Servidor[]
  porArquitectura: { name: string; count: number }[]
  porSO: { name: string; count: number }[]
  porPaisYSistema?: { pais: string; sistemas: { name: string; count: number }[] }[]
}

export interface ResourcesStats {
  totalVMs: number
  conRecursos: number
  stats: {
    cpu: { avg: number; max: number; min: number }
    memoria: { avg: number; max: number }
    disco: { total: number; avg: number }
  }
  porCpuRango: { range: string; count: number }[]
  porMemoriaRango: { range: string; count: number }[]
  porAmbiente: { ambiente: string; cpu: number; memoria: number; disco: number; count: number }[]
  porPais: { pais: string; cpu: number; memoria: number; disco: number; count: number }[]
  topCpu: any[]
  topMemoria: any[]
  topDisco: any[]
}

export interface EmailConfig {
  id?: number
  host: string
  puerto: number
  usuario: string
  contrasena?: string
  usandoTls: boolean
  emailFrom: string
  activo?: boolean
}

// Tipos para respuestas API
export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

export interface ImportResult {
  message: string
  count: number
  skipped: number
}
