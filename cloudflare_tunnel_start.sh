#!/bin/bash

# Cloudflare Tunnel Start Script
# Run this script to start sharing your local app via Cloudflare Tunnel

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Starting Cloudflare Tunnel"
echo "=========================================="
echo ""

# Check if setup was completed
if [ ! -f ".cloudflare_tunnel_info" ]; then
    echo -e "${RED}Error: Tunnel not configured yet.${NC}"
    echo "Please run: ./cloudflare_tunnel_setup.sh first"
    exit 1
fi

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}Error: cloudflared not found.${NC}"
    echo "Please run: ./cloudflare_tunnel_setup.sh first"
    exit 1
fi

# Check if config file exists
if [ ! -f "cloudflare_tunnel_config.yml" ]; then
    echo -e "${RED}Error: Configuration file not found.${NC}"
    echo "Please run: ./cloudflare_tunnel_setup.sh first"
    exit 1
fi

# Load tunnel info
source .cloudflare_tunnel_info

echo "Tunnel Name: $TUNNEL_NAME"
echo "Tunnel ID: $TUNNEL_ID"
echo ""

# Check if local servers are running
echo "Checking local servers..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Frontend (port 3000) is not responding${NC}"
    echo "Make sure to start your Next.js app: npm run dev"
    echo ""
fi

if ! curl -s http://localhost:8001 > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Backend (port 8001) is not responding${NC}"
    echo "Make sure to start your FastAPI server: python src/api.py"
    echo ""
fi

echo -e "${GREEN}Starting tunnel...${NC}"
echo ""
echo "Your app will be accessible at:"
echo "  Frontend: https://claimease-app.yourdomain.com"
echo "  Backend:  https://claimease-api.yourdomain.com"
echo ""
echo "(Replace 'yourdomain.com' with your actual configured domain)"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the tunnel${NC}"
echo ""

# Run tunnel
cloudflared tunnel --config cloudflare_tunnel_config.yml run $TUNNEL_NAME
