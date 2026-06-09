#!/bin/sh

# Fail on any error
set -e

# 1. Install Node.js dependencies and build Webpack / Tailwind CSS assets
echo "=============================================="
echo "📦 Installing Node.js dependencies..."
echo "=============================================="
npm install

echo "=============================================="
echo "⚡ Building frontend assets (Tailwind CSS & Webpack)..."
echo "=============================================="
npm run build:assets

# 2. Download and install .NET SDK 10.0
echo "=============================================="
echo "🌐 Downloading and installing .NET SDK 10.0..."
echo "=============================================="
curl -sSL https://dot.net/v1/dotnet-install.sh > dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh -c 10.0 -InstallDir ./dotnet

# 3. Compile and publish the Blazor WebAssembly project
echo "=============================================="
echo "🚀 Publishing Blazor WASM project..."
echo "=============================================="
./dotnet/dotnet publish -c Release -o output

echo "=============================================="
echo "🎉 Build finished! Output directory: output/wwwroot"
echo "=============================================="
