#!/bin/bash

# ============================================
# Configurar backups automáticos
# Inventario Almo
# ============================================

set -e

# ============================================
# Variables
# ============================================
PROJECT_DIR="/opt/inventario-almo"
BACKUP_SCRIPT="$PROJECT_DIR/backup.sh"
CRON_LOG="$PROJECT_DIR/logs/backup.log"

# ============================================
# Crear directorio de logs
# ============================================
mkdir -p "$PROJECT_DIR/logs"

# ============================================
# Agregar tarea cron
# ============================================
echo "Configurando backup automático..."

# Crear entrada cron (diario a las 3:00 AM)
CRON_ENTRY="0 3 * * * $BACKUP_SCRIPT >> $CRON_LOG 2>&1"

# Agregar al crontab del usuario actual
(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "$CRON_ENTRY") | crontab -

echo "✅ Backup automático configurado"
echo ""
echo "  Horario: Daily at 3:00 AM"
echo "  Script: $BACKUP_SCRIPT"
echo "  Logs: $CRON_LOG"
echo ""
echo "  Comandos útiles:"
echo "  - crontab -l           # Ver tareas"
echo "  - crontab -e           # Editar tareas"
echo "  - $BACKUP_SCRIPT       # Ejecutar manualmente"
