# ⚠️ IMPORTANTE - Base de Datos

## Ubicación
La base de datos SQLite está en el volumen Docker:
```
/app/prisma/dev.db
```

## ⚠️ NUNCA EJECUTAR
- `npx prisma generate`
- `npx prisma db push`
- `npx prisma migrate`

Estos comandos **borran todos los datos** y crean una base vacía.

## Si necesitas modificar el schema
1. Hacer backup de `/app/prisma/dev.db`
2. Modificar el schema en `prisma/schema.prisma`
3. Recrear la base con los datos del backup (consultar al desarrollador)

## Estado actual
- Base de datos: `/app/prisma/dev.db`
- Tablas: AuditLog, Configuracion, EmailConfig, InventarioFisico, Modulo, Permiso, Rol, RolModulo, Servidor, User, UsuarioRol
- Usuario admin: jorge.canel@grupoalmo.com / admin123
