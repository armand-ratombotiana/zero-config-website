# ZeroConfig Tauri Desktop Application Setup Guide

## Overview

This is a Tauri-based desktop application for ZeroConfig, providing a modern UI for managing development environments, services, and cloud emulators.

## Prerequisites

### System Requirements
- **Windows 10+** (x86_64 or ARM64)
- **macOS 10.13+** (Intel or Apple Silicon)
- **Linux** (Ubuntu 18.04+, Fedora 28+, or equivalent)

### Required Software
1. **Rust** (1.70+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** (18+)
   ```bash
   # Download from https://nodejs.org/
   ```

3. **Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli
   ```

### Windows-Specific Requirements
- **Visual Studio Build Tools 2022** or **Visual Studio Community 2022**
  - Install with "Desktop development with C++" workload
  - Or use: `npm run tauri -- build` which will guide you through setup

- **WebView2 Runtime** (usually pre-installed on Windows 11)
  - Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Project Structure

```
engine/ui/
├── src/                          # React frontend source
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── services/                 # API services
│   ├── types/                    # TypeScript types
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── styles.css                # Global styles
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs              # Tauri entry point
│   │   └── lib.rs               # Tauri commands
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri configuration
│   └── capabilities/            # Security capabilities
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json                 # Node dependencies
```

## Installation

### 1. Install Dependencies

```bash
cd engine/ui

# Install Node dependencies
npm install

# Install Rust dependencies (automatic with Tauri CLI)
```

### 2. Build ZeroConfig Engine

Before running the Tauri app, build the ZeroConfig CLI engine:

```bash
cd engine

# For development (debug build)
cargo build

# For production (release build)
cargo build --release
```

The executable will be at:
- Debug: `engine/target/debug/zeroconfig.exe` (Windows)
- Release: `engine/target/release/zeroconfig.exe` (Windows)

## Development

### Start Development Server

```bash
cd engine/ui

# Start Tauri dev server
npm run tauri dev
```

This will:
1. Start the Vite dev server on `http://localhost:1420`
2. Launch the Tauri window with hot-reload enabled
3. Open DevTools for debugging

### Development Workflow

1. **Frontend Changes**: Edit files in `src/` - changes auto-reload
2. **Backend Changes**: Edit files in `src-tauri/src/` - restart dev server
3. **Tauri Config Changes**: Restart dev server

### Debugging

#### Frontend Debugging
- Press `F12` in the Tauri window to open DevTools
- Use Chrome DevTools for debugging React components

#### Backend Debugging
- Add `println!` macros in Rust code
- Check console output in the terminal

#### Logs
- Frontend logs appear in DevTools console
- Backend logs appear in terminal

## Building for Production

### Build the Application

```bash
cd engine/ui

# Build frontend and Tauri app
npm run tauri build
```

This will:
1. Build the React frontend
2. Compile the Rust backend
3. Create platform-specific installers

### Output Locations

- **Windows**: `src-tauri/target/release/bundle/msi/`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/`

## Configuration

### Tauri Configuration (`src-tauri/tauri.conf.json`)

Key settings:
- `productName`: Application name
- `version`: Application version
- `identifier`: Unique app identifier
- `build.beforeDevCommand`: Command to run before dev
- `build.beforeBuildCommand`: Command to run before build
- `app.windows`: Window configuration
- `app.security.csp`: Content Security Policy

### Environment Variables

Create `.env` file in `engine/ui/`:

```env
TAURI_DEV_HOST=localhost
TAURI_DEV_PORT=1420
```

## Available Commands

### Development
```bash
npm run dev              # Start Vite dev server
npm run tauri dev       # Start Tauri dev server
npm run tauri build     # Build for production
```

### Building
```bash
npm run build           # Build frontend only
npm run preview         # Preview production build
```

### Linting & Type Checking
```bash
npm run tauri -- --help # Show Tauri CLI help
```

## Troubleshooting

### Issue: "zeroconfig.exe not found"

**Solution**: Build the engine first
```bash
cd engine
cargo build --release
```

### Issue: Port 1420 already in use

**Solution**: Kill the process or use a different port
```bash
# Windows
netstat -ano | findstr :1420
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :1420
kill -9 <PID>
```

### Issue: WebView2 not installed (Windows)

**Solution**: Download and install WebView2 Runtime
- https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### Issue: Rust compilation errors

**Solution**: Update Rust and dependencies
```bash
rustup update
cargo clean
cargo build
```

### Issue: TypeScript errors in IDE

**Solution**: Restart TypeScript server
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

## Security Considerations

### Capabilities System

The app uses Tauri's capabilities system for security. Permissions are defined in:
- `src-tauri/capabilities/default.json`

Current permissions:
- File system access (read/write)
- Shell command execution
- Dialog operations
- Window management

### Content Security Policy

CSP is configured in `tauri.conf.json` to:
- Allow only self-hosted resources
- Restrict script execution
- Allow localhost connections for dev

## Performance Optimization

### Frontend
- React code splitting via React Router
- Lazy loading of components
- CSS minification with Tailwind
- Image optimization

### Backend
- Async command handlers
- Efficient process spawning
- Error handling and logging

## Deployment

### Windows Installer

The MSI installer includes:
- Application executable
- WebView2 runtime check
- Auto-update capability
- Uninstaller

### macOS DMG

The DMG includes:
- Application bundle
- Code signing (if configured)
- Notarization (if configured)

### Linux AppImage

The AppImage is:
- Self-contained
- Portable across distributions
- Executable directly

## Additional Resources

- [Tauri Documentation](https://tauri.app/docs/)
- [Tauri API Reference](https://tauri.app/docs/api/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Tauri documentation
3. Check GitHub issues
4. Create a new issue with detailed information

## License

ZeroConfig © 2024. All rights reserved.