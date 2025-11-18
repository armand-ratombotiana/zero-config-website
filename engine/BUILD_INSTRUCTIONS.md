# Build Instructions for ZeroConfig Engine

## Prerequisites

### 1. Install Rust

Download and install Rust from [https://rustup.rs/](https://rustup.rs/)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Or on Windows, download from [rust-lang.org](https://www.rust-lang.org/tools/install)

### 2. Install Visual Studio Build Tools (Windows Only)

ZeroConfig requires C++ build tools for Windows MSVC target.

**Option A: Visual Studio Installer**
1. Download [Visual Studio 2022](https://visualstudio.microsoft.com/downloads/)
2. Run the installer
3. Select **"Desktop development with C++"** workload
4. Click Install

**Option B: Build Tools Only** (Lighter install)
1. Download [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. Run the installer
3. Select **"C++ build tools"**
4. Include these components:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 11 SDK (latest)
   - C++ CMake tools for Windows

**Option C: Use GNU Toolchain** (Alternative)
```bash
rustup toolchain install stable-x86_64-pc-windows-gnu
rustup default stable-x86_64-pc-windows-gnu

# Install MinGW-w64
# Download from: https://www.mingw-w64.org/downloads/
```

### 3. Install Docker (Required for Runtime)

Download and install Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

**Note**: Docker is required to run ZeroConfig, as it orchestrates containers for services.

---

## Building the Project

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/zero-config.git
cd zero-config/engine
```

### Step 2: Update Rust (Ensure latest stable)

```bash
rustup update stable
```

### Step 3: Build the Project

**Debug Build** (faster, for development):
```bash
cargo build
```

**Release Build** (optimized, for production):
```bash
cargo build --release
```

The binary will be located at:
- Debug: `target/debug/zeroconfig.exe` (Windows) or `target/debug/zeroconfig` (Linux/Mac)
- Release: `target/release/zeroconfig.exe` (Windows) or `target/release/zeroconfig` (Linux/Mac)

---

## Running the Project

### Run directly with Cargo:
```bash
cargo run -- --help
```

### Run the binary:
```bash
# Debug
./target/debug/zeroconfig --help

# Release
./target/release/zeroconfig --help
```

---

## Installing Globally

```bash
cargo install --path .
```

After installation, you can run `zero` or `zeroconfig` from anywhere:

```bash
zero init
zero doctor
zero up
```

---

## Common Build Issues

### Issue 1: Linker Error (Windows)

**Error**: `linking with link.exe failed`

**Cause**: Git's `link.exe` conflicts with MSVC linker

**Solution 1**: Temporarily rename Git's link.exe
```bash
# Rename Git's link.exe
ren "C:\Program Files\Git\usr\bin\link.exe" "C:\Program Files\Git\usr\bin\link_git.exe"

# Build
cargo build

# Rename back
ren "C:\Program Files\Git\usr\bin\link_git.exe" "C:\Program Files\Git\usr\bin\link.exe"
```

**Solution 2**: Use GNU toolchain (see Prerequisites above)

**Solution 3**: Build in PowerShell with VS tools
```powershell
# Open "x64 Native Tools Command Prompt for VS 2022"
cargo build
```

### Issue 2: Rust Version Too Old

**Error**: `requires rustc 1.74 or newer`

**Solution**:
```bash
rustup update stable
rustup default stable
```

### Issue 3: Missing Dependencies

**Error**: `error: no matching package found`

**Solution**:
```bash
cargo clean
rm Cargo.lock
cargo build
```

### Issue 4: Docker Not Running

**Error**: `Docker is not running or not accessible`

**Solution**:
1. Start Docker Desktop
2. Verify it's running: `docker ps`
3. Retry your command

---

## Development Workflow

### Running Tests

```bash
cargo test
```

### Check Code (Faster than full build)

```bash
cargo check
```

### Format Code

```bash
cargo fmt
```

### Lint Code

```bash
cargo clippy
```

### Clean Build Artifacts

```bash
cargo clean
```

---

## Cross-Platform Notes

### Linux

Install build dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential pkg-config libssl-dev

# Fedora/RHEL
sudo dnf install gcc pkg-config openssl-devel
```

### macOS

Install Xcode Command Line Tools:
```bash
xcode-select --install
```

### Windows

- Ensure you have Visual Studio Build Tools installed
- Use PowerShell or CMD (not Git Bash for building)
- Docker Desktop must be running in Windows Containers mode

---

## Performance Tips

1. **Use Release Build for Testing**
   ```bash
   cargo build --release
   time ./target/release/zeroconfig up
   ```

2. **Enable LTO (Link Time Optimization)**

   Add to `Cargo.toml`:
   ```toml
   [profile.release]
   lto = true
   codegen-units = 1
   ```

3. **Parallel Compilation**
   ```bash
   cargo build -j 8  # Use 8 parallel jobs
   ```

---

## Troubleshooting

### Enable Verbose Output

```bash
cargo build --verbose
```

### Check Rust Installation

```bash
rustc --version
cargo --version
rustup show
```

### Check System Requirements

```bash
# Run the built binary
./target/debug/zeroconfig doctor
```

This will check:
- Docker installation
- Runtime versions (Node, Python, etc.)
- Port availability

---

## Additional Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [Cargo Documentation](https://doc.rust-lang.org/cargo/)
- [Bollard (Docker Library)](https://github.com/fussybeaver/bollard)
- [ZeroConfig Documentation](../README.md)

---

## Getting Help

If you encounter issues:

1. Check this BUILD_INSTRUCTIONS.md
2. Search [GitHub Issues](https://github.com/your-username/zero-config/issues)
3. Create a new issue with:
   - Your OS and version
   - Rust version (`rustc --version`)
   - Full error message
   - Steps to reproduce

---

## License

MIT License - See [LICENSE](../LICENSE) file
