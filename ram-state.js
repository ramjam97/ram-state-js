/*!
 * RamStateJs JavaScript Library v1.2.2
 * https://github.com/ramjam97/ram-state-js
 * Date: 2024-08-05
 */

// Define a RamState object
class RamState {

    #data;
    #uponChangeEffects;
    #version;
    #initialData;
    #uponSetEffects;

    constructor(initialData) {
        this.#initialData = this.#deepClone(initialData);
        this.#data = this.#deepClone(initialData);
        this.#uponSetEffects = [];
        this.#uponChangeEffects = [];
        this.#version = 0;
    }

    set(param) {
        const oldData = this.#data;
        const newData = typeof param === 'function' ? param(this.#deepClone(oldData)) : param;
        const hasChange = !this.#isEqual(oldData, newData);

        if (hasChange) {
            this.#version += 1;
            this.#data = this.#deepClone(newData);
        }

        this.#triggerSetEffects(hasChange, newData, oldData, this.#version);

        if (hasChange) {
            this.#triggerChangeEffects(newData, oldData, this.#version);
        }
    }

    get() {
        return this.#deepClone(this.#data);
    }

    get value() {
        return this.#deepClone(this.#data);
    }

    get version() {
        return this.#version;
    }

    uponSet(callback, executeOnInit = false) {
        if (typeof callback === 'function') {
            this.#uponSetEffects.push(callback);
            if (executeOnInit) {
                try {
                    callback({
                        hasChange: !this.#isEqual(this.#data, this.#initialData),
                        latest: this.#data,
                        previous: this.#initialData,
                        version: this.#version
                    });
                } catch (error) {
                    console.error('Error in initial uponSet callback:', error);
                }
            }
        } else {
            console.warn('Callback provided to uponSet is not a function');
        }
    }

    watch(callback, executeOnInit = false) {
        return this.uponSet(callback, executeOnInit);
    }

    uponChange(callback, executeOnInit = false) {
        if (typeof callback === 'function') {
            this.#uponChangeEffects.push(callback);
            if (executeOnInit) {
                try {
                    callback({
                        latest: this.#data,
                        previous: this.#initialData,
                        version: this.#version
                    });
                } catch (error) {
                    console.error('Error in initial uponChange callback:', error);
                }
            }
        } else {
            console.warn('Callback provided to uponChange is not a function');
        }
    }

    watchChange(callback, executeOnInit = false) {
        return this.uponChange(callback, executeOnInit);
    }

    watchChanges(callback, executeOnInit = false) {
        return this.uponChange(callback, executeOnInit);
    }

    reset(newData = null) {
        const oldData = this.#data;
        newData = newData === null ? this.#deepClone(this.#initialData) : this.#deepClone(newData);

        const hasChange = !this.#isEqual(oldData, newData);

        if (hasChange) {
            this.#version += 1;
        }

        this.#data = newData;
        this.#triggerSetEffects(hasChange, newData, oldData, this.#version);

        if (hasChange) {
            this.#triggerChangeEffects(newData, oldData, this.#version);
        }
    }

    #triggerSetEffects(hasChange, newData, oldData, version) {
        this.#uponSetEffects.forEach(callback => {
            try {
                callback({
                    hasChange,
                    latest: newData,
                    previous: oldData,
                    version
                });
            } catch (error) {
                console.error('Error in uponSet callback:', error);
            }
        });
    }

    #triggerChangeEffects(newData, oldData, version) {
        this.#uponChangeEffects.forEach(callback => {
            try {
                callback({
                    latest: newData,
                    previous: oldData,
                    version
                });
            } catch (error) {
                console.error('Error in uponChange callback:', error);
            }
        });
    }

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
