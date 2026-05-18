@echo off
REM Clinic Management System - Secure Setup Script (Windows)
REM Run this ONCE when setting up the project for development or production

setlocal enabledelayedexpansion

echo.
echo 0x3C Clinic Management System - Security Setup
echo =========================================
echo.

REM Check if running in the right directory
if not exist "backend\package.json" (
    echo ERROR: Must run from root directory (clinic-v2-patched^)
    exit /b 1
)

REM Step 1: Generate JWT Secret
echo [Step 1] Generating JWT Secret...
for /f "delims=" %%A in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set "JWT_SECRET=%%A"
echo Generated JWT secret: %JWT_SECRET:~0,16%...
echo.

REM Step 2: Backend setup
echo [Step 2] Setting up Backend...
cd backend

if exist ".env" (
    echo WARNING: .env file already exists
    set /p OVERWRITE="Overwrite? (y/n): "
    if /i "!OVERWRITE!"=="y" (
        del .env
    ) else (
        echo Skipping .env creation
        goto skip_backend_env
    )
)

(
    echo # Database (fill in your PostgreSQL connection string^)
    echo # Example: postgresql://user:password@localhost:5432/clinic_db
    echo DATABASE_URL=postgresql://user:password@localhost:5432/clinic_db
    echo.
    echo # Security - JWT Secret
    echo JWT_SECRET=%JWT_SECRET%
    echo JWT_EXPIRES_IN=7d
    echo.
    echo # Frontend origin for CORS
    echo FRONTEND_URL=http://localhost:3000
    echo.
    echo # Server config
    echo NODE_ENV=development
    echo PORT=5000
) > .env

echo Created backend\.env
echo UPDATE REQUIRED in backend\.env:
echo   1. Set DATABASE_URL to your PostgreSQL connection string
echo   2. FRONTEND_URL should match your frontend URL
echo.

:skip_backend_env
echo Installing backend dependencies...
call npm install > nul 2>&1
echo Installed backend dependencies
cd ..
echo.

REM Step 3: Frontend setup
echo [Step 3] Setting up Frontend...
cd frontend

if not exist ".env.local" (
    (
        echo # API base URL
        echo VITE_API_BASE_URL=http://localhost:5000/api
    ) > .env.local
    echo Created frontend\.env.local
)

echo Installing frontend dependencies...
call npm install > nul 2>&1
echo Installed frontend dependencies
cd ..
echo.

REM Step 4: Security checks
echo [Step 4] Security Verification...
echo .env files should be in .gitignore - verify manually
echo.

REM Final summary
echo.
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Review and update backend\.env with your database URL
echo 2. Run the database migrations:
echo    cd backend ^&^& npx prisma migrate dev ^&^& npx prisma db seed
echo 3. Start development servers in separate terminals:
echo    Terminal 1: cd backend ^&^& npm run dev
echo    Terminal 2: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:5173 in your browser
echo.
echo Demo credentials:
echo   Admin: 9000000000 / admin123
echo   Doctor: 9876543210 / doctor123
echo   Patient: 9123456789 / patient123
echo.
echo Read SECURITY.md for hardening checklist before production
echo Read DEPLOYMENT.md for production deployment guide
echo.

pause
