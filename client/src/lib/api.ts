import { useAuthStore } from '@/store/authStore'

const API_URL = '/api'

function getHeaders() {
  // Try both localStorage key and Zustand store
  let token = localStorage.getItem('token')
  if (!token) {
    const state = useAuthStore.getState()
    token = state.token
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error de autenticación')
  }
  const data = await res.json()
  localStorage.setItem('token', data.token)
  return data
}

export async function getServidores() {
  const res = await fetch(`${API_URL}/servidores`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener servidores')
  return res.json()
}

export async function createServidor(data: any) {
  const res = await fetch(`${API_URL}/servidores`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al crear servidor')
  }
  return res.json()
}

export async function updateServidor(id: number, data: any) {
  const res = await fetch(`${API_URL}/servidores/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al actualizar servidor')
  }
  return res.json()
}

export async function deleteServidor(id: number) {
  const res = await fetch(`${API_URL}/servidores/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al eliminar servidor')
  }
  return res.json()
}

export async function importServidores(servidores: any[]) {
  const res = await fetch(`${API_URL}/servidores/import`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ servidores }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al importar servidores')
  }
  return res.json()
}

export async function getDashboardStats() {
  const res = await fetch(`${API_URL}/dashboard/stats`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener estadísticas')
  return res.json()
}

export async function getDashboardSecurity() {
  const res = await fetch(`${API_URL}/dashboard/security`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener estadísticas de seguridad')
  return res.json()
}

export async function getDashboardResources() {
  const res = await fetch(`${API_URL}/dashboard/resources`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener estadísticas de recursos')
  return res.json()
}

export async function getDashboardAvailability() {
  const res = await fetch(`${API_URL}/dashboard/availability`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener estadísticas de disponibilidad')
  return res.json()
}

export async function getDashboardPhysical() {
  const res = await fetch(`${API_URL}/dashboard/physical`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener estadísticas de inventario físico')
  return res.json()
}

export async function getDashboardResponsables() {
  const res = await fetch(`${API_URL}/dashboard/responsables`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener estadísticas de responsables')
  return res.json()
}

export async function getUsuarios() {
  const res = await fetch(`${API_URL}/admin/usuarios`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener usuarios')
  return res.json()
}

export async function createUsuario(data: any) {
  const res = await fetch(`${API_URL}/admin/usuarios`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al crear usuario')
  }
  return res.json()
}

export async function exportToExcel(data: any[], filename: string) {
  const res = await fetch(`${API_URL}/export/excel`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data, filename }),
  })
  if (!res.ok) throw new Error('Error al exportar')
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xlsx`
  a.click()
}

export async function getEmailConfig() {
  const res = await fetch(`${API_URL}/email/config`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener configuración')
  return res.json()
}

export async function saveEmailConfig(data: any) {
  const res = await fetch(`${API_URL}/email/config`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error al guardar configuración')
  return res.json()
}

export async function testEmail(email: string) {
  const res = await fetch(`${API_URL}/email/test`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  })
  return res.json()
}

export async function sendReport(email: string) {
  const res = await fetch(`${API_URL}/email/send-report`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  })
  return res.json()
}

// Inventario Físico
export async function getInventarioFisico() {
  const res = await fetch(`${API_URL}/inventario-fisico`, {
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Error al obtener inventario físico')
  return res.json()
}

export async function createInventarioFisico(data: any) {
  const res = await fetch(`${API_URL}/inventario-fisico`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al crear item')
  }
  return res.json()
}

export async function updateInventarioFisico(id: number, data: any) {
  const res = await fetch(`${API_URL}/inventario-fisico/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al actualizar item')
  }
  return res.json()
}

export async function deleteInventarioFisico(id: number) {
  const res = await fetch(`${API_URL}/inventario-fisico/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al eliminar item')
  }
  return res.json()
}

export async function importInventarioFisico(items: any[]) {
  const res = await fetch(`${API_URL}/inventario-fisico/import`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ items }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || 'Error al importar')
  }
  return res.json()
}
