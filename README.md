# Media Explorer: A Desktop App for Effortless Media Browsing

![alt text](./READMEimages/1.jpg "Media explorer window")

## What is Media Explorer?

**Media Explorer** is a desktop application built with Electron that allows users to quickly browse, view, and inspect images and videos on their PC. It supports a wide range of media formats and provides a smooth, distraction-free interface for navigating through folders of media files.

## Why I Built It

I created Media Explorer to solve a common problem: most default file explorers and media viewers are either too limited or too cluttered for quickly previewing large sets of images and videos. I wanted a tool that was:

- Fast and lightweight
- Able to handle both images and videos
- Easy to use with keyboard or mouse
- Minimalist, with just the essential info and controls

This project demonstrates my ability to design and implement a cross-platform desktop app from scratch, focusing on user experience and performance.

## Technologies and Tools Used

- **Electron** for building the cross-platform desktop app
- **JavaScript** (ES6+) for all application logic
- **Node.js** APIs for filesystem access
- **HTML5 & CSS3** for the UI
- **Custom utility libraries** (see `general.js`)
- **FontAwesome** for icons
- **Roboto** font for a modern look

## Key Features (with Real Code Examples)

### 1. Electron App Initialization

The app uses Electron’s APIs to create a custom window, maximize it, and load the main UI:

```js
// src/main.js
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
		icon: `${__dirname}/favicon.ico`,
		show: false,
    	webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
  	});
	mainWindow.removeMenu();
	mainWindow.loadFile(`${__dirname}/index.html`);
	// ...existing code...
}
```

### 2. Clean, Responsive UI

The interface is built with HTML and styled with CSS for a modern, dark-themed look:

```html
<!-- src/index.html -->
<div class="page">
	<div class="mediaDisplay"></div>
	<div class="menu">
		<div class="button previous" title="Previous">
			<i class="fa-regular fa-angle-left"></i>
		</div>
		<!-- ... file info and navigation ... -->
		<div class="button next" title="Next">
			<i class="fa-regular fa-angle-right"></i>
		</div>
	</div>
</div>
```

```css
/* src/index.css */
:root {
	--black: #000000;
	--white: #ffffff;
	--mainColor: #2a65e4;
	--mainColorDark: #1952cc;
	--shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
}
.page {
	width: 100vw;
	height: 100vh;
	background-color: var(--black);
}
.menu {
	background-color: #1a1a1a;
	border-radius: 5px;
	/* ...existing code... */
}
```

### 3. Media Navigation and Info Display

Navigate through media files, view details like size, dimensions, and file type, and open the file location in Explorer:

```js
// src/index.js
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
```

### 4. Image and Video Handling

The app supports both images and videos, displaying them with the correct HTML element and extracting metadata:

```js
// src/index.js
if(['.mp4', '.mkv', '.mov', '.avi', '.wmv', '.flv'].includes(path.extname(baseName).toLowerCase())) {
	mediaEl = strToEl(`<video src="file://${directory.replace(/\\/g, '/')}/${displayBaseName}" controls></video>`);
	listener.add(mediaEl, 'loadeddata', () => {
		displayMediaSizes();
	});
} else {
	mediaEl = strToEl(`<img src="file://${directory.replace(/\\/g, '/')}/${displayBaseName}"/>`);
	listener.add(mediaEl, 'load', (e) => {
		displayMediaSizes();
		// ...center image...
	});
}
```

### 5. Smooth Transitions and User Experience

Media transitions are animated for a polished feel, and the UI updates dynamically as you browse:

```js
// src/index.js
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
```

## What I Learned

Building Media Explorer taught me a lot about:

- **Desktop app development** with Electron and Node.js
- Handling **filesystem operations** securely and efficiently
- Creating a **responsive, modern UI** with HTML and CSS
- Managing **media playback and image rendering** in the browser context
- Designing for **usability and performance** in real-world scenarios

This project is a great example of my ability to take an idea from concept to a polished, user-friendly application, using modern JavaScript and desktop technologies.

If you’d like to know more about the project, feel free to reach out!
