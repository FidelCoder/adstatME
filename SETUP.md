# AdstatMe Setup Guide

Complete guide to set up and run the AdstatMe backend locally and in production.

---

## 📋 Prerequisites

- **Node.js** >= 20.0.0
- **PostgreSQL** >= 14
- **Redis** >= 6
- **npm** >= 10.0.0

---

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/FidelCoder/adstatME.git
cd adstatME
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

#### Install PostgreSQL

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

#### Create Database

```bash
# Login to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE adstatme_dev;
CREATE USER adstatme WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE adstatme_dev TO adstatme;
\q
```

### 4. Set Up Redis

#### Install Redis

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:**
Use [Redis for Windows](https://github.com/microsoftarchive/redis/releases) or Docker

#### Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://adstatme:your_password@localhost:5432/adstatme_dev

# Redis
REDIS_URL=redis://localhost:6379

# Authentication (Generate secure secrets in production)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# External APIs (Optional for development)
OPENAI_API_KEY=
NEXUSPAY_API_KEY=
NEXUSPAY_WEBHOOK_SECRET=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
PAYSTACK_SECRET_KEY=
AFRICAS_TALKING_API_KEY=
AFRICAS_TALKING_USERNAME=

# Storage (Optional for development)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Monitoring (Optional)
SENTRY_DSN=
POSTHOG_API_KEY=

# Feature Flags
ENABLE_AI_VERIFICATION=false
ENABLE_CRYPTO_PAYOUTS=false
ENABLE_FRAUD_DETECTION=true

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Apply the schema
- Generate Prisma Client

### 8. (Optional) Seed Database

Create test data:

```bash
npm run db:seed
```

### 9. Start Development Server

```bash
npm run dev
```

Server should be running at: `http://localhost:3000`

#### Test the API

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-10T...",
    "environment": "development",
    "version": "v1"
  }
}
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

---

## 🔧 Development Tools

### Prisma Studio (Database GUI)

```bash
npm run db:studio
```

Opens at: `http://localhost:5555`

### View Database Schema

```bash
npx prisma studio
```

### Create New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database

```bash
npx prisma migrate reset
```

**⚠️ Warning:** This will delete all data!

---

## 🌍 External API Setup (Optional)

### Africa's Talking (SMS)

1. Sign up at [africastalking.com](https://africastalking.com)
2. Get your API key and username
3. Add to `.env`:
   ```env
   AFRICAS_TALKING_API_KEY=your_key
   AFRICAS_TALKING_USERNAME=your_username
   ```

### M-Pesa (Kenya Payments)

1. Register at [Safaricom Daraja](https://developer.safaricom.co.ke/)
2. Create an app
3. Get consumer key and secret
4. Add to `.env`:
   ```env
   MPESA_CONSUMER_KEY=your_key
   MPESA_CONSUMER_SECRET=your_secret
   ```

### Paystack (Nigeria/Ghana Payments)

1. Sign up at [paystack.com](https://paystack.com)
2. Get your secret key
3. Add to `.env`:
   ```env
   PAYSTACK_SECRET_KEY=sk_test_your_key
   ```

### OpenAI (AI Verification)

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-your_key
   ENABLE_AI_VERIFICATION=true
   ```

---

## 🏗️ Production Deployment

### Option 1: Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and initialize:
   ```bash
   railway login
   railway init
   ```

3. Add PostgreSQL and Redis:
   ```bash
   railway add postgresql
   railway add redis
   ```

4. Set environment variables:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your_production_secret
   # ... add all other variables
   ```

5. Deploy:
   ```bash
   railway up
   ```

### Option 2: Heroku

1. Install Heroku CLI and login:
   ```bash
   heroku login
   ```

2. Create app:
   ```bash
   heroku create adstatme-api
   ```

3. Add addons:
   ```bash
   heroku addons:create heroku-postgresql:mini
   heroku addons:create heroku-redis:mini
   ```

4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_production_secret
   # ... add all other variables
   ```

5. Deploy:
   ```bash
   git push heroku main
   ```

6. Run migrations:
   ```bash
   heroku run npx prisma migrate deploy
   ```

### Option 3: DigitalOcean App Platform

1. Create account at [digitalocean.com](https://www.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Add PostgreSQL and Redis databases
5. Set environment variables in App settings
6. Deploy

### Option 4: VPS (Ubuntu Server)

1. **Set up server:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Install Redis
   sudo apt install redis-server
   
   # Install PM2 (Process Manager)
   sudo npm install -g pm2
   ```

2. **Clone and setup:**
   ```bash
   git clone https://github.com/FidelCoder/adstatME.git
   cd adstatME
   npm install
   ```

3. **Configure environment:**
   ```bash
   nano .env
   # Add production config
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Build application:**
   ```bash
   npm run build
   ```

6. **Start with PM2:**
   ```bash
   pm2 start dist/server.js --name adstatme
   pm2 startup
   pm2 save
   ```

7. **Set up Nginx reverse proxy:**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/adstatme
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name api.adstatme.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/adstatme /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Set up SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.adstatme.com
   ```

---

## 🔒 Security Checklist for Production

- [ ] Use strong, unique JWT secrets (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry)
- [ ] Regular database backups
- [ ] Use environment variables (never commit secrets)
- [ ] Keep dependencies updated
- [ ] Implement proper logging
- [ ] Set up firewall rules
- [ ] Use managed database services

---

## 📊 Monitoring & Logs

### View Logs (PM2)

```bash
pm2 logs adstatme
```

### View Database Logs

```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### View Redis Logs

```bash
sudo tail -f /var/log/redis/redis-server.log
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U adstatme -d adstatme_dev -h localhost
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping

# Restart Redis
sudo systemctl restart redis
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Prisma Client Not Generated

```bash
npx prisma generate
```

### Migration Failed

```bash
# Reset and reapply
npx prisma migrate reset
npx prisma migrate dev
```

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

---

## 🆘 Need Help?

- **Documentation:** [API.md](./API.md)
- **Issues:** [GitHub Issues](https://github.com/FidelCoder/adstatME/issues)
- **Email:** support@adstatme.com

---

## 📝 Next Steps

After setup:

1. ✅ Test the health endpoint
2. ✅ Create your first brand account
3. ✅ Create a test campaign
4. ✅ Test OTP authentication
5. ✅ Review API documentation
6. ✅ Set up external integrations
7. ✅ Deploy to production

Happy coding! 🚀




