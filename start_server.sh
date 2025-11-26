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
# Networking parameters
HOST="127.0.0.1"
PORT="8001"

# Check for existing process bound to the port
if command -v lsof >/dev/null 2>&1; then
    if lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
        echo "❌ Error: Port ${PORT} is already in use."
        echo "Please stop the existing process (e.g., run: lsof -iTCP:${PORT} -sTCP:LISTEN) and try again."
        exit 1
    fi
fi

echo "Starting server on port ${PORT}..."
echo "Press Ctrl+C to stop"
echo ""
echo "Endpoints:"
echo "  - Health: http://${HOST}:${PORT}/health"
echo "  - Query: http://${HOST}:${PORT}/query"
echo "  - Slack: http://${HOST}:${PORT}/slack/events"
echo ""
echo "======================================================================"
echo ""

# Run the server (bind to loopback to avoid sandbox permission issues)
python3 -m uvicorn src.api:app --host "${HOST}" --port "${PORT}"
exit_code=$?

if [ $exit_code -ne 0 ]; then
    echo "❌ FastAPI server exited with status $exit_code. Check the log above for details."
    exit $exit_code
fi
