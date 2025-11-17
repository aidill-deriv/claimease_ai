@echo off
REM ClaimEase Web Portal - Quick Start Script for Windows

echo 🚀 Starting ClaimEase Web Portal...
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo 📝 Creating .env from .env.example...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Please edit .env and add your OpenAI API key!
    echo    Open .env and replace 'sk-your-actual-api-key-here' with your actual key
    echo.
    pause
)

REM Check if virtual environment exists
if not exist venv (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
    echo.
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo 📥 Installing dependencies...
python -m pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo ✅ Dependencies installed
echo.

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs mkdir logs
if not exist data mkdir data

REM Run the application
echo 🎉 Launching ClaimEase Web Portal...
echo 📱 The app will open in your browser at http://localhost:8501
echo.
echo 💡 Tips:
echo    - Press Ctrl+C to stop the server
echo    - Login with any valid email (e.g., your.email@deriv.com)
echo    - Use the Chat Assistant to ask questions
echo.

streamlit run app.py
