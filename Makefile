.PHONY: help db-up db-down db-create backend backend-run frontend-install frontend-dev frontend-build clean start

DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_NAME ?= education_db

help:
	@echo "Makefile commands:"
	@echo "  make start          - Start local Postgres, create DB, run backend (interactive, needs sudo)"
	@echo "  make db-up          - Start local PostgreSQL service"
	@echo "  make db-down        - Stop local PostgreSQL service"
	@echo "  make db-create      - Create the education_db database"
	@echo "  make backend        - Build Go backend"
	@echo "  make backend-run    - Run Go backend"
	@echo "  make frontend-install - Install npm dependencies"
	@echo "  make frontend-dev   - Run frontend dev server"
	@echo "  make frontend-build - Build frontend for production"
	@echo "  make clean          - Clean build artifacts"

start: db-up db-create backend-run

db-up:
	@echo ">> Starting local PostgreSQL..."
	@sudo systemctl start postgresql 2>/dev/null || echo "    PostgreSQL already running or needs your password"
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if pg_isready -q 2>/dev/null; then echo "    Postgres is ready."; break; fi; \
		sleep 1; \
	done

db-down:
	@echo ">> Stopping local PostgreSQL..."
	@sudo systemctl stop postgresql

db-create:
	@echo ">> Creating database $(DB_NAME)..."
	@sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$(DB_NAME)'" | grep -q 1 && \
		echo "    Database already exists." || \
		(sudo -u postgres createdb "$(DB_NAME)" && echo "    Done.")
	@sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$(DB_USER)'" | grep -q 1 && \
		sudo -u postgres psql -c "ALTER USER $(DB_USER) WITH PASSWORD '$(DB_PASSWORD)';" && \
		echo "    Password set for $(DB_USER)." || \
		(sudo -u postgres psql -c "CREATE ROLE $(DB_USER) LOGIN SUPERUSER PASSWORD '$(DB_PASSWORD)';" && \
		 echo "    Role $(DB_USER) created.")

backend:
	cd backend && go build -o bin/server ./cmd/server

backend-run:
	cd backend && cp -n .env.example .env 2>/dev/null || true && go run ./cmd/server

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

clean:
	rm -rf backend/bin frontend/dist
