# Cloudflare Tunnel Setup Guide

This guide explains how to share your local ClaimEase web app with others using Cloudflare Tunnel (ngrok alternative).

## 🎯 What This Does

- **Shares your local app** with others via secure HTTPS URLs
- **Completely modular** - doesn't interfere with your normal development workflow
- **Persistent URLs** - same URLs every time you start the tunnel
- **Easy to remove** - just delete the cloudflare_* files when done

## 📋 Prerequisites

1. **Cloudflare account** (free) - Sign up at https://dash.cloudflare.com
2. **Homebrew** (for macOS) - Already installed on your system
3. **Your app running locally**:
   - Frontend: `npm run dev` (port 3000)
   - Backend: `python src/api.py` (port 8001)

## 🚀 Quick Start

### Step 1: One-Time Setup (5 minutes)

Run the setup script:

```bash
chmod +x cloudflare_tunnel_setup.sh
./cloudflare_tunnel_setup.sh
```

This will:
1. Install `cloudflared` CLI tool
2. Open browser for Cloudflare login
3. Create a tunnel
4. Generate configuration file

### Step 2: Configure DNS (One-Time)

After setup completes, you'll see commands like:

```bash
cloudflared tunnel route dns <tunnel-name> claimease-app.yourdomain.com
cloudflared tunnel route dns <tunnel-name> claimease-api.yourdomain.com
```

**Option A: If you have a domain**
- Replace `yourdomain.com` with your actual domain
- Run the commands shown in the setup output

**Option B: If you don't have a domain**
- You can use Cloudflare's free subdomain
- Or use the tunnel's auto-generated trycloudflare.com URL
- Edit `cloudflare_tunnel_config.yml` and remove the hostname lines to use auto-generated URLs

### Step 3: Start Sharing

```bash
chmod +x cloudflare_tunnel_start.sh
./cloudflare_tunnel_start.sh
```

Your app is now accessible via HTTPS URLs!

### Step 4: Stop Sharing

When done, stop the tunnel:

```bash
chmod +x cloudflare_tunnel_stop.sh
./cloudflare_tunnel_stop.sh
```

Or simply press `Ctrl+C` in the terminal running the tunnel.

## 📖 Daily Usage

### Your Normal Workflow (Unchanged)

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start backend
python src/api.py
```

Your app runs on `localhost:3000` and `localhost:8001` as usual.

### When You Need to Share

```bash
# Terminal 3: Start tunnel (only when needed)
./cloudflare_tunnel_start.sh
```

Now others can access your app via the configured URLs.

### When Done Sharing

```bash
./cloudflare_tunnel_stop.sh
```

Your local servers keep running, only the tunnel stops.

## 🔧 Configuration

### Files Created

- `cloudflare_tunnel_setup.sh` - One-time setup script
- `cloudflare_tunnel_start.sh` - Start tunnel
- `cloudflare_tunnel_stop.sh` - Stop tunnel
- `cloudflare_tunnel_config.yml` - Tunnel configuration
- `.cloudflare_tunnel_info` - Tunnel metadata (auto-generated)

### Customizing URLs

Edit `cloudflare_tunnel_config.yml` to change hostnames:

```yaml
ingress:
  # Frontend
  - hostname: your-custom-name.yourdomain.com
    service: http://localhost:3000
  
  # Backend
  - hostname: api-custom-name.yourdomain.com
    service: http://localhost:8001
  
  - service: http_status:404
```

### Using Auto-Generated URLs (No Domain Required)

If you don't have a domain, edit `cloudflare_tunnel_config.yml`:

```yaml
ingress:
  # Remove hostname lines to use auto-generated URLs
  - service: http://localhost:3000
  
  - service: http_status:404
```

Then run the tunnel and it will show you the auto-generated trycloudflare.com URL.

## 🔒 Security Notes

- Tunnel uses HTTPS encryption
- Only people with the URL can access your app
- You can add authentication in Cloudflare dashboard
- Stop the tunnel when not needed

## 🗑️ Complete Removal

To completely remove Cloudflare Tunnel:

```bash
# 1. Delete tunnel from Cloudflare
cloudflared tunnel delete <tunnel-name>

# 2. Remove local files
rm cloudflare_tunnel_*.sh
rm cloudflare_tunnel_config.yml
rm .cloudflare_tunnel_info
rm CLOUDFLARE_TUNNEL_GUIDE.md

# 3. Uninstall cloudflared (optional)
brew uninstall cloudflared
```

## 🆘 Troubleshooting

### "Tunnel not configured yet"
Run `./cloudflare_tunnel_setup.sh` first.

### "cloudflared not found"
The setup script will install it automatically. If it fails, run:
```bash
brew install cloudflared
```

### "Connection refused" errors
Make sure your local servers are running:
- Frontend: `npm run dev` (port 3000)
- Backend: `python src/api.py` (port 8001)

### DNS not resolving
Wait a few minutes for DNS propagation, or use auto-generated URLs instead.

### Port already in use
Check if another tunnel is running:
```bash
./cloudflare_tunnel_stop.sh
```

## 📚 Additional Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Tunnel Management](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)

## 💡 Tips

1. **Keep tunnel running in background**: Use `screen` or `tmux`
2. **Share specific pages**: Give users direct URLs like `https://your-app.com/chat`
3. **Monitor usage**: Check Cloudflare dashboard for analytics
4. **Multiple tunnels**: You can create different tunnels for different projects

## ✅ Advantages Over ngrok

- ✅ Free forever (no time limits)
- ✅ Persistent URLs (don't change)
- ✅ Better performance
- ✅ No account required for basic use
- ✅ Enterprise-grade infrastructure
- ✅ Built-in DDoS protection
- ✅ Can add authentication easily

---

**Need help?** Check the troubleshooting section or visit Cloudflare's documentation.
