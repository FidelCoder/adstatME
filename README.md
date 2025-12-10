# AdstatMe Backend API

> WhatsApp Status Monetization Platform - Backend API

AdstatMe connects brands with everyday users to monetize WhatsApp Status. Users earn money by posting sponsored content, while brands get authentic reach at 10x better ROI than traditional ads.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- npm >= 10.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/FidelCoder/adstatME.git
cd adstatMe

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The API will be running at `http://localhost:3000`

## 📁 Project Structure

```
adstatMe/
├── src/
│   ├── config/           # Configuration (env, database, redis, logger)
│   ├── modules/          # Feature modules (domain-driven)
│   │   ├── auth/         # Authentication & authorization
│   │   ├── users/        # User management, profiles, reputation
│   │   ├── brands/       # Brand accounts, billing
│   │   ├── campaigns/    # Campaign creation, matching, management
│   │   ├── posts/        # Status posts, verification, earnings
│   │   ├── payments/     # Payouts, transactions, NexusPay
│   │   ├── verification/ # AI verification, fraud detection
│   │   ├── analytics/    # Metrics, reporting, dashboards
│   │   └── notifications/# Email, SMS, push notifications
│   ├── shared/           # Shared utilities
│   │   ├── middleware/   # Express middleware
│   │   ├── utils/        # Helper functions
│   │   ├── types/        # TypeScript types
│   │   ├── validators/   # Zod schemas
│   │   └── errors/       # Custom error classes
│   ├── jobs/             # Background job processors
│   ├── database/         # Database migrations, seeds
│   └── server.ts         # Application entry point
├── tests/                # Unit & integration tests
├── prisma/               # Prisma schema & migrations
└── scripts/              # Deployment, maintenance scripts
```

## 🛠️ Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (Prisma ORM)
- **Cache/Queue:** Redis + BullMQ
- **Authentication:** JWT + Phone OTP
- **AI:** OpenAI GPT-4 Vision
- **Payments:** NexusPay, M-Pesa, Paystack
- **Logging:** Pino
- **Validation:** Zod

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build            # Build TypeScript to JavaScript
npm start                # Run production build

# Database
npm run db:migrate       # Run database migrations
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
```

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - For screenshot verification
- `NEXUSPAY_API_KEY` - For crypto payouts

## 🎯 Core Features

### Phase 1 (Week 1-2) - Foundation ✅
- [x] Project setup
- [x] Database schema
- [ ] Authentication (JWT + Phone OTP)
- [ ] User CRUD
- [ ] Brand CRUD

### Phase 2 (Week 3-4) - Core Features
- [ ] Campaign management
- [ ] Campaign matching algorithm
- [ ] Post submission & tracking
- [ ] Screenshot upload
- [ ] Basic verification

### Phase 3 (Week 5-6) - Advanced Features
- [ ] GPT-4 Vision AI verification
- [ ] Watermark embedding
- [ ] Fraud detection
- [ ] Background jobs (BullMQ)
- [ ] Payment integrations

### Phase 4 (Week 7-8) - Launch
- [ ] Analytics & reporting
- [ ] Notifications
- [ ] Admin APIs
- [ ] Security hardening
- [ ] Production deployment

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- user.test.ts
```

## 📚 API Documentation

API documentation will be available at `/api/docs` once implemented.

### API Endpoints (Planned)

```
POST   /api/v1/auth/register          # Register user
POST   /api/v1/auth/login             # Login
POST   /api/v1/auth/refresh           # Refresh token
GET    /api/v1/users/me               # Get current user
PUT    /api/v1/users/me               # Update profile
GET    /api/v1/campaigns              # List campaigns
POST   /api/v1/campaigns/:id/accept   # Accept campaign
POST   /api/v1/posts                  # Submit post
POST   /api/v1/payouts                # Request payout
```

## 🔒 Security

- JWT authentication with refresh tokens
- Rate limiting on all endpoints
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (Helmet.js)
- CORS configuration
- Device fingerprinting
- Fraud detection algorithms

## 🚢 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# With PM2 (recommended)
pm2 start dist/server.js --name adstatme-api
```

## 🤝 Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'feat: add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- Repository: https://github.com/FidelCoder/adstatME.git
- Documentation: Coming soon
- Website: Coming soon

---

Built with ❤️ by the AdstatMe Team


