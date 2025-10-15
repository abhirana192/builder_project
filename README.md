# Jiguang Tour — Running as Electron App

This project can run as a desktop app using Electron.

## Prerequisites
- Node.js 18+ and npm
- Windows 10/11 (for .exe)

## Dev (browser)
```bash
npm install
npm run dev
```

## Dev (Electron)
Runs the server and launches Electron pointing to http://localhost:3000.
```bash
npm install
npm run electron:start
```

## Build production bundles
```bash
# Build frontend + server bundles
npm run build
```

## Build Windows installer (.exe)
This uses electron-builder and creates an NSIS installer that places a desktop shortcut.
```bash
npm install
npm run electron:build
```
Output:
- Installer: dist/Jiguang Tour Setup.exe (name may vary)
- Unpacked app: dist/win-unpacked/

After installing, a desktop shortcut named "Jiguang Tour" will be created automatically.

## How the packaged app works
- Electron main: public/electron.cjs
- On first launch, Electron starts the internal Node server (compiled at dist/server/node-build.mjs) on port 3000, then loads http://localhost:3000 into the window.
- Static SPA is served from dist/spa; API routes are served by Express.

## Troubleshooting
- If the app opens a blank page, wait a few seconds (the internal server is starting) or relaunch.
- If port 3000 is busy, set PORT env before starting:
  - Dev: `PORT=3001 npm run start` and update electron URL or run `npm run electron:start` as-is.
- Logs: packaged app logs to the console when run from a terminal; dev logs appear in your terminal and browser devtools.

## Portable build (optional)
If you prefer a portable exe (no installer), you can build with:
```bash
npx electron-builder -w portable
```

## Notes
- The SQLite DB and schema files under server/db are included. For production, consider copying the DB to app.getPath('userData') on first run if you need writable storage outside Program Files.
