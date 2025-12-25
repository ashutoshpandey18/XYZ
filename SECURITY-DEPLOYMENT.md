# Security Checklist - Pre-Deployment Verification

## Files That Should NEVER Be Committed

| File Pattern | Status | Location |
|--------------|--------|----------|
| `.env` | IGNORED | All directories |
| `.env.local` | IGNORED | All directories |
| `.env.production` | IGNORED | All directories |
| `.env.*.local` | IGNORED | All directories |
| `uploads/*` | IGNORED | Backend (user data) |

## Files That ARE Safe to Commit

| File | Purpose |
|------|---------|
| `.env.example` | Template with placeholder values |
| `.env.production.example` | Production template |
| `Dockerfile` | Build instructions (no secrets) |
| `railway.json` | Deployment config (no secrets) |
| `vercel.json` | Frontend routing (no secrets) |

## Verification Commands

```bash
# Check what will be committed
git status

# Verify .env is ignored
git check-ignore -v backend/backend-api/.env

# List all tracked files (should NOT include .env)
git ls-files | grep -i env
```

## Environment Variables for Deployment

### Railway (Backend)
Set these in Railway Dashboard > Variables:

- `DATABASE_URL` - Auto-provided by Railway PostgreSQL
- `JWT_SECRET` - Generate: `openssl rand -base64 64`
- `ADMIN_EMAIL` - Your admin email
- `ADMIN_PASSWORD` - Strong password (16+ chars)
- `SMTP_HOST` - smtp.gmail.com
- `SMTP_PORT` - 587
- `SMTP_USER` - Your Gmail address
- `SMTP_PASS` - Gmail App Password (NOT your regular password!)
- `ENCRYPTION_KEY` - 32-char key: `openssl rand -hex 16`
- `FRONTEND_URL` - Your Vercel URL

### Vercel (Frontend)
Set in Vercel Dashboard > Settings > Environment Variables:

- `VITE_API_URL` - Your Railway backend URL

## Security Best Practices

1. **Never hardcode secrets** in source code
2. **Use App Passwords** for Gmail (not regular password)
3. **Rotate secrets** periodically
4. **Use HTTPS** in production (Railway/Vercel provide this)
5. **Set strong JWT_SECRET** (64+ characters)
