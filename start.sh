#!/bin/bash

# Script para iniciar Inventario Almo con Docker

set -e

echo "=========================================="
echo "  Inventario Almo - Iniciar Servicios"
echo "=========================================="
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Verificar si hay contenedores existentes
if docker ps -a --format '{{.Names}}' | grep -q "inventario-almo"; then
    echo "Contenedores existentes detectados. Limpiando..."
    docker-compose down -v
fi

# Construir y levantar servicios
echo "🏗️ Construyendo contenedores..."
docker-compose build

echo ""
echo "🚀 Iniciando servicios..."
docker-compose up -d

echo ""
echo "=========================================="
echo "  Servicios iniciados"
echo "=========================================="
echo ""
echo "🌐 Frontend: http://localhost:5174"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "Para ver logs: docker-compose logs -f"
echo "Para detener:  docker-compose down"
echo ""
