#!/bin/bash

# ============================================
# INSTALADOR - Inventario Almo (Sin Docker)
# ============================================
# Este script instala la aplicación en un servidor Linux dedicado
# sin usar Docker.

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
echo -e "${YELLOW}[1/8] Detectando sistema operativo...${NC}"

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
echo -e "${YELLOW}[2/8] Instalando dependencias del sistema...${NC}"

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt-get update
    apt-get install -y curl wget git build-essential nginx
    
    # Instalar Node.js 20
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "rocky" ] || [ "$OS" = "alma" ]; then
    yum install -y curl wget git nginx
    
    # Instalar Node.js 20
    if ! command -v node &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        yum install -y nodejs
    fi
    
elif [ "$OS" = "fedora" ]; then
    dnf install -y curl wget git nginx
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
echo -e "${YELLOW}[3/8] Creando estructura de directorios...${NC}"

# Crear usuario si no existe
if ! id -u inventario &> /dev/null; then
    useradd -m -s /bin/bash inventario
    echo "Usuario 'inventario' creado"
fi

APP_DIR="/opt/inventario-almo"
DATA_DIR="/var/lib/inventario-almo"
LOG_DIR="/var/log/inventario-almo"

mkdir -p $APP_DIR $DATA_DIR/prisma $LOG_DIR
chown -R inventario:inventario $APP_DIR $DATA_DIR $LOG_DIR

echo "Directorios creados en $APP_DIR"

# ============================================
# 4. COPIAR ARCHIVOS
# ============================================
echo -e "${YELLOW}[4/8] Copiando archivos de la aplicación...${NC}"

# Si estamos en el directorio del proyecto, copiar de ahí
# Si no, clonar o copiar desde otra ubicación
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copiar archivos del proyecto
cp -r $SCRIPT_DIR/server $APP_DIR/
cp -r $SCRIPT_DIR/client $APP_DIR/
cp -r $SCRIPT_DIR/node_modules $APP_DIR/ 2>/dev/null || true

# Copiar archivos de configuración
cp $SCRIPT_DIR/.env.example $APP_DIR/.env

chown -R inventario:inventario $APP_DIR

echo -e "${GREEN}Archivos copiados${NC}"

# ============================================
# 5. INSTALAR DEPENDENCIAS NODE.JS
# ============================================
echo -e "${YELLOW}[5/8] Instalando dependencias Node.js...${NC}"

cd $APP_DIR

# Instalar dependencias del workspace raíz
npm install --legacy-peer-deps 2>/dev/null || true

# Instalar dependencias del server
cd $APP_DIR/server
npm install --production

# Generar Prisma client
cd $APP_DIR/server
npx prisma generate

# Build del server
npm run build

# Instalar dependencias del client
cd $APP_DIR/client
npm install

# Build del client
npm run build

echo -e "${GREEN}Node.js configurado${NC}"

# ============================================
# 6. CONFIGURAR BASE DE DATOS
# ============================================
echo -e "${YELLOW}[6/8] Configurando base de datos...${NC}"

cd $APP_DIR/server

# Configurar ruta de base de datos
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"file:$DATA_DIR/prisma/dev.db\"|" $APP_DIR/.env

# Generar y aplicar migraciones
npx prisma db push

# Crear usuario admin por defecto
echo -e "${YELLOW}Creando usuario administrador...${NC}"
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'jorge.canel@grupoalmo.com' },
    update: {},
    create: {
      email: 'jorge.canel@grupoalmo.com',
      password: hashedPassword,
      nombre: 'Jorge Canel',
      rol: 'admin'
    }
  });
  
  console.log('Usuario admin creado:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.\$disconnect());
"

chown -R inventario:inventario $DATA_DIR

echo -e "${GREEN}Base de datos configurada${NC}"

# ============================================
# 7. CONFIGURAR PM2 (GESTOR DE PROCESOS)
# ============================================
echo -e "${YELLOW}[7/8] Configurando PM2...${NC}"

# Instalar PM2 globalmente
npm install -g pm2

# Crear archivo de configuración PM2
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
        PORT: 3001
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
chown inventario:inventario $APP_DIR/ecosystem.config.js
su - inventario -c "cd $APP_DIR && pm2 start ecosystem.config.js"

# Configurar inicio automático
pm2 startup
pm2 save

echo -e "${GREEN}PM2 configurado${NC}"

# ============================================
# 8. CONFIGURAR NGINX
# ============================================
echo -e "${YELLOW}[8/8] Configurando Nginx...${NC}"

# Configurar nginx
cat > /etc/nginx/sites-available/inventario-almo << 'EOF'
server {
    listen 80;
    server_name _;

    # Archivos estáticos del frontend
    location / {
        root /opt/inventario-almo/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API del backend
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

    # WebSocket (si es necesario)
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
nginx -t
systemctl reload nginx

echo -e "${GREEN}Nginx configurado${NC}"

# ============================================
# RESUMEN
# ============================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  INSTALACIÓN COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Aplicación instalada en: ${YELLOW}$APP_DIR${NC}"
echo -e "Datos en: ${YELLOW}$DATA_DIR${NC}"
echo -e "Logs en: ${YELLOW}$LOG_DIR${NC}"
echo ""
echo -e "Acceso: ${YELLOW}http://TU_IP_O_DOMINIO${NC}"
echo ""
echo -e "Credenciales por defecto:"
echo -e "  Email: ${YELLOW}jorge.canel@grupoalmo.com${NC}"
echo -e "  Password: ${YELLOW}Admin123${NC}"
echo ""
echo -e "Comandos útiles:"
echo -e "  Ver logs: ${YELLOW}pm2 logs inventario-backend${NC}"
echo -e "  Reiniciar: ${YELLOW}pm2 restart inventario-backend${NC}"
echo -e "  Estado: ${YELLOW}pm2 status${NC}"
echo ""
