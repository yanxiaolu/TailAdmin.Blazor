# TailAdmin.Blazor

TailAdmin Blazor is a premium admin dashboard template migrated from the original Tailwind HTML template to a native, compile-time **.NET 10 Blazor WebAssembly (WASM)** application.

## 🚀 Features
- **100% Native Blazor WASM Components**: No runtime static file readers or unsafe `MarkupString` injections. Every page is fully compiled.
- **Shared Layout Engine**: Structured layout flow using `MainLayout.razor` and `EmptyLayout.razor` (for auth pages).
- **Interactive Component Splitting**: Reusable subcomponents like `Sidebar`, `Header`, and `Breadcrumb`.
- **Advanced Side Navigation**: Collapsed icon-only state which smooth-expands to full width on mouse hover, with active link detection.
- **Tailwind CSS v4 & Webpack Bundle Pipeline**: Fast bundling of styles and key JS plugins (ApexCharts, Flatpickr, Dropzone, and FullCalendar).
- **Playwright E2E Test Suite**: Fully automated tests checking all 18 routes for successful compilation and 0 runtime Javascript warnings.

---

## 🛠️ Quick Start

### 1. Prerequisites
- **.NET SDK**: `10.0` or higher
- **NodeJS**: `v18+`

### 2. Setup and Asset Building
To install dependencies and bundle Tailwind CSS styles and plugins:
```bash
npm install
npm run build:assets
```

### 3. Running Locally
Run the local Blazor development server:
```bash
dotnet watch
# Or
dotnet run
```
The application will boot at `http://localhost:9090`.

### 4. Running UI Tests
Execute the Playwright end-to-end automation test suite:
```bash
npm run test:ui
```

---

## ☁️ Cloudflare Pages Deployment

This project contains a pre-configured build script to deploy directly to **Cloudflare Pages** as a static site.

### Cloudflare Pages Dashboard Settings:
- **Framework Preset**: None (or custom)
- **Build command**: `sh build.sh`
- **Build output directory**: `output/wwwroot`

### Under the hood:
The [build.sh](file:///Users/yanxiaolu/Downloads/tailadmin-free-tailwind-dashboard-template/TailAdmin.Blazor/build.sh) script automatically:
1. Installs Node dependencies and compiles Tailwind CSS and Webpack assets.
2. Downloads the official `.NET SDK 10.0` environment compiler.
3. Publishes the Blazor WASM site into `output/wwwroot` for instant static edge hosting.
