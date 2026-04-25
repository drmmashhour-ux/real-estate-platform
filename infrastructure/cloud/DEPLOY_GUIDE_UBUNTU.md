# LECIPM Cloud Deployment Guide (Ubuntu 5.161.211.42)

This guide documents the configuration and deployment process for the LECIPM platform on the `ubuntu-8gb-ash-1` instance.

## Server Details
- **Host**: 5.161.211.42
- **User**: root
- **OS**: Ubuntu (8GB RAM)
- **Region**: Ashburn (ASH)

## 1. Initial Server Setup (Run on Server)

```bash
# Update and install dependencies
apt update && apt upgrade -y
apt install -y git curl build-essential nginx

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2
```

## 2. Platform Deployment

```bash
# Clone the repository
git clone https://github.com/drmmashhour-ux/real-estate-platform.git /var/www/lecipm
cd /var/www/lecipm

# Install dependencies
pnpm install

# Setup Environment Variables
cp apps/web/.env.example apps/web/.env
# EDIT apps/web/.env with the production DATABASE_URL and other secrets

# Build the project
pnpm build

# Start with PM2
pm2 start "pnpm start" --name "lecipm-web"
```

## 3. Prisma Production Notes
The platform is configured to use the **Library Engine** for stability. Ensure the following is set in the production environment:
- `PRISMA_CLIENT_ENGINE_TYPE=library`
- `DATABASE_URL` (Neon PostgreSQL)

## 4. Nginx Reverse Proxy
Configure Nginx to route traffic from port 80 to the application (port 3001).

```nginx
server {
    listen 80;
    server_name 5.161.211.42;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
