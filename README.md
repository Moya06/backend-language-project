# GrammarLanguages Platform — Backend API

A **Modular Monolith** REST API built with Express, Prisma, and PostgreSQL. Ready to extract into microservices when traffic demands.

---

## Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| ORM / Migrations | Prisma |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh token rotation) |
| Deployment | Railway + Neon.tech |
| CI/CD | GitHub Actions |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and generate JWT secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Run database + migrate
```bash
# Option A — Docker (recommended for local dev)
docker compose up db -d
npm run db:migrate

# Option B — Neon.tech / existing Postgres
npm run db:migrate
```

### 4. Seed data
```bash
npm run db:seed
```

### 5. Start dev server
```bash
npm run dev
# API running at http://localhost:3000
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login → access + refresh tokens |
| POST | `/auth/refresh` | Rotate refresh token |
| POST | `/auth/logout` | Invalidate refresh token |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | ✓ | Get own profile |
| PATCH | `/users/me` | ✓ | Update profile |
| POST | `/users/me/password` | ✓ | Change password |
| GET | `/users/leaderboard` | ✓ | XP leaderboard |
| GET | `/users` | Admin | List all users |

### Languages & Catalogue
| Method | Path | Description |
|--------|------|-------------|
| GET | `/languages` | All active languages |
| GET | `/languages/:code/levels` | Levels for a language |
| GET | `/levels/:id` | Level + modules |
| GET | `/modules/:id` | Module + activities |
| GET | `/activities/:id` | Full activity content |

### Progress
| Method | Path | Description |
|--------|------|-------------|
| POST | `/progress/complete` | Submit activity result |
| GET | `/progress?lang=en` | Get user progress |
| GET | `/progress/skills/:lang/suggestions` | Weak skill suggestions |

### Gamification
| Method | Path | Description |
|--------|------|-------------|
| GET | `/gamification/achievements` | All achievements + unlock status |
| GET | `/gamification/notifications` | User notifications |
| PATCH | `/gamification/notifications/read` | Mark notifications read |

### Placement Test
| Method | Path | Description |
|--------|------|-------------|
| GET | `/placement/:lang/test` | Get test questions |
| POST | `/placement/submit` | Submit answers → CEFR result |
| GET | `/placement/:lang/result` | Latest result |

### AI (Phase 3 — optional)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/ai/status` | Check if AI is enabled |
| POST | `/ai/writing/correct` | GPT-4o writing correction |
| POST | `/ai/speaking/evaluate` | Whisper + GPT-4o speaking eval |

---

## Folder Structure

```
src/
├── app.js                    # Express app + route mounting
├── config/
│   ├── env.js                # Validated env vars
│   └── prisma.js             # Prisma singleton
├── middleware/
│   ├── auth.middleware.js    # JWT authentication
│   ├── error.middleware.js   # Global error handler
│   └── logger.middleware.js  # Morgan HTTP logger
├── modules/
│   ├── auth/                 # Register, login, refresh
│   ├── users/                # Profile, leaderboard
│   ├── languages/            # Catalogue: languages, levels, modules, activities
│   ├── progress/             # XP, streak, skill tracking
│   ├── gamification/         # Achievements, notifications
│   ├── placement/            # CEFR placement test
│   └── ai/                   # Phase 3: writing + speaking AI
└── utils/
    ├── jwt.js                # Token helpers
    ├── response.js           # Uniform API envelope
    └── validate.js           # express-validator runner

prisma/
├── schema.prisma             # Full DB schema
└── seed.js                   # Seed languages, levels, activities, achievements

frontend-integration/
└── api.js                    # Drop-in frontend service layer (ESM)

__tests__/
└── auth.test.js              # Integration tests
```

---

## Deployment

### Railway (recommended)
1. Push to GitHub
2. Create Railway project → connect repo
3. Add env vars (copy from `.env.example`)
4. Set `DATABASE_URL` from Neon.tech
5. Railway auto-deploys on push to `main`

### Docker
```bash
docker compose up --build
```

---

## Implementation Phases

| Phase | Status | Features |
|-------|--------|---------|
| Phase 1 | ✅ Ready | Auth, Users, Catalogue, Progress |
| Phase 2 | ✅ Ready | Placement test, Achievements, Skill suggestions |
| Phase 3 | 🔌 Optional | AI writing/speaking (set `OPENAI_API_KEY`) |
