#!/bin/bash
# ClaimEase Web Portal - Quick Start Script

echo "🚀 Starting ClaimEase Web Portal..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env and add your OpenAI API key!"
    echo "   Open .env and replace 'sk-your-actual-api-key-here' with your actual key"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
    echo ""
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs data

# Run the application
echo "🎉 Launching ClaimEase Web Portal..."
echo "📱 The app will open in your browser at http://localhost:8501"
echo ""
echo "💡 Tips:"
echo "   - Press Ctrl+C to stop the server"
echo "   - Login with any valid email (e.g., your.email@deriv.com)"
echo "   - Use the Chat Assistant to ask questions"
echo ""

streamlit run app.py
