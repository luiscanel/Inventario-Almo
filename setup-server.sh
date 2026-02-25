#!/bin/bash

###############################################################################
#  Inventario Almo - Script de Instalación para Servidor Dedicado
###############################################################################
# Este script configura todo lo necesario para ejecutar la aplicación
# sin Docker: Node.js, dependencias, base de datos SQLite y compilación
###############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Verificar que es root o tiene sudo
if [ "$EUID" -ne 0 ] && ! sudo -v 2>/dev/null; then
    print_warn "Este script necesita permisos de root para instalar dependencias del sistema"
    print_info "Ejecuta con: sudo $0"
fi

print_header "Inventario Almo - Instalación Completa"

###############################################################################
# 1. VERIFICAR PRERREQUISITOS
###############################################################################
echo ""
print_info "Verificando prerrequisitos del sistema..."

# Función para verificar comando
check_command() {
    if command -v "$1" &> /dev/null; then
        local version=$($1 --version 2>&1 | head -n1)
        print_success "$1 instalado: $version"
        return 0
    else
        print_error "$1 no está instalado"
        return 1
    fi
}

# Verificar Node.js
NODE_INSTALLED=false
if check_command node; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        NODE_INSTALLED=true
    else
        print_error "Node.js debe ser versión 18 o superior"
        NODE_INSTALLED=false
    fi
fi

# Si Node.js no está instalado, instalarlo
if [ "$NODE_INSTALLED" = false ]; then
    echo ""
    print_warn "Instalando Node.js 20.x..."
    
    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
        sudo apt-get install -y nodejs > /dev/null 2>&1
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1
        sudo yum install -y nodejs > /dev/null 2>&1
    elif command -v apk &> /dev/null; then
        # Alpine
        sudo apk add --no-cache nodejs npm
    else
        print_error "No se pudo detectar el gestor de paquetes"
        print_info "Por favor instala Node.js 18+ manualmente desde https://nodejs.org"
        exit 1
    fi
    
    print_success "Node.js instalado"
fi

# Verificar npm
check_command npm

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json"
    print_info "Ejecuta este script desde la raíz del proyecto: /home/teknao/Escritorio/Proyectos/Proyectos_Ubuntu/Inventario_Almo"
    exit 1
fi

print_success "Todos los prerrequisitos verificados"

###############################################################################
# 2. INSTALAR DEPENDENCIAS
###############################################################################
print_header "Instalando Dependencias"

echo ""
print_info "Instalando dependencias del proyecto root..."
npm install --silent
print_success "Dependencias root instaladas"

echo ""
print_info "Instalando dependencias del servidor..."
cd server
npm install --silent
print_success "Dependencias del servidor instaladas"

echo ""
print_info "Instalando dependencias del cliente..."
cd ../client
npm install --silent
print_success "Dependencias del cliente instaladas"

###############################################################################
# 3. CONFIGURAR BASE DE DATOS
###############################################################################
print_header "Configurando Base de Datos SQLite"

cd ../server

# Verificar si existe la base de datos
if [ -f "prisma/dev.db" ]; then
    print_warn "Ya existe una base de datos"
    read -p "¿Deseas recrearla? (perderás todos los datos) [s/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        print_info "Eliminando base de datos existente..."
        rm -f prisma/dev.db
        npx prisma migrate dev --name init
        print_success "Base de datos recreada"
    else
        print_info "Usando base de datos existente"
    fi
else
    print_info "Creando base de datos..."
    npx prisma migrate dev --name init
    print_success "Base de datos creada"
fi

# Generar cliente Prisma
npx prisma generate
print_success "Cliente Prisma generado"

# Verificar que la base de datos existe
if [ -f "prisma/dev.db" ]; then
    DB_SIZE=$(du -h prisma/dev.db | cut -f1)
    print_success "Base de datos configurada (tamaño: $DB_SIZE)"
fi

###############################################################################
# 4. COMPILAR PROYECTO
###############################################################################
print_header "Compilando Proyecto"

cd ..
print_info "Compilando frontend y backend..."
npm run build

# Verificar compilación
if [ -f "client/dist/index.html" ]; then
    FRONTEND_SIZE=$(du -sh client/dist | cut -f1)
    print_success "Frontend compilado (tamaño: $FRONTEND_SIZE)"
else
    print_error "Error al compilar el frontend"
    exit 1
fi

###############################################################################
# 5. CREAR ARCHIVO DE CONFIGURACIÓN DE ENTORNO
###############################################################################
print_header "Configuración de Entorno"

cd server

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Archivo .env creado desde .env.example"
    else
        cat > .env << 'EOF'
# Puerto del servidor
PORT=3001

# URL de la base de datos SQLite
DATABASE_URL="file:./prisma/dev.db"

# Configuración JWT
JWT_SECRET=tu_secret_jwt_aqui_cambialo_en_produccion
JWT_EXPIRES_IN=7d

# Configuración de email (configura según tu servidor SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_app
SMTP_FROM=noreply@inventario.almo.com
EOF
        print_success "Archivo .env creado"
    fi
else
    print_info "Archivo .env ya existe"
fi

###############################################################################
# 6. RESUMEN FINAL
###############################################################################
print_header "Instalación Completada"

echo ""
echo -e "${GREEN}¡Todo listo!${NC}"
echo ""
echo "=========================================="
echo "  Información del Servidor"
echo "=========================================="
echo ""
echo "🌐 Puertos configurados:"
echo "   • Frontend: http://localhost:5174"
echo "   • Backend:  http://localhost:3001"
echo ""
echo "📁 Archivos importantes:"
echo "   • Base de datos: server/prisma/dev.db"
echo "   • Frontend:     client/dist/"
echo "   • Config:       server/.env"
echo ""
echo "=========================================="
echo "  Comandos para Iniciar"
echo "=========================================="
echo ""
echo "📝 Modo desarrollo (recomendado para pruebas):"
echo "   npm run dev"
echo ""
echo "📝 Solo backend:"
echo "   cd server && npm run dev"
echo ""
echo "📝 Solo frontend:"
echo "   cd client && npm run dev"
echo ""
echo "📝 Modo producción:"
echo "   cd server && npm start"
echo "   (Luego sirve client/dist con nginx/apache)"
echo ""
echo "=========================================="
echo "  Configuración de Producción"
echo "=========================================="
echo ""
echo "Para producción, se recomienda:"
echo "1. Cambiar JWT_SECRET en server/.env"
echo "2. Configurar SMTP para emails"
echo "3. Usar nginx como proxy reverso"
echo "4. Configurar SSL/TLS con Let's Encrypt"
echo ""

print_success "Instalación finalizada correctamente"
