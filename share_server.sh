#!/bin/bash
# Simple script to share your server with ngrok

echo "======================================================================"
echo "🌐 Share Your Server with ngrok"
echo "======================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Kill any existing ngrok
echo "Stopping any existing ngrok tunnels..."
pkill -f ngrok 2>/dev/null
sleep 2

# Step 2: Check if servers are running
echo ""
echo "Checking if servers are running..."

# Check backend
if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is NOT running on port 8001${NC}"
    echo ""
    echo "Please start backend first:"
    echo "  python3 src/api.py"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Backend is running on port 8001${NC}"

# Check frontend
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Frontend is NOT running on port 3000${NC}"
    echo ""
    echo "Please start frontend first:"
    echo "  npm run dev"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"

# Step 3: Start BOTH ngrok tunnels using config file
echo ""
echo "Starting ngrok tunnels (backend + frontend)..."
~/ngrok start --all --config=ngrok.yml > /dev/null 2>&1 &
NGROK_PID=$!
sleep 5

# Get both URLs from ngrok API
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="backend") | .public_url')
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="frontend") | .public_url')

# Fallback if jq not available
if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "Trying alternative method to get URLs..."
    URLS=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*')
    BACKEND_URL=$(echo "$URLS" | sed -n '1p')
    FRONTEND_URL=$(echo "$URLS" | sed -n '2p')
fi

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}❌ Failed to get ngrok URLs${NC}"
    echo "Please check if ngrok is configured:"
    echo "  ~/ngrok config add-authtoken YOUR_TOKEN"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Backend tunnel created:${NC} $BACKEND_URL"
echo -e "${GREEN}✅ Frontend tunnel created:${NC} $FRONTEND_URL"

# Step 4: Update .env.local
echo ""
echo "Updating .env.local with backend URL..."
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.local
echo -e "${GREEN}✅ .env.local updated${NC}"

# Step 5: Remind to restart frontend
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You need to restart your frontend!${NC}"
echo ""
echo "In the terminal running 'npm run dev':"
echo "  1. Press Ctrl+C to stop"
echo "  2. Run: npm run dev"
echo ""
read -p "Press Enter once you've restarted the frontend..."

# Step 7: Display results
echo ""
echo "======================================================================"
echo -e "${GREEN}✅ SUCCESS! Your server is now shared!${NC}"
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
echo -e "${BLUE}📊 ngrok Dashboard:${NC}"
echo "  http://localhost:4040"
echo ""
echo "======================================================================"
echo -e "${YELLOW}⚠️  Keep this terminal open!${NC}"
echo "======================================================================"
echo ""
echo "• Closing this terminal will stop the tunnels"
echo "• Your computer must stay on for sharing to work"
echo "• Free ngrok URLs change each time you restart"
echo ""
echo "Press Ctrl+C to stop sharing..."
echo ""

# Keep script running
wait
