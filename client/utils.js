'use strict';

const LOGERRORS = true;
const LOGWARNINGS = false;

function logError(message, debug) {
	if (!LOGERRORS) {
		return;
	}
	
	if (debug) {
		console.error(message, debug);
	} else {
		console.error(message);
	}
}

function logWarning(message, debug) {
	if (!LOGWARNINGS) {
		return;
	}
	
	if (debug) {
		console.warn(message, debug);
	} else {
		console.warn(message);
	}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const listener = {
	functions: {},
	
	/**
	* Add event listeners to element(s).
	* @param {string|Element|Window|Document|Array<Element>|NodeList|HTMLCollection} arg1 The optional listener name, or element(s).
	* @param {string|string[]|Element|Window|Document|Array<Element>|NodeList|HTMLCollection} arg2 Event(s) or element(s) if a name is provided.
	* @param {string|string[]|Function} arg3 Callback function or event(s) if a name is provided.
	* @param {Function} [arg4] Callback function if a name is provided.
	* @returns {boolean} True on success, false on error.
	*/
	add(arg1, arg2, arg3, arg4) {
		let name = false, elementsInput, eventsInput, callback, id;
		
		if ((typeof arg1 === 'object') || ((typeof arg1 === 'string') && (['#', '.'].includes(arg1.charAt(0))))) {
			elementsInput = arg1;
			eventsInput = arg2;
			callback = arg3;
		} else {
			name = arg1;
			elementsInput = arg2;
			eventsInput = arg3;
			callback = arg4;
		}
		
		if (elementsInput === undefined || elementsInput === null) {
			logError('listener.add(): Elements input is missing or invalid.', { elements: elementsInput });
			return false;
		}
		
		let elementsList;
		
		if (typeof elementsInput === 'string') {
			try {
				elementsList = Array.from(document.querySelectorAll(elementsInput));
			} catch (_) {
				logError('listener.add(): Invalid selector string.', { elements: elementsInput });
				return false;
			}
		} else if (elementsInput === window || elementsInput === document) {
			elementsList = [elementsInput];
		} else if (elementsInput && (elementsInput.nodeType === 1 || elementsInput.nodeType === 9)) {
			elementsList = [elementsInput];
		} else if (Array.isArray(elementsInput)) {
			elementsList = elementsInput;
		} else if (typeof elementsInput.length === 'number') {
			elementsList = Array.from(elementsInput);
		} else {
			elementsList = [elementsInput];
		}
		
		if (!elementsList || (elementsList.length === 0)) {
			return false;
		}
		
		let eventsList = Array.isArray(eventsInput) ? eventsInput : [eventsInput];
		
		if (!eventsList || eventsList.length === 0 || eventsList.some((ev) => typeof ev !== 'string' || ev.trim() === '')) {
			logError('listener.add(): Events input is missing or invalid.', { events: eventsInput });
			return false;
		}
		
		if (typeof callback !== 'function') {
			logError('listener.add(): Callback is not a function.', { callback });
			return false;
		}
		
		if (listener.functions[name] !== undefined) {
			logError('listener.add(): Listener with this name already exists.', { name });
			return false;
		}
		
		if (name === false) {
			do {
				id = randomHelper.id(16, true);
			} while (listener.functions[id] !== undefined);
			name = id;
		}
		
		listener.functions[name] = {
			elements: elementsList,
			function: callback,
			events: eventsList
		};
		
		for (const element of elementsList) {
			for (const eventName of eventsList) {
				element.addEventListener(eventName, callback);
			}
		}
		
		return true;
	},
	
	/**
	* Remove event listeners by name.
	* @param {string} name The name of the listener to remove.
	* @returns {boolean} True on success, false if name is invalid.
	*/
	remove(name) {
		if (typeof name !== 'string' || name.trim() === '') {
			logError('listener.remove(): Name must be a non-empty string.', { name });
			return false;
		}
		
		if (listener.functions[name] === undefined) {
			logError('listener.remove(): Listener with this name does not exist.', { name });
			return false;
		}
		
		const record = listener.functions[name];
		const elementsList = Array.isArray(record.elements) ? record.elements : [record.elements];
		const eventsList = Array.isArray(record.events) ? record.events : [record.events];
		
		for (const element of elementsList) {
			for (const eventName of eventsList) {
				element.removeEventListener(eventName, record.function);
			}
		}
		
		delete listener.functions[name];
		return true;
	}
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
* Convert an HTML string into element(s).
* @param {string} input HTML string to convert.
* @returns {HTMLElement | DocumentFragment | null}
*/

export function strToEl(input) {
	if (typeof input !== 'string') {
		logError('strToEl(): Input is not a string.', { input });
		return null;
	}
	
	input = input.trim();
	
	if (!input) {
		logError('strToEl(): Input is empty after trim.', { input });
		return null;
	}
	
	let templateElement;
	
	try {
		templateElement = document.createElement('template');
	} catch (error) {
		logError('strToEl(): Failed to create template element.', { error });
		return null;
	}
	
	try {
		templateElement.innerHTML = input;
	} catch (error) {
		logError('strToEl(): Failed to set innerHTML on template.', { error });
		return null;
	}
	
	const content = templateElement.content;
	const elementList = Array.from(content.children);
	
	if (elementList.length === 0) {
		logError('strToEl(): No element nodes found in input.', { string: input });
		return null;
	}
	
	if (elementList.length === 1) {
		return elementList[0];
	}
	
	const fragment = document.createDocumentFragment();
	
	for (const element of elementList) {
		fragment.appendChild(element);
	}
	
	return fragment;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
* Get computed CSS value of element.
* @param {HTMLElement} element The element.
* @param {string} propertyValue CSS property in kebab-case.
* @returns {string} Computed CSS style value.
*/

export function getStyle(element, propertyValue) {
	if (!element || (typeof element !== 'object') || (element.nodeType !== 1)) {
		logError('getStyle(): Provided element is not an HTMLElement.', { element });
		return '';
	}
	
	if (typeof propertyValue !== 'string') {
		logError('getStyle(): CSS property must be a string.', { propertyValue });
		return '';
	}
	
	let requestedPropertyName = propertyValue.trim();
	
	if (!requestedPropertyName) {
		logError('getStyle(): CSS property is empty after trim.', { propertyValue });
		return '';
	}
	
	let computedStyle;
	
	try {
		computedStyle = window.getComputedStyle(element);
	} catch (error) {
		logError('getStyle(): Failed to get computed style.', { error, element });
		return '';
	}
	
	function toKebabCase(inputName) {
		if (inputName.startsWith('--')) {
			return inputName;
		}
		
		const vendorMatch = inputName.match(/^(Webkit|Moz|ms|O)([A-Z].*)$/);
		
		if (vendorMatch) {
			const prefix = vendorMatch[1].toLowerCase();
			const rest = vendorMatch[2];
			return '-' + prefix + '-' + rest.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
		}
		
		return inputName.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
	}
	
	const isKebabCase = (name) => (name.startsWith('--') || name.includes('-'));
	const kebabPropertyName = isKebabCase(requestedPropertyName) ? requestedPropertyName : toKebabCase(requestedPropertyName);
	let computedValue = '';
	
	try {
		computedValue = computedStyle.getPropertyValue(kebabPropertyName) || '';
	} catch (_) {}
	
	if (!computedValue) {
		const camelCaseName = requestedPropertyName.startsWith('--') ? requestedPropertyName : kebabPropertyName.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
		
		try {
			const directValue = computedStyle[camelCaseName];
			
			if (typeof directValue === 'string' && directValue) {
				computedValue = directValue;
			}
		} catch (_) {}
	}
	
	return typeof computedValue === 'string' ? computedValue.trim() : '';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const randomHelper = {
	/**
	* Generate a random integer between min and max, inclusive by default.
	* @param {number} min Lowest integer.
	* @param {number} max Highest integer.
	* @param {boolean} [inclusive=true] Include min & max as a possible result?
	* @returns {number | null} The integer, or null on error.
	*/
	
	int(min, max, inclusive = true) {
		if (typeof min !== 'number' || !Number.isFinite(min)) {
			logError('randomHelper.int(): The min parameter is not a finite number.', { min, max, inclusive });
			return null;
		}
		
		if (typeof max !== 'number' || !Number.isFinite(max)) {
			logError('randomHelper.int(): The max parameter is not a finite number.', { min, max, inclusive });
			return null;
		}
		
		if (inclusive !== undefined && typeof inclusive !== 'boolean') {
			logError('randomHelper.int(): The inclusive parameter must be a boolean if provided.', { inclusive });
			return null;
		}
		
		if (!Number.isInteger(min)) {
			logError('randomHelper.int(): The min parameter must be an integer.', { min });
			return null;
		}
		
		if (!Number.isInteger(max)) {
			logError('randomHelper.int(): The max parameter must be an integer.', { max });
			return null;
		}
		
		if (min > max) {
			logError('randomHelper.int(): The min parameter must be less than or equal to max.', { min, max });
			return null;
		}
		
		if (min === max) {
			if (inclusive) {
				return min;
			}
			
			logError('randomHelper.int(): Exclusive range has no integers when min equals max.', { min, max, inclusive });
			return null;
		}
		
		if (inclusive) {
			const rangeSize = (max - min) + 1;
			const randomOffset = Math.floor(Math.random() * rangeSize);
			return min + randomOffset;
		}
		
		const exclusiveMin = min + 1;
		const exclusiveMax = max - 1;
		const exclusiveRangeSize = exclusiveMax - exclusiveMin + 1;
		
		if (exclusiveRangeSize <= 0) {
			logError('randomHelper.int(): Exclusive range contains no integers.', { min, max, inclusive });
			return null;
		}
		
		const randomExclusiveOffset = Math.floor(Math.random() * exclusiveRangeSize);
		return exclusiveMin + randomExclusiveOffset;
	},
	
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	
	/**
	* Generate random float between min and max value inclusive by default.
	* @param {number} min Lowest float.
	* @param {number} max Highest float.
	* @param {boolean} [inclusive=true] Include min & max as a possible result?
	* @param {number} [decimals=2] Number of decimal places.
	* @returns {number | null} Random float, or null on error
	*/
	
	float(min, max, inclusive = true, decimals = 2) {
		if (typeof min !== 'number' || !Number.isFinite(min)) {
			logError('randomHelper.float(): The min parameter is not a finite number.', { min, max, inclusive, decimals });
			return null;
		}
		
		if (typeof max !== 'number' || !Number.isFinite(max)) {
			logError('randomHelper.float(): The max parameter is not a finite number.', { min, max, inclusive, decimals });
			return null;
		}
		
		if (inclusive !== undefined && typeof inclusive !== 'boolean') {
			logError('randomHelper.float(): The inclusive parameter must be a boolean if provided.', { inclusive });
			return null;
		}
		
		if (!Number.isInteger(decimals)) {
			logError('randomHelper.float(): The decimals parameter must be an integer.', { decimals });
			return null;
		}
		
		if (decimals < 0) {
			logError('randomHelper.float(): The decimals parameter must be zero or a positive integer.', { decimals });
			return null;
		}
		
		if (decimals > 15) {
			logError('randomHelper.float(): The decimals parameter is too large; maximum supported is 15.', { decimals });
			return null;
		}
		
		if (min > max) {
			logError('randomHelper.float(): The min parameter must be less than or equal to max.', { min, max });
			return null;
		}
		
		if (min === max) {
			if (inclusive) {
				return min;
			}
			
			logError('randomHelper.float(): Exclusive range has no values when min equals max.', { min, max, inclusive });
			return null;
		}
		
		const decimalPlaces = decimals;
		const scaleFactor = Math.pow(10, decimalPlaces);
		let integerMinBound;
		let integerMaxBound;
		
		if (inclusive) {
			integerMinBound = Math.ceil(min * scaleFactor);
			integerMaxBound = Math.floor(max * scaleFactor);
		} else {
			integerMinBound = Math.floor(min * scaleFactor) + 1;
			integerMaxBound = Math.ceil(max * scaleFactor) - 1;
		}
		
		const possibleCount = (integerMaxBound - integerMinBound) + 1;
		
		if (possibleCount <= 0) {
			logError('randomHelper.float(): Given parameters produce no representable values at the specified decimals.', {
				min, max, inclusive, decimals, integerMinBound, integerMaxBound
			});
			return null;
		}
		
		const randomOffset = Math.floor(Math.random() * possibleCount);
		const randomInteger = integerMinBound + randomOffset;
		const randomValue = randomInteger / scaleFactor;
		return randomValue;
	},
	
	// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	
	/**
	* Generate a random ID string of a specific length.
	* @param {number} length Length of the result string.
	* @param {string|boolean} [characters] Custom character set, true for alphanumerics, leave empty for full charset, or use custom string.
	* @returns {string} Random ID string.
	*/
	
	id(length, characters) {
		let targetLength;
		
		if (!Number.isInteger(length) || (length <= 0)) {
			logError('randomHelper.id(): The length parameter must be a positive integer.', { length });
			targetLength = 16;
		} else {
			targetLength = length;
		}
		
		const DEFAULT_ID_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-?+$#@!%&';
		const ALPHANUMERIC_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let characterSetString;
		
		if (characters === true) {
			characterSetString = ALPHANUMERIC_CHARACTERS;
		} else if (typeof characters === 'string') {
			const uniqueCharacters = Array.from(new Set(Array.from(characters)));
			characterSetString = uniqueCharacters.join('');
			
			if (characterSetString.length === 0) {
				logError('randomHelper.id(): Provided characters string is empty after deduplication.', { characters });
				characterSetString = DEFAULT_ID_CHARACTERS;
			}
		} else if (characters === undefined) {
			characterSetString = DEFAULT_ID_CHARACTERS;
		} else {
			logError('randomHelper.id(): The characters parameter must be a string, true, or omitted.', { characters });
			characterSetString = DEFAULT_ID_CHARACTERS;
		}
		
		const characterCount = characterSetString.length;
		
		if (characterCount === 0) {
			logError('randomHelper.id(): Character set is empty; returning empty string.');
			return '';
		}
		
		if (characterCount === 1) {
			return characterSetString.repeat(targetLength);
		}
		
		const resultCharacters = new Array(targetLength);
		const hasCrypto = (typeof crypto !== 'undefined') && crypto && (typeof crypto.getRandomValues === 'function');
		
		if (hasCrypto) {
			const maxValidByte = Math.floor(256 / characterCount) * characterCount - 1;
			let generatedCount = 0;
			
			while (generatedCount < targetLength) {
				const remaining = targetLength - generatedCount;
				const bufferSize = Math.max(remaining * 2, 16);
				const randomBuffer = new Uint8Array(bufferSize);
				
				try {
					crypto.getRandomValues(randomBuffer);
				} catch (error) {
					logError('randomHelper.id(): crypto.getRandomValues() failed; falling back to Math.random().', { error });
					break;
				}
				
				for (let i = 0; i < randomBuffer.length && generatedCount < targetLength; i++) {
					const randomByte = randomBuffer[i];
					
					if (randomByte > maxValidByte) {
						continue;
					}
					
					const index = randomByte % characterCount;
					resultCharacters[generatedCount++] = characterSetString.charAt(index);
				}
			}
			
			if (resultCharacters[targetLength - 1] !== undefined) {
				return resultCharacters.join('');
			}
		}
		
		if (!hasCrypto) {
			logError('randomHelper.id(): crypto.getRandomValues() is not available; using Math.random() as a fallback.');
		}
		
		for (let i = 0; i < targetLength; i++) {
			if (resultCharacters[i] !== undefined) {
				continue;
			}
			const randomIndex = Math.floor(Math.random() * characterCount);
			resultCharacters[i] = characterSetString.charAt(randomIndex);
		}
		
		return resultCharacters.join('');
	}
};