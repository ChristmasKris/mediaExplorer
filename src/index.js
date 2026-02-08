'use strict';

const {ipcRenderer, mainWindow, shell} = require('electron');
const path = require('path');
const fs = require('fs');
let mediaDisplay = document.querySelector('.mediaDisplay');
let menu = document.querySelector('.menu');
let previousButton = document.querySelector('.button.previous');
let nextButton = document.querySelector('.button.next');
let mediaWidthDisplay = document.querySelector('.mediaWidthDisplay');
let mediaHeightDisplay = document.querySelector('.mediaHeightDisplay');
let mediaSizeDisplay = document.querySelector('.mediaSizeDisplay');
let mediaNameDisplay = document.querySelector('.mediaNameDisplay');
let mediaExtensionDisplay = document.querySelector('.mediaExtensionDisplay');
let mediaPositionDisplay = document.querySelector('.mediaPositionDisplay');
let showButton = document.querySelector('.showButton');
let changingMedia = false;
let mediaEl = null;
let directory = null;
let currentFile = null;
let currentMediaPos = 1;
let maxMediaPos = 1;
let nextMediaPath = null;
let prevMediaPath = null;
let mediaSizesDisplayable = 0;
let zoomScale = 1;
let mouseDown = false;
let firstMediaInit = true;
let mediaPos = {
	x: null,
	y: null
};
let fileSizes = [
	{
		name: 'B',
		size: 1
	},
	{
		name: 'KB',
		size: 1024
	},
	{
		name: 'MB',
		size: 1048576
	},
	{
		name: 'GB',
		size: 1073741824
	}
];

ipcRenderer.on('open', openFile);

// openFile(null, 'C:/Users/krist/Documents/Programming/placeholders/differentFileTypes/GirlNormal.jpg');

listener.add(previousButton, 'click', () => {
	if (prevMediaPath === null) {
		return;
	}
	
	openFile(null, prevMediaPath, 'prev');
});

listener.add(nextButton, 'click', () => {
	if (nextMediaPath === null) {
		return;
	}
	
	openFile(null, nextMediaPath, 'next');
});

listener.add(showButton, 'click', () => {
	shell.showItemInFolder(path.join(directory, currentFile));
});

listener.add(window, 'wheel', (e) => {
	if (mediaDisplay.querySelector('img')) {
		let zoomDir = e.deltaY > 0 ? 'out' : 'in';
		let image = mediaDisplay.querySelector('img');
		let imgRect = image.getBoundingClientRect();
		
		if ((((imgRect.x + imgRect.width) <= 200) && (zoomDir === 'in')) || ((imgRect.x >= (window.innerWidth - 200)) && (zoomDir === 'in'))) {
			return;
		}
		
		if ((((imgRect.y + imgRect.height) <= 200) && (zoomDir === 'in')) || ((imgRect.y >= (window.innerHeight - 200)) && (zoomDir === 'in'))) {
			return;
		}
		
		if (zoomDir === 'in') {
			zoomScale = (Number(zoomScale) + 0.1).toFixed(1);
		} else {
			zoomScale = (Number(zoomScale) - 0.1).toFixed(1);
		}
		
		if (zoomScale < 0.5) {
			zoomScale = 0.5;
		}
		
		mediaDisplay.style.transform = `scale(${zoomScale})`;
	}
});

listener.add(document, 'mousemove', (e) => {
	if (mouseDown) {
		let image = mediaDisplay.querySelector('img');
		let imgRect = image.getBoundingClientRect();
		let currentLeft = parseInt(getStyle(image, 'left'));
		let currentTop = parseInt(getStyle(image, 'top'));
		
		if ((((imgRect.x + imgRect.width) <= 100) && ((mediaPos.x + (e.clientX / zoomScale)) < currentLeft)) || ((imgRect.x >= (window.innerWidth - 100)) && ((mediaPos.x + (e.clientX / zoomScale)) > currentLeft))) {
			image.style.left = `${currentLeft}px`;
		} else {
			image.style.left = `${mediaPos.x + (e.clientX / zoomScale)}px`;
		}
		
		if ((((imgRect.y + imgRect.height) <= 100) && ((mediaPos.y + (e.clientY / zoomScale)) < currentTop)) || ((imgRect.y >= (window.innerHeight - 100)) && ((mediaPos.y + (e.clientY / zoomScale)) > currentTop))) {
			image.style.top = `${currentTop}px`;
		} else {
			image.style.top = `${mediaPos.y + (e.clientY / zoomScale)}px`;
		}
	}
});

listener.add(document, 'mouseup', () => {
	if (mediaDisplay.querySelector('img')) {
		mediaDisplay.querySelector('img').style.cursor = '';
		mouseDown = false;
	}
});

listener.add(window, 'resize', () => {
	if (mediaDisplay.querySelector('img')) {
		zoomScale = 1;
		mediaDisplay.style.transition = 'none';
		mediaDisplay.style.transform = '';
		let image = mediaDisplay.querySelector('img');
		image.style.top = `${(mediaDisplay.offsetHeight - image.offsetHeight) / 2}px`;
		image.style.left = `${(mediaDisplay.offsetWidth - image.offsetWidth) / 2}px`;
	}
});

function openFile(e, filePath, dir) {
	if (previousButton.querySelector('svg') && nextButton.querySelector('svg')) {
		let baseName = path.basename(filePath);
		directory = path.dirname(filePath);
		displayMedia(baseName, dir);
	} else {
		setTimeout(() => {
			openFile(e, filePath);
		}, 50);
	}
}

function displayMedia(baseName, dir) {
	if (changingMedia) {
		return;
	}
	
	if (!firstMediaInit) {
		menu.style.opacity = '0';
		changingMedia = true;
		zoomScale = 1;
		mediaDisplay.style.transition = 'none';
		mediaDisplay.style.transform = '';
		setTimeout(() => {
			mediaDisplay.style.transition = '';
		}, 10);
	}
	
	currentFile = baseName;
	recalcFiles(baseName);
	let displayBaseName = encodeURIComponent(baseName);
	let extension = path.extname(baseName).toLowerCase();
	
	if (['.mp3', '.wav', '.ogg'].includes(extension)) {
		mediaEl = strToEl(`<audio controls src="file://${directory.replace(/\\/g, '/')}/${displayBaseName}"></audio>`);
	} else if(['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv'].includes(extension)) {
		mediaEl = strToEl(`<video src="file://${directory.replace(/\\/g, '/')}/${displayBaseName}" controls></video>`);
		listener.add(mediaEl, 'loadeddata', () => {
			displayMediaSizes();
		});
	} else {
		mediaEl = strToEl(`<img src="file://${directory.replace(/\\/g, '/')}/${displayBaseName}"/>`);
		listener.add(mediaEl, 'load', (e) => {
			displayMediaSizes();
			e.currentTarget.style.top = `${(mediaDisplay.offsetHeight - e.currentTarget.offsetHeight) / 2}px`;
			e.currentTarget.style.left = `${(mediaDisplay.offsetWidth - e.currentTarget.offsetWidth) / 2}px`;
			let image = mediaDisplay.querySelector('img');
			
			if (image.naturalWidth < 256 || image.naturalHeight < 256) {
				image.style.imageRendering = 'pixelated';
			}
		});
		
		listener.add(mediaEl, 'mousedown', (e) => {
			mediaEl.style.cursor = 'grabbing';
			mediaPos.x = parseInt(getStyle(e.currentTarget, 'left')) - (e.clientX / zoomScale);
			mediaPos.y = parseInt(getStyle(e.currentTarget, 'top')) - (e.clientY / zoomScale);
			mouseDown = true;
		});
	}
	
	if (!firstMediaInit) {
		if (dir === 'next') {
			mediaEl.style.transform = 'translateX(100vw)';
		} else {
			mediaEl.style.transform = 'translateX(-100vw)';
		}
		
		mediaDisplay.firstElementChild.style.transform = 'translateX(0)';
		mediaDisplay.firstElementChild.style.transition = 'transform 0.3s';
		mediaEl.style.transition = 'transform 0.3s';
	}
	
	mediaDisplay.appendChild(mediaEl);
	
	if (!firstMediaInit) {
		setTimeout(() => {
			mediaEl.style.transform = 'translateX(0)';
			
			if (dir === 'next') {
				mediaDisplay.firstElementChild.style.transform = 'translateX(-100vw)';
			} else {
				mediaDisplay.firstElementChild.style.transform = 'translateX(100vw)';
			}
			
			setTimeout(() => {
				if (!firstMediaInit) {
					mediaDisplay.firstElementChild.remove();
				}
				
				displayMediaInfo(baseName, extension);
				changingMedia = false;
			}, 300);
		}, 10);
	} else {
		displayMediaInfo(baseName, extension);
		firstMediaInit = false;
	}
}

function displayMediaInfo(baseName, extension) {
	let fileSize = fs.statSync(`${directory.replace(/\\/g, '/')}/${baseName}`).size;
	let foundSize = null;
	
	for (let size of fileSizes) {
		if ((fileSize / size.size) > 1000) {
			continue;
		} else {
			foundSize = size;
			break;
		}
	}
	
	let displayFileSize = (fileSize / foundSize.size).toFixed(2);
	displayFileSize = displayFileSize.toString().replace(/0+$/, '');
	
	if (displayFileSize.endsWith('.')) {
		displayFileSize = displayFileSize.slice(0, -1);
	}
	
	let fullName = path.parse(baseName).name;
	mediaSizeDisplay.innerHTML = displayFileSize + ' ' + foundSize.name;
	mediaSizeDisplay.setAttribute('title', `${fileSize} bytes`);
	mediaNameDisplay.innerHTML = fullName;
	mediaNameDisplay.setAttribute('title', fullName);
	mediaExtensionDisplay.innerHTML = path.extname(baseName).substring(1).toUpperCase();
	mediaPositionDisplay.innerHTML = `${currentMediaPos}/${maxMediaPos}`;
	ipcRenderer.send('windowTitle', `Media explorer - ${fullName}${extension}`);
	
	if (path.extname(baseName).toLowerCase() === '.mp4') {
		let video = document.createElement('video');
		video.src = mediaEl.src;
		video.currentTime = 3.5;
		video.addEventListener('canplay', () => {
			let canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			document.body.appendChild(canvas);
			let ctx = canvas.getContext('2d');
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			let dataUrl = canvas.toDataURL('image/png');
			video.remove();
			canvas.remove();
			mediaEl.setAttribute('poster', dataUrl);
		});
		document.body.appendChild(video);
	}
	
	displayMediaSizes();
	menu.style.opacity = '1';
}

function displayMediaSizes() {
	if (mediaSizesDisplayable == 1) {
		mediaSizesDisplayable = 0;
		
		if (mediaEl.tagName === 'IMG') {
			mediaWidthDisplay.innerHTML = `${mediaEl.naturalWidth}px`;
			mediaHeightDisplay.innerHTML = `${mediaEl.naturalHeight}px`;
		} else {
			mediaWidthDisplay.innerHTML = `${mediaEl.videoWidth}px`;
			mediaHeightDisplay.innerHTML = `${mediaEl.videoHeight}px`;
		}
	} else {
		mediaSizesDisplayable++;
	}
}

function recalcFiles(baseName) {
	let directoryFiles = fs.readdirSync(directory);
	
	directoryFiles = directoryFiles.filter((name) => {
		return !fs.statSync(path.join(directory, name)).isDirectory();
	});
	
	directoryFiles = directoryFiles.filter((name) => {
		return ['.mp4', '.mkv', '.png', '.jpg', '.mov', '.jpeg', '.webp', '.ico', '.svg', '.jfif', '.avi', '.wmv', '.webm', '.flv', '.gif', '.wav', '.bmp', '.tiff', '.raw', '.wav', '.mp3', '.ogg'].includes(path.extname(name).toLowerCase());
	});
	
	directoryFiles.sort((a, b) => {
		return a.localeCompare(b, undefined, {
			numeric: true,
			sensitivity: 'base'
		});
	});
	
	maxMediaPos = directoryFiles.length;
	
	for (let i = 0; i < directoryFiles.length; i++) {
		if (directoryFiles[i] === baseName) {
			currentMediaPos = i + 1;
			prevMediaPath = directoryFiles[i - 1] ? `${directory}/${directoryFiles[i - 1]}` : null;
			nextMediaPath = directoryFiles[i + 1] ? `${directory}/${directoryFiles[i + 1]}` : null;
			
			if (prevMediaPath === null) {
				previousButton.querySelector('svg').style.color = '#333333';
				previousButton.classList.add('disabled');
				previousButton.setAttribute('title', '');
				previousButton.style.cursor = 'not-allowed';
			} else {
				previousButton.querySelector('svg').style.color = '';
				previousButton.classList.remove('disabled');
				previousButton.setAttribute('title', 'Previous');
				previousButton.style.cursor = '';
			}
			
			if (nextMediaPath === null) {
				nextButton.querySelector('svg').style.color = '#333333';
				nextButton.classList.add('disabled');
				nextButton.setAttribute('title', '');
				nextButton.style.cursor = 'not-allowed';
			} else {
				nextButton.querySelector('svg').style.color = '';
				nextButton.classList.remove('disabled');
				nextButton.setAttribute('title', 'Next');
				nextButton.style.cursor = '';
			}
			
			break;
		}
	}
}