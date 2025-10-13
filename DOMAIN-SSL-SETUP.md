# Custom Domain with HTTPS Setup Guide

This guide will walk you through setting up a custom domain with HTTPS for your Flashcards application on AWS EC2.

## Overview

Your application will be accessible at:
- `https://yourdomain.com` - Frontend (React app)
- `https://yourdomain.com/api` - Backend API
- `https://yourdomain.com/docs` - API documentation

## Prerequisites

- Domain name purchased (from GoDaddy, Namecheap, Google Domains, etc.)
- AWS EC2 instance running
- Application repository cloned on EC2

## Step 1: Configure DNS Settings

### Option A: Using Your Domain Registrar's DNS

1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS Management or DNS Settings
3. Add/Edit the following DNS records:

```
Type    Host    Value                           TTL
A       @       YOUR_EC2_PUBLIC_IP             3600
A       www     YOUR_EC2_PUBLIC_IP             3600
```

**Example:**
- If your EC2 IP is `54.123.456.789`
- Domain is `myflashcards.com`

```
Type    Host    Value              TTL
A       @       54.123.456.789    3600
A       www     54.123.456.789    3600
```

### Option B: Using AWS Route 53 (Recommended for AWS)

1. Go to AWS Route 53 Console
2. Click "Create hosted zone"
3. Enter your domain name
4. Click "Create hosted zone"
5. Note the 4 nameservers (ns-xxxx.awsdns-xx.com)
6. Go to your domain registrar and update nameservers to the Route 53 ones
7. Back in Route 53, create records:
   - Click "Create record"
   - Record name: leave empty (for root domain)
   - Record type: A
   - Value: Your EC2 IP
   - Click "Create records"
   - Repeat for "www" subdomain

### Verify DNS Propagation

Wait 5-60 minutes for DNS to propagate, then verify:

```bash
# Check if domain resolves to your EC2 IP
nslookup yourdomain.com
ping yourdomain.com

# Should show your EC2 IP address
```

## Step 2: Update EC2 Security Group

1. Go to AWS EC2 Console
2. Select your instance
3. Click on Security Group
4. Edit Inbound Rules
5. Ensure these ports are open:

```
Port    Protocol    Source          Description
22      TCP         Your IP         SSH
80      TCP         0.0.0.0/0       HTTP (for Let's Encrypt)
443     TCP         0.0.0.0/0       HTTPS
```

**IMPORTANT:** Port 80 must be open for Let's Encrypt certificate verification!

## Step 3: Configure Environment Variables on EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd ~/fc-production-app
```

Create/edit the `.env` file:

```bash
nano .env
```

Add these variables:

```bash
# Domain Configuration
DOMAIN_NAME=yourdomain.com

# SSL Configuration
SSL_EMAIL=your-email@example.com

# Database Configuration
POSTGRES_PASSWORD=your-secure-db-password
DATABASE_URL=postgresql+psycopg://postgres:your-secure-db-password@db:5432/flashcards

# JWT Configuration
JWT_SECRET=your-jwt-secret

# These will be auto-configured based on DOMAIN_NAME
# CORS_ORIGINS='["https://yourdomain.com", "https://www.yourdomain.com"]'
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

Save and exit (Ctrl+X, Y, Enter)

### Generate JWT Secret

If you don't have a JWT secret:

```bash
openssl rand -hex 32
```

## Step 4: Setup SSL Certificates

Run the SSL setup script:

```bash
chmod +x setup-ssl.sh
./setup-ssl.sh
```

This script will:
1. Create necessary directories for SSL certificates
2. Start a temporary nginx server
3. Request SSL certificates from Let's Encrypt
4. Configure automatic renewal

**What happens during SSL setup:**
- Let's Encrypt will verify you own the domain
- Free SSL certificates valid for 90 days
- Automatic renewal every 12 hours

**Troubleshooting SSL Setup:**

If the script fails, check:

```bash
# Verify domain points to your EC2
nslookup yourdomain.com

# Check if port 80 is accessible
curl http://yourdomain.com

# Check Docker is running
docker ps

# Manual certificate request (if script fails)
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --standalone \
  --email your-email@example.com \
  --agree-tos \
  -d yourdomain.com \
  -d www.yourdomain.com
```

## Step 5: Deploy Application

Start the application with SSL:

```bash
# Pull latest changes (if any)
git pull origin main

# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Step 6: Verify Everything Works

### Test HTTPS Access

1. Open browser and go to `https://yourdomain.com`
2. You should see your React app
3. Check for the lock icon in the address bar (indicates HTTPS is working)

### Test API Access

```bash
# Test API endpoint
curl https://yourdomain.com/api/health

# Test API docs
# Open in browser: https://yourdomain.com/docs
```

### Test HTTP to HTTPS Redirect

```bash
# Should automatically redirect to HTTPS
curl -I http://yourdomain.com
# Look for: HTTP/1.1 301 Moved Permanently
```

## Step 7: Update GitHub Secrets (Optional)

If you want the deployment script to use your domain:

1. Go to GitHub repository → Settings → Secrets
2. Add new secret:
   - Name: `DOMAIN_NAME`
   - Value: `yourdomain.com`
3. Update the deployment workflow to use this in the `.env` file

## Architecture Overview

```
Internet
    ↓
DNS (yourdomain.com) → EC2 Public IP
    ↓
Port 443 (HTTPS) / Port 80 (HTTP)
    ↓
Nginx Reverse Proxy
    ├─ / → Frontend (React - Port 3000)
    ├─ /api → Backend (FastAPI - Port 8000)
    └─ /docs → API Docs (FastAPI)
    ↓
Docker Network
    ├─ Frontend Container (Next.js)
    ├─ Backend Container (FastAPI)
    └─ Database Container (PostgreSQL)
```

## What Nginx Does

1. **SSL/TLS Termination**: Handles HTTPS encryption
2. **HTTP to HTTPS Redirect**: Automatically redirects HTTP traffic to HTTPS
3. **Reverse Proxy**: Routes requests to appropriate containers
   - `/` goes to frontend
   - `/api` goes to backend
   - `/docs` goes to backend docs
4. **Rate Limiting**: Prevents abuse (10 req/s general, 30 req/s for API)
5. **Security Headers**: Adds security headers (HSTS, X-Frame-Options, etc.)
6. **Gzip Compression**: Compresses responses for faster loading

## Certificate Renewal

Certificates automatically renew every 12 hours via the certbot container.

### Manual Renewal (if needed)

```bash
# Renew certificates manually
docker-compose -f docker-compose.prod.yml run --rm certbot renew

# Reload nginx to use new certificates
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Monitoring SSL Certificate Expiry

```bash
# Check certificate expiration date
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Common Issues and Solutions

### Issue: DNS not resolving

**Solution:**
```bash
# Clear DNS cache on your local machine
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache

# Wait 5-60 minutes for DNS propagation
```

### Issue: Certificate generation fails

**Possible causes:**
1. Domain doesn't point to EC2 yet
2. Port 80 blocked by security group
3. Domain already has certificate (rate limit)

**Solution:**
```bash
# Verify domain resolves
nslookup yourdomain.com

# Check if port 80 is open
telnet yourdomain.com 80

# Use staging for testing (unlimited rate limit)
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --staging \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  -d yourdomain.com
```

### Issue: "502 Bad Gateway" error

**Cause:** Backend or frontend containers not running

**Solution:**
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Issue: "NET::ERR_CERT_AUTHORITY_INVALID"

**Cause:** Using staging certificates or SSL not properly configured

**Solution:**
```bash
# Remove staging certificates
rm -rf certbot/conf/*

# Re-run SSL setup without --staging flag
./setup-ssl.sh
```

### Issue: API calls failing with CORS errors

**Cause:** CORS not configured for your domain

**Solution:**
```bash
# Edit .env file
nano .env

# Update CORS_ORIGINS
CORS_ORIGINS='["https://yourdomain.com", "https://www.yourdomain.com"]'

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Issue: "Too many certificates already issued"

**Cause:** Let's Encrypt rate limit (5 certificates per week per domain)

**Solution:**
```bash
# Wait a week, or use staging for testing
# Add --staging flag to certbot commands for testing
```

## Updating Your Domain

If you change your domain:

```bash
# 1. Update .env file
nano .env
# Change DOMAIN_NAME=newdomain.com

# 2. Remove old certificates
sudo rm -rf certbot/conf/*

# 3. Run SSL setup again
./setup-ssl.sh

# 4. Restart all services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## Performance Optimization

### Enable Cloudflare (Optional)

1. Sign up for [Cloudflare](https://cloudflare.com) (free)
2. Add your domain
3. Update nameservers at your registrar
4. Enable:
   - SSL/TLS → Full (strict)
   - Speed → Auto Minify (JS, CSS, HTML)
   - Caching → Standard
   - DDoS protection (automatic)

**Benefits:**
- CDN caching (faster load times globally)
- DDoS protection
- Additional SSL/TLS layer
- Analytics

## Security Checklist

- [ ] HTTPS enabled and working
- [ ] HTTP automatically redirects to HTTPS
- [ ] SSL certificate valid (check browser lock icon)
- [ ] Strong JWT_SECRET set
- [ ] Database password changed from default
- [ ] CORS configured for your domain only
- [ ] Security group allows only necessary ports
- [ ] SSH key pair secured (not shared)
- [ ] Auto-renewal working for SSL certificates
- [ ] Regular backups configured for database
- [ ] Firewall configured (ufw or AWS security groups)

## Maintenance

### Weekly Tasks
- Check application is accessible
- Monitor disk space: `df -h`
- Review logs for errors

### Monthly Tasks
- Update Docker images: `docker-compose pull`
- Check SSL certificate status
- Review security group rules
- Backup database

### As Needed
- Update application code (git pull)
- Scale resources if traffic increases
- Review and update dependencies

## Cost Considerations

**Free:**
- Let's Encrypt SSL certificates (free forever)
- Nginx (open source)
- Certbot (open source)

**Paid:**
- Domain name ($10-15/year typically)
- EC2 instance (varies by instance type)
- Route 53 hosted zone ($0.50/month if used)

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [AWS Route 53 Documentation](https://docs.aws.amazon.com/route53/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Getting Help

If you encounter issues:

1. Check application logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

2. Check nginx logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

3. Check certbot logs:
   ```bash
   docker-compose -f docker-compose.prod.yml logs certbot
   ```

4. Test individual components:
   ```bash
   # Test backend directly
   curl http://localhost:8000/health

   # Test frontend directly
   curl http://localhost:3000
   ```

5. Open an issue on the GitHub repository with:
   - Error messages
   - Logs
   - Steps you've taken
   - Domain name (if comfortable sharing)
