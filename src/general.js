'use strict';

function getExtension(string) {
	let extensions = ['jpg', 'png', 'webp', 'jpeg', 'tif', 'tiff', 'bmp', 'gif', 'svg', 'ico', 'mp4'];
	
	for (let extension of extensions) {
		if (string.includes(`.${extension}`)) {
			return extension;
		} else if (string.includes(`.${extension.toUpperCase()}`)) {
			return extension.toUpperCase();
		}
	}
}

function fade(el, dir, speed) {
	if (el.hasAttribute('fading')) {
		el.setAttribute('fading', 'false');
	} else {
		el.setAttribute('fading', 'true');
	}
	
	let currentDisplay = window.getComputedStyle(el, null).getPropertyValue('display');
	let currentOpacity = window.getComputedStyle(el, null).getPropertyValue('opacity');
	let originalDisplay = el.getAttribute('originaldisplay');
	let originalOpacity = el.getAttribute('originalopacity');
	let originalTransition = window.getComputedStyle(el, null).getPropertyValue('transition');
	let transitions = originalTransition.split(',');
	
	for (let i = 0; i < transitions.length; i++) {
		if (transitions[i].toLowerCase().indexOf('opacity ') > -1) {
			if (transitions[i].toLowerCase().trim().indexOf('opacity ') > 0) {
				continue;
			} else {
				transitions.splice(i, 1);
				i--;
			}
		}
	}
	
	if ((dir === 1) && ((currentOpacity === originalOpacity) && (currentDisplay === originalDisplay) && (originalDisplay != 'none'))) {
		return;
	}
	
	if ((dir === 1) && (currentOpacity === 1)) {
		el.style.opacity = '0';
	} else if ((dir === 0) && (currentOpacity === 0)) {
		el.style.opacity = '1';
	}
	
	let opacitylessTransitions = transitions.join(',');
	el.style.transition = `${opacitylessTransitions}, opacity ${speed / 1000}s`;
	
	if (dir === 0) {
		if (currentDisplay === 'none') {
			return;
		}
		
		setTimeout(() => {
			el.style.opacity = 0;
			
			setTimeout(() => {
				if (el.getAttribute('fading') === 'false') {
					el.setAttribute('fading', 'true');
					return;
				}
				
				el.style.display = 'none';
				el.style.transition = opacitylessTransitions;
				el.removeAttribute('fading');
			}, speed);
		}, 10);
	} else {
		el.style.display = originalDisplay;
		
		setTimeout(() => {
			el.style.opacity = originalOpacity;
			
			setTimeout(() => {
				if (el.getAttribute('fading') === 'false') {
					el.setAttribute('fading', 'true');
					return;
				}
				
				el.style.transition = opacitylessTransitions;
				el.removeAttribute('fading');
			}, speed);
		}, 10);
	}
}

function htmlEntityDecode(input) {
	let parser = new DOMParser().parseFromString(input, "text/html");
	return parser.documentElement.textContent;
}

function imageExists(src) {
	return new Promise((resolve, reject) => {
		let image = new Image();
		
		listener.add(image, 'load', () => {
			resolve(true);
		});
		
		listener.add(image, 'error', () => {
			resolve(false);
		});
		
		image.src = src;
		
		if (image.complete) {
			resolve(true);
		}
	});
}

const listener = {
	functions: {},
	
	add(arg1, arg2, arg3, arg4) {
		let name = false, elements, events, callback, id;
		
		if ((typeof arg1 === 'object') || ((typeof arg1 === 'string') && (['#', '.'].includes(arg1.charAt(0))))) {
			elements = arg1;
			events = arg2;
			callback = arg3;
		} else {
			name = arg1;
			elements = arg2;
			events = arg3;
			callback = arg4;
		}
		
		if ((elements != window) && ((Array.isArray(elements) && (elements.length === 0)) || (elements.length === 0) || (elements === undefined))) {
			return false;
		}
		
		if (typeof elements === 'string') {
			elements = document.querySelectorAll(elements);
		} else if ((elements.tagName === undefined) || ((elements.tagName != undefined) && (elements.tagName != 'SELECT'))) {
			if ((elements.length === undefined) || (elements.length === 0) || (elements=== window)) {
				elements = [elements];
			}
		}
		
		if (!Array.isArray(events)) {
			events = [events];
		}
		
		if (listener.functions[name] !== undefined) {
			console.error('Listener already defined with this name');
			return false;
		}
		
		if (name === false) {
			do {
				id = random.id(16, true);
			} while (listener.functions[id] !== undefined);
			
			name = id;
		}
		
		listener.functions[name] = {
			elements: elements,
			function: callback,
			events: events
		};
		
		if ((elements.tagName != undefined) && (elements.tagName === 'SELECT')) {
			for (let eventChild of events) {
				elements.addEventListener(eventChild, listener.functions[name].function);
			}
		} else {
			for (let element of elements) {
				for (let eventChild of events) {
					element.addEventListener(eventChild, listener.functions[name].function);
				}
			}
		}
	},
	
	remove(name) {
		if (listener.functions[name] === undefined) {
			console.error('Listener with this name does not exist');
			return false;
		}
		
		for (let i = 0; i < listener.functions[name].elements.length; i++) {
			for (let eventChild of listener.functions[name].events) {
				listener.functions[name].elements[i].removeEventListener(eventChild, listener.functions[name].function);
			}
		}
		
		delete listener.functions[name];
	}
};

function autoTextarea(textarea) {
	let height = str.height(textarea.value, {
		width: getStyle(textarea, 'width'),
		lineHeight: getStyle(textarea, 'line-height'),
		fontSize: getStyle(textarea, 'font-size'),
		letterSpacing: getStyle(textarea, 'letter-spacing'),
		fontFamily: getStyle(textarea, 'font-family'),
		fontStyle: getStyle(textarea, 'font-style'),
		fontWeight: getStyle(textarea, 'font-weight'),
		paddingLeft: getStyle(textarea, 'padding-left'),
		paddingRight: getStyle(textarea, 'padding-right'),
		border: getStyle(textarea, 'border'),
		boxSizing: getStyle(textarea, 'box-sizing'),
		borderRadius: getStyle(textarea, 'borderRadius'),
		minWidth: getStyle(textarea, 'min-width'),
		maxWidth: getStyle(textarea, 'max-width'),
		minHeight: getStyle(textarea, 'min-height'),
		maxHeight: getStyle(textarea, 'max-height')
	});
	textarea.style.height = height + 'px';
}

function rgbToHex(rgb) {
	let content = rgb.split('(')[1].split(')')[0].split(',');
	return '#' + content.map((x) => {
		x = parseInt(x).toString(16);
		return (x.length === 1) ? `0${x}` : x;
	}).join('');
}

function hexToLightness(value) {
	let r = 0;
	let g = 0;
	let b = 0;
	
	if (value.length === 4) {
		r = "0x" + value[1] + value[1];
		g = "0x" + value[2] + value[2];
		b = "0x" + value[3] + value[3];
	} else if (value.length === 7) {
		r = "0x" + value[1] + value[2];
		g = "0x" + value[3] + value[4];
		b = "0x" + value[5] + value[6];
	}
	
	r /= 255;
	g /= 255;
	b /= 255;
	let cmin = Math.min(r,g,b);
	let cmax = Math.max(r,g,b);
	let lightness = 0;
	lightness = (cmax + cmin) / 2;
	lightness = +(lightness * 100).toFixed(1);
	return lightness;
}

function getRotation(element) {
	let computedStyle = window.getComputedStyle(element, null);
	let transform = computedStyle.getPropertyValue('-webkit-transform') || computedStyle.getPropertyValue('-moz-transform') || computedStyle.getPropertyValue('-ms-transform') || computedStyle.getPropertyValue('-o-transform') || computedStyle.getPropertyValue('transform');
	
	if (transform === 'none') {
		return 0;
	}
	
	let values = transform.split('(')[1].split(')')[0].split(',');
	let radians = Math.atan2(values[1], values[0]);
	
	if (radians < 0) {
		radians += (2 * Math.PI);
	}
	
	return Math.round(radians * (180 / Math.PI));
}

const str = {
	removePos(str, pos) {
		return str.slice(0, pos) + str.slice(pos + 1);
	},
	
	removeFirst(str, amount) {
		if (amount === undefined) {
			amount = 1;
		}
		
		return str.slice(amount);
	},
	
	removeLast(str, amount) {
		if (amount === undefined) {
			amount = 1;
		}
		
		return str.slice(0, -amount);
	},
	
	copy(string) {
		let textarea = document.createElement('textarea');
		textarea.value = string;
		let style = {
			opacity: '0',
			width: '0',
			height: '0',
			position: 'absolute',
			top: '-999999px',
			left: '-999999px',
			zIndex: '-999999'
		};
		str.setStyle(textarea, style);
		textarea.setAttribute('readonly', '');
		document.body.appendChild(textarea);
		textarea.select();
		document.execCommand('copy');
		document.body.removeChild(textarea);
	},
	
	height(text, style) {
		let div = document.createElement('div');
		div.innerHTML = text;
		let staticStyle = {
			opacity: '0',
			height: 'auto',
			position: 'absolute',
			top: '-999999px',
			left: '-999999px',
			zIndex: '-999999',
			wordWrap: 'break-word'
		};
		
		str.setStyle(div, {...style, ...staticStyle});
		document.body.appendChild(div);
		let height = div.clientHeight;
		document.body.removeChild(div);
		return height;
	},
	
	setStyle(element, object) {
		for (let property in object) {
			element.style[property] = object[property];
		}
	}
};

const calc = {
	percent(percent, number) {
		return (number / 100) * percent;
	},
	
	whatPercent(complete, part) {
		return (part / complete) * 100;
	}
};

function cloneVar(variable) {
	return JSON.parse(JSON.stringify(variable));
}

function formatNumber(number) {
	if (number.toString().length <= 3) {
		return number.toString();
	}
	
	number = number.toString().split('');
	let newNumber = '';
	let finishNumber = false;
	let checkpoint = 0;
	
	for (let i = (number.length - 1); i > -1; i--) {
		if (finishNumber || (number[i] === ',')) {
			finishNumber = true;
			newNumber += number[i];
			continue;
		}
		
		newNumber += number[i];
		checkpoint++;
		
		if (checkpoint === 3) {
			newNumber += '.';
			checkpoint = 0;
		}
	}
	
	newNumber = newNumber.split('');
	newNumber = newNumber.reverse().join('');
	
	return newNumber;
}

function capitalize(input) {
	let result;
	
	if (typeof input === 'string') {
		result = input.charAt(0).toUpperCase() + input.slice(1)
	} else if (typeof input === 'object') {
		result = [];
		
		for (let value of input) {
			result.push(value.charAt(0).toUpperCase() + value.slice(1));
		}
	}
	
	return result;
}

function getStyle(element, propertyValue) {
	return window.getComputedStyle(element, null).getPropertyValue(propertyValue);
}

function elParent(el, selector) {
	if (typeof selector === 'object') {
      while ((el = el.parentElement) && !(el === selector));
      return el || false;
	} else if ((typeof selector === 'string') && (selector.charAt(0) === '.')) {
      selector = selector.substr(1);
      while ((el = el.parentElement) && (!el.classList.contains(selector)));
      return el || false;
   } else if ((typeof selector === 'string') && (selector.charAt(0) === '#')) {
      selector = selector.substr(1);
      while ((el = el.parentElement) && (el.getAttribute('id') != selector));
      return el || false;
   } else {
		while ((el = el.parentElement) && (el.tagName.toLowerCase() != selector));
      return el || false;
	}
}

function isNumeric(input) {
	return !isNaN(input);
}

function strToEl(string) {
   let div = document.createElement('div');
   div.innerHTML = string.trim();
   return div.firstChild;
}

function elToStr(element) {
	let div = document.createElement('div');
	div.appendChild(element);
	return div.innerHTML;
}

const random = {
	int(min, max) {
		return Math.floor(Math.random() * ((max - min) + 1)) + min;
	},
	
	float(min, max, decimals, keepBelow) {
		if (decimals === undefined) {
			decimals = 2;
		}
		
		if (keepBelow === undefined) {
			keepBelow = max;
		}
		
		let randomFloat;
		
		do {
			randomFloat = (Math.random() * (max - min)) + min;
		} while (randomFloat > keepBelow);
		
		return randomFloat.toFixed(decimals);
	},
	
	id(length, characters) {
		if (characters === true) {
			characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		} else if (!characters) {
			characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-?+$#@!%&';
		}
		
		characters = characters.split('');
		let string = '';
		let indexes, values = [];
		let loopAmount = random.int(characters.length, (characters.length * 2));

		for (let i = 0; i < loopAmount; i++) {
			indexes = [
				random.int(0, (characters.length - 1)),
				random.int(0, (characters.length - 1))
			];
			
			values = [
				characters[indexes[0]],
				characters[indexes[1]]
			];
			
			characters[indexes[0]] = values[1];
			characters[indexes[1]] = values[0];
		}
		
		for (let i = 0; i < length; i++) {
			string += characters[Math.floor(Math.random() * characters.length)];
		}

		return string;
	}
};

function ajaxNode(data) {
	if (data.data === undefined) {
		data.data = {};
	}
	
	let page = data.target.split('.');
	let pageFunction = page.pop();
	page = page.join('.');
	
	if (global.activeAjaxSockets.indexOf(data.target) > -1) {
		note.add(note.warning, 'Please wait while previous process is finished.');
		return;
	} else {
		global.activeAjaxSockets.push(data.target);
		socket.on(data.target, (response) => {
			socket.off(data.target);
			global.activeAjaxSockets = removeFromArray(global.activeAjaxSockets, data.target);
			
			if (data.complete != undefined) {
				data.complete(response);
			}
		});
	}
	
	data.data.function = pageFunction;
	socket.emit(page, data.data);
}

function ajax(data) {
	let formData = new FormData();
	let loopCount = 0;
	let xhttp;
	formData.append('XMLHTTP', true);
	
	if (!data.target) {
		console.error('AJAX: No target directory selected');
		return false;
	}
	
	if (!data.get) {
	   for (let variable in data.data) {
	      if (data.data.hasOwnProperty(variable)) {
	         if (data.data[variable] instanceof FormData) {
	            for (let formVar of data.data[variable].entries()) {
	               formData.append(formVar[0], formVar[1]);
	            }
	         } else if (Array.isArray(data.data[variable]) || (typeof data.data[variable] === 'object')) {
					formData.append(variable, JSON.stringify(data.data[variable]));
				} else {
	            formData.append(variable, data.data[variable]);
	         }
	      } else {
	         console.error('AJAX: Data is corrupt or undefined');
	         return false;
	      }
	      
	      loopCount++;
	   }
	   
	   if (loopCount === 0) {
	      console.error('AJAX: Data is undefined');
	      return false;
	   }
	}
	
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	} else {
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xhttp.onreadystatechange = function() {
		if ((xhttp.readyState === 4) && (xhttp.status === 200) && data.complete) {
			if (data.target.includes('.html')) {
				data.complete(xhttp.responseText);
			} else {
				data.complete(JSON.parse(xhttp.responseText));
			}
		}
	}
	
	if (!data.get) {
		xhttp.open('POST', data.target, true);
		xhttp.send(formData);
	} else {
		xhttp.open('GET', data.target, true);
		xhttp.send();
	}
}

function removeFromArray(array, values, all) {
	if (!Array.isArray(values)) {
		values = [values];
	}
	
	if (all === undefined) {
		all = true;
	}
	
	array = array.filter((value) => {
		if (values.indexOf(value) > -1) {
			if (!all) {
				values.splice(values.indexOf(value), 1);
			}
			
			return false;
		}
		
		return true;
	});
	
	return array;
}

function calcAge(birthDate) {
	if (typeof birthDate === 'string') {
		birthDate = new Date(birthDate);
	}
	
	let msDiff = Date.now() - birthDate.getTime();
	let ageDate = new Date(msDiff);
	return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const date = {
	getString(format) {
		let dateObj = new Date();
		let year = dateObj.getFullYear().toString();
		let month = (dateObj.getMonth() + 1).toString();
		let day = dateObj.getDate().toString();
		let hour = dateObj.getHours().toString();
		let minute = dateObj.getMinutes().toString();
		let second = dateObj.getSeconds().toString();
		let millisecond = dateObj.getMilliseconds().toString();
		
		if (month.length === 1) {
			month = `0${month}`;
		}
		
		if (day.length === 1) {
			day = `0${day}`;
		}
		
		if (hour.length === 1) {
			hour = `0${hour}`;
		}
		
		if (minute.length === 1) {
			minute = `0${minute}`;
		}
		
		if (second.length === 1) {
			second = `0${second}`;
		}
		
		if (format) {
			let formattedDate = '';
			
			for (let char of format) {
				switch (char) {
					case 'd':
						formattedDate += day;
						break;
					case 'm':
						formattedDate += month;
						break;
					case 'y':
						formattedDate += year;
						break;
					case 'h':
						formattedDate += hour;
						break;
					case 'i':
						formattedDate += minute;
						break;
					case 's':
						formattedDate += second;
						break;
					case 'v':
						formattedDate += millisecond;
						break;
					default:
						formattedDate += char;
				}
			}
			
			return formattedDate;
		} else {
			return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
		}
	},
	
	calc(current) {
		if (!current) {
			return new Date();
		}
		
		if (!current.date) {
			let newDate = new Date();
			current.date = {
				millisecond: date.getChunk('millisecond'),
				second: date.getChunk('second'),
				minute: date.getChunk('minute'),
				hour: date.getChunk('hour'),
				day: date.getChunk('day'),
				month: date.getChunk('month'),
				year: date.getChunk('year')
			};
		} else {
			current.date = date.parse(current.date, true);
		}
		
		for (let key in current) {
			if (key === 'date') {
				continue;
			}
			
			current.date[key] += current[key];
		}
		
		return new Date(current.date.year, current.date.month - 1, current.date.day, current.date.hour, current.date.minute, current.date.second, current.date.millisecond);
	},
	
	get(newDate, resultString) {
		let selector;
		
		if (!(newDate instanceof Date) && (typeof newDate === 'object')) {
			return new Date(newDate.year || false, newDate.month - 1 || false, newDate.day || false, newDate.hour || false, newDate.minute || false, newDate.second || false, newDate.millisecond || false);
		} else if (newDate === undefined) {
			return new Date();
		} else if (!(newDate instanceof Date)) {
			if (newDate) {
				selector = newDate;
			}
			
			newDate = new Date();
		}
		
		let selectors = ['v', 's', 'i', 'h', 'd', 'm', 'y', 'millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];
		let replace, chunk;
		
		for (let selector of selectors) {
			replace = new RegExp(selector, 'g');
			chunk = date.getChunk(newDate, selector);
			
			if ((selector != 'y') && (selector != 'year')) {
				chunk = `0${chunk}`.slice(-2);
			}
			
			resultString = resultString.replace(replace, chunk);
		}
		
		return resultString;
	},
	
	diff(date1, date2) {
		if (!date1 || !(date1 instanceof Date)) {
			date1 = date.parse(date1);
		}
		
		if (!date2 || !(date2 instanceof Date)) {
			date2 = date.parse(date2);
		}
		
		let recent = date1 > date2 ? date1 : date2;
		let old = date1 < date2 ? date1 : date2;
		let ms = recent.getTime() - old.getTime();
		
		let newDate = {
			millisecond: ms,
			second: Math.floor(ms / 1000),
			minute: Math.floor(ms / (1000 * 60)),
			hour: Math.floor(ms / (1000 * 60 * 60)),
			day: Math.floor(ms / (1000 * 60 * 60 * 24)),
			month: Math.floor(ms / (1000 * 60 * 60 * 24 * 30)),
			year: Math.floor(ms / (1000 * 60 * 60 * 24 * 30 * 12))
		};
		
		return newDate;
	},
	
	parse(dateObject, object) {
		if (!dateObject) {
			return new Date();
		}
		
		let properties = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];
		
		for (let i = 0; i < properties.length; i++) {
			if (!dateObject.hasOwnProperty(properties[i])) {
				dateObject[properties[i]] = false;
			}
		}
		
		if (object) {
			return dateObject;
		} else {
			return new Date(dateObject.year, dateObject.month - 1, dateObject.day, dateObject.hour, dateObject.minute, dateObject.second, dateObject.millisecond);
		}
	},
	
	getChunk(newDate, input) {
		if (!(newDate instanceof Date)) {
			input = newDate;
			newDate = new Date();
		}
		
		switch (input) {
			case 'v':
			case 'millisecond':
				return newDate.getMilliseconds();
				break;
			case 's':
			case 'second':
				return newDate.getSeconds();
				break;
			case 'i':
			case 'minute':
				return newDate.getMinutes();
				break;
			case 'h':
			case 'hour':
				return newDate.getHours();
				break;
			case 'd':
			case 'day':
				return newDate.getDate();
				break;
			case 'm':
			case 'month':
				return newDate.getMonth() + 1;
				break;
			case 'y':
			case 'year':
				return newDate.getFullYear();
				break;
			default:
				console.error('Date: Invalid chunk.');
				return false;
		}
	}
};

function getDominantColor(imgEl) {
	let blockSize = 5;
	let canvas = document.createElement('canvas');
	let context = canvas.getContext('2d');
	let data, width, height, length;
	let i = -4;
	let count = 0;
	let rgb = {
		r:0,
		g:0,
		b:0
	};
	height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
   width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
   context.drawImage(imgEl, 0, 0);
   data = context.getImageData(0, 0, width, height);
	length = data.data.length;
	
	while ((i += (blockSize * 4)) < length) {
		count++;
		rgb.r += data.data[i];
		rgb.g += data.data[i+1];
		rgb.b += data.data[i+2];
	}
	
	rgb.r = Math.floor(rgb.r / count);
	rgb.g = Math.floor(rgb.g / count);
	rgb.b = Math.floor(rgb.b / count);
	return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

const ratio = {
   getWidth(width, height, newHeight) {
      return (width / height) * newHeight;
   },
   
   getHeight(width, height, newWidth) {
      return (height / width) * newWidth;
   },
   
   getWidthByRatio(aspectRatio, height) {
      return (height / aspectRatio.split(':')[1]) * Number(aspectRatio.split(':')[0]);
   },
   
   getHeightByRatio(aspectRatio, width) {
      return (width / aspectRatio.split(':')[0]) * Number(aspectRatio.split(':')[1]);
   },
   
   get(width, height) {
      let gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      let ratio = gcd(width, height);
      return `${width / ratio}:${height / ratio}`;
   }
};