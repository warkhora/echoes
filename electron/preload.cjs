const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('echoesDesktop', true);
