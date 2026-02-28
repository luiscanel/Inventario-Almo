import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== USUARIOS ===')
  const usuarios = await prisma.user.findMany({
    include: {
      usuarioRoles: {
        include: { rol: true }
      }
    }
  })
  console.log(JSON.stringify(usuarios, null, 2))
  
  console.log('\n=== ROLES ===')
  const roles = await prisma.rol.findMany({
    include: {
      roles: { include: { modulo: true } },
      permisos: true
    }
  })
  console.log(JSON.stringify(roles, null, 2))
  
  console.log('\n=== MÓDULOS ===')
  const modulos = await prisma.modulo.findMany()
  console.log(JSON.stringify(modulos, null, 2))
  
  await prisma.$disconnect()
}

main().catch(console.error)
