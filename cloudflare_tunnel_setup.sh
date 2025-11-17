#!/bin/bash

# Cloudflare Tunnel Setup Script
# This script sets up Cloudflare Tunnel for sharing your local web app
# Run this once to configure everything

set -e

echo "=========================================="
echo "Cloudflare Tunnel Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if cloudflared is installed
echo "Step 1: Checking for cloudflared..."
if ! command -v cloudflared &> /dev/null; then
    echo -e "${YELLOW}cloudflared not found. Installing...${NC}"
    
    # Install cloudflared for macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Installing cloudflared via Homebrew..."
        brew install cloudflared
    else
        echo -e "${RED}Please install cloudflared manually:${NC}"
        echo "Visit: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        exit 1
    fi
else
    echo -e "${GREEN}✓ cloudflared is already installed${NC}"
fi

echo ""
echo "Step 2: Login to Cloudflare"
echo -e "${YELLOW}A browser window will open. Please login to your Cloudflare account.${NC}"
echo "If you don't have an account, you can create one for free."
echo ""
read -p "Press Enter to continue..."

cloudflared tunnel login

if [ $? -ne 0 ]; then
    echo -e "${RED}Login failed. Please try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Successfully logged in to Cloudflare${NC}"
echo ""

# Create tunnel
echo "Step 3: Creating tunnel..."
TUNNEL_NAME="claimease-app-$(date +%s)"
echo "Tunnel name: $TUNNEL_NAME"

cloudflared tunnel create $TUNNEL_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create tunnel. Please check your Cloudflare account.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Tunnel created successfully${NC}"
echo ""

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"

# Save tunnel info
echo "TUNNEL_NAME=$TUNNEL_NAME" > .cloudflare_tunnel_info
echo "TUNNEL_ID=$TUNNEL_ID" >> .cloudflare_tunnel_info

echo ""
echo "Step 4: Creating configuration file..."

# Create config file
cat > cloudflare_tunnel_config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /Users/$USER/.cloudflared/$TUNNEL_ID.json

ingress:
  # Frontend (Next.js) - Port 3000
  - hostname: claimease-app.example.com
    service: http://localhost:3000
  
  # Backend (FastAPI) - Port 8001
  - hostname: claimease-api.example.com
    service: http://localhost:8001
  
  # Catch-all rule (required)
  - service: http_status:404
EOF

echo -e "${GREEN}✓ Configuration file created${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "IMPORTANT: You need to configure DNS records in Cloudflare:"
echo ""
echo "1. Go to: https://dash.cloudflare.com"
echo "2. Select your domain (or add a free one)"
echo "3. Go to DNS settings"
echo "4. Run these commands to create DNS records:"
echo ""
echo -e "${YELLOW}cloudflared tunnel route dns $TUNNEL_NAME claimease-app.yourdomain.com${NC}"
echo -e "${YELLOW}cloudflared tunnel route dns $TUNNEL_NAME claimease-api.yourdomain.com${NC}"
echo ""
echo "Replace 'yourdomain.com' with your actual domain."
echo ""
echo "If you don't have a domain, you can:"
echo "- Use Cloudflare's free subdomain"
echo "- Or use the tunnel's auto-generated URL"
echo ""
echo "Next steps:"
echo "1. Configure your DNS records (see above)"
echo "2. Run: ./cloudflare_tunnel_start.sh"
echo ""
echo "Tunnel info saved to: .cloudflare_tunnel_info"
echo "Configuration saved to: cloudflare_tunnel_config.yml"
echo ""
