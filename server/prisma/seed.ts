import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Inicializando roles y permisos...')

  // Crear permisos por módulo
  const permisosData = [
    // Dashboard
    { modulo: 'dashboard', accion: 'ver' },
    // Inventario Servidores
    { modulo: 'inventario_servidores', accion: 'ver' },
    { modulo: 'inventario_servidores', accion: 'crear' },
    { modulo: 'inventario_servidores', accion: 'editar' },
    { modulo: 'inventario_servidores', accion: 'eliminar' },
    { modulo: 'inventario_servidores', accion: 'exportar' },
    // Inventario Físico
    { modulo: 'inventario_fisico', accion: 'ver' },
    { modulo: 'inventario_fisico', accion: 'crear' },
    { modulo: 'inventario_fisico', accion: 'editar' },
    { modulo: 'inventario_fisico', accion: 'eliminar' },
    { modulo: 'inventario_fisico', accion: 'exportar' },
    // Informes
    { modulo: 'informes', accion: 'ver' },
    { modulo: 'informes', accion: 'exportar' },
    { modulo: 'informes', accion: 'enviar' },
    // Email
    { modulo: 'email', accion: 'ver' },
    { modulo: 'email', accion: 'enviar' },
    // Admin
    { modulo: 'admin', accion: 'ver' },
    { modulo: 'admin', accion: 'crear' },
    { modulo: 'admin', accion: 'editar' },
    { modulo: 'admin', accion: 'eliminar' },
  ]

  // Crear permisos
  for (const p of permisosData) {
    await prisma.permiso.upsert({
      where: { modulo_accion: { modulo: p.modulo, accion: p.accion } },
      update: {},
      create: p,
    })
  }
  console.log('Permisos creados')

  // Obtener permisos para cada rol
  const permisosDashboard = await prisma.permiso.findMany({ where: { modulo: 'dashboard' } })
  const permisosInvServidores = await prisma.permiso.findMany({ where: { modulo: 'inventario_servidores' } })
  const permisosInvFisico = await prisma.permiso.findMany({ where: { modulo: 'inventario_fisico' } })
  const permisosInformes = await prisma.permiso.findMany({ where: { modulo: 'informes' } })
  const permisosEmail = await prisma.permiso.findMany({ where: { modulo: 'email' } })
  const permisosAdmin = await prisma.permiso.findMany({ where: { modulo: 'admin' } })

  // Rol Admin - todos los permisos
  await prisma.rol.upsert({
    where: { nombre: 'admin' },
    update: {},
    create: {
      nombre: 'admin',
      descripcion: 'Administrador con acceso completo',
      permisos: {
        connect: [
          ...permisosDashboard.map(p => ({ id: p.id })),
          ...permisosInvServidores.map(p => ({ id: p.id })),
          ...permisosInvFisico.map(p => ({ id: p.id })),
          ...permisosInformes.map(p => ({ id: p.id })),
          ...permisosEmail.map(p => ({ id: p.id })),
          ...permisosAdmin.map(p => ({ id: p.id })),
        ]
      }
    }
  })
  console.log('Rol admin creado')

  // Rol Editor - puede ver y editar inventarios e informes, NO email ni admin
  await prisma.rol.upsert({
    where: { nombre: 'editor' },
    update: {},
    create: {
      nombre: 'editor',
      descripcion: 'Editor con acceso a inventarios e informes',
      permisos: {
        connect: [
          ...permisosDashboard.map(p => ({ id: p.id })),
          ...permisosInvServidores.map(p => ({ id: p.id })),
          ...permisosInvFisico.map(p => ({ id: p.id })),
          ...permisosInformes.map(p => ({ id: p.id })),
        ]
      }
    }
  })
  console.log('Rol editor creado')

  // Rol Viewer - solo lectura (NO email, NO admin)
  await prisma.rol.upsert({
    where: { nombre: 'viewer' },
    update: {},
    create: {
      nombre: 'viewer',
      descripcion: 'Solo lectura - acceso limitado',
      permisos: {
        connect: [
          ...permisosDashboard.map(p => ({ id: p.id })),
          { id: permisosInvServidores.find(p => p.accion === 'ver')!.id },
          { id: permisosInvFisico.find(p => p.accion === 'ver')!.id },
          { id: permisosInformes.find(p => p.accion === 'ver')!.id },
        ]
      }
    }
  })
  console.log('Rol viewer creado')

  // Rol Soporte (legacy)
  await prisma.rol.upsert({
    where: { nombre: 'soporte' },
    update: {},
    create: {
      nombre: 'soporte',
      descripcion: 'Soporte técnico - acceso completo a inventarios',
      permisos: {
        connect: [
          ...permisosDashboard.map(p => ({ id: p.id })),
          ...permisosInvServidores.map(p => ({ id: p.id })),
          ...permisosInvFisico.map(p => ({ id: p.id })),
          ...permisosInformes.map(p => ({ id: p.id })),
        ]
      }
    }
  })
  console.log('Rol soporte creado')

  console.log('Seed completado!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
