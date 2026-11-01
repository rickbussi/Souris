const { app, BrowserWindow, ipcMain, net, protocol } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{ scheme: 'souris', privileges: {
  standard: true, secure: true, supportFetchAPI: true, stream: true
} }]);

let mainWindow;
const appRoot = path.join(__dirname, '..', 'dist', 'souris-web', 'browser');
const progressFile = () => path.join(app.getPath('userData'), 'progression.json');
function legacyFile() {
  const dataHome = process.platform === 'win32'
    ? process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local')
    : process.env.XDG_DATA_HOME || path.join(app.getPath('home'), '.local', 'share');
  return path.join(dataHome, 'Souris', 'progression.json');
}
function normalizeProgress(data) {
  if (Array.isArray(data)) {
    return data.map((index) => index === 1 ? 3 : index === 2 ? 1 : index === 3 ? 2 : index)
      .filter((index) => Number.isInteger(index) && index >= 0 && index < 6);
  }
  return data?.version === 2 && Array.isArray(data.completed)
    ? data.completed.filter((index) => Number.isInteger(index) && index >= 0 && index < 6)
    : [];
}
async function saveProgress(values) {
  try {
    await fs.mkdir(path.dirname(progressFile()), { recursive: true });
    await fs.writeFile(progressFile(), JSON.stringify({ version: 2, completed: values }), 'utf8');
    return true;
  } catch { return false; }
}
async function loadProgress() {
  for (const file of [progressFile(), legacyFile()]) {
    try {
      const values = [...new Set(normalizeProgress(JSON.parse(await fs.readFile(file, 'utf8'))))].sort();
      if (file !== progressFile()) await saveProgress(values);
      return values;
    } catch (error) {
      if (error.code !== 'ENOENT') return [];
    }
  }
  return [];
}
function trusted(event) {
  return event.sender === mainWindow?.webContents && event.senderFrame?.url.startsWith('souris://app/');
}

app.whenReady().then(() => {
  protocol.handle('souris', async (request) => {
    const url = new URL(request.url);
    if (url.host !== 'app') return new Response('Not found', { status: 404 });
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(appRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(appRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  ipcMain.handle('progress:load', (event) => trusted(event) ? loadProgress() : []);
  ipcMain.handle('progress:save', (event, values) => trusted(event) && Array.isArray(values)
    && values.length <= 6 && values.every((i) => Number.isInteger(i) && i >= 0 && i < 6)
    ? saveProgress([...new Set(values)].sort()) : false);
  mainWindow = new BrowserWindow({
    width: 1180, height: 780, minWidth: 560, minHeight: 460,
    show: process.env.SOURIS_SMOKE !== '1',
    title: 'Souris — apprendre la souris',
    icon: path.join(__dirname, '..', 'build', 'icons', '256x256.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true,
      nodeIntegration: false, sandbox: true }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, target) => {
    if (!target.startsWith('souris://app/')) event.preventDefault();
  });
  mainWindow.loadURL('souris://app/');
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
