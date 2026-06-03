# Go + PostgreSQL + React + TypeScript - Education Management System

A full-stack education management web application with Go (Gin + GORM + PostgreSQL) backend and React + TypeScript + Vite + TailwindCSS frontend.

## Features

- **Authentication**: Sign up, sign in, sign out with JWT
- **User management**: Admin can list, update role, activate/deactivate and delete users
- **Students**: Full CRUD with student code, major, year, GPA, guardian info
- **Teachers**: Full CRUD with department, title, specialty, salary
- **Courses**: Full CRUD with credit, hours, department
- **Launches** (semesters/terms): Full CRUD with date range and active flag
- **Classes**: Full CRUD linking course + teacher + launch with room, schedule, capacity, and enrollment
- **Dashboard**: Quick stats of all entities

## Project Structure

```
go_postgres_react_with_typescript/
├── backend/                    # Go API server
│   ├── cmd/server/main.go     # Entry point
│   ├── internal/
│   │   ├── config/            # Env config
│   │   ├── database/          # DB connect, migrate, seed
│   │   ├── models/            # GORM models
│   │   ├── handlers/          # HTTP handlers
│   │   ├── middleware/        # JWT auth, role check
│   │   ├── routes/            # Route registration
│   │   └── utils/             # JWT, password helpers
│   ├── .env.example
│   └── go.mod
├── frontend/                   # React + TS app
│   ├── src/
│   │   ├── components/        # Layout, modals
│   │   ├── context/           # Auth context
│   │   ├── pages/             # All pages
│   │   ├── services/          # API client
│   │   ├── types/             # TS types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml          # Optional: Postgres via Docker (alternative)
├── start.sh                    # One-command startup script
├── Makefile
└── README.md
```

## Tech Stack

**Backend:** Go 1.23, Gin, GORM, PostgreSQL, JWT (HS256), bcrypt, godotenv

**Frontend:** React 18, TypeScript 5, Vite 5, React Router 6, Axios, TailwindCSS 3

## Quick Start

### One-command start

```bash
./start.sh
```

This will:
- Start the local PostgreSQL service (prompts for `sudo`)
- Create the `education_db` database and `postgres` role if missing
- Start the Go backend on `:8080`

### Step by step

**1. Start PostgreSQL & create database**

```bash
sudo systemctl start postgresql
make db-create     # creates education_db and postgres role
```

**2. Configure backend**

```bash
cd backend
cp .env.example .env
```

**3. Run backend**

```bash
make backend-run
# or: cd backend && go run ./cmd/server
```

The API will start at `http://localhost:8080` and:
- auto-migrate all tables
- seed a default admin user and one launch
- print: `Default admin: admin@education.com / admin123`

**4. Run frontend**

```bash
cd frontend
npm install
npm run dev
```

The UI will be at `http://localhost:5173` and proxies `/api` requests to the backend.

**5. Sign in**

Open `http://localhost:5173` and use the default admin:

- Email: `admin@education.com`
- Password: `admin123`

> If you prefer Docker over the local PostgreSQL, run `docker compose up -d postgres` instead of step 1.

## API Endpoints

All endpoints under `/api`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint                       | Description                  |
|--------|--------------------------------|------------------------------|
| GET    | /health                        | Health check                 |
| POST   | /api/auth/signup               | Register a new user          |
| POST   | /api/auth/signin               | Sign in, returns JWT         |
| POST   | /api/auth/signout              | Sign out                     |
| GET    | /api/auth/me                   | Get current user             |
| GET    | /api/users                     | List users                   |
| GET    | /api/users/:id                 | Get user                     |
| PUT    | /api/users/:id                 | Update user                  |
| DELETE | /api/users/:id                 | Delete user                  |
| GET    | /api/students                  | List students (`?search=`)   |
| POST   | /api/students                  | Create student               |
| PUT    | /api/students/:id              | Update student               |
| DELETE | /api/students/:id              | Delete student               |
| GET    | /api/teachers                  | List teachers                |
| POST   | /api/teachers                  | Create teacher               |
| PUT    | /api/teachers/:id              | Update teacher               |
| DELETE | /api/teachers/:id              | Delete teacher               |
| GET    | /api/courses                   | List courses                 |
| POST   | /api/courses                   | Create course                |
| PUT    | /api/courses/:id               | Update course                |
| DELETE | /api/courses/:id               | Delete course                |
| GET    | /api/launches                  | List launches                |
| POST   | /api/launches                  | Create launch                |
| PUT    | /api/launches/:id              | Update launch                |
| DELETE | /api/launches/:id              | Delete launch                |
| GET    | /api/classes                   | List classes                 |
| POST   | /api/classes                   | Create class                 |
| PUT    | /api/classes/:id               | Update class                 |
| DELETE | /api/classes/:id               | Delete class                 |
| POST   | /api/classes/:id/enroll        | Enroll a student in a class  |
| GET    | /api/classes/:id/enrollments   | List enrollments of a class  |

## Roles

- `admin` – full access
- `teacher` – read-only access to most resources
- `student` – read-only access

Roles are stored in the `users` table. Use the Users page to promote/demote accounts.

## Notes

- JWT secret must be changed in production (set `JWT_SECRET` in `.env`).
- Database schema is created automatically via GORM `AutoMigrate` on startup.
- The default admin can create more users, students, teachers, etc.
