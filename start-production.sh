#!/bin/bash

###############################################################################
#  Inventario Almo - Script de Inicio para Producción
###############################################################################
# Inicia la aplicación con PM2 para gestión de procesos
###############################################################################

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# Verificar que el setup se ha ejecutado
if [ ! -f "server/prisma/dev.db" ]; then
    print_error "La base de datos no existe"
    print_info "Ejecuta primero: ./setup-server.sh"
    exit 1
fi

if [ ! -d "client/dist" ]; then
    print_error "El proyecto no está compilado"
    print_info "Ejecuta primero: ./setup-server.sh"
    exit 1
fi

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    print_warn "PM2 no está instalado. Instalando..."
    npm install -g pm2
    print_success "PM2 instalado"
fi

print_header "Iniciando Inventario Almo"

# Detener procesos anteriores si existen
print_info "Deteniendo instancias anteriores..."
pm2 stop inventario-almo 2>/dev/null || true
pm2 delete inventario-almo 2>/dev/null || true

# Iniciar el backend
print_info "Iniciando backend en puerto 3001..."
cd server
pm2 start npm --name "inventario-almo-backend" -- run dev -- --port 3001

# Volver al directorio raíz
cd ..

# Configurar nginx si se desea
if command -v nginx &> /dev/null; then
    print_info "Configurando nginx..."
    
    # Crear configuración de nginx
    sudo tee /etc/nginx/sites-available/inventario-almo > /dev/null << 'EOF'
server {
    listen 80;
    server_name inventario.almo.com;

    # Frontend (archivos estáticos)
    location / {
        root /home/teknao/Escritorio/Proyectos/Proyectos_Ubuntu/Inventario_Almo/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend (API)
    location /api {
        proxy_pass http://localhost:3001;
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

    # Habilitar sitio
    sudo ln -sf /etc/nginx/sites-available/inventario-almo /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    print_success "Nginx configurado"
fi

print_header "Servicios Iniciados"

echo ""
print_success "Inventario Almo está en ejecución"
echo ""
echo "=========================================="
echo "  URLs de Acceso"
echo "=========================================="
echo ""
echo "🌐 Frontend: http://localhost:5174"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "=========================================="
echo "  Comandos Útiles"
echo "=========================================="
echo ""
echo "📝 Ver logs:"
echo "   pm2 logs inventario-almo-backend"
echo ""
echo "📝 Reiniciar:"
echo "   pm2 restart inventario-almo-backend"
echo ""
echo "📝 Estado:"
echo "   pm2 status"
echo ""
