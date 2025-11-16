# ZeroConfig — Universal Developer Environment Automation Engine

> **Zero setup. Instant productivity.**

ZeroConfig is an AI-assisted DevOps tool that automatically builds, configures, and manages developer environments for any programming language. It eliminates configuration, dependency errors, port conflicts, local database issues, onboarding delays, and cloud emulation complexity — so engineers can ship faster.

## 🌟 Platform Highlights

- **Rust-powered core engine** for blazing-fast orchestration
- **Docker/Podman orchestration** with automatic container management
- **CLI + Desktop App (Tauri) + Web UI** for every workflow
- **Multi-language support**: Node, Python, Go, Rust, Java, .NET
- **Automatic SDK + DB/service setup**
- **Automatic port allocation** to avoid conflicts
- **Local cloud emulation** (LocalStack)
- **Instant local productivity** with zero configuration

## 📁 Project Structure

```
zero-config/
├── website/          # Marketing website (React + TypeScript + Tailwind)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── store/        # Zustand state management
│   │   └── index.css     # Tailwind CSS styles
│   └── README.md
└── README.md         # This file
```

## 🚀 Quick Start

### Marketing Website

```bash
cd website
npm install
npm run dev
```

The website will be available at `http://localhost:5173`

### Build for Production

```bash
cd website
npm run build
npm run preview
```

## 🎨 Design System

The marketing website uses a modern, developer-first design inspired by Vercel, Raycast, Warp, Linear, and Stripe.

**Color Palette:**
- Primary: `#0F1724` (Deep slate)
- Accent: `#FF6A00` (Rust orange)
- Accent Purple: `#7C5CFF`
- Success: `#00C48C`
- Muted: `#94A3B8`

**Typography:**
- Sans: Inter (UI, headings)
- Mono: JetBrains Mono (code, terminal)

## 📦 Tech Stack

### Marketing Website
- ⚛️ React 18 with TypeScript
- ⚡ Vite for build tooling
- 🎨 Tailwind CSS for styling
- 🔄 Zustand for state management
- ✨ Framer Motion for animations
- 📱 Fully responsive design

## 🎯 Features

### Instant Environment Provisioning
Provision full environments automatically with one command — language runtimes, SDKs, databases, and background services included.

### Rust-Powered Orchestration Core
A low-latency, memory-safe orchestration engine written in Rust for predictable starts and fast dependency resolution.

### Automatic SDK & Tool Installer
Detects your project and automatically installs required SDKs, CLIs, and language managers (nvm, pyenv, rvm).

### Smart Port Allocation
Avoids port conflicts automatically — detects used ports and remaps services with friendly URLs.

### Cloud Emulation
Local emulation of cloud services (S3, SQS, Lambda) for offline-first development.

### Cross-Language Support
One engine, many languages: Node, Python, Go, Rust, Java, .NET, and community-contributed stack templates.

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔗 Links

- [Website](https://zeroconfig.dev) (coming soon)
- [Documentation](https://docs.zeroconfig.dev) (coming soon)
- [GitHub](https://github.com/armand-ratombotiana/zero-config)

---

Built with ♥ using Rust, React, and modern web technologies.
