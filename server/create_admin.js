const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Crear rol admin si no existe
  let rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'Admin' } })
  if (!rolAdmin) {
    rolAdmin = await prisma.rol.create({
      data: {
        nombre: 'Admin',
        descripcion: 'Administrador del sistema'
      }
    })
    console.log('Rol Admin creado')
  }

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const existingUser = await prisma.user.findUnique({ 
    where: { email: 'admin@grupoalmo.com' } 
  })
  
  if (existingUser) {
    console.log('Usuario admin ya existe, actualizando...')
    await prisma.user.update({
      where: { email: 'admin@grupoalmo.com' },
      data: { password: hashedPassword }
    })
    console.log('Password actualizado')
  } else {
    await prisma.user.create({
      data: {
        email: 'admin@grupoalmo.com',
        nombre: 'Administrador',
        password: hashedPassword,
        activo: true,
        rol: 'admin'
      }
    })
    console.log('Usuario admin creado')
  }

  console.log('\n✅ Admin creado: admin@grupoalmo.com / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
