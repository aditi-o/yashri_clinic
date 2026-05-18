# Deployment Guide – Free Stack

Deploy this clinic app for free on **Vercel** (frontend) + **Render** (backend) + **Neon** (PostgreSQL).

---

## Step 1: Create Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project (free tier)
3. Copy your `DATABASE_URL` from the connection string
4. Keep it safe — you'll need it for the backend

**Example:**
```
postgresql://user:password@ep-xyz.neon.tech/clinic_db?sslmode=require
```

---

## Step 2: Deploy Backend on Render

### 2.1 Prepare the Backend

1. Create a `.env` file in the `backend/` folder:

```env
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/clinic_db?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
PORT=5000
```

**Generate a strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.2 Push to GitHub

```bash
cd clinic-v2-patched
git add backend/.env
git commit -m "Add backend env for Render"
git push origin main
```

**Do NOT commit `.env` in production — Render will read it from the dashboard.**

### 2.3 Create Render App

1. Go to [render.com](https://render.com) and sign up
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Fill in:
   - **Name:** `clinic-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npx prisma migrate deploy`
   - **Start Command:** `cd backend && npm start`
   - **Region:** Choose closest to you

5. Click **Advanced** and add environment variables:
   ```
   DATABASE_URL = [paste from Neon]
   JWT_SECRET = [your generated secret]
   NODE_ENV = production
   FRONTEND_URL = [will update after Vercel deploy]
   ```

6. Click **Create Web Service**
7. Wait for build to complete (5–10 min)
8. Copy your Render URL (e.g., `https://clinic-backend.onrender.com`)

### 2.4 Seed the Database

Run this in Render dashboard → **Shell**:
```bash
cd backend && npx prisma db seed
```

Or run locally with the same `DATABASE_URL` if shell fails:
```bash
DATABASE_URL="postgresql://..." npx prisma db seed
```

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Update Frontend API URL

Edit `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... rest of file unchanged
```

### 3.2 Create Vercel App

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Click **Environment Variables** and add:
   ```
   VITE_API_BASE_URL = https://clinic-backend.onrender.com/api
   ```

6. Click **Deploy**
7. Wait for build (2–5 min)
8. Copy your Vercel URL (e.g., `https://clinic-frontend.vercel.app`)

---

## Step 4: Connect Backend to Frontend

Go back to Render dashboard:
1. Click your `clinic-backend` service
2. Click **Environment**
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL = https://clinic-frontend.vercel.app
   ```
4. Click **Save** (will trigger redeploy)

---

## Step 5: Test Login

1. Open your Vercel app: `https://clinic-frontend.vercel.app`
2. Use demo credentials:
   - **Admin:** `9000000000` / `admin123`
   - **Doctor:** `9876543210` / `doctor123`
   - **Patient:** `9123456789` / `patient123`
   - **Receptionist:** `9555000001` / `rec123`

---

## Troubleshooting

### Frontend shows 404 or "Cannot find API"
- Check `VITE_API_BASE_URL` in Vercel environment variables
- Verify backend URL is correct and accessible
- Check browser console for CORS errors

### Backend build fails on Render
- Check build logs in Render dashboard
- Ensure all dependencies are in `backend/package.json`
- Make sure migrations exist: `backend/prisma/migrations/`

### Database connection error
- Verify `DATABASE_URL` is correct
- Check Neon IP whitelist (free tier may require manual allowlist)
- Test locally: `DATABASE_URL="..." npm run dev`

### Seeding fails
- Make sure `prisma/schema.prisma` is present
- Check `prisma/seed.js` exists and is executable
- Run manually if dashboard shell fails

---

## Scaling Later

When you need more than free:
- Database: Neon Pro ($15/mo)
- Backend: Render paid tier ($7/mo)
- Frontend: stays free on Vercel
- Total: ~$25/mo for reliable production

---

## For Your Second Project

Repeat steps 1–5, creating separate:
- Neon database
- Render backend
- Vercel frontend

Or, if your 2 projects share data, keep the same backend and database, and just create a second Vercel frontend.
