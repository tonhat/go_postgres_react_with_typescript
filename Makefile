.PHONY: help db-up db-down backend backend-run frontend frontend-install frontend-build seed clean

DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_NAME ?= education_db

help:
	@echo "Makefile commands:"
	@echo "  make db-up           - Start Postgres via docker compose"
	@echo "  make db-down         - Stop Postgres"
	@echo "  make db-create       - Create database if not exists"
	@echo "  make backend         - Build Go backend"
	@echo "  make backend-run     - Run Go backend"
	@echo "  make frontend-install- Install npm dependencies"
	@echo "  make frontend-dev    - Run frontend dev server"
	@echo "  make frontend-build  - Build frontend for production"
	@echo "  make clean           - Clean build artifacts"

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

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
