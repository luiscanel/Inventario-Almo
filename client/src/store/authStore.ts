import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Permiso } from '@/types/api'

interface User {
  id: number
  email: string
  nombre: string
  rol: string
  roles?: string[]
  permisos?: Permiso[]
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  permisos: Permiso[]
  login: (user: User, token: string) => void
  logout: () => void
  tienePermiso: (modulo: string, accion: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      permisos: [],
      login: (user, token) => {
        const permisos = user.permisos || []
        set({ isAuthenticated: true, user, token, permisos })
      },
      logout: () => set({ isAuthenticated: false, user: null, token: null, permisos: [] }),
      tienePermiso: (modulo: string, accion: string) => {
        const { permisos } = get()
        return permisos.some(p => p.modulo === modulo && p.accion === accion)
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
