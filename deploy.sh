#!/bin/bash

# ============================================
# Script de despliegue - Inventario Almo
# Servidor Linux (sin Docker)
# ============================================

set -e

echo "🚀 Despliegue de Inventario Almo"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# 1. Verificar Node.js
# ============================================
echo -e "${YELLOW}1. Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Instalar con: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION"

# ============================================
# 2. Verificar PM2
# ============================================
echo -e "${YELLOW}2. Verificando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️ PM2 no encontrado. Instalando...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓${NC} PM2 instalado"

# ============================================
# 3. Instalar dependencias
# ============================================
echo -e "${YELLOW}3. Instalando dependencias del servidor...${NC}"
cd "$(dirname "$0")/server"
npm install --production
echo -e "${GREEN}✓${NC} Dependencias instaladas"

# ============================================
# 4. Generar build
# ============================================
echo -e "${YELLOW}4. Compilando TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓${NC} Build completado"

# ============================================
# 5. Verificar .env
# ============================================
echo -e "${YELLOW}5. Verificando configuración...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ Archivo .env no encontrado${NC}"
    echo "Copia .env.production.example a .env y configura los valores"
    exit 1
fi

# Verificar JWT_SECRET
source .env
if [ -z "$JWT_SECRET" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    echo -e "${RED}❌ JWT_SECRET debe tener al menos 32 caracteres${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Configuración verificada"

# ============================================
# 6. Iniciar con PM2
# ============================================
echo -e "${YELLOW}6. Iniciando aplicación con PM2...${NC}"
pm2 stop inventario-almo 2>/dev/null || true
pm2 delete inventario-almo 2>/dev/null || true
pm2 start dist/index.js --name inventario-almo --wait-ready --listen-timeout 10000

# ============================================
# 7. Configurar auto-inicio
# ============================================
echo -e "${YELLOW}7. Configurando auto-inicio...${NC}"
pm2 startup
pm2 save

echo -e "${GREEN}"
echo "========================================"
echo "  ✅ Despliegue completado"
echo "========================================"
echo ""
echo "  URLs:"
echo "  - Backend: http://localhost:3001"
echo "  - Health:  http://localhost:3001/api/health"
echo ""
echo "  Comandos útiles:"
echo "  - pm2 status          # Ver estado"
echo "  - pm2 logs            # Ver logs"
echo "  - pm2 restart         # Reiniciar"
echo ""
echo "  ⚠️  No olvides configurar Nginx para exponer el servidor"
echo -e "${NC}"
