# Install Build Tools for ZeroConfig Engine

## Quick Install Guide

### Option 1: Visual Studio Build Tools (Recommended for Windows)

1. **Download Visual Studio Build Tools 2022**:
   - Go to: https://visualstudio.microsoft.com/downloads/
   - Scroll down to "Tools for Visual Studio"
   - Download "Build Tools for Visual Studio 2022"

2. **Install Required Components**:
   - Run the installer
   - Select **"Desktop development with C++"**
   - Ensure these are checked:
     - MSVC v143 - VS 2022 C++ x64/x86 build tools (Latest)
     - Windows 11 SDK (10.0.22621.0 or later)
     - C++ CMake tools for Windows
   - Click Install (requires ~7GB)

3. **Verify Installation**:
   ```cmd
   "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
   cl
   ```

4. **Build ZeroConfig**:
   ```cmd
   cd C:\Users\judic\OneDrive\Desktop\zero-config\engine
   rustup default stable-x86_64-pc-windows-msvc
   cargo build --release
   ```

### Option 2: MinGW-w64 (GNU Toolchain)

1. **Download MinGW-w64**:
   - Go to: https://www.mingw-w64.org/downloads/
   - Recommended: WinLibs standalone build
   - Download: https://github.com/brechtsanders/winlibs_mingw/releases/latest
   - Get: `winlibs-x86_64-posix-seh-gcc-*-mingw-w64msvcrt-*.7z`

2. **Extract and Add to PATH**:
   ```cmd
   # Extract to C:\mingw64
   # Add to PATH:
   setx PATH "%PATH%;C:\mingw64\bin"
   ```

3. **Verify Installation**:
   ```cmd
   gcc --version
   g++ --version
   ```

4. **Build ZeroConfig with GNU**:
   ```cmd
   cd C:\Users\judic\OneDrive\Desktop\zero-config\engine
   rustup default stable-x86_64-pc-windows-gnu
   cargo build --release
   ```

### Option 3: Use Administrator PowerShell (Chocolatey)

1. **Open PowerShell as Administrator**:
   - Press Windows + X
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Install Chocolatey** (if not installed):
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

3. **Install MinGW**:
   ```powershell
   choco install mingw -y
   ```

4. **Refresh PATH and verify**:
   ```powershell
   refreshenv
   gcc --version
   ```

5. **Build**:
   ```powershell
   cd C:\Users\judic\OneDrive\Desktop\zero-config\engine
   rustup default stable-x86_64-pc-windows-gnu
   cargo build --release
   ```

## After Installation

Once build tools are installed, run:

```cmd
# Clean previous build attempts
cargo clean

# Build in release mode
cargo build --release

# Or run directly
cargo run -- --help

# Install globally
cargo install --path .
```

## Troubleshooting

### Still Getting Linker Errors?

1. **Check which link.exe is being used**:
   ```cmd
   where link
   ```

2. **If Git's link.exe appears first, temporarily rename it**:
   ```cmd
   ren "C:\Program Files\Git\usr\bin\link.exe" "C:\Program Files\Git\usr\bin\link_git.exe"
   ```

3. **Build, then rename back**:
   ```cmd
   cargo build --release
   ren "C:\Program Files\Git\usr\bin\link_git.exe" "C:\Program Files\Git\usr\bin\link.exe"
   ```

### Error: "rust-src" component is missing

```cmd
rustup component add rust-src
```

### Error: Can't find Windows SDK

Reinstall Visual Studio Build Tools and ensure Windows SDK is selected.

## Verification Commands

```cmd
# Check Rust
rustc --version
cargo --version

# Check compiler (MSVC)
cl

# Check compiler (GNU)
gcc --version

# Check linker
link /?

# Build test
cd C:\Users\judic\OneDrive\Desktop\zero-config\engine
cargo check
```

## Next Steps

After successful build:

1. Test the CLI:
   ```cmd
   .\target\release\zeroconfig.exe --help
   ```

2. Run doctor command:
   ```cmd
   .\target\release\zeroconfig.exe doctor
   ```

3. Initialize a test project:
   ```cmd
   mkdir test-project
   cd test-project
   ..\target\release\zeroconfig.exe init --template node
   ```
