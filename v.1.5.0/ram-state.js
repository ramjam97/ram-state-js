/*!
 * RamStateJs JavaScript Library v1.5.0
 * https://github.com/ramjam97/ram-state-js
 * Date: 2024-08-05
 * 
 * A lightweight state management library for Vanilla JavaScript with deep cloning, change detection,
 * and subscription-based updates. Handles complex data types (Set/Map/Date/RegExp)
 * and circular references.
 */

// Define a RamState object
class RamState {
    #a;                   // Private: Current state data
    #uponChangeEffects;   // Private: Array of change-triggered callbacks
    #version;             // Private: State version counter
    #initialData;         // Private: Initial state snapshot
    #uponSetEffects;      // Private: Array of set-triggered callbacks

    constructor(initialData) {
        // Validate initial state type
        if (typeof initialData === 'function') {
            throw new Error("Initial state cannot be a function.");
        }

        // Initialize state with deep clones to prevent reference sharing
        this.#initialData = this.#deepClone(initialData);
        this.#a = this.#deepClone(initialData);
        this.#uponSetEffects = [];    // Callbacks for every set() call
        this.#uponChangeEffects = []; // Callbacks only when state changes
        this.#version = 0;            // Track state mutations
    }

    /**
     * Update the state. Accepts either a value or a function (currentState => newState).
     * Triggers callbacks only if state actually changes.
     */
    set(param) {
        const oldData = this.#a;
        // Calculate new state (function receives cloned data to prevent mutation)
        const newDataUncloned = typeof param === 'function'
            ? param(this.#deepClone(oldData))
            : param;
        // Clone again to ensure internal state can't be modified externally
        const newData = this.#deepClone(newDataUncloned);
        const hasChange = !this.#isEqual(oldData, newData);

        if (hasChange) {
            this.#version += 1;       // Increment version on change
            this.#a = newData;        // Update stored state
        }

        // Always trigger set effects, conditionally trigger change effects
        this.#triggerSetEffects(hasChange, newData, oldData, this.#version);
        if (hasChange) {
            this.#triggerChangeEffects(newData, oldData, this.#version);
        }
    }

    /** 
     * Get a deep clone of current state to prevent external mutation 
     */
    get() {
        return this.#deepClone(this.#a);
    }

    // Aliases for get()
    get value() { return this.get(); }
    get current() { return this.get(); }

    /** Get current state version number */
    get version() { return this.#version; }

    /**
     * Subscribe to all set() operations (even if no change occurred)
     * @param {Function} callback - Receives {hasChange, current, previous, version}
     * @param {boolean} executeOnInit - Immediately invoke with current state
     */
    uponSet(callback, executeOnInit = false) {
        if (typeof callback === 'function') {
            this.#uponSetEffects.push(callback);
            if (executeOnInit) {
                try {
                    // Compare current state with initial state for hasChange
                    callback({
                        hasChange: !this.#isEqual(this.#a, this.#initialData),
                        current: this.#a,
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

    // Alias for uponSet
    watch(callback, executeOnInit = false) {
        return this.uponSet(callback, executeOnInit);
    }

    /**
     * Subscribe to state changes (only triggered when state actually changes)
     * @param {Function} callback - Receives {current, previous, version}
     * @param {boolean} executeOnInit - Immediately invoke with current state
     */
    uponChange(callback, executeOnInit = false) {
        if (typeof callback === 'function') {
            this.#uponChangeEffects.push(callback);
            if (executeOnInit) {
                try {
                    callback({
                        current: this.#a,
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

    // Aliases for uponChange
    watchChange(callback, executeOnInit = false) { return this.uponChange(callback, executeOnInit); }
    watchChanges(callback, executeOnInit = false) { return this.uponChange(callback, executeOnInit); }


    /**
     * Trigger effects manually. Can specify 'set' or 'change' effects.
     * @param {string} fx - Type of effects to trigger ('set' or 'change')
     */
    triggerEffects(fx = '') {
        if (typeof fx === 'string') {
            if (fx.toLowerCase() === 'set') return this.#triggerSetEffects(false, this.#a, this.#initialData);
            if (fx.toLowerCase() === 'change') return this.#triggerChangeEffects(this.#a, this.#initialData);
        }
        this.#triggerSetEffects(false, this.#a, this.#initialData);
        this.#triggerChangeEffects(this.#a, this.#initialData);
    }

    /**
     * Trigger set effects manually.
     */
    triggerSetEffects() {
        this.triggerEffects('set');
    }

    /**
     * Trigger change effects manually.
     */
    triggerChangeEffects() {
        this.triggerEffects('change');
    }

    /**
     * Reset state to initial value or provided value
     * @param {any|null} newData - If null, resets to initial state
     */
    reset(newData = null) {
        const oldData = this.#a;
        // Clone input or use initial state clone
        newData = newData === null
            ? this.#deepClone(this.#initialData)
            : this.#deepClone(newData);

        const hasChange = !this.#isEqual(oldData, newData);

        if (hasChange) {
            this.#version += 1;
        }

        this.#a = newData;
        this.#triggerSetEffects(hasChange, newData, oldData, this.#version);

        if (hasChange) {
            this.#triggerChangeEffects(newData, oldData, this.#version);
        }
    }

    /** 
     * Trigger all set subscriptions (called on every set()) 
     * @private
     */
    #triggerSetEffects(hasChange, newData, oldData, version) {
        this.#uponSetEffects.forEach(callback => {
            try {
                callback({ hasChange, current: newData, previous: oldData, version });
            } catch (error) {
                console.error('Error in uponSet callback:', error);
            }
        });
    }

    /** 
     * Trigger all change subscriptions (called only when state changes) 
     * @private
     */
    #triggerChangeEffects(newData, oldData, version) {
        this.#uponChangeEffects.forEach(callback => {
            try {
                callback({ current: newData, previous: oldData, version });
            } catch (error) {
                console.error('Error in uponChange callback:', error);
            }
        });
    }

    /**
     * Deep equality check for complex objects
     * @private
     */
    #isEqual(obj1, obj2) {
        // Fast reference equality check
        if (obj1 === obj2) return true;

        // Handle Set comparison
        if (obj1 instanceof Set && obj2 instanceof Set) {
            return obj1.size === obj2.size && [...obj1].every(value => obj2.has(value));
        }

        // Handle Map comparison
        if (obj1 instanceof Map && obj2 instanceof Map) {
            if (obj1.size !== obj2.size) return false;
            for (const [key, value] of obj1) {
                if (!obj2.has(key) || !this.#isEqual(value, obj2.get(key))) return false;
            }
            return true;
        }

        // Handle Date comparison
        if (obj1 instanceof Date && obj2 instanceof Date) return obj1.getTime() === obj2.getTime();

        // Handle RegExp comparison
        if (obj1 instanceof RegExp && obj2 instanceof RegExp) return obj1.toString() === obj2.toString();

        // Handle non-object/null comparisons
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
            return false;
        }

        // Recursive object/array comparison
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;

        return keys1.every(key => keys2.includes(key) && this.#isEqual(obj1[key], obj2[key]));
    }

    /**
     * Deep clone implementation supporting complex types and circular references
     * @private
     */
    #deepClone(value, hash = new WeakMap()) {
        // Handle primitives and null
        if (typeof value !== 'object' || value === null) return value;

        // Handle circular references
        if (hash.has(value)) return hash.get(value);

        // Clone special object types
        let clone;
        if (value instanceof Date) {
            clone = new Date(value.getTime());
        } else if (value instanceof RegExp) {
            clone = new RegExp(value.source, value.flags);
        } else if (value instanceof Set) {
            clone = new Set([...value].map(item => this.#deepClone(item, hash)));
        } else if (value instanceof Map) {
            clone = new Map([...value].map(([k, v]) => [
                this.#deepClone(k, hash),
                this.#deepClone(v, hash)
            ]));
        } else {
            // Handle plain objects/arrays
            clone = Array.isArray(value)
                ? []
                : Object.create(Object.getPrototypeOf(value));

            hash.set(value, clone);

            // Recursively clone all properties
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    clone[key] = this.#deepClone(value[key], hash);
                }
            }
        }

        return clone;
    }
}