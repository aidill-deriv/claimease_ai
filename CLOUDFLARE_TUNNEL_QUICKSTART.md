# Cloudflare Tunnel - Quick Reference

## 🚀 First Time Setup

```bash
./cloudflare_tunnel_setup.sh
```

Follow the prompts to:
1. Install cloudflared
2. Login to Cloudflare
3. Create tunnel
4. Configure DNS (optional)

## 📱 Daily Usage

### Start Your App (Normal Workflow)
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend  
python src/api.py
```

### Share with Others (When Needed)
```bash
# Terminal 3: Start tunnel
./cloudflare_tunnel_start.sh
```

### Stop Sharing
```bash
./cloudflare_tunnel_stop.sh
```
Or press `Ctrl+C` in the tunnel terminal.

## 🔗 Your URLs

After setup, your app will be accessible at:
- **Frontend**: `https://claimease-app.yourdomain.com`
- **Backend**: `https://claimease-api.yourdomain.com`

(Or auto-generated trycloudflare.com URLs if no domain configured)

## 📝 Key Points

✅ **Modular** - Doesn't affect your normal workflow
✅ **Persistent URLs** - Same URLs every time
✅ **Free** - No time limits or paid plans needed
✅ **Secure** - HTTPS encryption by default
✅ **Easy Removal** - Just delete the cloudflare_* files

## 🆘 Quick Troubleshooting

**"Tunnel not configured"**
→ Run `./cloudflare_tunnel_setup.sh` first

**"Connection refused"**
→ Make sure your local servers are running (npm run dev & python src/api.py)

**"cloudflared not found"**
→ Run setup script again, it will install automatically

## 📚 Full Documentation

See `CLOUDFLARE_TUNNEL_GUIDE.md` for complete instructions and advanced configuration.

---

**Ready to share?** Just run `./cloudflare_tunnel_setup.sh` to get started!
