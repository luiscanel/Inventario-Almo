import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login: setAuth } = useAuthStore()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar dominio
    if (!email.toLowerCase().endsWith('@grupoalmo.com')) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'Solo se permiten correos con dominio @grupoalmo.com',
      })
      return
    }

    setLoading(true)
    try {
      const data = await login(email, password)
      setAuth(data.user, data.token)
      toast({
        title: 'Bienvenido',
        description: `Sesión iniciada como ${data.user.nombre}`,
      })
      navigate('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: error.message || 'Credenciales inválidas',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Inventario Almo</CardTitle>
            <CardDescription className="mt-2">
              Ingrese sus credenciales corporativas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@grupoalmo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? 'Autenticando...' : 'Iniciar Sesión'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Solo se permiten usuarios con dominio @grupoalmo.com
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
