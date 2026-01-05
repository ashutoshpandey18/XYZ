# 🎓 College Email SaaS Platform

> **Automated college email provisioning system with OCR verification, AI-powered decision-making, and secure email delivery via Brevo REST API.**

A full-stack SaaS platform that automates institutional email creation through intelligent document verification, admin approval workflows, and secure credential delivery. Built with NestJS, React, PostgreSQL, deployed on Railway + Vercel.

🔗 **Live Demo**: [https://xyz-4lq7.vercel.app/login](https://xyz-4lq7.vercel.app/login)

---

## ✨ Key Features

- 🔐 **JWT Authentication** - Secure login/register with email verification & password reset
- 📄 **OCR Processing** - Tesseract.js extracts student data from ID cards automatically
- 🤖 **AI Confidence Scoring** - 0-100% accuracy scoring for verification
- 📧 **Brevo REST API** - Railway-compatible email delivery (no SMTP port blocking)
- 👨‍💼 **Admin Dashboard** - Manage requests, approve/reject, issue emails
- 📊 **Audit Logging** - Complete activity trail with IP addresses and timestamps
- ♻️ **Email Retry Logic** - 3 automatic retries with exponential backoff
- 🎨 **Modern UI** - React + TailwindCSS with real-time status tracking

---

## 🛠 Technology Stack

### Backend
- **NestJS 11** + **TypeScript 5** + **Node.js 20+**
- **PostgreSQL 15** (Railway) + **Prisma 6** ORM
- **JWT** + **Bcrypt** authentication
- **Tesseract.js 5** for OCR
- **Brevo REST API** for emails
- **Sharp** for image processing
- **Multer** for file uploads

### Frontend
- **React 19** + **Vite 7** + **TypeScript 5**
- **React Router 7** + **TanStack Query 5**
- **TailwindCSS 3** + **Axios**
- **React Hook Form** for forms

### Deployment
- **Backend**: Railway (auto-deploy from GitHub)
- **Frontend**: Vercel (preview + production)
- **Database**: Railway PostgreSQL

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or use Railway)
- Brevo API account (free tier)

### 1. Clone Repository
```bash
git clone https://github.com/ashutoshpandey18/XYZ.git
cd XYZ
```

### 2. Backend Setup
```bash
cd backend/backend-api
npm install
```

Create `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/college_email"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"
BREVO_API_KEY="your-brevo-api-key"
ENCRYPTION_KEY="your-32-char-encryption-key!!"
FRONTEND_URL="http://localhost:5173"
PORT=3000
NODE_ENV=development
```

Run migrations and start:
```bash
npx prisma migrate deploy
npx prisma generate
node create-admin.js
npm run start:dev
```

### 3. Frontend Setup
```bash
cd ../../frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:3000
```

Start frontend:
```bash
npm run dev
```

Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Student registration |
| POST | `/auth/login` | User login |
| POST | `/auth/verify-email` | Email verification |
| POST | `/auth/request-password-reset` | Request password reset |
| POST | `/auth/reset-password` | Reset password |

### Email Requests (Student)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/email-request` | Create new request with ID upload |
| GET | `/email-request/me` | Get student's requests |
| POST | `/email-request/:id/extract` | Trigger OCR (Admin) |

### Admin Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/requests` | List all requests (filterable) |
| GET | `/admin/requests/:id` | Get request details with OCR |
| PATCH | `/admin/requests/:id/approve` | Approve request |
| PATCH | `/admin/requests/:id/reject` | Reject request |
| POST | `/admin/requests/:id/issue-email` | Issue college email |
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/email-settings` | Get email settings |
| PUT | `/admin/email-settings` | Update email settings |
| POST | `/admin/email-settings/test` | Send test email |

---

## 🚀 Deployment

### Railway (Backend)

1. Create Railway project with PostgreSQL
2. Connect GitHub repository (root: `backend/backend-api`)
3. Add environment variables:
```
DATABASE_URL=<from Railway Postgres>
BREVO_API_KEY=<your-brevo-key>
JWT_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
ENCRYPTION_KEY=<32-char-key>
FRONTEND_URL=<your-vercel-url>
NODE_ENV=production
PORT=8080
```
4. Deploy automatically on push to main

### Vercel (Frontend)

1. Import project (root: `frontend`)
2. Add environment variable:
```
VITE_API_URL=<your-railway-url>
```
3. Deploy automatically on push

---

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:pass@host:port/db"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
BREVO_API_KEY="xkeysib-your-brevo-key"
ENCRYPTION_KEY="your-32-character-key!!!!!!!!!!!"
FRONTEND_URL="http://localhost:5173"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (.env)
```env
VITE_API_URL="http://localhost:3000"
```

---

## 📁 Project Structure

```
XYZ/
├── backend/backend-api/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # JWT auth, password reset
│   │   │   ├── admin/             # Admin dashboard
│   │   │   ├── email/             # Brevo email service
│   │   │   ├── email-request/     # OCR, request management
│   │   │   └── student/           # Student profile
│   │   ├── prisma.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── uploads/
│   ├── create-admin.js
│   └── delete-all-students.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── router/
│   └── package.json
└── README.md
```

---

## 🐛 Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- For Railway: Use external connection URL

### Email Delivery Fails
- Verify `BREVO_API_KEY` is set
- Test with `/admin/email-settings/test` endpoint

### CORS Errors
- Add frontend URL to `CORS_ORIGIN`
- For Vercel previews, use `CORS_ORIGIN=*`

### 401 Unauthorized
- Check JWT token is being sent
- Verify `JWT_SECRET` matches

---

## 📈 Features Implemented

✅ Student registration & login  
✅ JWT authentication with refresh tokens  
✅ Email verification & password reset  
✅ ID card upload with OCR (Tesseract.js)  
✅ AI confidence scoring (0-100%)  
✅ Admin dashboard with request management  
✅ Approve/Reject requests with notes  
✅ College email issuance with Brevo API  
✅ Email retry mechanism (3 attempts)  
✅ Complete audit logging  
✅ Real-time status tracking  
✅ Profile photo upload  
✅ Email settings management  
✅ Dashboard statistics  
✅ Role-based access control  
✅ Railway & Vercel deployment  

---

## 🛠 Utility Scripts

```bash
# Create admin user
node create-admin.js

# Delete all student records (dev only)
node delete-all-students.js

# Prisma Studio (DB GUI)
npx prisma studio

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

---

## 👨‍💻 Author

**Ashutosh Pandey**  
GitHub: [@ashutoshpandey18](https://github.com/ashutoshpandey18)  
Repository: [XYZ](https://github.com/ashutoshpandey18/XYZ)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- **NestJS** - Backend framework
- **Prisma** - Database ORM
- **Tesseract.js** - OCR engine
- **Brevo** - Email API
- **Railway** - Backend hosting
- **Vercel** - Frontend hosting

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

[Report Bug](https://github.com/ashutoshpandey18/XYZ/issues) • [Request Feature](https://github.com/ashutoshpandey18/XYZ/issues)

**Built with ❤️ using NestJS, React, and TypeScript**

</div>
