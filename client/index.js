'use strict';

const electron = window.electron;

import { setLocation, updateMediaInfo, updateMediaSizes, resetSidebarToggles } from './sidebar.js';
import { listener, strToEl, getStyle } from './utils.js';

let mediaDisplay = document.querySelector('.mediaDisplay');
let noMediaPlaceholder = document.querySelector('.noMediaPlaceholder');
let noMediaTitle = document.querySelector('.noMediaTitle');
let noMediaSubtitle = document.querySelector('.noMediaSubtitle');
let leftArrow = document.querySelector('.leftArrow');
let rightArrow = document.querySelector('.rightArrow');
let changingMedia = false;
let mediaEl = null;
let directory = null;
let currentFile = null;
let currentMediaPos = 1;
let maxMediaPos = 1;
let nextMediaPath = null;
let prevMediaPath = null;
let zoomScale = 1;
let mouseDown = false;
let mediaAtDefault = true;
const preloadCache = new Map();
let firstMediaInit = true;
let mediaPos = {
	x: null,
	y: null
};

electron.on('open', openFile);
const normalizePath = (value) => value.replace(/\\/g, '/');
const getBaseName = (value) => normalizePath(value).split('/').pop();

const getDirName = (value) => {
	const normalized = normalizePath(value);
	const lastSlash = normalized.lastIndexOf('/');
	return lastSlash >= 0 ? normalized.slice(0, lastSlash) : '';
};

const getExtName = (value) => {
	const base = getBaseName(value);
	const lastDot = base.lastIndexOf('.');
	return lastDot >= 0 ? base.slice(lastDot) : '';
};

const displayObserver = new ResizeObserver(() => {
	if (window.isTogglingSidebar) {
		if (zoomScale === 1 && mediaEl && mediaEl.tagName === 'IMG' && mediaAtDefault) {
			const targetLeft = (mediaDisplay.offsetWidth - mediaEl.offsetWidth) / 2;
			const targetTop = (mediaDisplay.offsetHeight - mediaEl.offsetHeight) / 2;
			mediaEl.style.top = `${targetTop}px`;
			mediaEl.style.left = `${targetLeft}px`;
		}
	} else {
		resetImageState();
	}
});

async function openFile(e, filePath) {
	let baseName = getBaseName(filePath);
	directory = getDirName(filePath);
	await displayMedia(baseName);
}

async function displayMedia(baseName) {
	if (changingMedia) {
		return;
	}
	
	if (!firstMediaInit) {
		changingMedia = true;
	}
	
	let extension = getExtName(baseName).toLowerCase();
	const supportedExtensions = [
		'.mp3', '.wav', '.ogg',
		'.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm',
		'.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff', '.ico', '.svg', '.jfif', '.raw'
	];

	if (!supportedExtensions.includes(extension)) {
		noMediaTitle.textContent = 'Unsupported file type';
		noMediaSubtitle.textContent = 'Open the app with an image, video or audio file';
		noMediaPlaceholder.classList.remove('hidden');
		return;
	}

	// Hide placeholder when media is opened
	noMediaTitle.textContent = 'Welcome';
	noMediaSubtitle.textContent = 'Open the app with an image, video or audio file';
	noMediaPlaceholder.classList.add('hidden');
	
	currentFile = baseName;
	await recalcFiles(baseName);
	setLocation(directory, currentFile);
	let displayBaseName = encodeURIComponent(baseName);
	
	if (['.mp3', '.wav', '.ogg'].includes(extension)) {
		mediaEl = strToEl(`<audio controls src="file://${directory}/${displayBaseName}"></audio>`);
	} else if(['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv'].includes(extension)) {
		mediaEl = strToEl(`<video src="file://${directory}/${displayBaseName}" controls preload="metadata"></video>`);
		if (extension === '.mp4') {
			mediaEl.style.opacity = '0';
		}
		listener.add(mediaEl, 'loadeddata', () => {
			updateMediaSizes(mediaEl);
			if (extension !== '.mp4') {
				mediaEl.style.opacity = '1';
			}
		});
	} else {
		mediaEl = strToEl(`<img src="file://${directory}/${displayBaseName}"/>`);
		mediaEl.style.opacity = '0';
		listener.add(mediaEl, 'load', (e) => {
			updateMediaSizes(mediaEl);
			e.currentTarget.style.transform = '';
			e.currentTarget.style.top = `${(mediaDisplay.offsetHeight - e.currentTarget.offsetHeight) / 2}px`;
			e.currentTarget.style.left = `${(mediaDisplay.offsetWidth - e.currentTarget.offsetWidth) / 2}px`;
			e.currentTarget.style.opacity = '1';
			mediaAtDefault = true;
		});
		
		listener.add(mediaEl, 'mousedown', (e) => {
			mediaEl.style.cursor = 'grabbing';
			mediaPos.x = parseInt(getStyle(e.currentTarget, 'left')) - e.clientX;
			mediaPos.y = parseInt(getStyle(e.currentTarget, 'top')) - e.clientY;
			mouseDown = true;
		});
	}
	
	let oldMedia = mediaDisplay.querySelector('img, audio, video');
	if (oldMedia) {
		oldMedia.remove();
	}
	
	if (!firstMediaInit) {
		zoomScale = 1;
	}
	
	mediaDisplay.appendChild(mediaEl);
	
	if (!firstMediaInit) {
		await updateMediaInfo(baseName, extension, currentMediaPos, maxMediaPos, mediaEl);
		changingMedia = false;
	} else {
		await updateMediaInfo(baseName, extension, currentMediaPos, maxMediaPos, mediaEl);
		firstMediaInit = false;
	}
}

async function recalcFiles(baseName) {
	let directoryFiles = await electron.invoke('getDirectoryFiles', directory);
	
	maxMediaPos = directoryFiles.length;
	
	for (let i = 0; i < directoryFiles.length; i++) {
		if (directoryFiles[i] === baseName) {
			currentMediaPos = i + 1;
			prevMediaPath = directoryFiles[i - 1] ? `${directory}/${directoryFiles[i - 1]}` : null;
			nextMediaPath = directoryFiles[i + 1] ? `${directory}/${directoryFiles[i + 1]}` : null;
			
			break;
		}
	}
	
	updateArrowVisibility();
	preloadNeighbors();
}

function updateArrowVisibility() {
	leftArrow.style.display = prevMediaPath === null ? 'none' : 'flex';
	rightArrow.style.display = nextMediaPath === null ? 'none' : 'flex';
}

function preloadNeighbors() {
	const keep = new Set([prevMediaPath, nextMediaPath]);
	for (const key of preloadCache.keys()) {
		if (!keep.has(key)) {
			preloadCache.delete(key);
		}
	}
	preloadMedia(prevMediaPath);
	preloadMedia(nextMediaPath);
}

function preloadMedia(filePath) {
	if (!filePath || preloadCache.has(filePath)) {
		return;
	}
	
	const baseName = getBaseName(filePath);
	const dirName = getDirName(filePath);
	const displayBaseName = encodeURIComponent(baseName);
	const url = `file://${dirName}/${displayBaseName}`;
	const extension = getExtName(baseName).toLowerCase();
	let el = null;

	if (['.png', '.jpg', '.jpeg', '.webp', '.ico', '.svg', '.jfif', '.gif', '.bmp', '.tiff', '.raw'].includes(extension)) {
		el = new Image();
		el.src = url;
	} else if (['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv', '.webm'].includes(extension)) {
		el = document.createElement('video');
		el.preload = 'auto';
		el.src = url;
		el.load();
	} else if (['.mp3', '.wav', '.ogg'].includes(extension)) {
		el = document.createElement('audio');
		el.preload = 'auto';
		el.src = url;
		el.load();
	}

	if (el) {
		preloadCache.set(filePath, el);
	}
}

function resetImageState() {
	if (!mediaEl || mediaEl.tagName !== 'IMG') {
		return;
	}
	
	zoomScale = 1;
	mediaEl.style.transform = '';
	mediaEl.style.imageRendering = '';
	mediaEl.style.top = `${(mediaDisplay.offsetHeight - mediaEl.offsetHeight) / 2}px`;
	mediaEl.style.left = `${(mediaDisplay.offsetWidth - mediaEl.offsetWidth) / 2}px`;
	mediaAtDefault = true;
	
	resetSidebarToggles();
}

window.resetImage = resetImageState;

(() => {
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
			
			let oldScale = zoomScale;
			
			if (zoomDir === 'in') {
				zoomScale = Number((Number(zoomScale) * 1.15).toFixed(2));
			} else {
				zoomScale = Number((Number(zoomScale) / 1.15).toFixed(2));
			}
			
			if (zoomScale < 0.5) {
				zoomScale = 0.5;
			}
			mediaAtDefault = false;
			
			let currentLeft = parseInt(getStyle(image, 'left')) || 0;
			let currentTop = parseInt(getStyle(image, 'top')) || 0;
			
			let imageCenterX = imgRect.left + imgRect.width / 2;
			let imageCenterY = imgRect.top + imgRect.height / 2;
			let offsetX = e.clientX - imageCenterX;
			let offsetY = e.clientY - imageCenterY;
			
			let scaleDelta = zoomScale / oldScale;
			
			let deltaX = offsetX * (scaleDelta - 1);
			let deltaY = offsetY * (scaleDelta - 1);
			
			const flipInput = document.querySelector('.flipCheckbox input');
			const flipActive = flipInput && flipInput.checked;
			image.style.transform = `${flipActive ? 'scaleX(-1) ' : ''}scale(${zoomScale})`;
			image.style.left = `${currentLeft - deltaX}px`;
			image.style.top = `${currentTop - deltaY}px`;
		}
	});
	
	listener.add(document, 'mousemove', (e) => {
		if (mouseDown) {
			let image = mediaDisplay.querySelector('img');
			let newLeft = mediaPos.x + e.clientX;
			let newTop = mediaPos.y + e.clientY;
			
			image.style.left = `${newLeft}px`;
			image.style.top = `${newTop}px`;
			
			let imgRect = image.getBoundingClientRect();
			let displayRect = mediaDisplay.getBoundingClientRect();
			
			let minVisible = 100;
			
			if (imgRect.right < displayRect.left + minVisible) {
				newLeft += (displayRect.left + minVisible - imgRect.right);
			} else if (imgRect.left > displayRect.right - minVisible) {
				newLeft -= (imgRect.left - (displayRect.right - minVisible));
			}
			
			if (imgRect.bottom < displayRect.top + minVisible) {
				newTop += (displayRect.top + minVisible - imgRect.bottom);
			} else if (imgRect.top > displayRect.bottom - minVisible) {
				newTop -= (imgRect.top - (displayRect.bottom - minVisible));
			}
			
			image.style.left = `${newLeft}px`;
			image.style.top = `${newTop}px`;
			mediaAtDefault = false;
		}
	});
	
	listener.add(document, 'mouseup', () => {
		if (mediaDisplay.querySelector('img')) {
			mediaDisplay.querySelector('img').style.cursor = '';
			mouseDown = false;
		}
	});
	
	listener.add(window, 'resize', () => {
		resetImageState();
	});
	
	displayObserver.observe(mediaDisplay);
	
	listener.add(leftArrow, 'click', () => {
		if (prevMediaPath === null) {
			return;
		}
		openFile(null, prevMediaPath, 'prev');
	});
	
	listener.add(rightArrow, 'click', () => {
		if (nextMediaPath === null) {
			return;
		}
		openFile(null, nextMediaPath, 'next');
	});
	
	listener.add(window, 'keydown', (e) => {
		if (e.key === 'ArrowLeft') {
			if (prevMediaPath !== null) {
				openFile(null, prevMediaPath, 'prev');
			}
		} else if (e.key === 'ArrowRight') {
			if (nextMediaPath !== null) {
				openFile(null, nextMediaPath, 'next');
			}
		}
	});
})();