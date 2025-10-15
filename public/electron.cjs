const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const SERVER_PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

function waitForServer(url, timeoutMs = 30000, intervalMs = 500) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url + "/api/ping", (res) => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
            resolve(true);
          } else if (Date.now() - start >= timeoutMs) {
            reject(new Error("Server did not become ready in time"));
          } else {
            setTimeout(tick, intervalMs);
          }
        })
        .on("error", () => {
          if (Date.now() - start >= timeoutMs)
            reject(new Error("Server not reachable"));
          else setTimeout(tick, intervalMs);
        });
    };
    tick();
  });
}

let serverProcess = null;

function startPackagedServer() {
  // In packaged app, compiled files are under resourcesPath/app
  const serverEntry = path.join(
    process.resourcesPath,
    "app",
    "dist",
    "server",
    "node-build.mjs",
  );
  serverProcess = spawn(
    process.execPath,
    ["--experimental-modules", serverEntry],
    {
      env: { ...process.env, PORT: String(SERVER_PORT) },
      stdio: "inherit",
    },
  );
}

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      webSecurity: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    startPackagedServer();
    try {
      await waitForServer(SERVER_URL);
      win.loadURL(SERVER_URL);
    } catch (e) {
      win.loadURL(
        "data:text/html,<h2>Failed to start internal server</h2><pre>" +
          (e && e.message) +
          "</pre>",
      );
    }
  } else {
    // Development: expect external server from npm run start
    await waitForServer(SERVER_URL).catch(() => {});
    win.loadURL(SERVER_URL);
  }
  // win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (_) {}
  }
  if (process.platform !== "darwin") app.quit();
});

// Catch unhandled exceptions and log them
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
