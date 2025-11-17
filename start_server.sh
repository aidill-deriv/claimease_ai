#!/bin/bash
# Helper script to start ClaimBot API server

echo "======================================================================"
echo "🚀 Starting ClaimBot API Server"
echo "======================================================================"
echo ""

# Check if .env file exists
if [ ! -f "config/.env" ]; then
    echo "❌ Error: config/.env file not found!"
    echo "Please create config/.env with your configuration."
    exit 1
fi

# Check if required environment variables are set
source config/.env

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not set in config/.env"
    exit 1
fi

if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "⚠️  Warning: SLACK_BOT_TOKEN not set in config/.env"
    echo "Slack integration will not work without it."
fi

if [ -z "$SLACK_SIGNING_SECRET" ]; then
    echo "⚠️  Warning: SLACK_SIGNING_SECRET not set in config/.env"
    echo "Slack integration will not work without it."
fi

echo "✅ Environment variables loaded"
echo ""

# Start the server
echo "Starting server on port 8000..."
echo "Press Ctrl+C to stop"
echo ""
echo "Endpoints:"
echo "  - Health: http://localhost:8000/health"
echo "  - Query: http://localhost:8000/query"
echo "  - Slack: http://localhost:8000/slack/events"
echo ""
echo "======================================================================"
echo ""

# Run the server
python3 -m uvicorn src.api:app --host 0.0.0.0 --port 8000
