'use strict';

(async () => {
	try {
		const { contextBridge, ipcRenderer } = await import('electron');
		
		contextBridge.exposeInMainWorld('electron', {
			on: (channel, listener) => ipcRenderer.on(channel, listener),
			invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
			send: (channel, ...args) => ipcRenderer.send(channel, ...args)
		});
	} catch (err) {
		console.error('Preload error:', err);
	}
})();