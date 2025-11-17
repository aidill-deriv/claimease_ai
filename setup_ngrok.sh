#!/bin/bash
# Script to download and setup ngrok without brew

echo "======================================================================"
echo "📥 Downloading ngrok for Mac (ARM64)"
echo "======================================================================"
echo ""

# Check if ngrok already exists
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is already installed!"
    ngrok version
    exit 0
fi

# Create temp directory
mkdir -p /tmp/ngrok_setup
cd /tmp/ngrok_setup

# Download ngrok for Mac ARM64
echo "Downloading ngrok..."
curl -o ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip

# Unzip
echo "Extracting..."
unzip -o ngrok.zip

# Move to /usr/local/bin (or current directory if no permission)
if [ -w /usr/local/bin ]; then
    echo "Installing to /usr/local/bin..."
    mv ngrok /usr/local/bin/
    echo "✅ ngrok installed to /usr/local/bin/ngrok"
else
    echo "Installing to current directory..."
    mv ngrok ~/ngrok
    echo "✅ ngrok installed to ~/ngrok"
    echo ""
    echo "⚠️  To use ngrok, run: ~/ngrok"
    echo "Or add to PATH: export PATH=\$PATH:~/"
fi

# Cleanup
cd -
rm -rf /tmp/ngrok_setup

echo ""
echo "======================================================================"
echo "✅ ngrok setup complete!"
echo "======================================================================"
echo ""
echo "Next steps:"
echo "1. Sign up at: https://dashboard.ngrok.com/signup"
echo "2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
echo "4. Test: ngrok http 8000"
echo ""
