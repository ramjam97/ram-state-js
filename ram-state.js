/*!
 * RamStateJs JavaScript Library v1.0.0
 * https://github.com/ramjam97/ram-state-js
 * Date: 2024-07-26T16:46:19.944Z
 */

// Define a RamState object
class RamState {

    #data;
    #sideEffects;
    #version

    constructor(initialData) {
        this.#data = this.#deepClone(initialData);
        this.#sideEffects = [];
        this.#version = 0;
    }

    set(param) {
        const oldData = this.#data;
        const newData = typeof param === 'function' ? param(this.#deepClone(oldData)) : param;
        if (!this.#isEqual(oldData, newData)) {
            this.#version += 1;
            this.#data = this.#deepClone(newData);
            this.#triggerSideEffects(newData, oldData, this.#version);
        }
    }

    get() {
        return this.#deepClone(this.#data);
    }

    get value() {
        return this.#deepClone(this.#data);
    }

    watch(callback, executeOnInit = false) {
        if (typeof callback === 'function') {
            this.#sideEffects.push(callback);
            if (executeOnInit) {
                try {
                    callback(this.#data, this.#data, this.#version);
                } catch (error) {
                    console.error('Error in initial side effect callback:', error);
                }
            }
        } else {
            console.warn('Callback provided to watch is not a function');
        }
    }

    #triggerSideEffects(newData, oldData, version) {
        this.#sideEffects.forEach(callback => {
            try {
                callback(newData, oldData, version);
            } catch (error) {
                console.error('Error in side effect callback:', error);
            }
        });
    }

    // Utility function for comparison
    #isEqual(obj1, obj2) {
        if (obj1 instanceof Set && obj2 instanceof Set) {
            return obj1.size === obj2.size && [...obj1].every(value => obj2.has(value));
        }
        if (obj1 instanceof Map && obj2 instanceof Map) {
            if (obj1.size !== obj2.size) return false;
            for (let [key, value] of obj1) {
                if (!obj2.has(key) || !this.#isEqual(value, obj2.get(key))) {
                    return false;
                }
            }
            return true;
        }
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    // Utility function for deep cloning
    #deepClone(value, hash = new WeakMap()) {
        if (Object(value) !== value) return value;
        if (value instanceof Date) return new Date(value);
        if (value instanceof RegExp) return new RegExp(value);
        if (value instanceof Set) return new Set([...value].map(item => this.#deepClone(item, hash)));
        if (value instanceof Map) return new Map([...value].map(([key, val]) => [this.#deepClone(key, hash), this.#deepClone(val, hash)]));

        if (hash.has(value)) return hash.get(value);

        const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
        hash.set(value, clone);

        return Object.assign(clone, ...Object.keys(value).map(
            key => ({ [key]: this.#deepClone(value[key], hash) })
        ));
    }

}