const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    title: 'Gems Group Services CRM',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    show: false,
    backgroundColor: '#0f172a'
  });

  // Primary live cloud app URL
  const LIVE_URL = process.env.VITE_APP_URL || 'https://education-sansar-crm.vercel.app';
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === 'true';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadURL(LIVE_URL);
    });
  } else {
    // Connect directly to live app so any change or deployment is instantly visible in the desktop app
    mainWindow.loadURL(LIVE_URL).catch((err) => {
      console.warn('Network issue reaching cloud app, loading local offline fallback:', err);
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  // Smooth show once ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle links: keep CRM internal routes inside the desktop app, open external sites in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(LIVE_URL) || url.startsWith('http://localhost') || url.startsWith('file:')) {
      return { action: 'allow' };
    }
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createAppMenu();
}

function createAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: 'Gems Group Services',
      submenu: [
        { role: 'about', label: 'About Gems Group Services CRM' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide Window' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit Gems Group Services' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload App',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              if (mainWindow.webContents && mainWindow.webContents.reloadIgnoringCache) {
                mainWindow.webContents.reloadIgnoringCache();
              } else {
                mainWindow.reload();
              }
            }
          }
        },
        {
          label: 'Force Reload (Clear Cache)',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (mainWindow && mainWindow.webContents) {
              mainWindow.webContents.session.clearCache().then(() => {
                mainWindow.webContents.reloadIgnoringCache();
              });
            }
          }
        },
        {
          label: 'Open Web Portal',
          click: () => shell.openExternal('https://education-sansar-crm.vercel.app')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools', label: 'Developer Tools' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation & Help',
          click: () => shell.openExternal('https://education-sansar-crm.vercel.app')
        },
        {
          label: 'Support Hotline',
          click: () => shell.openExternal('mailto:admin@gemsgroupservices.com')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Single instance lock (prevent multiple app instances)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
