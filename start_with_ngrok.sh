#!/bin/bash
# Comprehensive script to start servers with ngrok for sharing

echo "======================================================================"
echo "🚀 ClaimEase - Start with Public Sharing"
echo "======================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ngrok is configured
if ! ~/ngrok config check &> /dev/null; then
    echo -e "${RED}⚠️  ngrok is not configured yet!${NC}"
    echo ""
    echo "Please follow these steps:"
    echo "1. Sign up at: https://dashboard.ngrok.com/signup"
    echo "2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Run: ~/ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    exit 1
fi

echo -e "${BLUE}📋 Setup Instructions:${NC}"
echo ""
echo "This script will help you start your servers with public sharing."
echo "You'll need to run commands in SEPARATE terminal windows."
echo ""
echo "======================================================================"
echo ""

# Step 1: Backend
echo -e "${GREEN}STEP 1: Start Backend API${NC}"
echo "Open a NEW terminal and run:"
echo -e "${YELLOW}python3 src/api.py${NC}"
echo ""
read -p "Press Enter once backend is running on port 8001..."
echo ""

# Step 2: Frontend
echo -e "${GREEN}STEP 2: Start Frontend${NC}"
echo "Open another NEW terminal and run:"
echo -e "${YELLOW}npm run dev${NC}"
echo ""
read -p "Press Enter once frontend is running on port 3000..."
echo ""

# Step 3: Start ngrok tunnels
echo -e "${GREEN}STEP 3: Starting ngrok tunnels...${NC}"
echo ""

# Kill any existing ngrok processes
pkill -f ngrok 2>/dev/null

# Start ngrok with both tunnels
echo "Starting ngrok tunnels for backend (8001) and frontend (3000)..."
~/ngrok start --all --config=ngrok.yml > /dev/null 2>&1 &

# Wait for ngrok to start
sleep 3

# Get ngrok URLs
echo ""
echo "======================================================================"
echo -e "${GREEN}✅ Tunnels Started!${NC}"
echo "======================================================================"
echo ""

# Fetch tunnel info from ngrok API
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1)
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | tail -1)

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo -e "${RED}⚠️  Could not retrieve ngrok URLs automatically.${NC}"
    echo ""
    echo "Please visit: http://localhost:4040"
    echo "And manually copy the URLs."
else
    echo -e "${BLUE}Backend API URL:${NC}"
    echo "$BACKEND_URL"
    echo ""
    echo -e "${BLUE}Frontend URL (share this):${NC}"
    echo "$FRONTEND_URL"
    echo ""
    
    # Update .env.local with backend URL
    echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.local
    echo -e "${GREEN}✅ Updated .env.local with backend URL${NC}"
fi

echo ""
echo "======================================================================"
echo -e "${GREEN}📱 Access Information:${NC}"
echo "======================================================================"
echo ""
echo -e "${BLUE}For YOU (localhost):${NC}"
echo "  http://localhost:3000"
echo ""
echo -e "${BLUE}For OTHERS (public):${NC}"
echo "  $FRONTEND_URL"
echo ""
echo -e "${BLUE}ngrok Dashboard:${NC}"
echo "  http://localhost:4040"
echo ""
echo "======================================================================"
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "======================================================================"
echo ""
echo "• Keep this terminal open to maintain the tunnels"
echo "• Your computer must stay on for sharing to work"
echo "• Free ngrok URLs change each time you restart"
echo "• To stop: Press Ctrl+C in this terminal"
echo ""
echo "======================================================================"
echo ""

# Keep script running
echo "Press Ctrl+C to stop ngrok tunnels..."
wait
