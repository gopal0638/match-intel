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

or

use following command to run app using pm2:

pm2 start npm --name "my-app-name" -- start

```

The app should start at `http://localhost:3000`. Press `Ctrl + C` to stop.