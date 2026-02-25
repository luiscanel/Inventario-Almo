#!/bin/bash

# ============================================
# Script de instalación - Inventario Almo
# Servidor: Linux (Ubuntu/Debian)
# ============================================

set -e

echo "=========================================="
echo "  INSTALACIÓN INVENTARIO ALMO"
echo "=========================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
APP_DIR="/opt/inventario-almo"
SERVICE_USER="inventario"
DOMAIN=${1:-"localhost"}
PORT=${2:-3000}

# Funciones
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Verificar root
if [ "$EUID" -ne 0 ]; then
  log_error "Ejecutar como root: sudo $0 [dominio] [puerto]"
  exit 1
fi

log_info "Iniciando instalación..."

# 1. Actualizar sistema
log_info "Actualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar Node.js 20
log_info "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Instalar dependencias
log_info "Instalando dependencias del sistema..."
apt install -y curl git nginx certbot python3-certbot-nginx

# 4. Crear usuario del servicio
log_info "Creando usuario del servicio..."
if ! id "$SERVICE_USER" &>/dev/null; then
  useradd -r -s /bin/false $SERVICE_USER
fi

# 5. Crear directorio de la app
log_info "Creando directorio de la app..."
mkdir -p $APP_DIR
cd $APP_DIR

# 6. Copiar archivos (si es desde repo git)
if [ -d "/home/teknao/Escritorio/Proyectos/Proyectos_Ubuntu/Inventario_Almo" ]; then
  log_info "Copiando archivos del proyecto..."
  cp -r /home/teknao/Escritorio/Proyectos/Proyectos_Ubuntu/Inventario_Almo/* $APP_DIR/
fi

# 7. Instalar dependencias npm
log_info "Instalando dependencias npm..."
cd $APP_DIR
npm install

# 8. Generar cliente Prisma
log_info "Generando cliente Prisma..."
cd $APP_DIR/server
npm install
npx prisma generate

# 9. Crear archivo .env
log_info "Configurando variables de entorno..."
cat > $APP_DIR/server/.env << 'EOF'
# Server Configuration
PORT=3000
HOST=0.0.0.0

# JWT Secret - Cambiar en producción
JWT_SECRET=alm0_1nv3nt4r10_2026_s3cur3_k3y_xK9mP2vN8rT4wY7zA

# Database
DATABASE_URL="file:./prisma/dev.db"

# Node Environment
NODE_ENV=production
EOF

# 10. Crear servicio systemd
log_info "Creando servicio systemd..."
cat > /etc/systemd/system/inventario-almo.service << 'EOF'
[Unit]
Description=Inventario Almo - Sistema de Gestión
After=network.target

[Service]
Type=simple
User=inventario
WorkingDirectory=/opt/inventario-almo
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 11. Configurar permisos
log_info "Configurando permisos..."
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# 12. Configurar Nginx
log_info "Configurando Nginx..."
cat > /etc/nginx/sites-available/inventario-almo << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/inventario-almo /etc/nginx/sites-enabled/
nginx -t

# 13. Habilitar servicios
log_info "Habilitando servicios..."
systemctl daemon-reload
systemctl enable inventario-almo
systemctl enable nginx

# 14. Iniciar servicios
log_info "Iniciando servicios..."
systemctl restart nginx
systemctl restart inventario-almo

# 15. Verificar estado
sleep 3
if systemctl is-active --quiet inventario-almo; then
    log_info "✅ Servicio iniciado correctamente"
else
    log_warn "⚠️ Revisar estado del servicio: systemctl status inventario-almo"
fi

echo ""
echo "=========================================="
echo "  INSTALACIÓN COMPLETA"
echo "=========================================="
echo ""
echo "📍 Acceso: http://$DOMAIN:$PORT"
echo "📧 Email: admin@grupoalmo.com"
echo "🔑 Password: admin123"
echo ""
echo "Comandos útiles:"
echo "  - Estado: systemctl status inventario-almo"
echo "  - Reiniciar: systemctl restart inventario-almo"
echo "  - Logs: journalctl -u inventario-almo -f"
echo ""
