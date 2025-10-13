#!/bin/bash

# SSL Certificate Setup Script
# This script sets up Let's Encrypt SSL certificates for your domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}SSL Certificate Setup Script${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create a .env file with DOMAIN_NAME variable"
    exit 1
fi

# Load environment variables
source .env

# Check if DOMAIN_NAME is set
if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}Error: DOMAIN_NAME not set in .env file!${NC}"
    echo "Please add DOMAIN_NAME=yourdomain.com to your .env file"
    exit 1
fi

# Check if email is provided
if [ -z "$SSL_EMAIL" ]; then
    echo -e "${YELLOW}Warning: SSL_EMAIL not set in .env file${NC}"
    read -p "Enter your email for Let's Encrypt notifications: " SSL_EMAIL
    echo "SSL_EMAIL=$SSL_EMAIL" >> .env
fi

echo -e "${GREEN}Domain: $DOMAIN_NAME${NC}"
echo -e "${GREEN}Email: $SSL_EMAIL${NC}"
echo ""

# Create certbot directories
echo -e "${YELLOW}Creating certbot directories...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www

# Create temporary nginx config without SSL
echo -e "${YELLOW}Creating temporary nginx configuration...${NC}"
cat > nginx/nginx-init.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name DOMAIN_PLACEHOLDER;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'Server is ready for SSL setup';
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Replace placeholder with actual domain
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN_NAME/g" nginx/nginx-init.conf

# Start nginx temporarily for certificate generation
echo -e "${YELLOW}Starting temporary nginx server...${NC}"
docker run -d --name temp-nginx \
    -p 80:80 \
    -v $(pwd)/certbot/www:/var/www/certbot \
    -v $(pwd)/nginx/nginx-init.conf:/etc/nginx/nginx.conf \
    nginx:alpine

sleep 3

# Request SSL certificate
echo -e "${YELLOW}Requesting SSL certificate from Let's Encrypt...${NC}"
docker run --rm \
    -v $(pwd)/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN_NAME \
    -d www.$DOMAIN_NAME

# Stop temporary nginx
echo -e "${YELLOW}Stopping temporary nginx...${NC}"
docker stop temp-nginx
docker rm temp-nginx

# Clean up
rm nginx/nginx-init.conf

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}SSL Certificate Setup Complete!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Your SSL certificates are ready"
echo "2. Run: docker-compose -f docker-compose.prod.yml up -d"
echo "3. Your app will be available at https://$DOMAIN_NAME"
echo ""
echo -e "${YELLOW}Note: Certificates will auto-renew every 12 hours${NC}"
