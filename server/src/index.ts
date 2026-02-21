import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import servidoresRoutes from './routes/servidores'
import inventarioFisicoRoutes from './routes/inventarioFisico'
import dashboardRoutes from './routes/dashboard'
import dashboardNewRoutes from './routes/dashboardNew'
import adminRoutes from './routes/admin'
import emailRoutes from './routes/email'

dotenv.config()

const app = express()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
const HOST = process.env.HOST || '0.0.0.0'

app.use(cors())
app.use(express.json())

// Rutas públicas
app.use('/api/auth', authRoutes)

// Rutas de dashboards (protegidas)
app.use('/api/dashboard', dashboardNewRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Rutas protegidas
app.use('/api/servidores', servidoresRoutes)
app.use('/api/inventario-fisico', inventarioFisicoRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/email', emailRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`)
})
