# Docker Setup Guide

This project is now configured with Docker and Docker Compose for easy development and deployment.

## Prerequisites

- Docker Desktop installed (includes both Docker and Docker Compose)
  - [macOS](https://docs.docker.com/docker-for-mac/install/)
  - [Windows](https://docs.docker.com/docker-for-windows/install/)
  - [Linux](https://docs.docker.com/engine/install/)

## Quick Start

### 1. Build and Start Services

```bash
docker-compose up --build
```

This will:
- Build the Next.js application image
- Start PostgreSQL container
- Start the Next.js app container
- Automatically create all database tables

### 2. Access the Application

- **App:** http://localhost:3000
- **Database:** localhost:5432

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f app
```

## Common Commands

### Start Services (without rebuilding)
```bash
docker-compose up
```

### Start in Background
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Remove Everything (including volumes)
```bash
docker-compose down -v
```

### Rebuild Services
```bash
docker-compose up --build
```

### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U postgres -d cricket_db
```

### View Database Tables
```bash
docker-compose exec postgres psql -U postgres -d cricket_db -c "\dt"
```

## Development Workflow

### Development Mode (Hot Reload)

Create a `docker-compose.dev.yml`:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Run Commands Inside Container

```bash
# Install dependencies
docker-compose exec app npm install

# Run lint
docker-compose exec app npm run lint

# Run build
docker-compose exec app npm run build
```

## Environment Variables

The Docker setup uses environment variables defined in:
- **docker-compose.yml** - Service configuration

Database credentials are:
- Username: `postgres`
- Password: `postgres`
- Host: `postgres` (container name, resolves via Docker network)
- Port: `5432`
- Database: `cricket_db`

## Volumes

### postgres_data
- Persists PostgreSQL data between container restarts
- Automatically created and managed by Docker
- Removed when running `docker-compose down -v`

### Application Volume
- Mounts current directory into `/app`
- Allows live code editing (with npm hot reload in dev mode)

## Networking

Services communicate through the `cricket_network` Docker network:
- App service: accessible at `app` hostname
- PostgreSQL service: accessible at `postgres` hostname

External access:
- App on `localhost:3000`
- PostgreSQL on `localhost:5432`

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Find process using port 5432
lsof -i :5432

# Kill process (macOS)
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check if postgres is healthy
docker-compose ps

# View postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

### Build Failures
```bash
# Clean rebuild
docker-compose down
docker-compose up --build --no-cache
```

### Permission Issues (Linux)
```bash
# Run with sudo
sudo docker-compose up

# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## Production Deployment

For production:

1. Update `docker-compose.yml`:
   - Change `NODE_ENV` to `production`
   - Use strong passwords
   - Set up proper database backups
   - Configure environment variables securely

2. Use Docker Registry (Docker Hub, ECR, etc.):
   ```bash
   docker build -t myregistry/match-intel:latest .
   docker push myregistry/match-intel:latest
   ```

3. Orchestration platforms:
   - Kubernetes
   - Docker Swarm
   - AWS ECS
   - Heroku

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
