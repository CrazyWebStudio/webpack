/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const util = require("util");

const TOMBSTONE = {};
const UNDEFINED_MARKER = {};

class StackedSetMap {
	constructor(parentStack, caching) {
		this.stack = parentStack === undefined ? [] : parentStack.slice();
		this.map = new Map();
		this.stack.push(this.map);
		this.caching = caching;
	}

	add(item) {
		this.map.set(item, true);
	}

	set(item, value) {
		this.map.set(item, value === undefined ? UNDEFINED_MARKER : value);
	}

	delete(item) {
		if(this.stack.length > 1)
			this.map.set(item, TOMBSTONE);
		else
			this.map.delete(item);
	}

	has(item) {
		const topValue = this.map.get(item);
		if(topValue !== undefined)
			return topValue !== TOMBSTONE;
		if(this.stack.length > 1) {
			for(var i = this.stack.length - 2; i >= 0; i--) {
				const value = this.stack[i].get(item);
				if(value !== undefined) {
					if(this.caching !== false)
						this.map.set(item, value);
					return value !== TOMBSTONE;
				}
			}
			if(this.caching !== false)
				this.map.set(item, TOMBSTONE);
		}
		return false;
	}

	get(item) {
		const topValue = this.map.get(item);
		if(topValue !== undefined)
			return topValue === TOMBSTONE || topValue === UNDEFINED_MARKER ? undefined : topValue;
		if(this.stack.length > 1) {
			for(var i = this.stack.length - 2; i >= 0; i--) {
				const value = this.stack[i].get(item);
				if(value !== undefined) {
					if(this.caching !== false)
						this.map.set(item, value);
					return value === TOMBSTONE || value === UNDEFINED_MARKER ? undefined : value;
				}
			}
			if(this.caching !== false)
				this.map.set(item, TOMBSTONE);
		}
		return undefined;
	}

	_compress() {
		this.map = new Map();
		for(const data of this.stack) {
			for(const pair of data) {
				if(pair[1] === TOMBSTONE)
					this.map.delete(pair[0]);
				else
					this.map.set(pair[0], pair[1]);
			}
		}
		this.stack = [this.map];
	}

	asSet() {
		this._compress();
		return new Set(Array.from(this.map.entries()).map(pair => pair[0]));
	}

	asMap() {
		this._compress();
		return new Map(this.map.entries());
	}

	createChild(caching) {
		if(typeof caching === "number") {
			const r = new StackedSetMap(this.stack, false);
			if(r.stack.length > caching) r._compress();
			return r;
		}
		return new StackedSetMap(this.stack);
	}

	get length() {
		throw new Error("This is no longer an Array");
	}

	set length(value) {
		throw new Error("This is no longer an Array");
	}
}

StackedSetMap.prototype.push = util.deprecate(function(item) {
	this.add(item);
}, "This is no longer an Array: Use add instead.");

module.exports = StackedSetMap;
