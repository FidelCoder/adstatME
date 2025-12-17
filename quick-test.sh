#!/bin/bash

echo "🧪 Quick API Test Script"
echo "========================"
echo ""

# Start server in background
echo "Starting server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Server failed to start. Check server.log for errors."
    cat server.log
    exit 1
fi

echo "✅ Server started!"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
curl -s http://localhost:3000/health | jq '.' || curl -s http://localhost:3000/health
echo -e "\n"

# Test 2: API Info
echo "Test 2: API Info"
echo "----------------"
curl -s http://localhost:3000/api/v1 | jq '.' || curl -s http://localhost:3000/api/v1
echo -e "\n"

# Test 3: Send OTP
echo "Test 3: Send OTP"
echo "----------------"
echo "Sending OTP to +254712345678..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+254712345678"}')

echo $RESPONSE | jq '.' || echo $RESPONSE
echo -e "\n"

# Check server log for OTP
echo "📱 Check server.log for the OTP code!"
echo "Grep for OTP:"
grep -i "otp" server.log | tail -5
echo ""

# Keep server running
echo "Server is running on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""
echo "To test more endpoints, open another terminal and run:"
echo "  curl http://localhost:3000/api/v1/campaigns/available"
echo ""

# Wait for user interrupt
wait $SERVER_PID

