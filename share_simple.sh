#!/bin/bash
# Simple manual approach to share server with ngrok

echo "======================================================================"
echo "🌐 Share Your Server - Simple Method"
echo "======================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Kill any existing ngrok
echo "Stopping any existing ngrok tunnels..."
pkill -f ngrok 2>/dev/null
sleep 2

# Check if servers are running
echo ""
echo "Checking if servers are running..."

if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is NOT running on port 8001${NC}"
    echo "Please start: python3 src/api.py"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend is NOT running on port 3000${NC}"
    echo "Please start: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running${NC}"

echo ""
echo "======================================================================"
echo -e "${YELLOW}📋 MANUAL SETUP REQUIRED${NC}"
echo "======================================================================"
echo ""
echo "You need to open TWO new terminal windows and run these commands:"
echo ""
echo -e "${BLUE}Terminal 1 (Backend ngrok):${NC}"
echo "  ~/ngrok http 8001"
echo ""
echo -e "${BLUE}Terminal 2 (Frontend ngrok):${NC}"
echo "  ~/ngrok http 3000"
echo ""
echo "======================================================================"
echo ""
read -p "Press Enter once BOTH ngrok terminals are running..."

# Wait for ngrok to be ready
sleep 3

# Try to get URLs from ngrok API
echo ""
echo "Fetching ngrok URLs..."

# Get all tunnel URLs
TUNNELS=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)

if [ -z "$TUNNELS" ]; then
    echo -e "${RED}❌ Cannot connect to ngrok API${NC}"
    echo "Make sure ngrok is running in the other terminals"
    exit 1
fi

# Extract URLs - try to match by port
BACKEND_URL=$(echo "$TUNNELS" | jq -r '.tunnels[] | select(.config.addr | contains("8001")) | .public_url' | head -1)
FRONTEND_URL=$(echo "$TUNNELS" | jq -r '.tunnels[] | select(.config.addr | contains("3000")) | .public_url' | head -1)

# Fallback if jq fails
if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "Using alternative URL extraction..."
    ALL_URLS=$(echo "$TUNNELS" | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | sort -u)
    BACKEND_URL=$(echo "$ALL_URLS" | sed -n '1p')
    FRONTEND_URL=$(echo "$ALL_URLS" | sed -n '2p')
fi

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}❌ Could not get ngrok URLs${NC}"
    echo ""
    echo "Please manually check the ngrok terminals for the URLs"
    echo "Then update .env.local manually:"
    echo "  echo 'NEXT_PUBLIC_API_URL=YOUR_BACKEND_URL' > .env.local"
    exit 1
fi

# Check if URLs are different
if [ "$BACKEND_URL" = "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Both URLs are the same!${NC}"
    echo ""
    echo "This means you're using a static ngrok domain."
    echo "You need to run ngrok in TWO separate terminals to get different URLs."
    echo ""
    echo "Make sure you ran:"
    echo "  Terminal 1: ~/ngrok http 8001"
    echo "  Terminal 2: ~/ngrok http 3000"
    echo ""
    echo "If you did, check the ngrok terminals for the actual URLs."
    exit 1
fi

echo -e "${GREEN}✅ Backend URL:${NC} $BACKEND_URL"
echo -e "${GREEN}✅ Frontend URL:${NC} $FRONTEND_URL"

# Update .env.local
echo ""
echo "Updating .env.local..."
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.local
echo -e "${GREEN}✅ .env.local updated${NC}"

# Remind to restart frontend
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Restart your frontend!${NC}"
echo ""
echo "In the terminal running 'npm run dev':"
echo "  1. Press Ctrl+C"
echo "  2. Run: npm run dev"
echo ""
read -p "Press Enter once you've restarted the frontend..."

# Final summary
echo ""
echo "======================================================================"
echo -e "${GREEN}✅ SUCCESS!${NC}"
echo "======================================================================"
echo ""
echo -e "${BLUE}📱 Access URLs:${NC}"
echo ""
echo -e "${GREEN}For YOU (localhost):${NC}"
echo "  http://localhost:3000"
echo ""
echo -e "${GREEN}For OTHERS (share this):${NC}"
echo "  $FRONTEND_URL"
echo ""
echo -e "${BLUE}🔧 Backend API:${NC}"
echo "  $BACKEND_URL"
echo ""
echo "======================================================================"
echo -e "${YELLOW}⚠️  Keep the ngrok terminals open!${NC}"
echo "======================================================================"
echo ""
echo "Closing the ngrok terminals will stop the tunnels."
echo ""
