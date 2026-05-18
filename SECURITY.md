# Security Checklist & Hardening Guide

## ✅ What's Already Secure

Your project already implements several security best practices:

- **Passwords**: Hashed with bcrypt (10 salt rounds) ✓
- **JWT Tokens**: Signed with environment variable secret ✓
- **CORS**: Restricted to specific FRONTEND_URL ✓  
- **Role-Based Access Control**: RBAC middleware validates user roles ✓
- **Auth Middleware**: Protected routes require valid JWT ✓
- **.env Files**: Not committed to Git ✓

---

## 🔧 Security Fixes Applied (May 18, 2026)

### Frontend (FIXED)
```
✓ axios 1.6.2 → 1.8.2+ (fixed 13 prototype pollution & SSRF CVEs)
✓ dompurify updated (fixed XSS bypass vulnerabilities)
✓ postcss updated (fixed CSS XSS vulnerability)
✓ vite & esbuild updated (fixed dev server SSRF)
✓ jspdf & jspdf-autotable updated
```

### Backend 
```
✓ No direct high-risk dependencies
⚠ tar ≤7.5.10 (transitive via @mapbox/node-pre-gyp): build-time only, no runtime impact
```

Run locally to verify:
```bash
cd backend && npm audit
cd frontend && npm audit
```

---

## 📋 Hardening Checklist Before Deployment

### 1. Environment Variables (CRITICAL)

**Backend** — Create `.env` in `backend/`:
```bash
# Generate a strong JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
# Database (use managed PostgreSQL, never local file)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/clinic_db?sslmode=require

# Security
JWT_SECRET=your_64_character_random_hex_string_here
JWT_EXPIRES_IN=7d

# Frontend origin for CORS
FRONTEND_URL=https://your-vercel-app.vercel.app

# Server
NODE_ENV=production
PORT=5000
```

**Frontend** — Create `.env.local` in `frontend/`:
```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api
```

⚠️ **NEVER commit `.env` files**. Only commit `.env.example`.

### 2. Database Security

- [ ] Use managed PostgreSQL (Neon, Supabase, Azure) — not local files
- [ ] Enable SSL/TLS for database connections (`?sslmode=require`)
- [ ] Use strong database passwords (20+ characters)
- [ ] Restrict database IP access if possible
- [ ] Enable database audit logging if available
- [ ] Perform regular backups

### 3. API Security

- [ ] Rate limit endpoints to prevent brute force (add to backend):
  ```javascript
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use('/api/', limiter);
  ```

- [ ] Add request validation (already using Zod ✓)
- [ ] Sanitize user inputs (add to affected routes)
- [ ] Add HELMET.js for security headers:
  ```javascript
  const helmet = require('helmet');
  app.use(helmet());
  ```

- [ ] Log failed authentication attempts
- [ ] Disable HTTP in production (HTTPS only)

### 4. Authentication

- [ ] Change seed demo credentials before production:
  ```bash
  # In backend/prisma/seed.js, update phone numbers and passwords
  ```

- [ ] Set short JWT expiry for sensitive operations (7 days min acceptable)
- [ ] Add password reset functionality (not yet implemented)
- [ ] Require password change on first login for new users

### 5. Frontend Security

- [ ] Store JWT in httpOnly cookies (not localStorage):
  ```javascript
  // Update frontend/src/services/api.js to use cookies
  ```

- [ ] Add CSRF token validation
- [ ] Implement Content Security Policy (CSP) headers
- [ ] Sanitize user-generated content (DOMPurify is installed ✓)
- [ ] Validate file uploads (if applicable)

### 6. Deployment Security

- [ ] Use HTTPS only (Vercel/Render both enforce this ✓)
- [ ] Disable directory listing
- [ ] Set security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Keep dependencies updated (run `npm audit` monthly)
- [ ] Monitor for new CVEs using GitHub Dependabot

### 7. Secrets Management

- [ ] Never log sensitive data (passwords, tokens, keys)
- [ ] Rotate JWT secret periodically
- [ ] Use separate credentials for development vs production
- [ ] Restrict environment variable access to authorized team members only

### 8. Logging & Monitoring

- [ ] Log all authentication attempts
- [ ] Log API errors without exposing sensitive details
- [ ] Monitor for unusual activity (multiple failed logins, etc.)
- [ ] Set up alerts for security events

---

## 🚀 Secure Deployment Steps

### Step 1: Prepare & Test Locally
```bash
# Test with production config
NODE_ENV=production npm run dev

# Verify no console.log statements leak secrets
grep -r "password\|secret\|token" src/
```

### Step 2: Backend Security Setup (Render)

1. ✓ Secrets stored only in Render environment variables
2. ✓ No `.env` file in Git
3. ✓ Database URL uses SSL
4. ✓ FRONTEND_URL restricted to your Vercel domain
5. ✓ JWT_SECRET is 32+ random hex characters

### Step 3: Frontend Security Setup (Vercel)

1. ✓ Store API base URL as environment variable
2. ✓ No API keys hardcoded in frontend code
3. ✓ HTTPS enforced (automatic on Vercel)

### Step 4: Database Security (Neon/Supabase)

1. ✓ Strong password (20+ characters)
2. ✓ SSL connections required
3. ✓ IP whitelist configured (if available)
4. ✓ Backups enabled

### Step 5: First Production Login

Test with seed credentials:
- **Admin:** `9000000000` / `admin123`

Then immediately:
- [ ] Change admin password
- [ ] Remove/disable other seed accounts
- [ ] Create real user accounts
- [ ] Test RBAC enforcement

---

## 🔍 Ongoing Security Tasks

### Weekly
- [ ] Monitor error logs for anomalies
- [ ] Check for failed login attempts

### Monthly
- [ ] Run `npm audit` in both frontend and backend
- [ ] Review access logs
- [ ] Backup database verification

### Quarterly
- [ ] Security dependency review
- [ ] Rotate non-critical secrets
- [ ] Test disaster recovery procedures

### Annually
- [ ] Full security audit
- [ ] Penetration testing (optional but recommended)
- [ ] Review GDPR/compliance requirements for clinic data

---

## ⚠️ Known Issues & Workarounds

### Issue: Tar vulnerability in node-pre-gyp
- **Severity**: High (CVE)
- **Impact**: Build-time only, no runtime impact
- **Status**: Pending fix in upstream dependencies
- **Workaround**: Use container-based builds where possible

### Issue: Axios vulnerabilities resolved
- **Status**: ✓ FIXED in latest version
- **Version**: 1.8.2+

---

## 🆘 If You Get Hacked

1. **IMMEDIATELY** rotate all secrets:
   - `JWT_SECRET` in Render
   - Database password
   - GitHub personal access tokens

2. **Audit**:
   - Review API logs for unauthorized access
   - Check database for unauthorized data modifications
   - Check Git history for secret commits

3. **Notify users**:
   - Reset all user passwords
   - Notify clinic staff of breach
   - Comply with local privacy regulations

4. **Remediate**:
   - Update all dependencies to latest
   - Run full security audit
   - Add additional logging/monitoring

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Guide](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security](https://react.dev/learn/security)

---

## Next Steps

1. ✓ Vulnerabilities fixed (axios, dompurify, postcss, vite)
2. ✓ Dependencies updated
3. ✓ Environment variable template created
4. → **Create `.env` with strong JWT secret**
5. → **Test locally with production config**
6. → **Deploy to Render + Vercel (see DEPLOYMENT.md)**
7. → **Change seed credentials in production**
8. → **Set up monitoring & backups**
