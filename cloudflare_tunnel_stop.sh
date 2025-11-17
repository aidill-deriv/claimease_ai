#!/bin/bash

# Cloudflare Tunnel Stop Script
# Run this script to stop the Cloudflare Tunnel

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Stopping Cloudflare Tunnel"
echo "=========================================="
echo ""

# Find and kill cloudflared processes
PIDS=$(pgrep -f "cloudflared tunnel")

if [ -z "$PIDS" ]; then
    echo -e "${YELLOW}No running tunnel found.${NC}"
    exit 0
fi

echo "Found running tunnel processes: $PIDS"
echo "Stopping..."

kill $PIDS

sleep 2

# Check if processes are still running
REMAINING=$(pgrep -f "cloudflared tunnel")

if [ -z "$REMAINING" ]; then
    echo -e "${GREEN}✓ Tunnel stopped successfully${NC}"
else
    echo -e "${YELLOW}Some processes still running. Force killing...${NC}"
    kill -9 $REMAINING
    echo -e "${GREEN}✓ Tunnel force stopped${NC}"
fi

echo ""
echo "Your local servers (Next.js and FastAPI) are still running."
echo "The tunnel is now disconnected."
echo ""
