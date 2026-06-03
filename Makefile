.PHONY: help db-up db-down db-status backend backend-run frontend frontend-install frontend-build seed clean

DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_NAME ?= education_db
SUDO ?= sudo

help:
	@echo "Makefile commands:"
	@echo "  make db-up           - Stop local Postgres, then start Docker Postgres on :5432"
	@echo "  make db-down         - Stop Docker Postgres, then start local Postgres back"
	@echo "  make db-status       - Show which Postgres is currently running"
	@echo "  make db-create       - Create database if not exists"
	@echo "  make backend         - Build Go backend"
	@echo "  make backend-run     - Run Go backend"
	@echo "  make frontend-install- Install npm dependencies"
	@echo "  make frontend-dev    - Run frontend dev server"
	@echo "  make frontend-build  - Build frontend for production"
	@echo "  make clean           - Clean build artifacts"

db-up:
	@echo ">> Stopping local PostgreSQL service..."
	@$(SUDO) systemctl stop postgresql || true
	@echo ">> Starting Postgres via docker compose..."
	docker compose up -d postgres
	@echo ">> Waiting for Postgres to be ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if docker compose exec -T postgres pg_isready -U $(DB_USER) >/dev/null 2>&1; then \
			echo ">> Postgres is ready."; \
			break; \
		fi; \
		sleep 1; \
	done

db-down:
	@echo ">> Stopping docker Postgres..."
	docker compose down
	@echo ">> Starting local PostgreSQL service back..."
	@$(SUDO) systemctl start postgresql || true
	@echo ">> Done."

db-status:
	@echo "Local Postgres:    " ; (ss -tlnp 2>/dev/null | grep -q ':5432 ' && echo "running" || echo "stopped")
	@echo "Docker container:  " ; (docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^edu_postgres$$' && echo "running" || echo "stopped")

db-create:
	PGPASSWORD=$(DB_PASSWORD) psql -h localhost -U $(DB_USER) -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)'" | grep -q 1 || \
	PGPASSWORD=$(DB_PASSWORD) psql -h localhost -U $(DB_USER) -c "CREATE DATABASE $(DB_NAME)"

backend:
	cd backend && go build -o bin/server ./cmd/server

backend-run:
	cd backend && go run ./cmd/server

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

clean:
	rm -rf backend/bin frontend/dist

