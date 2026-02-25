#!/bin/bash

# ============================================
# Restaurar backup - Inventario Almo
# ============================================

set -e

# ============================================
# Colores
# ============================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# Configuración
# ============================================
BACKUP_DIR="/opt/inventario-almo/backups"
DB_PATH="/opt/inventario-almo/server/prisma/dev.db"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# Listar backups disponibles
# ============================================
echo "========================================="
echo "  Backups disponibles"
echo "========================================="
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Directorio de backups no existe"
    exit 1
fi

ls -1t "$BACKUP_DIR"/*.db.gz 2>/dev/null | head -10 | nl

echo ""
echo -n "Selecciona el número del backup a restaurar: "
read SELECTION

BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/*.db.gz 2>/dev/null | sed -n "${SELECTION}p")

if [ -z "$BACKUP_FILE" ]; then
    log_error "Selección inválida"
    exit 1
fi

log_warn "ADVERTENCIA: Esto reemplazará la base de datos actual"
log_warn "Base de datos actual: $DB_PATH"
log_warn "Backup a restaurar: $BACKUP_FILE"
echo ""
echo -n "¿Continuar? (yes/no): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "Operación cancelada"
    exit 0
fi

# ============================================
# Crear backup de seguridad antes de restaurar
# ============================================
log_info "Creando backup de seguridad..."
mkdir -p "$BACKUP_DIR/pre-restore"
cp "$DB_PATH" "$BACKUP_DIR/pre-restore/$(basename $DB_PATH).$(date +%Y%m%d_%H%M%S).bak"

# ============================================
# Detener aplicación
# ============================================
log_info "Deteniendo aplicación..."
pm2 stop inventario-almo 2>/dev/null || true

# ============================================
# Restaurar
# ============================================
log_info "Restaurando backup..."

# Descomprimir
gunzip -c "$BACKUP_FILE" > "$DB_PATH"

# Verificar integridad
if [ -f "$DB_PATH" ]; then
    log_info "✅ Backup restaurado exitosamente"
else
    log_error "Error al restaurar backup"
    exit 1
fi

# ============================================
# Iniciar aplicación
# ============================================
log_info "Iniciando aplicación..."
pm2 start inventario-almo

log_info "✅ Restauración completada"
