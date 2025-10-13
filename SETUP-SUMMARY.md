# Quick Setup Summary

## What I've Set Up For You

I've configured your application for deployment to AWS EC2 with optional custom domain and HTTPS support.

## Files Created/Modified

1. **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)** - GitHub Actions CI/CD pipeline
2. **[docker-compose.prod.yml](docker-compose.prod.yml)** - Production Docker configuration with nginx & SSL
3. **[nginx/nginx.conf](nginx/nginx.conf)** - Nginx reverse proxy with HTTPS, security headers, and rate limiting
4. **[nginx/Dockerfile](nginx/Dockerfile)** - Custom nginx Docker image
5. **[setup-ssl.sh](setup-ssl.sh)** - Script to generate SSL certificates
6. **[.env.production.example](.env.production.example)** - Example environment variables
7. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Basic EC2 deployment guide
8. **[DOMAIN-SSL-SETUP.md](DOMAIN-SSL-SETUP.md)** - Custom domain & HTTPS setup guide

---

## Option 1: Deploy Without Custom Domain (IP Address Only)

### GitHub Secrets Needed (7 secrets):

```
AWS_ACCESS_KEY_ID          - From AWS IAM
AWS_SECRET_ACCESS_KEY      - From AWS IAM
AWS_REGION                 - e.g., us-east-1
EC2_HOST                   - Your EC2 public IP
EC2_USER                   - ubuntu (or ec2-user)
EC2_SSH_KEY                - Your .pem file contents
JWT_SECRET                 - Run: openssl rand -hex 32
```

### Result:
- Frontend: `http://YOUR_EC2_IP:3000`
- Backend API: `http://YOUR_EC2_IP:8000`
- No HTTPS

### Security Group Ports:
- 22 (SSH)
- 3000 (Frontend)
- 8000 (Backend)

---

## Option 2: Deploy With Custom Domain (HTTPS)

### GitHub Secrets Needed (9 secrets):

All 7 from Option 1, PLUS:

```
DOMAIN_NAME               - yourdomain.com
SSL_EMAIL                 - your-email@example.com
```

### Additional Steps Required:

1. **Configure DNS** (point domain to EC2 IP)
2. **Update Security Group** (open ports 80 & 443)
3. **Run SSL setup on EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   cd ~/fc-production-app
   chmod +x setup-ssl.sh
   ./setup-ssl.sh
   ```

### Result:
- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api`
- API Docs: `https://yourdomain.com/docs`
- Auto HTTPS with free SSL certificate
- HTTP automatically redirects to HTTPS

### Security Group Ports:
- 22 (SSH)
- 80 (HTTP - for SSL verification & redirect)
- 443 (HTTPS)

---

## Step-by-Step: Getting Started

### 1. Prepare EC2 Instance

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt-get update && sudo apt-get install -y git

# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/fc-production-app.git

# Log out and back in for Docker permissions
exit
```

### 2. Add GitHub Secrets

Go to: **Your GitHub Repo → Settings → Secrets and variables → Actions**

Click **"New repository secret"** for each:

#### Required Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `JWT_SECRET`

#### Optional (for custom domain):
- `DOMAIN_NAME`
- `SSL_EMAIL`

### 3. Deploy!

```bash
# On your local machine
git add .
git commit -m "Add deployment configuration"
git push origin main
```

GitHub Actions will automatically deploy to your EC2 instance!

---

## Adding Custom Domain Later

If you start with Option 1 (IP only) and want to add a domain later:

1. **Buy a domain** (GoDaddy, Namecheap, etc.)

2. **Point DNS to EC2**:
   - Add A record: `@` → Your EC2 IP
   - Add A record: `www` → Your EC2 IP

3. **Add GitHub Secrets**:
   - `DOMAIN_NAME` → yourdomain.com
   - `SSL_EMAIL` → your-email@example.com

4. **Update Security Group** (allow ports 80 & 443)

5. **SSH to EC2 and setup SSL**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   cd ~/fc-production-app
   git pull origin main
   chmod +x setup-ssl.sh
   ./setup-ssl.sh
   docker-compose -f docker-compose.prod.yml up -d
   ```

6. **Push any change to trigger redeployment**:
   ```bash
   git commit --allow-empty -m "Trigger deployment with domain"
   git push origin main
   ```

Done! Your app is now at `https://yourdomain.com`

---

## Common Commands

### On EC2:

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check status
docker-compose -f docker-compose.prod.yml ps

# Stop all
docker-compose -f docker-compose.prod.yml down

# Start all
docker-compose -f docker-compose.prod.yml up -d

# Check SSL certificate
openssl s_client -servername yourdomain.com -connect yourdomain.com:443 < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

## Troubleshooting

### Deployment fails?
- Check GitHub Actions logs (Actions tab in GitHub)
- Verify all secrets are set correctly
- Check EC2 security group allows required ports

### Can't access application?
- Check containers are running: `docker ps`
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Verify security group allows inbound traffic
- Check if services are listening: `sudo netstat -tulpn`

### SSL certificate fails?
- Ensure domain points to EC2 IP: `nslookup yourdomain.com`
- Ensure port 80 is open (required for Let's Encrypt)
- Check certbot logs: `docker logs flashcards-certbot`

### CORS errors?
- Check CORS_ORIGINS in .env matches your domain
- Restart backend: `docker-compose -f docker-compose.prod.yml restart backend`

---

## Documentation Reference

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed EC2 deployment instructions
- **[DOMAIN-SSL-SETUP.md](DOMAIN-SSL-SETUP.md)** - Complete domain & HTTPS guide

---

## Architecture

```
                    Internet
                       ↓
         DNS (yourdomain.com) → EC2 IP
                       ↓
              Port 443 (HTTPS)
                       ↓
         Nginx (Reverse Proxy + SSL)
           ├─ / → Frontend (React)
           ├─ /api → Backend (FastAPI)
           └─ /docs → API Docs
                       ↓
              Docker Network
         ├─ Frontend Container
         ├─ Backend Container
         ├─ Database Container
         └─ Certbot (SSL renewal)
```

---

## Security Features

✅ HTTPS with automatic SSL certificate renewal
✅ HTTP to HTTPS redirect
✅ Rate limiting (prevents abuse)
✅ Security headers (HSTS, X-Frame-Options, etc.)
✅ CORS configured for your domain
✅ Gzip compression
✅ Container isolation

---

## Need Help?

1. Check the logs first: `docker-compose -f docker-compose.prod.yml logs`
2. Review the detailed guides: [DEPLOYMENT.md](DEPLOYMENT.md) & [DOMAIN-SSL-SETUP.md](DOMAIN-SSL-SETUP.md)
3. Check GitHub Actions logs for deployment issues
4. Open an issue on GitHub with error details

---

**You're all set!** 🚀

Push your code to trigger the first deployment.
