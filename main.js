'use strict';

const {app, BrowserWindow, screen, ipcMain} = require("electron");
const path = require('path');
const fs = require('fs');
let mainWindow;

try {
	require('electron-reloader')(module);
} catch {}

if (require('electron-squirrel-startup')) {
	app.quit();
}

function createWindow() {
	let screenSize = screen.getPrimaryDisplay().workAreaSize;
	mainWindow = new BrowserWindow({
    	width: screenSize.width * 0.6,
    	height: screenSize.height * 0.8,
		minWidth: 1216,
		minHeight: 839,
		center: true,
		backgroundColor: '#000000',
		darkTheme: true,
		devTools: false,
		// devTools: true,
		icon: `${__dirname}/favicon.ico`,
		show: false,
    	webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
  	});
	
	mainWindow.removeMenu();
	mainWindow.loadFile(`${__dirname}/src/index.html`);
	// mainWindow.webContents.openDevTools();
	mainWindow.webContents.on('did-finish-load', () => {
		if ((process.argv.length >= 2) && (process.argv[1] !== '.')) {
			mainWindow.webContents.send('open', process.argv[1]);
		}
	});
	
	mainWindow.once('ready-to-show', () => {
		mainWindow.maximize();
		mainWindow.setAlwaysOnTop(true);
		mainWindow.show();
		mainWindow.setAlwaysOnTop(false);
	});
	
	ipcMain.on('windowTitle', (e, newTitle) => {
		mainWindow.setTitle(newTitle);
  	});
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  	if (process.platform !== 'darwin') {
    	app.quit();
  	}
});

app.on('activate', () => {
  	if (BrowserWindow.getAllWindows().length === 0) {
    	createWindow();
  	}
});