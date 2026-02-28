# Inventario Almo

## ⚠️ IMPORTANTE - Base de Datos

### Ubicación
La base de datos está en el volumen Docker:
```
/app/prisma/dev.db
```

### ⚠️ NUNCA EJECUTAR
- `npx prisma generate`
- `npx prisma db push`
- `npx prisma migrate`

Estos comandos **borran todos los datos** y crean una base vacía.

### Si necesitas modificar el schema
1. Hacer backup de `/app/prisma/dev.db` primero
2. Modificar el schema en `server/prisma/schema.prisma`
3. Consultar al desarrollador para recrear la base

### Credenciales
- Usuario: jorge.canel@grupoalmo.com
- Contraseña: admin123
