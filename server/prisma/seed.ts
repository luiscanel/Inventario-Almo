import { prisma } from '../src/prisma/index.js'

//.seed // npm run prisma seed

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Crear módulos base del sistema
  const modulosBase = [
    { nombre: 'dashboard', descripcion: 'Panel de control y estadísticas', icono: 'LayoutDashboard', orden: 1 },
    { nombre: 'servidores', descripcion: 'Inventario de servidores y VMs', icono: 'Server', orden: 2 },
    { nombre: 'inventario_fisico', descripcion: 'Inventario de equipos físicos', icono: 'Monitor', orden: 3 },
    { nombre: 'inventario_cloud', descripcion: 'Inventario de servicios en la nube', icono: 'Cloud', orden: 4 },
    { nombre: 'informes', descripcion: 'Informes y exportaciones', icono: 'FileText', orden: 5 },
    { nombre: 'admin', descripcion: 'Administración de usuarios y roles', icono: 'Settings', orden: 6 },
    { nombre: 'email', descripcion: 'Configuración de notificaciones email', icono: 'Mail', orden: 7 },
  ]

  console.log('📦 Creating modulos...')
  
  const modulosCreados: Record<string, number> = {}
  
  for (const mod of modulosBase) {
    const existente = await prisma.modulo.findUnique({ where: { nombre: mod.nombre } })
    if (!existente) {
      const creado = await prisma.modulo.create({ data: mod })
      modulosCreados[mod.nombre] = creado.id
      console.log(`  ✓ Modulo: ${mod.nombre}`)
    } else {
      modulosCreados[mod.nombre] = existente.id
      console.log(`  ✓ Modulo ya existe: ${mod.nombre}`)
    }
  }

  // 2. Crear permisos base por módulo
  const accionesBase = ['ver', 'crear', 'editar', 'eliminar', 'exportar']
  
  console.log('🔐 Creating permisos...')
  
  for (const modNombre of Object.keys(modulosCreados)) {
    for (const accion of accionesBase) {
      const existente = await prisma.permiso.findFirst({
        where: { moduloId: modulosCreados[modNombre], accion }
      })
      if (!existente) {
        await prisma.permiso.create({
          data: { moduloId: modulosCreados[modNombre], accion }
        })
        console.log(`  ✓ Permiso: ${modNombre}_${accion}`)
      }
    }
  }

  // 3. Crear roles base (admin y viewer)
  console.log('👥 Creating roles...')
  
  // Rol Admin - tiene todos los módulos y todos los permisos
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'admin' },
    update: {},
    create: {
      nombre: 'admin',
      descripcion: 'Administrador con acceso completo a todos los módulos',
      esBase: true,
    }
  })
  console.log(`  ✓ Rol: admin`)

  // Asignar todos los módulos y permisos al admin
  const todosLosModulos = await prisma.modulo.findMany()
  const todosLosPermisos = await prisma.permiso.findMany()
  
  await prisma.rolModulo.deleteMany({ where: { rolId: rolAdmin.id } })
  for (const mod of todosLosModulos) {
    await prisma.rolModulo.create({
      data: { rolId: rolAdmin.id, moduloId: mod.id }
    })
  }
  
  // El admin tiene todos los permisos
  for (const perm of todosLosPermisos) {
    await prisma.permiso.update({
      where: { id: perm.id },
      data: { modulo: { connect: { id: perm.moduloId } } }
    })
  }
  
  // Actualizar permisos con la nueva estructura
  for (const perm of todosLosPermisos) {
    await prisma.permiso.update({
      where: { id: perm.id },
      data: { moduloId: perm.moduloId }
    })
  }

  // Rol Viewer - solo tiene permisos de ver
  const rolViewer = await prisma.rol.upsert({
    where: { nombre: 'viewer' },
    update: {},
    create: {
      nombre: 'viewer',
      descripcion: 'Visualizador de solo lectura',
      esBase: true,
    }
  })
  console.log(`  ✓ Rol: viewer`)

  // Asignar solo permisos de ver al viewer
  await prisma.rolModulo.deleteMany({ where: { rolId: rolViewer.id } })
  const permisosVer = await prisma.permiso.findMany({ where: { accion: 'ver' } })
  
  for (const mod of todosLosModulos) {
    await prisma.rolModulo.create({
      data: { rolId: rolViewer.id, moduloId: mod.id }
    })
  }

  // 4. Verificar que el usuario admin existente tenga el rol admin
  const adminUser = await prisma.user.findFirst({
    where: { email: 'jorge.canel@grupoalmo.com' }
  })
  
  if (adminUser) {
    const tieneRolAdmin = await prisma.usuarioRol.findFirst({
      where: { usuarioId: adminUser.id, rolId: rolAdmin.id }
    })
    
    if (!tieneRolAdmin) {
      await prisma.usuarioRol.create({
        data: { usuarioId: adminUser.id, rolId: rolAdmin.id }
      })
      console.log(`  ✓ Usuario admin asignado al rol admin`)
    }
  }

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
