#!/bin/bash

# ============================================
# Script de backup - Inventario Almo
# Backup automático de base de datos
# ============================================

set -e

# ============================================
# CONFIGURACIÓN
# ============================================
BACKUP_DIR="/opt/inventario-almo/backups"
DB_PATH="/opt/inventario-almo/server/prisma/dev.db"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="inventario_almo_$DATE"

# ============================================
# Colores
# ============================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# Funciones
# ============================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Verificar que existe la base de datos
# ============================================
if [ ! -f "$DB_PATH" ]; then
    log_error "Base de datos no encontrada en: $DB_PATH"
    exit 1
fi

# ============================================
# Crear directorio de backups
# ============================================
mkdir -p "$BACKUP_DIR"

# ============================================
# Crear backup
# ============================================
log_info "Creando backup: $BACKUP_NAME"

# Copiar base de datos
cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME.db"

# Comprimir
gzip "$BACKUP_DIR/$BACKUP_NAME.db"

# Crear archivo de metadatos
cat > "$BACKUP_DIR/$BACKUP_NAME.json" << EOF
{
  "name": "$BACKUP_NAME",
  "date": "$(date -Iseconds)",
  "size_bytes": $(stat -f%z "$BACKUP_DIR/$BACKUP_NAME.db.gz" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_NAME.db.gz"),
  "database_path": "$DB_PATH"
}
EOF

# Crear checksum
sha256sum "$BACKUP_DIR/$BACKUP_NAME.db.gz" > "$BACKUP_DIR/$BACKUP_NAME.sha256"

log_info "Backup creado: $BACKUP_DIR/$BACKUP_NAME.db.gz"

# ============================================
# Limpiar backups antiguos
# ============================================
log_info "Limpiando backups mayores a $RETENTION_DAYS días..."

find "$BACKUP_DIR" -name "*.db.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.json" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.sha256" -mtime +$RETENTION_DAYS -delete

# ============================================
# Resumen
# ============================================
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.db.gz 2>/dev/null | wc -l)
LAST_BACKUP_SIZE=$(ls -lh "$BACKUP_DIR"/"$BACKUP_NAME".db.gz | awk '{print $5}')

log_info "Backups actuales: $BACKUP_COUNT"
log_info "Último backup: $LAST_BACKUP_SIZE"

echo ""
log_info "✅ Backup completado exitosamente"
