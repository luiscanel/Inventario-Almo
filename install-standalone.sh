#!/bin/bash

# ============================================
# INSTALADOR - Inventario Almo (Sin Docker)
# ============================================
# Version corregida con todos los fixes identificados

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  INSTALADOR - Inventario Almo v2${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ============================================
# 0. DETECTAR SISTEMA Y VARIABLES
# ============================================
echo -e "${YELLOW}[0/12] Detectando sistema...${NC}"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}Error: Sistema no detectado${NC}"
    exit 1
fi

# IP del servidor
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Sistema: $OS | IP: $SERVER_IP"

# ============================================
# 1. INSTALAR DEPENDENCIAS DEL SISTEMA
# ============================================
echo -e "${YELLOW}[1/12] Instalando dependencias del sistema...${NC}"

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get install -y curl wget git build-essential nginx sqlite3 jq
    
    # Node.js 20
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "rocky" ] || [ "$OS" = "alma" ]; then
    yum install -y curl wget git nginx sqlite jq
    if ! command -v node &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    fi
fi

echo -e "${GREEN}Dependencias instaladas${NC}"

# ============================================
# 2. CREAR DIRECTORIOS
# ============================================
echo -e "${YELLOW}[2/12] Creando estructura de directorios...${NC}"

APP_DIR="/opt/inventario-almo"
DATA_DIR="/var/lib/inventario-almo"
LOG_DIR="/var/log/inventario-almo"

mkdir -p $APP_DIR $DATA_DIR/prisma $LOG_DIR
chown -R $(whoami):$(whoami) $APP_DIR $DATA_DIR $LOG_DIR 2>/dev/null || true

echo "Directorios creados"

# ============================================
# 3. COPIAR ARCHIVOS
# ============================================
echo -e "${YELLOW}[3/12] Copiando archivos...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cp -r $SCRIPT_DIR/server $APP_DIR/
cp -r $SCRIPT_DIR/client $APP_DIR/

echo "Archivos copiados"

# ============================================
# 4. INSTALAR TYPESCRIPT Y PM2 GLOBAL
# ============================================
echo -e "${YELLOW}[4/12] Instalando TypeScript y PM2...${NC}"

npm install -g typescript pm2

echo -e "${GREEN}TypeScript y PM2 instalados${NC}"

# ============================================
# 5. INSTALAR DEPENDENCIAS BACKEND
# ============================================
echo -e "${YELLOW}[5/12] Instalando dependencias backend...${NC}"

cd $APP_DIR/server

# Forzar Prisma 5 (compatible)
npm install @prisma/client@5.22.0 prisma@5.22.0 --save

# Instalar todas las dependencias
npm install

echo -e "${GREEN}Dependencias backend instaladas${NC}"

# ============================================
# 6. CREAR .ENV CON RUTAS CORRECTAS
# ============================================
echo -e "${YELLOW}[6/12] Configurando variables de entorno...${NC}"

DB_PATH="$DATA_DIR/prisma/dev.db"

# Crear archivo .env
cat > $APP_DIR/server/.env << EOF
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
DATABASE_URL="file:$DB_PATH"
JWT_SECRET=inventario-almo-secret-key-$(openssl rand -hex 16)
JWT_EXPIRES_IN=24h
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
EOF

chmod 600 $APP_DIR/server/.env
chown -R $(whoami):$(whoami) $APP_DIR/server/.env

echo ".env creado"

# ============================================
# 7. CONFIGURAR PRISMA (FIX: schema con url)
# ============================================
echo -e "${YELLOW}[7/12] Configurando Prisma...${NC}"

cd $APP_DIR/server

# Verificar que schema.prisma tenga la configuración correcta
if grep -q 'url = env("DATABASE_URL")' prisma/schema.prisma; then
    echo "schema.prisma OK"
else
    echo "Corrigiendo schema.prisma..."
    # El schema ya debe tener la configuración correcta
    cat prisma/schema.prisma | head -20
fi

# Generar cliente y DB
npx prisma generate
npx prisma db push

echo -e "${GREEN}Prisma configurado${NC}"

# ============================================
# 8. COMPILAR BACKEND
# ============================================
echo -e "${YELLOW}[8/12] Compilando backend...${NC}"

cd $APP_DIR/server
npm run build

echo -e "${GREEN}Backend compilado${NC}"

# ============================================
# 9. CREAR USUARIO ADMIN
# ============================================
echo -e "${YELLOW}[9/12] Creando usuario administrador...${NC}"

cd $APP_DIR/server
node - << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  const count = await prisma.user.count();
  if (count === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@grupoalmo.com',
        nombre: 'Administrador',
        password: hashed,
        activo: true,
        rol: 'admin'
      }
    });
    console.log('Seed: usuario admin creado');
  } else {
    console.log('Seed: usuarios ya existen');
  }
  await prisma.$disconnect();
})().catch(async e => { 
  console.error('Error:', e.message); 
  await prisma.$disconnect(); 
  process.exit(1); 
});
EOF

echo -e "${GREEN}Usuario admin creado${NC}"

# ============================================
# 10. CONFIGURAR PM2 (FIX: cwd correcto + env)
# ============================================
echo -e "${YELLOW}[10/12] Configurando PM2...${NC}"

cat > $APP_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inventario-backend',
    script: 'dist/index.js',
    cwd: '/opt/inventario-almo/server',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: '3001',
      HOST: '0.0.0.0',
      DATABASE_URL: 'file:/var/lib/inventario-almo/prisma/dev.db',
      JWT_SECRET: 'inventario-almo-secret-key-placeholder',
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
  }]
};
EOF

# Actualizar JWT_SECRET en ecosystem
sed -i "s|JWT_SECRET: 'placeholder'|JWT_SECRET: '$(openssl rand -hex 16)'|" $APP_DIR/ecosystem.config.js

cd $APP_DIR
pm2 delete inventario-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo -e "${GREEN}PM2 configurado${NC}"

# ============================================
# 11. CONFIGURAR NGINX (FIX: sin / final)
# ============================================
echo -e "${YELLOW}[11/12] Configurando Nginx...${NC}"

cat > /etc/nginx/sites-available/inventario-almo << 'EOF'
server {
    listen 80;
    server_name _;

    root /opt/inventario-almo/client/dist;
    index index.html;

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

    location / {
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

ln -sf /etc/nginx/sites-available/inventario-almo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo -e "${GREEN}Nginx configurado${NC}"

# ============================================
# 12. COMPILAR FRONTEND
# ============================================
echo -e "${YELLOW}[12/12] Compilando frontend...${NC}"

cd $APP_DIR/client

# Configurar VITE_API_URL
echo "VITE_API_URL=http://$SERVER_IP" > .env

npm install
npm run build

echo -e "${GREEN}Frontend compilado${NC}"

# ============================================
# HEALTHCHECKS FINALES
# ============================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  HEALTHCHECKS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

sleep 2

# Backend directo
echo -e "${YELLOW}Test: Backend directo /api/health${NC}"
HEALTH=$(curl -sf http://127.0.0.1:3001/api/health 2>/dev/null || echo "FAILED")
if [[ "$HEALTH" == *"ok"* ]]; then
    echo -e "${GREEN}✅ Backend funcionando${NC}"
else
    echo -e "${RED}❌ Backend NO responde${NC}"
    pm2 logs inventario-backend --lines 10 --nostream
fi

# Via Nginx
echo -e "${YELLOW}Test: Via Nginx /api/health${NC}"
HEALTH_NGINX=$(curl -sf http://localhost/api/health 2>/dev/null || echo "FAILED")
if [[ "$HEALTH_NGINX" == *"ok"* ]]; then
    echo -e "${GREEN}✅ Nginx proxy funcionando${NC}"
else
    echo -e "${RED}❌ Nginx NO responde correctamente${NC}"
fi

# Login
echo -e "${YELLOW}Test: Login API${NC}"
LOGIN=$(curl -sf -X POST http://127.0.0.1:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@grupoalmo.com","password":"admin123"}' 2>/dev/null || echo "FAILED")

if [[ "$LOGIN" == *"token"* ]]; then
    echo -e "${GREEN}✅ Login funcionando${NC}"
else
    echo -e "${RED}❌ Login falló${NC}"
    echo "Respuesta: $LOGIN"
fi

# PM2 status
echo ""
echo -e "${YELLOW}Estado de PM2:${NC}"
pm2 status

# ============================================
# RESUMEN
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  INSTALACION COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Aplicación: ${YELLOW}$APP_DIR${NC}"
echo -e "Datos: ${YELLOW}$DATA_DIR${NC}"
echo -e "Logs: ${YELLOW}$LOG_DIR${NC}"
echo ""
echo -e "Acceso: ${YELLOW}http://$SERVER_IP${NC}"
echo ""
echo -e "Credenciales:${NC}"
echo -e "  Email: ${YELLOW}admin@grupoalmo.com${NC}"
echo -e "  Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "Comandos:${NC}"
echo -e "  Ver logs: ${YELLOW}pm2 logs inventario-backend${NC}"
echo -e "  Reiniciar: ${YELLOW}pm2 restart inventario-backend${NC}"
echo -e "  Estado: ${YELLOW}pm2 status${NC}"
echo ""
