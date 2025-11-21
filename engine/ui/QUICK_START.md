# Quick Start Guide - ZeroConfig Tauri Desktop App

## 5-Minute Setup

### Step 1: Prerequisites Check
Ensure you have installed:
- ✅ Node.js 18+ (`node --version`)
- ✅ Rust 1.70+ (`rustc --version`)
- ✅ Git

### Step 2: Clone and Navigate
```bash
cd engine/ui
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Build the Engine
```bash
cd ../
cargo build --release
cd ui
```

### Step 5: Start Development
```bash
npm run tauri dev
```

The app will open automatically! 🎉

## Common Commands

```bash
# Development
npm run tauri dev          # Start dev server with hot-reload

# Building
npm run tauri build        # Build production app

# Debugging
npm run dev                # Start Vite dev server only
npm run build              # Build frontend only
npm run preview            # Preview production build
```

## Troubleshooting

### "Port 1420 already in use"
```bash
# Windows
netstat -ano | findstr :1420
taskkill /PID <PID> /F
```

### "zeroconfig.exe not found"
```bash
cd engine
cargo build --release
cd ui
```

### "WebView2 not installed" (Windows)
Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Next Steps

1. Read `TAURI_SETUP.md` for detailed setup
2. Check `src/` for frontend code
3. Check `src-tauri/src/` for backend code
4. Press `F12` in the app to open DevTools

## Need Help?

- 📖 [Tauri Docs](https://tauri.app/docs/)
- 🐛 Check GitHub Issues
- 💬 Create a new issue with details

Happy coding! 🚀