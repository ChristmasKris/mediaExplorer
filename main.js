'use strict';

import 'dotenv/config';
import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { shell } from 'electron';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEV_MODE = process.env.DEV_MODE === 'true';
let mainWindow;

try {
	if (DEV_MODE) {
		const electronReloader = await import('electron-reloader');
		electronReloader.default(import.meta.url, {
			watchRenderer: true
		});
	}
} catch {}

ipcMain.handle('getDirectoryFiles', (e, directory) => {
	try {
		let files = fs.readdirSync(directory);
		files = files.filter((name) => {
			return !fs.statSync(path.join(directory, name)).isDirectory();
		});
		files = files.filter((name) => {
			return ['.mp4', '.mkv', '.png', '.jpg', '.mov', '.jpeg', '.webp', '.ico', '.svg', '.jfif', '.avi', '.wmv', '.webm', '.flv', '.gif', '.wav', '.bmp', '.tiff', '.raw', '.mp3', '.ogg'].includes(path.extname(name).toLowerCase());
		});
		files.sort((a, b) => {
			return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
		});
		return files;
	} catch (err) {
		console.error('Error reading directory:', err);
		return [];
	}
});

ipcMain.handle('getFileSize', (e, filePath) => {
	try {
		return fs.statSync(filePath).size;
	} catch (err) {
		console.error('Error getting file size:', err);
		return 0;
	}
});

ipcMain.handle('showInFolder', (e, filePath) => {
	try {
		shell.showItemInFolder(filePath);
		return true;
	} catch (err) {
		console.error('Error showing in folder:', err);
		return false;
	}
});

ipcMain.handle('openWith', (e, filePath) => {
	try {
		if (!filePath) {
			return false;
		}
		if (process.platform === 'win32') {
			const normalizedPath = path.normalize(filePath);
			const child = spawn('rundll32.exe', ['shell32.dll,OpenAs_RunDLL', normalizedPath], {
				detached: true,
				stdio: 'ignore',
				windowsHide: true
			});
			child.unref();
			return true;
		}
		return false;
	} catch (err) {
		console.error('Error opening Open With dialog:', err);
		return false;
	}
});

ipcMain.handle('getPathInfo', (e, filePath) => {
	try {
		const parsed = path.parse(filePath);
		return {
			dir: path.dirname(filePath),
			name: parsed.name,
			ext: path.extname(filePath),
			basename: path.basename(filePath)
		};
	} catch (err) {
		console.error('Error parsing path:', err);
		return null;
	}
});
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
		devTools: DEV_MODE,
		icon: `${__dirname}/favicon.ico`,
		show: false,
    	webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			preload: `${__dirname}/preload.js`
		}
  	});
	
	mainWindow.removeMenu();
	mainWindow.loadFile(`${__dirname}/client/index.html`);
	
	if (DEV_MODE) {
		const clientDir = path.join(__dirname, 'client');
		let reloadTimer;
		try {
			fs.watch(clientDir, { recursive: true }, () => {
				clearTimeout(reloadTimer);
				reloadTimer = setTimeout(() => {
					if (mainWindow && !mainWindow.isDestroyed()) {
						mainWindow.webContents.reloadIgnoringCache();
					}
				}, 150);
			});
		} catch {}
	}
	
	if (DEV_MODE) {
		mainWindow.webContents.openDevTools();
		mainWindow.webContents.once('devtools-opened', () => {
			const devTools = mainWindow.webContents.devToolsWebContents;
			
			if (devTools) {
				devTools.setZoomFactor(1.5);
			}
		});
	}
	
	mainWindow.webContents.on('did-finish-load', () => {
		if ((process.argv.length >= 2) && (process.argv[1] !== '.')) {
			mainWindow.webContents.send('open', process.argv[1]);
			return;
		}

		if (DEV_MODE) {
			// Skip opening any file if TEST_FILE is explicitly set to false
			if (process.env.TEST_FILE === 'false') {
				return;
			}

			const testDir = path.join(__dirname, 'testFiles');
			const testFile = (process.env.TEST_FILE || '').trim();
			let selectedPath = '';
			const testGroups = {
				image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff'],
				video: ['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm'],
				audio: ['.mp3', '.wav', '.ogg'],
				txt: ['.txt']
			};

			if (testFile) {
				const targetKey = testFile.toLowerCase();
				const extensions = testGroups[targetKey];
				if (extensions && fs.existsSync(testDir)) {
					const files = fs.readdirSync(testDir);
					for (const ext of extensions) {
						const match = files.find((name) => name.toLowerCase().endsWith(ext));
						if (match) {
							selectedPath = path.join(testDir, match);
							break;
						}
					}
				}
			}

			if (!selectedPath && !testFile) {
				const fallbackPath = path.join(testDir, 'image.png');
				if (fs.existsSync(fallbackPath)) {
					selectedPath = fallbackPath;
				}
			}

			if (selectedPath) {
				mainWindow.webContents.send('open', selectedPath);
			}
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