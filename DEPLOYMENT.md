# AWS EC2 Deployment Guide

This guide will help you deploy the Flashcards application to AWS EC2 using GitHub Actions CI/CD.

## Prerequisites

- AWS EC2 instance running and accessible
- Docker and Docker Compose installed on EC2
- GitHub repository set up
- SSH access to EC2 instance

## EC2 Instance Setup

### 1. Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Install Docker

```bash
# Update package list
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
exit
```

### 3. Install Docker Compose

```bash
# Connect again
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 4. Install Git

```bash
sudo apt-get install -y git
```

### 5. Clone Your Repository

```bash
# Clone the repository (replace with your repo URL)
cd ~
git clone https://github.com/YOUR_USERNAME/fc-production-app.git
cd fc-production-app

# Configure git to store credentials
git config --global credential.helper store
```

### 6. Configure Security Groups

Make sure your EC2 Security Group allows inbound traffic on:
- Port 22 (SSH)
- Port 3000 (Frontend)
- Port 8000 (Backend API)
- Port 80 (Optional: HTTP)
- Port 443 (Optional: HTTPS)

## GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | Your AWS region | `us-east-1` |
| `EC2_HOST` | Your EC2 instance public IP or DNS | `54.123.456.789` or `ec2-54-123-456-789.compute-1.amazonaws.com` |
| `EC2_USER` | SSH username for EC2 | `ubuntu` (or `ec2-user` for Amazon Linux) |
| `EC2_SSH_KEY` | Your EC2 private key (entire file) | Contents of your `.pem` file |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with: `openssl rand -hex 32` |

### How to Get Your SSH Key Content

On your local machine:

```bash
cat your-ec2-key.pem
```

Copy the entire output (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`) and paste it as the `EC2_SSH_KEY` secret.

### How to Generate JWT_SECRET

```bash
openssl rand -hex 32
```

## Deployment Process

### Automatic Deployment

Once you've set up the secrets, deployment is automatic:

1. Push to the `main` branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. GitHub Actions will automatically:
   - Connect to your EC2 instance
   - Pull the latest code
   - Build Docker images
   - Start the containers
   - Run database migrations

### Manual Deployment

You can also trigger deployment manually:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to AWS EC2" workflow
4. Click "Run workflow" → "Run workflow"

## Access Your Application

After successful deployment:

- **Frontend**: `http://YOUR_EC2_IP:3000`
- **Backend API**: `http://YOUR_EC2_IP:8000`
- **API Documentation**: `http://YOUR_EC2_IP:8000/docs`

## Local Testing Before Deployment

Test your production configuration locally:

```bash
# Create a .env file
cp .env.example .env

# Edit .env with your production values
nano .env

# Run with production compose file
docker-compose -f docker-compose.prod.yml up --build
```

## Monitoring and Logs

### View Container Logs on EC2

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# View all container logs
cd ~/fc-production-app
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs db

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

### Check Container Status

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs in the Actions tab
2. Verify all secrets are correctly set
3. Ensure EC2 security groups allow necessary ports
4. Check EC2 instance has enough disk space: `df -h`
5. Check EC2 instance has enough memory: `free -h`

### Application Not Accessible

1. Verify containers are running:
   ```bash
   docker ps
   ```

2. Check container logs for errors:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

3. Verify ports are open:
   ```bash
   sudo netstat -tulpn | grep -E '3000|8000'
   ```

4. Check EC2 Security Group rules in AWS Console

### Database Issues

1. Check database container is running:
   ```bash
   docker ps | grep flashcards-db
   ```

2. Connect to database directly:
   ```bash
   docker exec -it flashcards-db psql -U postgres -d flashcards
   ```

3. Check database logs:
   ```bash
   docker logs flashcards-db
   ```

### Out of Disk Space

Clean up Docker resources:

```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove unused volumes (WARNING: this will delete data)
docker volume prune
```

## Updating Environment Variables

To update environment variables after deployment:

1. SSH into EC2:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. Edit the .env file:
   ```bash
   cd ~/fc-production-app
   nano .env
   ```

3. Restart containers:
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

## Setting Up a Domain Name (Optional)

1. Point your domain's DNS A record to your EC2 IP
2. Update `NEXT_PUBLIC_API_URL` in your .env file
3. Update `CORS_ORIGINS` in docker-compose.prod.yml
4. Consider setting up SSL with Let's Encrypt and nginx

## Backup Database

```bash
# Create backup
docker exec flashcards-db pg_dump -U postgres flashcards > backup.sql

# Restore backup
docker exec -i flashcards-db psql -U postgres flashcards < backup.sql
```

## Security Recommendations

1. Change default database password
2. Use strong JWT_SECRET
3. Enable HTTPS with SSL certificate
4. Regularly update Docker images
5. Use AWS Secrets Manager for sensitive data
6. Enable AWS CloudWatch for monitoring
7. Set up automated backups for the database
8. Restrict SSH access to specific IP addresses
9. Keep EC2 instance and packages updated

## Cost Optimization

1. Use appropriate EC2 instance size (t2.micro/t3.micro for small apps)
2. Consider Reserved Instances for long-term use
3. Set up auto-shutdown for non-production instances
4. Monitor with AWS Cost Explorer
5. Use Elastic IPs carefully (charged when not attached)

## Support

For issues or questions:
- Check GitHub Actions logs
- Review EC2 container logs
- Check AWS CloudWatch logs
- Open an issue in the GitHub repository
