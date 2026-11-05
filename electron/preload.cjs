const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sourisDesktop', {
  loadProgress: () => ipcRenderer.invoke('progress:load'),
  saveProgress: (progress) => ipcRenderer.invoke('progress:save', progress)
});
