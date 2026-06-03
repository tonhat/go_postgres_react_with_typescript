#!/usr/bin/env bash
set -e

DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-education_db}"

echo "==> Starting PostgreSQL..."
if pg_isready -q 2>/dev/null; then
  echo "    PostgreSQL is already running."
else
  echo "    Starting local PostgreSQL service..."
  sudo systemctl start postgresql
  echo "    Waiting for PostgreSQL..."
  for i in $(seq 1 10); do
    if pg_isready -q 2>/dev/null; then break; fi
    sleep 1
  done
fi

echo "==> Creating database '${DB_NAME}' if it does not exist..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres createdb "${DB_NAME}"

echo "==> Setting password for '${DB_USER}' role..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}'" | grep -q 1 && \
  sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" || \
  sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN SUPERUSER PASSWORD '${DB_PASSWORD}';"

echo "==> Database is ready at localhost:5432"
echo "==> Starting Go backend..."
cd "$(dirname "$0")/backend"
cp -n .env.example .env 2>/dev/null || true
go run ./cmd/server

