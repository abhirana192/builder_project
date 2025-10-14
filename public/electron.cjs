const { app, BrowserWindow } = require('electron')
const path = require('path');

const createWindow = () => {
    const win = new BrowserWindow ({
        width: 800,
        height: 600,
        webPreferences: {
            webSecurity: false, // Disable web security for debugging
            nodeIntegration: true, // Enable Node.js integration
            contextIsolation: false // Disable context isolation for easier debugging
        }
    })

    win.loadURL('http://localhost:8080'); // Load from the local server
    // Open the DevTools.
    // win.webContents.openDevTools();
}

app.whenReady().then( () => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit
})

// Catch unhandled exceptions and log them
process.on('unhandledException', (error) => {
  console.error('Unhandled Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
