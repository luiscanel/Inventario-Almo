import { useAuthStore } from '@/store/authStore'
import type { Servidor, Usuario, InventarioFisico, SecurityStats, ResourcesStats, EmailConfig, ImportResult } from '@/types/api'

const API_URL = '/api'

// ============================================
// Utility Functions
// ============================================

function getToken(): string | null {
  // Try localStorage first, then Zustand store
  return localStorage.getItem('token') || useAuthStore.getState().token || null
}

function getHeaders(): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de red' }))
    throw new Error(error.message || `Error ${response.status}`)
  }
  return response.json()
}

// ============================================
// Authentication
// ============================================

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de autenticación' }))
    throw new Error(error.message)
  }
  
  const data = await res.json()
  localStorage.setItem('token', data.token)
  return data
}

// ============================================
// Servidores
// ============================================

export async function getServidores(): Promise<Servidor[]> {
  const res = await fetch(`${API_URL}/servidores`, {
    headers: getHeaders(),
  })
  return handleResponse<Servidor[]>(res)
}

export async function createServidor(data: Partial<Servidor>): Promise<Servidor> {
  const res = await fetch(`${API_URL}/servidores`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Servidor>(res)
}

export async function updateServidor(id: number, data: Partial<Servidor>): Promise<Servidor> {
  const res = await fetch(`${API_URL}/servidores/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Servidor>(res)
}

export async function deleteServidor(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/servidores/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  
  if (!res.ok) {
    throw new Error('Error al eliminar servidor')
  }
}

export async function deleteServidoresBulk(ids: number[]): Promise<void> {
  const res = await fetch(`${API_URL}/servidores/bulk-delete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ids }),
  })
  
  if (!res.ok) {
    throw new Error('Error en eliminación masiva')
  }
}

export async function importServidores(servidores: Partial<Servidor>[]): Promise<ImportResult> {
  const res = await fetch(`${API_URL}/servidores/import`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ servidores }),
  })
  return handleResponse<ImportResult>(res)
}

// ============================================
// Inventario Físico
// ============================================

export async function getInventarioFisico(): Promise<InventarioFisico[]> {
  const res = await fetch(`${API_URL}/inventario-fisico`, {
    headers: getHeaders(),
  })
  return handleResponse<InventarioFisico[]>(res)
}

export async function createInventarioFisico(data: Partial<InventarioFisico>): Promise<InventarioFisico> {
  const res = await fetch(`${API_URL}/inventario-fisico`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<InventarioFisico>(res)
}

export async function updateInventarioFisico(id: number, data: Partial<InventarioFisico>): Promise<InventarioFisico> {
  const res = await fetch(`${API_URL}/inventario-fisico/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<InventarioFisico>(res)
}

export async function deleteInventarioFisico(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/inventario-fisico/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  
  if (!res.ok) {
    throw new Error('Error al eliminar item')
  }
}

export async function deleteInventarioFisicoBulk(ids: number[]): Promise<void> {
  const res = await fetch(`${API_URL}/inventario-fisico/bulk-delete`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ids }),
  })
  
  if (!res.ok) {
    throw new Error('Error en eliminación masiva')
  }
}

export async function importInventarioFisico(items: Partial<InventarioFisico>[]): Promise<ImportResult> {
  const res = await fetch(`${API_URL}/inventario-fisico/import`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ items }),
  })
  return handleResponse<ImportResult>(res)
}

// ============================================
// Dashboard
// ============================================

export async function getDashboardStats() {
  const res = await fetch(`${API_URL}/dashboard/stats`, {
    headers: getHeaders(),
  })
  return handleResponse<any>(res)
}

export async function getDashboardSecurity(): Promise<SecurityStats> {
  const res = await fetch(`${API_URL}/dashboard/security`, {
    headers: getHeaders(),
  })
  return handleResponse<SecurityStats>(res)
}

export async function getDashboardResources(): Promise<ResourcesStats> {
  const res = await fetch(`${API_URL}/dashboard/resources`, {
    headers: getHeaders(),
  })
  return handleResponse<ResourcesStats>(res)
}

export async function getDashboardAvailability() {
  const res = await fetch(`${API_URL}/dashboard/availability`, {
    headers: getHeaders(),
  })
  return handleResponse<any>(res)
}

export async function getDashboardPhysical() {
  const res = await fetch(`${API_URL}/dashboard/physical`, {
    headers: getHeaders(),
  })
  return handleResponse<any>(res)
}

export async function getDashboardResponsables() {
  const res = await fetch(`${API_URL}/dashboard/responsables`, {
    headers: getHeaders(),
  })
  return handleResponse<any>(res)
}

// ============================================
// Admin
// ============================================

export async function getUsuarios(): Promise<Usuario[]> {
  const res = await fetch(`${API_URL}/admin/usuarios`, {
    headers: getHeaders(),
  })
  return handleResponse<Usuario[]>(res)
}

export async function createUsuario(data: { email: string; nombre: string; password: string; rol: string }): Promise<Usuario> {
  const res = await fetch(`${API_URL}/admin/usuarios`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<Usuario>(res)
}

export async function deleteAllServidores(): Promise<void> {
  const res = await fetch(`${API_URL}/admin/servidores`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  
  if (!res.ok) {
    throw new Error('Error al eliminar servidores')
  }
}

// ============================================
// Email
// ============================================

export async function getEmailConfig(): Promise<EmailConfig | null> {
  const res = await fetch(`${API_URL}/email/config`, {
    headers: getHeaders(),
  })
  return handleResponse<EmailConfig | null>(res)
}

export async function saveEmailConfig(data: EmailConfig): Promise<EmailConfig> {
  const res = await fetch(`${API_URL}/email/config`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<EmailConfig>(res)
}

export async function testEmail(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/email/test`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  })
  return handleResponse<{ success: boolean; message: string }>(res)
}

export async function sendReport(email: string, tipo: string, filtro: string, tipoReporte: string, titulo: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_URL}/email/send-report`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, tipo, filtro, tipoReporte, titulo }),
  })
  return handleResponse<{ success: boolean; message: string }>(res)
}
