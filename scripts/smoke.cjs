const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

process.env.SOURIS_SMOKE = '1';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'souris-smoke-'));
app.setPath('userData', profile);
fs.writeFileSync(path.join(profile, 'progression.json'), JSON.stringify({ version: 2, completed: [] }));
require('../electron/main.cjs');

const timeout = setTimeout(() => { console.error('Electron n’a pas chargé la page.'); process.exit(1); }, 15000);
app.whenReady().then(() => {
  const window = BrowserWindow.getAllWindows()[0];
  window.webContents.once('did-fail-load', (_event, code, description) => {
    clearTimeout(timeout);
    console.error(`Chargement échoué : ${code} ${description}`);
    process.exit(1);
  });
  window.webContents.once('did-finish-load', async () => {
    try {
      const result = await window.webContents.executeJavaScript(`(async () => {
        const wait = () => new Promise(resolve => setTimeout(resolve, 80));
        await wait();
        const home = document.querySelector('h1')?.textContent?.trim();
        document.querySelector('.home .big')?.click();
        await wait();
        const lesson = document.querySelector('h1')?.textContent?.trim();
        document.querySelector('.actions button:last-child')?.click();
        await wait();
        document.querySelector('.first-scene .click-action button')?.click();
        document.querySelectorAll('.coffee input')[1]?.click();
        document.querySelector('.file-menu > button')?.click();
        await wait();
        document.querySelector('.popup-menu button:last-child')?.click();
        await wait();
        return { home, lesson, progress: document.querySelector('.progress strong')?.textContent?.trim(),
          nextEnabled: !document.querySelector('.actions button:last-child')?.disabled,
          desktopApi: !!window.sourisDesktop };
      })()`);
      if (result.home !== 'Apprendre à utiliser la souris' || result.lesson !== 'Clic gauche'
        || result.progress !== '1 / 6 exercices réussis' || !result.nextEnabled || !result.desktopApi) {
        throw new Error(`Parcours inattendu : ${JSON.stringify(result)}`);
      }
      console.log(`Parcours Electron vérifié : ${JSON.stringify(result)}`);
      clearTimeout(timeout);
      app.quit();
    } catch (error) {
      clearTimeout(timeout);
      console.error(error);
      process.exit(1);
    }
  });
});
