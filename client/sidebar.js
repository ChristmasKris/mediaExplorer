'use strict';

import { listener } from './utils.js';

const electron = window.electron;

let state = false;
let sharpPixelsEnabled = false;
let invertBackgroundEnabled = false;
let flipEnabled = false;
let currentMediaEl = null;
let currentDirectory = null;
let currentFile = null;

const ui = {
	sidebar: document.querySelector('.sidebar'),
	mediaDisplay: document.querySelector('.mediaDisplay'),
	page: document.querySelector('.page'),
	sidebarFolder: document.querySelector('.sidebarFolder'),
	sidebarIndex: document.querySelector('.sidebarIndex'),
	sidebarWidth: document.querySelector('.sidebarWidth'),
	sidebarHeight: document.querySelector('.sidebarHeight'),
	sidebarFileSize: document.querySelector('.sidebarFileSize'),
	sidebarExactFileSize: document.querySelector('.sidebarExactFileSize'),
	sidebarName: document.querySelector('.sidebarName'),
	sidebarExtension: document.querySelector('.sidebarExtension'),
	sidebarWidthItem: document.querySelector('.sidebarWidthItem'),
	sidebarHeightItem: document.querySelector('.sidebarHeightItem'),
	showButton: document.querySelector('.showInExplorer'),
	openWithButton: document.querySelector('.openWith'),
	resetButton: document.querySelector('.resetImage'),
	sharpPixelsCheckbox: document.querySelector('.sharpPixelsCheckbox'),
	sharpPixelsInput: document.querySelector('.sharpPixelsCheckbox input'),
	invertBackgroundCheckbox: document.querySelector('.invertBackgroundCheckbox'),
	invertBackgroundInput: document.querySelector('.invertBackgroundCheckbox input'),
	flipCheckbox: document.querySelector('.flipCheckbox'),
	flipInput: document.querySelector('.flipCheckbox input')
};

const fileSizes = [
	{ name: 'B', size: 1 },
	{ name: 'KB', size: 1000 },
	{ name: 'MB', size: 1000000 },
	{ name: 'GB', size: 1000000000 }
];

function formatNumberWithDots(num) {
	const parts = num.toString().split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	return parts.join('.');
}

function toggle() {
	window.isTogglingSidebar = true;
	ui.mediaDisplay.style.transition = 'width 0.15s';
	
	if (state === true) {
		ui.mediaDisplay.style.width = '100vw';
	} else {
		ui.mediaDisplay.style.width = 'calc(100vw - 400px)';
	}
	
	state = !state;
	
	setTimeout(() => {
		ui.mediaDisplay.style.transition = '';
		window.isTogglingSidebar = false;
	}, 200);
}

export function setLocation(directory, file) {
	currentDirectory = directory;
	currentFile = file;
}

export async function updateMediaInfo(baseName, extension, currentMediaPos, maxMediaPos, mediaEl) {
	const fullPath = `${currentDirectory}/${baseName}`;
	const pathInfo = await electron.invoke('getPathInfo', fullPath);
	const fileSize = await electron.invoke('getFileSize', fullPath);
	
	if (!pathInfo) {
		return;
	}
	
	const normalizedDir = currentDirectory.replace(/\\/g, '/');
	const folderName = normalizedDir.split('/').pop() || normalizedDir;
	let foundSize = null;
	
	for (let size of fileSizes) {
		if ((fileSize / size.size) > 1000) {
			continue;
		}
		
		foundSize = size;
		break;
	}
	
	let displayFileSize = (fileSize / foundSize.size).toFixed(2);
	displayFileSize = parseFloat(displayFileSize).toString();
	let fullName = pathInfo.name;
	ui.sidebarFolder.textContent = folderName;
	ui.sidebarFolder.setAttribute('title', currentDirectory);
	ui.sidebarFileSize.textContent = formatNumberWithDots(displayFileSize) + ' ' + foundSize.name;
	ui.sidebarExactFileSize.textContent = formatNumberWithDots(fileSize) + ' bytes';
	ui.sidebarName.textContent = fullName;
	ui.sidebarName.setAttribute('title', fullName);
	ui.sidebarExtension.textContent = pathInfo.ext.substring(1).toUpperCase();
	ui.sidebarIndex.textContent = `${formatNumberWithDots(currentMediaPos)} / ${formatNumberWithDots(maxMediaPos)}`;
	electron.send('windowTitle', `Media explorer - ${fullName}${extension}`);
	
	if (pathInfo.ext.toLowerCase() === '.mp4') {
		let video = document.createElement('video');
		video.src = mediaEl.src;
		video.preload = 'metadata';
		
		listener.add(video, 'loadedmetadata', () => {
			video.currentTime = Math.min(3.5, video.duration / 2);
		});
		
		listener.add(video, 'seeked', () => {
			let canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			let ctx = canvas.getContext('2d');
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			let dataUrl = canvas.toDataURL('image/png');
			video.remove();
			canvas.remove();
			mediaEl.setAttribute('poster', dataUrl);
			mediaEl.style.opacity = '1';
		});
		
		document.body.appendChild(video);
		video.style.display = 'none';
	}
	
	updateMediaSizes(mediaEl);
}

export function updateMediaSizes(mediaEl) {
	currentMediaEl = mediaEl;
	
	if (mediaEl.tagName === 'IMG') {
		ui.sidebarWidth.textContent = `${formatNumberWithDots(mediaEl.naturalWidth)} px`;
		ui.sidebarHeight.textContent = `${formatNumberWithDots(mediaEl.naturalHeight)} px`;
		ui.sidebarWidthItem.style.display = '';
		ui.sidebarHeightItem.style.display = '';
		ui.sharpPixelsCheckbox.style.display = 'flex';
		ui.invertBackgroundCheckbox.style.display = 'flex';
		ui.flipCheckbox.style.display = 'flex';
		ui.openWithButton.style.display = 'flex';
		ui.resetButton.style.display = 'flex';
		ui.sharpPixelsInput.checked = false;
		ui.invertBackgroundInput.checked = false;
		ui.flipInput.checked = false;
		sharpPixelsEnabled = false;
		invertBackgroundEnabled = false;
		flipEnabled = false;
		ui.page.style.backgroundColor = '#000000';
		mediaEl.style.imageRendering = '';
		mediaEl.style.transform = mediaEl.style.transform.replace(/scaleX\([^)]*\)\s*/g, '');
	} else if (mediaEl.tagName === 'VIDEO') {
		ui.sidebarWidth.textContent = `${formatNumberWithDots(mediaEl.videoWidth)} px`;
		ui.sidebarHeight.textContent = `${formatNumberWithDots(mediaEl.videoHeight)} px`;
		ui.sidebarWidthItem.style.display = '';
		ui.sidebarHeightItem.style.display = '';
		ui.sharpPixelsCheckbox.style.display = 'none';
		ui.invertBackgroundCheckbox.style.display = 'flex';
		ui.flipCheckbox.style.display = 'flex';
		ui.openWithButton.style.display = 'flex';
		ui.resetButton.style.display = 'none';
		ui.invertBackgroundInput.checked = false;
		ui.flipInput.checked = false;
		invertBackgroundEnabled = false;
		flipEnabled = false;
		ui.page.style.backgroundColor = '#000000';
		mediaEl.style.transform = 'scaleX(1)';
	} else if (mediaEl.tagName === 'AUDIO') {
		ui.sidebarWidthItem.style.display = 'none';
		ui.sidebarHeightItem.style.display = 'none';
		ui.sharpPixelsCheckbox.style.display = 'none';
		ui.invertBackgroundCheckbox.style.display = 'none';
		ui.flipCheckbox.style.display = 'none';
		ui.openWithButton.style.display = 'flex';
		ui.resetButton.style.display = 'none';
		sharpPixelsEnabled = false;
		invertBackgroundEnabled = false;
		flipEnabled = false;
		ui.sharpPixelsInput.checked = false;
		ui.invertBackgroundInput.checked = false;
		ui.flipInput.checked = false;
		ui.page.style.backgroundColor = '#000000';
	} else {
		ui.sidebarWidthItem.style.display = 'none';
		ui.sidebarHeightItem.style.display = 'none';
		ui.sharpPixelsCheckbox.style.display = 'none';
		ui.invertBackgroundCheckbox.style.display = 'none';
		ui.flipCheckbox.style.display = 'none';
		ui.openWithButton.style.display = 'none';
		ui.resetButton.style.display = 'none';
		sharpPixelsEnabled = false;
		invertBackgroundEnabled = false;
		flipEnabled = false;
		ui.sharpPixelsInput.checked = false;
		ui.invertBackgroundInput.checked = false;
		ui.flipInput.checked = false;
		ui.page.style.backgroundColor = '#000000';
	}
}

export function resetSidebarToggles() {
	sharpPixelsEnabled = false;
	invertBackgroundEnabled = false;
	flipEnabled = false;
	ui.sharpPixelsInput.checked = false;
	ui.invertBackgroundInput.checked = false;
	ui.flipInput.checked = false;
	ui.page.style.backgroundColor = '#000000';
	if (currentMediaEl) {
		currentMediaEl.style.imageRendering = '';
		currentMediaEl.style.transform = currentMediaEl.style.transform.replace(/scaleX\([^)]*\)\s*/g, '');
	}
}

(() => {
	listener.add(window, 'keydown', (e) => {
		if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
			toggle();
		}
	});
	
	listener.add(ui.showButton, 'click', () => {
		if (!currentDirectory || !currentFile) {
			return;
		}
		electron.invoke('showInFolder', `${currentDirectory}/${currentFile}`);
	});
	
	listener.add(ui.openWithButton, 'click', () => {
		if (!currentDirectory || !currentFile) {
			return;
		}
		electron.invoke('openWith', `${currentDirectory}/${currentFile}`);
	});
	
	listener.add(ui.resetButton, 'click', () => {
		if (typeof window.resetImage === 'function') {
			window.resetImage();
		}
		
		sharpPixelsEnabled = false;
		invertBackgroundEnabled = false;
		flipEnabled = false;
		ui.sharpPixelsInput.checked = false;
		ui.invertBackgroundInput.checked = false;
		ui.flipInput.checked = false;
		ui.page.style.backgroundColor = '#000000';
		if (currentMediaEl) {
			currentMediaEl.style.imageRendering = '';
			currentMediaEl.style.transform = currentMediaEl.style.transform.replace(/scaleX\([^)]*\)\s*/g, '');
		}
	});
	
	listener.add(ui.sharpPixelsCheckbox, 'click', () => {
		sharpPixelsEnabled = !sharpPixelsEnabled;
		ui.sharpPixelsInput.checked = sharpPixelsEnabled;
		
		if (currentMediaEl && currentMediaEl.tagName === 'IMG') {
			if (sharpPixelsEnabled) {
				currentMediaEl.style.imageRendering = 'pixelated';
			} else {
				currentMediaEl.style.imageRendering = '';
			}
		}
	});
	
	listener.add(ui.invertBackgroundCheckbox, 'click', () => {
		invertBackgroundEnabled = !invertBackgroundEnabled;
		ui.invertBackgroundInput.checked = invertBackgroundEnabled;
		
		if (invertBackgroundEnabled) {
			ui.page.style.backgroundColor = '#ffffff';
		} else {
			ui.page.style.backgroundColor = '#000000';
		}
	});
	
	listener.add(ui.flipCheckbox, 'click', () => {
		flipEnabled = !flipEnabled;
		ui.flipInput.checked = flipEnabled;
		
		if (currentMediaEl && (currentMediaEl.tagName === 'IMG' || currentMediaEl.tagName === 'VIDEO')) {
			if (flipEnabled) {
				if (currentMediaEl.tagName === 'IMG') {
					const currentTransform = currentMediaEl.style.transform || '';
					if (!currentTransform.includes('scaleX')) {
						currentMediaEl.style.transform = currentTransform + ' scaleX(-1)';
					}
				} else {
					currentMediaEl.style.transform = 'scaleX(-1)';
				}
			} else {
				if (currentMediaEl.tagName === 'IMG') {
					currentMediaEl.style.transform = currentMediaEl.style.transform.replace(/scaleX\([^)]*\)\s*/g, '');
				} else {
					currentMediaEl.style.transform = 'scaleX(1)';
				}
			}
		}
	});
})();