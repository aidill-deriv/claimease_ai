#!/usr/bin/env python3
"""
Simple HTTP server to share the built Next.js app over the network.
This bypasses any firewall issues with the Next.js dev server.
"""
import http.server
import socketserver
import os
import subprocess
import sys

def main():
    # Build the Next.js app first
    print("🔨 Building Next.js app...")
    try:
        subprocess.run(["npm", "run", "build"], check=True)
        print("✅ Build completed!")
    except subprocess.CalledProcessError:
        print("❌ Build failed. Make sure 'npm run build' works.")
        sys.exit(1)
    
    # Change to the build output directory
    os.chdir("out") if os.path.exists("out") else os.chdir(".next")
    
    # Start simple HTTP server
    PORT = 8080
    Handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"🌐 Server running at:")
        print(f"   Local: http://localhost:{PORT}")
        print(f"   Network: http://10.10.24.121:{PORT}")
        print(f"")
        print(f"📱 Share this URL with your team:")
        print(f"   http://10.10.24.121:{PORT}")
        print(f"")
        print("Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

if __name__ == "__main__":
    main()