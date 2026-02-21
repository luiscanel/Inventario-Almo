import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@grupoalmo.com' },
    update: {},
    create: {
      email: 'admin@grupoalmo.com',
      password: hashedPassword,
      nombre: 'Administrador',
      rol: 'admin'
    }
  })

  // Create sample servidores
  const sampleServers = [
    {
      pais: 'Colombia',
      host: 'SRV-COL-001',
      nombreVM: 'VM-WEB-01',
      ip: '192.168.1.10',
      cpu: 4,
      memoria: '16GB',
      disco: '500GB SSD',
      ambiente: 'Produccion',
      arquitectura: 'x86_64',
      sistemaOperativo: 'Windows Server 2019',
      version: '1809',
      antivirus: 'Windows Defender',
      estado: 'Activo',
      responsable: 'Juan Perez'
    },
    {
      pais: 'Colombia',
      host: 'SRV-COL-002',
      nombreVM: 'VM-DB-01',
      ip: '192.168.1.11',
      cpu: 8,
      memoria: '32GB',
      disco: '1TB SSD',
      ambiente: 'Produccion',
      arquitectura: 'x86_64',
      sistemaOperativo: 'Linux',
      version: 'Ubuntu 22.04 LTS',
      antivirus: 'ClamAV',
      estado: 'Activo',
      responsable: 'Maria Garcia'
    },
    {
      pais: 'México',
      host: 'SRV-MEX-001',
      nombreVM: '',
      ip: '192.168.2.10',
      cpu: 16,
      memoria: '64GB',
      disco: '2TB SSD',
      ambiente: 'Produccion',
      arquitectura: 'x86_64',
      sistemaOperativo: 'VMware ESXi',
      version: '7.0',
      antivirus: 'Symantec',
      estado: 'Activo',
      responsable: 'Carlos Lopez'
    },
    {
      pais: 'Perú',
      host: 'SRV-PER-001',
      nombreVM: 'VM-APP-01',
      ip: '192.168.3.10',
      cpu: 4,
      memoria: '8GB',
      disco: '250GB SSD',
      ambiente: 'Desarrollo',
      arquitectura: 'x86_64',
      sistemaOperativo: 'CentOS',
      version: '8',
      antivirus: 'Ninguno',
      estado: 'Activo',
      responsable: 'Ana Martinez'
    },
    {
      pais: 'Colombia',
      host: 'SRV-COL-003',
      nombreVM: 'VM-TEST-01',
      ip: '192.168.1.20',
      cpu: 2,
      memoria: '4GB',
      disco: '100GB SSD',
      ambiente: 'Testing',
      arquitectura: 'x86_64',
      sistemaOperativo: 'Linux',
      version: 'Debian 11',
      antivirus: 'Ninguno',
      estado: 'Inactivo',
      responsable: 'Pedro Sanchez'
    }
  ]

  for (const server of sampleServers) {
    await prisma.servidor.create({
      data: server
    }).catch(() => {
      console.log(`Servidor ${server.host} ya existe, saltando...`)
    })
  }

  console.log('Database seeded successfully!')
  console.log('Admin user: admin@grupoalmo.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
