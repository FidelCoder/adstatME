#!/bin/bash

echo "🚀 AdstatMe - Quick Setup Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Redis is installed
echo "📦 Checking Redis..."
if ! command -v redis-server &> /dev/null; then
    echo -e "${RED}❌ Redis is not installed${NC}"
    echo "Installing Redis..."
    sudo apt update && sudo apt install redis-server -y
else
    echo -e "${GREEN}✅ Redis is installed${NC}"
fi

# Start Redis
echo "🔄 Starting Redis..."
sudo systemctl start redis 2>/dev/null || sudo service redis-server start 2>/dev/null
sleep 2

# Test Redis
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis failed to start${NC}"
    echo "Try manually: sudo systemctl start redis"
    exit 1
fi

# Check PostgreSQL
echo ""
echo "🗄️  Checking PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL may not be running${NC}"
fi

# Setup database
echo ""
echo "🔧 Setting up database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS adstatme_dev;" 2>/dev/null
sudo -u postgres psql -c "DROP USER IF EXISTS adstatme;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE adstatme_dev;"
sudo -u postgres psql -c "CREATE USER adstatme WITH PASSWORD 'adstatme123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE adstatme_dev TO adstatme;"

# Grant schema privileges (PostgreSQL 15+)
sudo -u postgres psql -d adstatme_dev -c "GRANT ALL ON SCHEMA public TO adstatme;"

echo -e "${GREEN}✅ Database created${NC}"

# Test database connection
echo ""
echo "🧪 Testing database connection..."
if PGPASSWORD=adstatme123 psql -U adstatme -d adstatme_dev -h localhost -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

# Run migrations
echo ""
echo "📦 Running database migrations..."
cd "$(dirname "$0")"
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${RED}❌ Migrations failed${NC}"
    exit 1
fi

# Seed database (optional)
echo ""
read -p "🌱 Do you want to seed test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    echo -e "${GREEN}✅ Database seeded${NC}"
fi

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "To start the server, run:"
echo "  npm run dev"
echo ""
echo "To test the API, run in another terminal:"
echo "  curl http://localhost:3000/health"

