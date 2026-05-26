# Darotech Backend

Fully-fledged Node.js + Express + MongoDB backend for Darotech Technology website and admin dashboard.

## Features
- JWT admin auth with refresh cookie
- Leads CRM with CSV export and email notifications
- Services, packages/pricing, pages, sections, media, blogs, testimonials, portfolio CRUD
- Razorpay/Stripe-ready payment architecture
- Invoice PDF generation
- Reports dashboard APIs
- Local chatbot service endpoint
- Multer uploads
- Gmail SMTP-ready Nodemailer setup
- Zod validation, rate limiting, Helmet, CORS, Winston logs

## Quick Start
```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

API health: `GET /health`
Base API: `/api/v1`

## Gmail SMTP Setup
Use a Gmail App Password, not your normal Gmail password.
Set:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_16_digit_app_password
MAIL_FROM="Darotech Technology <yourgmail@gmail.com>"
ADMIN_NOTIFY_EMAIL=yourgmail@gmail.com
```

## Default Seed Login
Set in `.env`:
```env
ADMIN_SEED_EMAIL=admin@darotech.com
ADMIN_SEED_PASSWORD=admin123
```
Then run `npm run seed`.

## Important API Routes
- `POST /api/v1/auth/login`
- `POST /api/v1/leads`
- `GET /api/v1/leads`
- `POST /api/v1/payments/order`
- `POST /api/v1/payments/verify`
- `GET /api/v1/reports/summary`
- `GET /api/v1/settings`
- `POST /api/v1/chatbot/message`

## Deployment Notes
Use MongoDB Atlas, set environment variables on hosting platform, enable HTTPS, and configure payment webhooks.
