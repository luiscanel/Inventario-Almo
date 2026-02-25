#!/bin/bash

# Script de configuración completa para Inventario Almo
# Este script instala dependencias, configura la base de datos y compila el proyecto

set -e

echo "=========================================="
echo "  Inventario Almo - Setup Completo"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
success() { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# 1. Instalar dependencias del root
echo "📦 Instalando dependencias del proyecto..."
npm install
success "Dependencias del root instaladas"

# 2. Instalar dependencias del servidor
echo ""
echo "📦 Instalando dependencias del servidor..."
cd server
npm install
success "Dependencias del servidor instaladas"

# 3. Instalar dependencias del cliente
echo ""
echo "📦 Instalando dependencias del cliente..."
cd ../client
npm install
success "Dependencias del cliente instaladas"

# 4. Configurar base de datos
echo ""
echo "🗄️ Configurando base de datos SQLite..."
cd ../server

# Verificar si existe el archivo de base de datos
if [ -f "prisma/dev.db" ]; then
    warn "La base de datos ya existe. ¿Deseas recrearla? (s/n)"
    read -r response
    if [ "$response" = "s" ] || [ "$response" = "S" ]; then
        rm -f prisma/dev.db
        npx prisma migrate dev --name init
        success "Base de datos recreada"
    else
        success "Base de datos existente preservada"
    fi
else
    npx prisma migrate dev --name init
    success "Base de datos creada"
fi

# Generar el cliente de Prisma
npx prisma generate
success "Cliente Prisma generado"

# 5. Hacer build del proyecto
echo ""
echo "🔨 Compilando proyecto..."
cd ..
npm run build
success "Proyecto compilado exitosamente"

# 6. Verificar que todo esté correcto
echo ""
echo "=========================================="
echo "  Verificación final"
echo "=========================================="

if [ -f "client/dist/index.html" ]; then
    success "Frontend compilado en client/dist/"
else
    error "Error en la compilación del frontend"
    exit 1
fi

if [ -f "server/prisma/dev.db" ]; then
    success "Base de datos SQLite configurada"
else
    error "Error en la base de datos"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  ¡Setup completado exitosamente!${NC}"
echo "=========================================="
echo ""
echo "Para iniciar la aplicación:"
echo "  - Modo desarrollo: npm run dev"
echo "  - Solo backend:    cd server && npm run dev"
echo "  - Solo frontend:   cd client && npm run dev"
echo ""
echo "Puertos:"
echo "  - Frontend: http://localhost:5174"
echo "  - Backend:  http://localhost:3001"
echo ""
