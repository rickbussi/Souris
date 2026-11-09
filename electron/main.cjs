const { app, BrowserWindow, ipcMain, Menu, net, protocol } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{ scheme: 'souris', privileges: {
  standard: true, secure: true, supportFetchAPI: true, stream: true
} }]);

// Ignore the Linux desktop's device scale; the UI applies its own column-based text sizing.
if (process.platform === 'linux') app.commandLine.appendSwitch('force-device-scale-factor', '1');

let mainWindow;
const appRoot = path.join(__dirname, '..', 'dist', 'souris-web', 'browser');
const exerciseCount = 7;
const progressFile = () => path.join(app.getPath('userData'), 'progression.json');
function legacyFile() {
  const dataHome = process.platform === 'win32'
    ? process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local')
    : process.env.XDG_DATA_HOME || path.join(app.getPath('home'), '.local', 'share');
  return path.join(dataHome, 'Souris', 'progression.json');
}
function normalizeProgress(data) {
  const valid = (values) => [...new Set(values.filter((index) => Number.isInteger(index)
    && index >= 0 && index < exerciseCount))].sort((a, b) => a - b);
  if (Array.isArray(data)) {
    return { version: 2, completed: valid(data.map((index) => index === 1 ? 3 : index === 2 ? 1 : index === 3 ? 2 : index)), failed: [] };
  }
  if (data?.version !== 2 || !Array.isArray(data.completed)) return { version: 2, completed: [], failed: [] };
  const completed = valid(data.completed);
  const failed = valid(Array.isArray(data.failed) ? data.failed : []).filter((index) => !completed.includes(index));
  return { version: 2, completed, failed };
}
async function saveProgress(progress) {
  try {
    await fs.mkdir(path.dirname(progressFile()), { recursive: true });
    await fs.writeFile(progressFile(), JSON.stringify(progress), 'utf8');
    return true;
  } catch { return false; }
}
async function loadProgress() {
  for (const file of [progressFile(), legacyFile()]) {
    try {
      const progress = normalizeProgress(JSON.parse(await fs.readFile(file, 'utf8')));
      if (file !== progressFile()) await saveProgress(progress);
      return progress;
    } catch (error) {
      if (error.code !== 'ENOENT') return { version: 2, completed: [], failed: [] };
    }
  }
  return { version: 2, completed: [], failed: [] };
}
function trusted(event) {
  return event.sender === mainWindow?.webContents && event.senderFrame?.url.startsWith('souris://app/');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('souris', async (request) => {
    const url = new URL(request.url);
    if (url.host !== 'app') return new Response('Not found', { status: 404 });
    const pathname = decodeURIComponent(url.pathname);
    const file = path.resolve(appRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(appRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
  ipcMain.handle('progress:load', (event) => trusted(event) ? loadProgress() : { version: 2, completed: [], failed: [] });
  const validIndices = (values) => Array.isArray(values) && values.length <= exerciseCount
    && values.every((i) => Number.isInteger(i) && i >= 0 && i < exerciseCount);
  ipcMain.handle('progress:save', (event, progress) => trusted(event) && progress?.version === 2
    && validIndices(progress.completed) && validIndices(progress.failed)
    ? saveProgress(normalizeProgress(progress)) : false);
  mainWindow = new BrowserWindow({
    width: 1180, height: 780, minWidth: 640, minHeight: 650,
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
