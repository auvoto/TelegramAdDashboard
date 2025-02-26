# Production Deployment Guide

## Prerequisites
1. Node.js v18+ installed on VPS
2. PostgreSQL database setup
3. PM2 for process management (`npm install -g pm2`)

## Deployment Steps

### 1. First-time Setup
```bash
# Create app directory
mkdir -p /var/www/telegram-marketing
cd /var/www/telegram-marketing

# Create uploads directory
mkdir -p uploads/logos
```

### 2. Environment Setup
Create `.env` file with production settings:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/telegram_marketing"
SESSION_SECRET="your-long-secure-secret"
NODE_ENV="production"
```

### 3. Application Deployment
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build frontend
npm run build

# Start with PM2
pm2 start npm --name "telegram-marketing" -- start
```

### 4. Nginx Configuration
Create `/etc/nginx/sites-available/telegram-marketing`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploads directory
    location /uploads {
        alias /var/www/telegram-marketing/uploads;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # Enable compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/xml;
    gzip_disable "MSIE [1-6]\.";
}
```

### 5. Database Migration
```bash
# Run database migrations
npm run db:push
```

### 6. SSL Setup (Optional)
```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

## Maintenance Commands

### Update Application
```bash
git pull origin main
npm install
npm run build
pm2 restart telegram-marketing
```

### View Logs
```bash
pm2 logs telegram-marketing
```

### Monitor Application
```bash
pm2 monit
```

## Troubleshooting

### If the app fails to start:
1. Check logs: `pm2 logs telegram-marketing`
2. Verify env variables: `cat .env`
3. Check database connection: `psql -U your_user -d your_database`
4. Verify node version: `node -v`

### If uploads aren't working:
1. Check directory permissions:
```bash
chown -R www-data:www-data /var/www/telegram-marketing/uploads
chmod 755 /var/www/telegram-marketing/uploads
```

### If sessions are not persisting:
1. Verify SESSION_SECRET is set
2. Check PostgreSQL connection for session store
3. Clear all sessions if needed:
```sql
TRUNCATE TABLE "session";
```

## Performance Optimization

1. Enable node clustering:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "telegram-marketing",
    script: "npm",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    }
  }]
}
```

2. Configure Nginx caching:
```nginx
# Add to server block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

location / {
    proxy_cache my_cache;
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    proxy_cache_valid 200 60m;
    add_header X-Cache-Status $upstream_cache_status;
    # ... rest of the location block
}
```

## Monitoring Setup

1. Install monitoring tools:
```bash
pm2 install pm2-server-monit
pm2 install pm2-logrotate
```

2. Set up log rotation:
```bash
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Regular Maintenance

1. Update system packages:
```bash
apt update && apt upgrade
```

2. Monitor disk space:
```bash
df -h
```

3. Backup database:
```bash
pg_dump -U your_user your_database > backup.sql
```

4. Clean old logs:
```bash
pm2 flush
```
