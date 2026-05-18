#!/bin/bash
# Clinic Management System - Secure Setup Script
# Run this ONCE when setting up the project for development or production

set -e # Exit on error

echo "🔒 Clinic Management System - Security Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Error: Must run from root directory (clinic-v2-patched)${NC}"
    exit 1
fi

# Step 1: Generate JWT Secret
echo -e "${YELLOW}Step 1: Generating JWT Secret...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}✓ Generated JWT secret: ${JWT_SECRET:0:16}...${NC}"
echo ""

# Step 2: Backend setup
echo -e "${YELLOW}Step 2: Setting up Backend...${NC}"
cd backend

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${RED}⚠ Warning: .env file already exists${NC}"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm .env
    else
        echo "Skipping .env creation"
    fi
fi

# Create .env file
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Database (fill in your PostgreSQL connection string)
# Example: postgresql://user:password@localhost:5432/clinic_db
DATABASE_URL=postgresql://user:password@localhost:5432/clinic_db

# Security - JWT Secret (generated securely above)
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Frontend origin for CORS (update this when deploying)
FRONTEND_URL=http://localhost:3000

# Server config
NODE_ENV=development
PORT=5000
EOF
    echo -e "${GREEN}✓ Created backend/.env${NC}"
fi

echo "⚠  UPDATE REQUIRED:"
echo "   1. Set DATABASE_URL to your PostgreSQL connection string"
echo "   2. FRONTEND_URL should match your frontend URL"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
npm install > /dev/null 2>&1 && echo -e "${GREEN}✓ Backend dependencies installed${NC}" || echo -e "${RED}❌ Failed to install${NC}"

cd ..

# Step 3: Frontend setup  
echo ""
echo -e "${YELLOW}Step 3: Setting up Frontend...${NC}"
cd frontend

if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
# API base URL (for production, set to your backend URL)
VITE_API_BASE_URL=http://localhost:5000/api
EOF
    echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install > /dev/null 2>&1 && echo -e "${GREEN}✓ Frontend dependencies installed${NC}" || echo -e "${RED}❌ Failed to install${NC}"

cd ..

# Step 4: Security checks
echo ""
echo -e "${YELLOW}Step 4: Security Verification...${NC}"

# Check .gitignore
if grep -q "\.env" backend/.gitignore && grep -q "\.env" frontend/.gitignore; then
    echo -e "${GREEN}✓ .env files are in .gitignore${NC}"
else
    echo -e "${RED}⚠ Warning: .env files may not be ignored by Git${NC}"
fi

# Run security audit
echo ""
echo -e "${YELLOW}Checking dependencies for vulnerabilities...${NC}"
cd backend
BACKEND_AUDIT=$(npm audit 2>&1 | grep -c "high\|critical" || echo "0")
cd ../frontend
FRONTEND_AUDIT=$(npm audit 2>&1 | grep -c "high\|critical" || echo "0")
cd ..

if [ "$BACKEND_AUDIT" -eq "0" ] && [ "$FRONTEND_AUDIT" -eq "0" ]; then
    echo -e "${GREEN}✓ No critical vulnerabilities found${NC}"
else
    echo -e "${RED}⚠ Some vulnerabilities detected. Run 'npm audit fix' to resolve.${NC}"
fi

# Step 5: Database setup (optional)
echo ""
echo -e "${YELLOW}Step 5: Database Setup (OPTIONAL - only if using local PostgreSQL)${NC}"
echo "To seed the database with demo data:"
echo "  cd backend"
echo "  npx prisma migrate dev --name init"
echo "  npx prisma db seed"
echo ""

# Final summary
echo "=============================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Review and update backend/.env with your database URL"
echo "2. Run the database migrations:"
echo "   cd backend && npx prisma migrate dev && npx prisma db seed"
echo "3. Start development servers:"
echo "   In terminal 1: cd backend && npm run dev"
echo "   In terminal 2: cd frontend && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "Demo credentials:"
echo "  Admin: 9000000000 / admin123"
echo "  Doctor: 9876543210 / doctor123"
echo "  Patient: 9123456789 / patient123"
echo ""
echo -e "${YELLOW}📖 Read SECURITY.md for hardening checklist before production${NC}"
echo -e "${YELLOW}📖 Read DEPLOYMENT.md for production deployment guide${NC}"
echo ""
