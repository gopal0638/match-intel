# PostgreSQL Migration Guide

Your project has been successfully migrated from SQLite to PostgreSQL!

## Setup Instructions

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Connect to PostgreSQL
psql postgres

# Inside psql, run these commands:
CREATE USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE cricket_db OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE cricket_db TO postgres;
\q
```

Or use this one-liner:
```bash
createdb -U postgres cricket_db
```

### 3. Environment Setup

Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

Update the values in `.env.local` if needed:
```
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_db
```

### 4. Run the Application

```bash
npm run dev
```

The application will automatically create all tables on first connection.

### 5. Verify Connection

You can verify the database connection with:
```bash
psql -U postgres -d cricket_db -c "\dt"
```

This should list all the tables created by the application.

## What Changed

- **Old:** SQLite (file-based, `data/cricket.db`)
- **New:** PostgreSQL (client-server, network access)

### Benefits of PostgreSQL:
- ✅ Better for concurrent users
- ✅ More powerful query capabilities
- ✅ Enterprise-grade reliability
- ✅ Network-accessible
- ✅ Better for production deployments

## Database Connection Details

The connection is configured through environment variables:
- `DB_USER`: PostgreSQL user
- `DB_PASSWORD`: User password
- `DB_HOST`: Server host (localhost for local development)
- `DB_PORT`: Server port (default 5432)
- `DB_NAME`: Database name

## Troubleshooting

**Connection refused?**
- Ensure PostgreSQL is running: `brew services list` (macOS)
- Check if port 5432 is open: `lsof -i :5432`

**Table not found?**
- The tables are created automatically on first run
- Check the PostgreSQL logs for errors

**Password issues?**
- Update `.env.local` with correct credentials
- Reset password: `psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"`
