const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sourisDesktop', {
  loadProgress: () => ipcRenderer.invoke('progress:load'),
  saveProgress: (completed) => ipcRenderer.invoke('progress:save', completed)
});
