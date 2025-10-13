#!/bin/bash

# EC2 Instance Setup Script
# Run this script on your EC2 instance to prepare it for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  EC2 Setup Script for Flashcards App  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}Error: This script must be run on a Linux system${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Update system packages
echo -e "${BLUE}[1/6] Updating system packages...${NC}"
sudo apt-get update -y
echo -e "${GREEN}✓ System packages updated${NC}"
echo ""

# 2. Install Docker
if command_exists docker; then
    echo -e "${YELLOW}Docker is already installed${NC}"
    docker --version
else
    echo -e "${BLUE}[2/6] Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh

    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
    docker --version
fi
echo ""

# 3. Install Docker Compose
if command_exists docker-compose; then
    echo -e "${YELLOW}Docker Compose is already installed${NC}"
    docker-compose --version
else
    echo -e "${BLUE}[3/6] Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
    docker-compose --version
fi
echo ""

# 4. Install Git
if command_exists git; then
    echo -e "${YELLOW}Git is already installed${NC}"
    git --version
else
    echo -e "${BLUE}[4/6] Installing Git...${NC}"
    sudo apt-get install -y git
    echo -e "${GREEN}✓ Git installed${NC}"
    git --version
fi
echo ""

# 5. Clone repository
echo -e "${BLUE}[5/6] Setting up application repository...${NC}"
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/fc-production-app.git): " REPO_URL

if [ -d "$HOME/fc-production-app" ]; then
    echo -e "${YELLOW}Repository directory already exists${NC}"
    read -p "Do you want to remove and re-clone? (y/n): " RECLONE
    if [ "$RECLONE" = "y" ]; then
        rm -rf "$HOME/fc-production-app"
        git clone "$REPO_URL" "$HOME/fc-production-app"
        echo -e "${GREEN}✓ Repository cloned${NC}"
    else
        echo -e "${YELLOW}Using existing repository${NC}"
    fi
else
    git clone "$REPO_URL" "$HOME/fc-production-app"
    echo -e "${GREEN}✓ Repository cloned to $HOME/fc-production-app${NC}"
fi
echo ""

# 6. Create .env file
echo -e "${BLUE}[6/6] Creating environment configuration...${NC}"
cd "$HOME/fc-production-app"

if [ -f .env ]; then
    echo -e "${YELLOW}.env file already exists${NC}"
    read -p "Do you want to create a new one? (y/n): " CREATE_ENV
else
    CREATE_ENV="y"
fi

if [ "$CREATE_ENV" = "y" ]; then
    echo -e "${YELLOW}Let's set up your environment variables...${NC}"
    echo ""

    # Ask for domain
    read -p "Do you have a custom domain? (y/n): " HAS_DOMAIN

    if [ "$HAS_DOMAIN" = "y" ]; then
        read -p "Enter your domain name (e.g., myapp.com): " DOMAIN_NAME
        read -p "Enter your email for SSL certificates: " SSL_EMAIL

        # Generate JWT secret
        echo -e "${YELLOW}Generating JWT secret...${NC}"
        JWT_SECRET=$(openssl rand -hex 32)

        # Create .env file with domain
        cat > .env << EOF
# Domain Configuration
DOMAIN_NAME=$DOMAIN_NAME
SSL_EMAIL=$SSL_EMAIL

# Database Configuration
POSTGRES_PASSWORD=sqlflashcards123
DATABASE_URL=postgresql+psycopg://postgres:sqlflashcards123@db:5432/flashcards

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# API Configuration (will use domain)
NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME/api
CORS_ORIGINS='["https://$DOMAIN_NAME"]'
EOF
        echo -e "${GREEN}✓ .env file created with domain configuration${NC}"
        echo -e "${YELLOW}⚠ IMPORTANT: You need to:${NC}"
        echo -e "  1. Point your domain's DNS A record to this EC2 IP"
        echo -e "  2. Wait for DNS propagation (5-60 minutes)"
        echo -e "  3. Run: ./setup-ssl.sh"
        echo -e "  4. Then run: docker-compose -f docker-compose.prod.yml up -d --build"
    else
        # Get EC2 public IP
        PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)

        # Generate JWT secret
        echo -e "${YELLOW}Generating JWT secret...${NC}"
        JWT_SECRET=$(openssl rand -hex 32)

        # Create .env file without domain
        cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=sqlflashcards123
DATABASE_URL=postgresql+psycopg://postgres:sqlflashcards123@db:5432/flashcards

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# API Configuration (using EC2 IP)
NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:8000
CORS_ORIGINS='["http://localhost:3000", "http://$PUBLIC_IP:3000"]'
EOF
        echo -e "${GREEN}✓ .env file created with IP configuration${NC}"
        echo -e "${YELLOW}⚠ You can now run: docker-compose -f docker-compose.prod.yml up -d --build${NC}"
        echo -e "${YELLOW}⚠ Your app will be at: http://$PUBLIC_IP:3000${NC}"
    fi
fi
echo ""

# Check if user needs to log out for Docker permissions
if ! groups $USER | grep -q docker; then
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  IMPORTANT: Docker Group Setup${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo -e "${RED}You need to log out and log back in${NC}"
    echo -e "for Docker permissions to take effect."
    echo ""
    echo -e "Run these commands:"
    echo -e "  ${GREEN}exit${NC}"
    echo -e "  ${GREEN}ssh -i your-key.pem $USER@$(curl -s http://checkip.amazonaws.com)${NC}"
    echo ""
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Installation summary:"
echo -e "  ✓ Docker installed"
echo -e "  ✓ Docker Compose installed"
echo -e "  ✓ Git installed"
echo -e "  ✓ Repository cloned to $HOME/fc-production-app"
echo -e "  ✓ Environment configured"
echo ""
echo -e "${BLUE}Next steps:${NC}"
if [ "$HAS_DOMAIN" = "y" ]; then
    echo -e "  1. Configure DNS to point to this EC2 instance"
    echo -e "  2. Wait for DNS propagation"
    echo -e "  3. cd ~/fc-production-app"
    echo -e "  4. chmod +x setup-ssl.sh && ./setup-ssl.sh"
    echo -e "  5. docker-compose -f docker-compose.prod.yml up -d --build"
else
    echo -e "  1. Log out and back in (for Docker permissions)"
    echo -e "  2. cd ~/fc-production-app"
    echo -e "  3. docker-compose -f docker-compose.prod.yml up -d --build"
    echo -e "  4. Access your app at: http://$(curl -s http://checkip.amazonaws.com):3000"
fi
echo ""
echo -e "${GREEN}GitHub CI/CD will handle future deployments automatically!${NC}"
