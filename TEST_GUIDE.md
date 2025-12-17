# 🧪 Testing Guide - AdstatMe Backend

Quick guide to test the backend locally.

---

## Prerequisites Check

### 1. Check Node.js
```bash
node --version
# Should be >= 18.x (we have 18.19.1)
```

### 2. Check PostgreSQL
```bash
# Check if PostgreSQL is installed
psql --version

# Check if PostgreSQL is running
sudo systemctl status postgresql
# OR on Mac: brew services list | grep postgresql
```

### 3. Check Redis
```bash
# Check if Redis is installed
redis-cli --version

# Check if Redis is running
redis-cli ping
# Should return: PONG
```

---

## Quick Setup (If services not running)

### Install & Start PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE adstatme_dev;"
sudo -u postgres psql -c "CREATE USER adstatme WITH PASSWORD 'adstatme123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE adstatme_dev TO adstatme;"
```

### Install & Start Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# Test
redis-cli ping
```

---

## Setup Environment

### 1. Create .env file
```bash
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
API_VERSION=v1

DATABASE_URL=postgresql://adstatme:adstatme123@localhost:5432/adstatme_dev
REDIS_URL=redis://localhost:6379

JWT_SECRET=dev-secret-key-minimum-32-characters-long-12345
JWT_REFRESH_SECRET=dev-refresh-secret-key-minimum-32-characters-long-12345
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ENABLE_AI_VERIFICATION=false
ENABLE_CRYPTO_PAYOUTS=false
ENABLE_FRAUD_DETECTION=true

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
EOF
```

### 2. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

### 3. Seed Test Data (Optional)
```bash
npm run db:seed
```

---

## Start the Server

```bash
npm run dev
```

Expected output:
```
✅ Database connected
✅ Redis connected
✅ Job queues initialized
✅ Verification worker started
✅ Payout worker started
🚀 Server running on port 3000
📍 Environment: development
🔗 API: http://localhost:3000/api/v1
❤️  Health: http://localhost:3000/health
```

---

## Test the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Expected:
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

### 2. API Info
```bash
curl http://localhost:3000/api/v1
```

### 3. Test Authentication Flow

#### Send OTP
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678"
  }'
```

Expected:
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 900
  }
}
```

**Check your terminal** - In development mode, the OTP will be printed in the console!

#### Verify OTP
```bash
# Replace 123456 with the OTP from terminal
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "otp": "123456"
  }'
```

Expected:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "phoneNumber": "+254712345678",
      "role": "USER",
      "name": null
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    },
    "isNewUser": true
  }
}
```

**Save the accessToken** - you'll need it for authenticated requests!

### 4. Test User Profile

#### Get Profile
```bash
# Replace YOUR_TOKEN with the accessToken from step 3
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Profile
```bash
curl -X PATCH http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "locationCity": "Nairobi",
    "locationCountry": "KE",
    "ageRange": "25-34",
    "interests": ["tech", "fashion"],
    "contactCount": 500
  }'
```

#### Get Stats
```bash
curl http://localhost:3000/api/v1/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test Campaigns (If seeded)

#### Get Available Campaigns
```bash
curl http://localhost:3000/api/v1/campaigns/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Specific Campaign
```bash
# Replace CAMPAIGN_ID with actual ID from above
curl http://localhost:3000/api/v1/campaigns/CAMPAIGN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Test Posts

#### Claim a Campaign
```bash
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "CAMPAIGN_ID"
  }'
```

#### Get My Posts
```bash
curl http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Test Payments

#### Get Balance
```bash
curl http://localhost:3000/api/v1/payments/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Payout Stats
```bash
curl http://localhost:3000/api/v1/payments/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Using a REST Client (Better for Testing)

### Option 1: Using HTTPie (Recommended)
```bash
# Install
sudo apt install httpie

# Test with HTTPie (prettier output)
http GET http://localhost:3000/health

# With auth
http GET http://localhost:3000/api/v1/users/profile \
  Authorization:"Bearer YOUR_TOKEN"
```

### Option 2: Using Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Import the API endpoints
3. Set up environment variables
4. Test visually

### Option 3: Using VS Code REST Client
1. Install "REST Client" extension
2. Create `test.http` file:

```http
### Health Check
GET http://localhost:3000/health

### Send OTP
POST http://localhost:3000/api/v1/auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "+254712345678"
}

### Verify OTP
POST http://localhost:3000/api/v1/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+254712345678",
  "otp": "123456"
}

### Get Profile
GET http://localhost:3000/api/v1/users/profile
Authorization: Bearer {{accessToken}}
```

---

## Testing with Seeded Data

If you ran `npm run db:seed`, you have:

### Test Users
- `+254712345678` - John Doe (SILVER tier)
- `+254723456789` - Jane Smith (GOLD tier)
- `+2348012345678` - Chidi Okafor (SILVER tier)

### Test Brands
- `brand@fashionhouse.com` - Fashion House
- `marketing@techcorp.com` - Tech Corp

### Test Campaigns
- Summer Fashion Collection 2025 (ACTIVE)
- New Smartphone Launch (ACTIVE)
- Black Friday Sale (DRAFT)

---

## Common Issues & Solutions

### 1. Database Connection Error
```
Error: P1001: Can't reach database server
```

**Solution:**
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U adstatme -d adstatme_dev -h localhost
```

### 2. Redis Connection Error
```
Error: Redis connection to localhost:6379 failed
```

**Solution:**
```bash
# Start Redis
sudo systemctl start redis

# Test
redis-cli ping
```

### 3. Prisma Client Not Generated
```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npx prisma generate
```

### 4. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

### 5. JWT Token Invalid
```
{"success": false, "error": {"code": "INVALID_TOKEN"}}
```

**Solution:**
- Token may have expired (15 min)
- Get a new token with `/auth/send-otp` and `/auth/verify-otp`

---

## Automated Testing

### Run Unit Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run with Coverage
```bash
npm run test:coverage
```

---

## Load Testing (Optional)

### Using Apache Bench
```bash
# Install
sudo apt install apache2-utils

# Test health endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:3000/health
```

### Using Artillery
```bash
# Install
npm install -g artillery

# Create test script
artillery quick --count 10 --num 20 http://localhost:3000/health
```

---

## Debugging

### View Logs
The server logs everything to console in development mode.

### View Database
```bash
# Open Prisma Studio
npm run db:studio

# Opens at http://localhost:5555
```

### View Redis Data
```bash
redis-cli

# List all keys
KEYS *

# Get a specific key
GET auth:otp:+254712345678

# Exit
exit
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Success Criteria

✅ Server starts without errors  
✅ Health check returns 200  
✅ Database connects successfully  
✅ Redis connects successfully  
✅ OTP generation works  
✅ OTP verification works  
✅ Profile endpoints work  
✅ Campaign listing works  

---

## Next Steps After Testing

1. Report any bugs found
2. Test edge cases
3. Test error handling
4. Load test critical endpoints
5. Security testing
6. Integration testing

---

**Need Help?** Check the logs or open an issue on GitHub!




