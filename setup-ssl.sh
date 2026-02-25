#!/bin/bash

# ============================================
# Configuración SSL/TLS con Let's Encrypt
# Inventario Almo
# ============================================

set -e

echo "🔐 Configuración de SSL/TLS"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# Variables - EDITAR ESTOS VALORES
# ============================================
DOMAIN="inventario.grupoalmo.com"        # Tu dominio
EMAIL="admin@grupoalmo.com"              # Tu email
WEBROOT="/var/www/inventario-almo"       # Root del proyecto

# ============================================
# Verificar root
# ============================================
if [ !d "$WEBROOT" ]; then
    echo -e "${YELLOW}⚠️ Directorio web no existe. Creando...${NC}"
    sudo mkdir -p "$WEBROOT"
fi

# ============================================
# 1. Instalar Certbot
# ============================================
echo -e "${YELLOW}1. Instalando Certbot...${NC}"

if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✓ Certbot ya instalado${NC}"
else
    echo "Instalando certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# ============================================
# 2. Obtener certificado
# ============================================
echo -e "${YELLOW}2. Obteniendo certificado SSL...${NC}"

# Detener Nginx temporalmente
sudo systemctl stop nginx

# Obtener certificado
sudo certbot certonly --standalone \
    -d "$DOMAIN" \
    --agree-tos \
    --email "$EMAIL" \
    --non-interactive \
    --keep-until-expiring

# ============================================
# 3. Configurar Nginx con SSL
# ============================================
echo -e "${YELLOW}3. Configurando Nginx con SSL...${NC}"

sudo cat > /etc/nginx/sites-available/inventario-almo << 'EOF'
server {
    listen 80;
    server_name INVENTARIO.DOMAIN;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name INVENTARIO.DOMAIN;

    # ============================================
    # CERTIFICADOS SSL
    # ============================================
    ssl_certificate /etc/letsencrypt/live/INVENTARIO.DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/INVENTARIO.DOMAIN/privkey.pem;
    
    # Configuración SSL moderna
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Protocolos y cifrados seguros
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # ============================================
    # SEGURIDAD
    # ============================================
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ============================================
    # FRONTEND
    # ============================================
    root /var/www/inventario-almo/client/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ============================================
    # BACKEND API
    # ============================================
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# ============================================
# HTTP/2 Push (opcional)
# ============================================
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
EOF

# Reemplazar dominio en config
sudo sed -i "s/INVENTARIO.DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/inventario-almo

# ============================================
# 4. Habilitar sitio
# ============================================
echo -e "${YELLOW}4. Habilitando sitio...${NC}"

sudo ln -sf /etc/nginx/sites-available/inventario-almo /etc/nginx/sites-enabled/
sudo nginx -t

# ============================================
# 5. Configurar auto-renovación
# ============================================
echo -e "${YELLOW}5. Configurando renovación automática...${NC}"

# Crear script de renovación
sudo tee /etc/cron.d/certbot-renew > /dev/null << 'RENEW'
# Renew SSL certificates twice daily
0 */12 * * * root test -x /usr/bin/certbot -a \! -d /run/systemd/system && perl -e 'sleep int(rand(43200))' && certbot -q renew --renew-hook "systemctl reload nginx"
RENEW

sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# ============================================
# 6. Iniciar Nginx
# ============================================
echo -e "${YELLOW}6. Iniciando Nginx...${NC}"
sudo systemctl reload nginx

echo -e "${GREEN}"
echo "========================================"
echo "  ✅ SSL configurado correctamente"
echo "========================================"
echo ""
echo "  URL: https://$DOMAIN"
echo "  Certificados: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "  Renovación: Automática (cada 12 horas)"
echo -e "${NC}"
