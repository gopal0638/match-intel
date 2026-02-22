# Production Setup Guide for Ubuntu

This guide walks you through deploying the Cricket Data Management System to a production Ubuntu server.

## Prerequisites

- Ubuntu 20.04 LTS or newer
- SSH access to your server
- A domain name (optional but recommended)
- Basic knowledge of Linux/Ubuntu command line

## Step 1: Server Setup

### 1.1 Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Required System Dependencies

```bash
sudo apt install -y \
  curl \
  git \
  build-essential \
  wget \
  unzip \
  nano \
  htop
```

## Step 2: Install Node.js

### 2.1 Add NodeSource Repository

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
```

### 2.2 Install Node.js

```bash
sudo apt install -y nodejs
```

### 2.3 Verify Installation

```bash
node --version
npm --version
```

Expected output: Node v22.x.x and npm 10.x.x (or higher)

## Step 3: Install PostgreSQL

### 3.1 Add PostgreSQL Repository

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
```

### 3.2 Update Package List and Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16
```

### 3.3 Start PostgreSQL Service

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### 3.4 Create Database and User

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE cricket_db;
CREATE USER cricket_user WITH PASSWORD 'checkMatchFixing@21';
ALTER ROLE cricket_user SET client_encoding TO 'utf8';
ALTER ROLE cricket_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE cricket_user SET default_transaction_deferrable TO on;
ALTER ROLE cricket_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE cricket_db TO cricket_user;
\c cricket_db
GRANT ALL ON SCHEMA public TO cricket_user;
EOF
```

**Replace `'your_secure_password_here'` with a strong password and save it securely.**

### 3.5 Verify Database Connection

```bash
psql -U cricket_user -d cricket_db -h localhost -W
```

When prompted, enter the password you created. You should see the `cricket_db=#` prompt. Type `\q` to exit.

## Step 4: Install PM2 (Process Manager)

### 4.1 Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 4.2 Enable PM2 Startup Hook

```bash
pm2 startup
# Follow the command output to complete setup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
```

## Step 5: Clone and Setup Application

### 5.1 Choose Application Directory

```bash
cd /home/$USER
mkdir -p apps
cd apps
```

### 5.2 Clone Repository

```bash
git clone <your-repository-url> match-intel
cd match-intel
```

### 5.3 Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 5.4 Build Application

```bash
npm run build
```

### 5.5 Create Production Environment File

```bash
nano .env.local
```

Add the following content:

```env
# Database Configuration
DB_USER=cricket_user
DB_PASSWORD=your_secure_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_db

# Application
NODE_ENV=production
```

**Replace `your_secure_password_here` with the actual password you created in Step 3.4**

Save and exit: `Ctrl + X`, then `Y`, then `Enter`

### 5.6 Verify Application Builds and Runs

```bash
npm start
```

The app should start at `http://localhost:3000`. Press `Ctrl + C` to stop.

## Step 6: Setup PM2 for Production

### 6.1 Create PM2 Start Script

```bash
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [
    {
      name: 'match-intel',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
    },
  ],
};
```

Save and exit: `Ctrl + X`, then `Y`, then `Enter`

### 6.2 Start Application with PM2

```bash
pm2 start ecosystem.config.js
```

### 6.3 Verify PM2 Status

```bash
pm2 status
pm2 logs match-intel
```

### 6.4 Save PM2 Configuration

```bash
pm2 save
```

## Step 7: Setup Nginx Reverse Proxy

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/match-intel
```

Add the following configuration:

```nginx
upstream match_intel_app {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name your-domain.com www.your-domain.com;

  # Redirect HTTP to HTTPS (uncomment after SSL is set up)
  # return 301 https://$server_name$request_uri;

  client_max_body_size 20M;

  location / {
    proxy_pass http://match_intel_app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Serve static files
  location /_next/static {
    proxy_pass http://match_intel_app;
    proxy_cache_bypass $http_upgrade;
    add_header Cache-Control "public, max-age=3600, immutable";
  }
}
```

**Replace `your-domain.com` with your actual domain name.**

Save and exit: `Ctrl + X`, then `Y`, then `Enter`

### 7.3 Enable Nginx Configuration

```bash
sudo ln -s /etc/nginx/sites-available/match-intel /etc/nginx/sites-enabled/match-intel
```

### 7.4 Test Nginx Configuration

```bash
sudo nginx -t
```

Expected output: `configuration file test is successful`

### 7.5 Start Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

## Step 8: Setup SSL Certificate (Let's Encrypt)

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Generate SSL Certificate

```bash
sudo certbot certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts to complete the setup.

### 8.3 Enable HTTPS Redirect in Nginx

Edit the Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/match-intel
```

Find the line `# return 301 https://$server_name$request_uri;` and uncomment it:

```nginx
return 301 https://$server_name$request_uri;
```

### 8.4 Reload Nginx

```bash
sudo systemctl reload nginx
```

### 8.5 Enable Auto-Renewal for SSL

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
sudo systemctl status certbot.timer
```

## Step 9: Setup Database Backups (Optional but Recommended)

### 9.1 Create Backup Script

```bash
mkdir -p ~/backups
nano ~/backups/backup_db.sh
```

Add the following:

```bash
#!/bin/bash

BACKUP_DIR="/home/$USER/backups"
DB_NAME="cricket_db"
DB_USER="cricket_user"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/cricket_db_backup_$TIMESTAMP.sql"

pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only the last 7 days of backups
find $BACKUP_DIR -name "cricket_db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Save and exit: `Ctrl + X`, then `Y`, then `Enter`

### 9.2 Make Script Executable

```bash
chmod +x ~/backups/backup_db.sh
```

### 9.3 Schedule Daily Backups with Cron

```bash
crontab -e
```

Add the following line at the end:

```
0 2 * * * /home/$USER/backups/backup_db.sh
```

This runs the backup daily at 2 AM.

## Step 10: Setup Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## Step 11: Monitor and Maintain

### 11.1 Monitor Application Logs

```bash
pm2 logs match-intel
```

### 11.2 Check PostgreSQL Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### 11.3 Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 11.4 Monitor System Resources

```bash
htop
```

## Troubleshooting

### Application Won't Start

1. Check PM2 logs: `pm2 logs match-intel`
2. Verify database connection: `psql -U cricket_user -d cricket_db -h localhost -W`
3. Check environment variables: `cat /home/$USER/apps/match-intel/.env.local`

### Database Connection Error

1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Verify credentials: `psql -U cricket_user -d cricket_db -h localhost -W`
3. Check firewall: `sudo ufw status`

### Nginx Not Forwarding Traffic

1. Test config: `sudo nginx -t`
2. Check if app is running: `pm2 status`
3. Verify upstream server: `sudo netstat -tlnp | grep 3000`

### SSL Certificate Issues

1. Check certificate expiry: `sudo certbot certificates`
2. Renew manually: `sudo certbot renew --dry-run`
3. Check certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

## Security Checklist

- [ ] Change PostgreSQL `cricket_user` password to a strong, unique password
- [ ] Configure SSH key-based authentication (disable password login)
- [ ] Enable and configure firewall (ufw)
- [ ] Setup regular database backups
- [ ] Monitor logs regularly
- [ ] Enable SSL/HTTPS
- [ ] Setup fail2ban for brute-force protection (optional)
- [ ] Keep system packages updated: `sudo apt update && sudo apt upgrade`
- [ ] Use strong database credentials in `.env.local`
- [ ] Restrict file permissions: `chmod 600 .env.local`

## Additional Commands

### Restart Application

```bash
pm2 restart match-intel
```

### Stop Application

```bash
pm2 stop match-intel
```

### View Application Logs

```bash
pm2 logs match-intel --lines 100
```

### Deploy Updates

```bash
cd /home/$USER/apps/match-intel
git pull origin main
npm install --legacy-peer-deps
npm run build
pm2 restart match-intel
```

### Database Connection from CLI

```bash
psql -U cricket_user -d cricket_db -h localhost
```

## Environment Variables Reference

All environment variables should be set in `.env.local`:

```env
# Required
DB_USER=cricket_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_db
NODE_ENV=production
```

## Support & Maintenance

- Keep your Ubuntu system updated: `sudo apt update && sudo apt upgrade`
- Monitor disk space: `df -h`
- Monitor database size: `psql -U cricket_user -d cricket_db -c "SELECT pg_size_pretty(pg_database_size('cricket_db'));"`
- Setup log rotation for application logs
- Schedule regular security updates

## Rollback Procedure

If you need to rollback to a previous version:

1. Stop the application: `pm2 stop match-intel`
2. Restore database backup: `gunzip < ~/backups/cricket_db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U cricket_user -d cricket_db`
3. Checkout previous commit: `cd /home/$USER/apps/match-intel && git checkout <commit-hash>`
4. Rebuild and restart: `npm run build && pm2 start ecosystem.config.js`

---

**Version**: 1.0  
**Last Updated**: February 22, 2026
