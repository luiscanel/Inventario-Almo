# MANUAL DE INSTALACIÓN
## Inventario Almo - Servidor Dedicado (Sin Docker)

---

## Información General

| Campo | Valor |
|-------|-------|
| **Proyecto** | Inventario Almo |
| **Tech Stack** | React + Vite + Express + Prisma + SQLite |
| **Servidor** | 192.168.0.12 |
| **Usuario** | inventario / root |
| **Contraseña** | 123456789 |

---

## Estado del Deploy

✅ **INSTALADO Y FUNCIONANDO**

- Backend: http://192.168.0.12:3001 (API)
- Frontend: http://192.168.0.12 (a través de Nginx)
- Estado: Online y funcionando

---

## Estructura en el Servidor

```
/opt/inventario-almo/
├── client/                    # Frontend (React + Vite)
│   ├── dist/                   # Build de producción
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── vite.config.ts
├── server/                     # Backend (Express)
│   ├── src/
│   ├── prisma/
│   │   ├── dev.db             # Base de datos SQLite
│   │   └── schema.prisma
│   ├── package.json
│   └── .env
├── backups/                    # Backups de la base de datos
├── nginx.conf                  # Configuración de Nginx
├── ecosystem.config.js         # Configuración de PM2
├── deploy.sh                   # Script de instalación automática
└── MANUAL_DE_INSTALACION.md
```

---

## Comandos de Administración

### Ver Estado de Servicios

```bash
pm2 status
```

### Ver Logs

```bash
# Ver todos los logs
pm2 logs

# Ver logs específicos
pm2 logs inventario-backend
pm2 logs inventario-frontend
```

### Reiniciar Servicios

```bash
# Reiniciar todos
pm2 restart all

# Reiniciar solo backend
pm2 restart inventario-backend
```

### Detener Servicios

```bash
pm2 stop all
```

---

## Acceso a la Aplicación

```
http://192.168.0.12
```

---

## Credenciales

⚠️ **NOTA**: La base de datos es nueva. Necesitas crear el primer usuario desde la página de registro o contacta al administrador.

---

## Respaldos (Backups)

### Crear Backup Manual

```bash
cd /opt/inventario-almo/server/prisma
cp dev.db ../../backups/inventario_$(date +%Y%m%d_%H%M%S).db
```

### Restaurar Backup

```bash
# Listar backups disponibles
ls -la /opt/inventario-almo/backups/

# Restaurar (detener servicios primero)
pm2 stop all
cp /opt/inventario-almo/backups/inventario_20240101_120000.db /opt/inventario-almo/server/prisma/dev.db
pm2 start all
```

---

## Actualización del Proyecto

Para actualizar a una nueva versión:

```bash
# 1. Detener servicios
pm2 stop all

# 2. Respaldar base de datos
cp /opt/inventario-almo/server/prisma/dev.db /opt/inventario-almo/backups/pre-update_$(date +%Y%m%d_%H%M%S).db

# 3. Actualizar archivos (si hay repositorio)
cd /opt/inventario-almo
git pull

# 4. Reinstalar dependencias si es necesario
cd server && npm install
cd ../client && npm install

# 5. Regenerar Prisma (solo si hay cambios en schema)
cd ../server
npx prisma generate

# 6. Rebuild frontend (solo si hay cambios en cliente)
cd ../client
npm run build

# 7. Reiniciar servicios
pm2 restart all
```

---

## Solución de Problemas

### Servicio no inicia

```bash
# Ver errores específicos
pm2 logs inventario-backend --err --lines 50
```

### Puerto en uso

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3001
sudo lsof -i :80
sudo lsof -i :5173

# Matar proceso
sudo kill -9 <PID>
```

### Permisos denegados

```bash
sudo chown -R inventario:inventario /opt/inventario-almo
```

---

## Instalación desde Cero (Referencia)

Si necesitas reinstalar desde cero:

```bash
# 1. Conectar al servidor
ssh inventario@192.168.0.12

# 2. Instalación de herramientas
echo '123456789' | sudo -S apt update
echo '123456789' | sudo -S apt install -y nginx
echo '123456789' | sudo -S npm install -g pm2

# 3. Copiar proyecto
scp -r /ruta/local/* inventario@192.168.0.12:/opt/inventario-almo/

# 4. Configurar y ejecutar
cd /opt/inventario-almo
mkdir -p backups
echo '123456789' | sudo -S mkdir -p /var/log/inventario-almo
echo '123456789' | sudo -S chown inventario:inventario /var/log/inventario-almo

# 5. Instalar dependencias
cd server && npm install --production && npm install --save-dev tsx
cd ../client && npm install

# 6. Configurar variables de entorno
# (crear .env con valores apropiados)

# 7. Generar Prisma
cd server && npx prisma generate && npx prisma db push

# 8. Build frontend
cd ../client && npm run build

# 9. Configurar Nginx
echo '123456789' | sudo -S cp /opt/inventario-almo/nginx.conf /etc/nginx/sites-available/inventario-almo
echo '123456789' | sudo -S ln -sf /etc/nginx/sites-available/inventario-almo /etc/nginx/sites-enabled/
echo '123456789' | sudo -S rm -f /etc/nginx/sites-enabled/default
echo '123456789' | sudo -S nginx -t
echo '123456789' | sudo -S systemctl restart nginx

# 10. Iniciar servicios
pm2 start /opt/inventario-almo/ecosystem.config.js
pm2 save
```

---

*Documento generado para Inventario Almo - Versión 1.0*
*Fecha de instalación: 28 de febrero de 2026*
