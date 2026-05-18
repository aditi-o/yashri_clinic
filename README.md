# ClinicMS — Full-Stack Clinic Management System

## Demo Credentials
| Role         | Phone      | Password   |
|-------------|------------|------------|
| Admin        | 9000000000 | admin123   |
| Doctor       | 9876543210 | doctor123  |
| Patient      | 9123456789 | patient123 |
| Receptionist | 9555000001 | rec123   |

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev --name init
npx prisma db seed
npm run dev          # starts on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # starts on port 5173
```

## Deployment

**Free deployment to production?** See [DEPLOYMENT.md](DEPLOYMENT.md) for a complete step-by-step guide using:
- **Frontend:** Vercel (free)
- **Backend:** Render (free)
- **Database:** Neon PostgreSQL (free)

Takes ~30 minutes to set up and scales as you grow.

## Architecture
- **Frontend**: React 18 + Vite + Tailwind CSS 3 + Recharts + Zustand + React Router 6
- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL + JWT + Zod + bcrypt
- **Design**: Plus Jakarta Sans + DM Sans fonts, CSS custom properties design system

## RBAC
| Role         | Can Register | Created By | Capabilities |
|-------------|-------------|------------|-------------|
| ADMIN        | No (seeded)  | Database   | Full system control, manage doctors & receptionists |
| DOCTOR       | No           | Admin only | Appointments, visits, staff management |
| RECEPTIONIST | No           | Admin/Doctor | Patient registration, scheduling (permission-gated) |
| PATIENT      | Yes (public) | Self       | Book appointments, view history |
