#!/bin/bash

# ============================================
# INSTALADOR - Inventario Almo (Sin Docker)
# ============================================
# Corregido: TypeScript, PM2, Prisma 5, variables de entorno

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  INSTALADOR - Inventario Almo${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================
# 1. DETECTAR SISTEMA
# ============================================
echo -e "${YELLOW}[1/10] Detectando sistema operativo...${NC}"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}Error: No se pudo detectar el sistema operativo${NC}"
    exit 1
fi

echo "Sistema detectado: $OS"

# ============================================
# 2. INSTALAR DEPENDENCIAS
# ============================================
echo -e "${YELLOW}[2/10] Instalando dependencias del sistema...${NC}"

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get install -y curl wget git build-essential nginx sqlite3
    
    # Instalar Node.js 20
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "rocky" ] || [ "$OS" = "alma" ]; then
    yum install -y curl wget git nginx sqlite
    
    if ! command -v node &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    fi
    
elif [ "$OS" = "fedora" ]; then
    dnf install -y curl wget git nginx sqlite
    if ! command -v node &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        dnf install -y nodejs
    fi
else
    echo -e "${RED}Sistema no soportado: $OS${NC}"
    exit 1
fi

echo -e "${GREEN}Dependencias instaladas${NC}"

# ============================================
# 3. CREAR USUARIO Y DIRECTORIOS
# ============================================
echo -e "${YELLOW}[3/10] Creando estructura de directorios...${NC}"

APP_DIR="/opt/inventario-almo"
DATA_DIR="/var/lib/inventario-almo"
LOG_DIR="/var/log/inventario-almo"

mkdir -p $APP_DIR $DATA_DIR/prisma $LOG_DIR
chown -R $(whoami):$(whoami) $APP_DIR $DATA_DIR $LOG_DIR 2>/dev/null || true

echo "Directorios creados en $APP_DIR"

# ============================================
# 4. COPIAR ARCHIVOS
# ============================================
echo -e "${YELLOW}[4/10] Copiando archivos de la aplicación...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copiar archivos del proyecto
cp -r $SCRIPT_DIR/server $APP_DIR/
cp -r $SCRIPT_DIR/client $APP_DIR/

# Copiar archivos de configuración
cp $SCRIPT_DIR/.env.example $APP_DIR/.env 2>/dev/null || true
cp $SCRIPT_DIR/server/.env.example $APP_DIR/server/.env 2>/dev/null || true

echo -e "${GREEN}Archivos copiados${NC}"

# ============================================
# 5. INSTALAR DEPENDENCIAS NODE.JS
# ============================================
echo -e "${YELLOW}[5/10] Instalando dependencias Node.js...${NC}"

cd $APP_DIR/server

# Instalar TypeScript globalmente
npm install -g typescript

# Instalar dependencias
npm install

# Fix: Asegurar Prisma 5.x (compatible)
npm install @prisma/client@5.22.0 prisma@5.22.0 --save

# Generar Prisma client
npx prisma generate

# Build del server
npm run build

# Client
cd $APP_DIR/client
npm install

# Build del client
npm run build

echo -e "${GREEN}Node.js configurado${NC}"

# ============================================
# 6. CONFIGURAR VARIABLES DE ENTORNO
# ============================================
echo -e "${YELLOW}[6/10] Configurando variables de entorno...${NC}"

cd $APP_DIR/server

# Configurar .env
cat > $APP_DIR/server/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL="file:/var/lib/inventario-almo/prisma/dev.db"
JWT_SECRET=inventario-almo-secret-key-production-2024
JWT_EXPIRES_IN=24h
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
EOF

chmod 600 $APP_DIR/server/.env
chown -R $(whoami):$(whoami) $APP_DIR/server/.env

echo -e "${GREEN}Variables de entorno configuradas${NC}"

# ============================================
# 7. CONFIGURAR BASE DE DATOS
# ============================================
echo -e "${YELLOW}[7/10] Configurando base de datos...${NC}"

cd $APP_DIR/server

# Generar y aplicar migraciones
npx prisma db push

# Crear usuario admin
echo -e "${YELLOW}Creando usuario administrador...${NC}"

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123', 10);
  
  // Crear o actualizar usuario
  const user = await prisma.user.upsert({
    where: { email: 'jorge.canel@grupoalmo.com' },
    update: { password: hashedPassword, nombre: 'Jorge Canel', rol: 'admin' },
    create: {
      email: 'jorge.canel@grupoalmo.com',
      password: hashedPassword,
      nombre: 'Jorge Canel',
      rol: 'admin'
    }
  });
  
  console.log('Usuario admin creado/actualizado:', user.email);
}

main()
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.\$disconnect());
"

echo -e "${GREEN}Base de datos configurada${NC}"

# ============================================
# 8. INSTALAR Y CONFIGURAR PM2
# ============================================
echo -e "${YELLOW}[8/10] Configurando PM2...${NC}"

# Instalar PM2 globalmente
npm install -g pm2

# Crear archivo de configuración PM2 con variables embebidas
cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'inventario-backend',
      script: 'dist/index.js',
      cwd: '/opt/inventario-almo/server',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'file:/var/lib/inventario-almo/prisma/dev.db',
        JWT_SECRET: 'inventario-almo-secret-key-production-2024',
        JWT_EXPIRES_IN: '24h',
        CORS_ORIGIN: '*',
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX_REQUESTS: '100',
        AUTH_RATE_LIMIT_MAX: '5'
      },
      error_file: '/var/log/inventario-almo/backend-error.log',
      out_file: '/var/log/inventario-almo/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '500M',
      watch: false
    }
  ]
};
EOF

# Iniciar con PM2
cd $APP_DIR
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

echo -e "${GREEN}PM2 configurado${NC}"

# ============================================
# 9. CONFIGURAR NGINX
# ============================================
echo -e "${YELLOW}[9/10] Configurando Nginx...${NC}"

# Configurar nginx
cat > /etc/nginx/sites-available/inventario-almo << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /opt/inventario-almo/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/inventario-almo /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo -e "${GREEN}Nginx configurado${NC}"

# ============================================
# 10. VERIFICAR INSTALACIÓN
# ============================================
echo -e "${YELLOW}[10/10] Verificando instalación...${NC}"

sleep 2

# Probar health
HEALTH=$(curl -s http://127.0.0.1:3001/api/health 2>/dev/null || echo "FAILED")

if [[ "$HEALTH" == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend funcionando correctamente${NC}"
else
    echo -e "${YELLOW}⚠️ Backend no responde, verificando logs...${NC}"
    pm2 logs inventario-backend --lines 10 --nostream
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Aplicación: ${YELLOW}$APP_DIR${NC}"
echo -e "Datos: ${YELLOW}$DATA_DIR${NC}"
echo -e "Logs: ${YELLOW}$LOG_DIR${NC}"
echo ""
echo -e "Acceso: ${YELLOW}http://TU_IP_O_DOMINIO${NC}"
echo ""
echo -e "Credenciales:"
echo -e "  Email: ${YELLOW}jorge.canel@grupoalmo.com${NC}"
echo -e "  Password: ${YELLOW}Admin123${NC}"
echo ""
echo -e "Comandos útiles:"
echo -e "  Ver logs: ${YELLOW}pm2 logs inventario-backend${NC}"
echo -e "  Reiniciar: ${YELLOW}pm2 restart inventario-backend${NC}"
echo -e "  Estado: ${YELLOW}pm2 status${NC}"
echo ""
