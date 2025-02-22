/*!
 * RamStateJs JavaScript Library v1.6.0
 * https://github.com/ramjam97/ram-state-js
 * Date: 2024-08-05
 * 
 * A lightweight state management library for Vanilla JavaScript with deep cloning, change detection,
 * and subscription-based updates. Handles complex data types (Set/Map/Date/RegExp)
 * and circular references.
 */

// Define a RamState object
class RamState {

    #initialData;           // Private: Initial state snapshot
    #data;                  // Private: Current state data
    #hasChange;             // Private: Flag for state change detection
    #onSetEffectsList;      // Private: Array of set-triggered callbacks
    #onChangeEffectsList;   // Private: Array of change-triggered callbacks
    #version;               // Private: State version counter

    constructor(initialData) {
        // Validate initial state type
        if (typeof initialData === 'function') {
            throw new Error("Initial state cannot be a function.");
        }

        // Initialize state with deep clones to prevent reference sharing
        this.#initialData = this.#deepClone(initialData);
        this.#data = this.#deepClone(initialData);
        this.#hasChange = false;
        this.#onSetEffectsList = [];    // Callbacks for every set() call
        this.#onChangeEffectsList = []; // Callbacks only when state changes
        this.#version = 0;              // Track state mutations

    }

    /**
     * Update the state. Accepts either a value or a function (currentState => newState).
     * Triggers callbacks only if state actually changes.
     */
    set(param) {

        const oldData = this.#data;

        // Calculate new state (function receives cloned data to prevent mutation)
        const newDataUncloned = typeof param === 'function' ? param(this.#deepClone(oldData)) : param;

        // Clone again to ensure internal state can't be modified externally
        this.#data = this.#deepClone(newDataUncloned);
        this.#hasChange = !this.#isEqual(oldData, this.#data);

        if (this.#hasChange) {
            this.#version += 1;     // Increment version on change
        }

        // Always trigger set effects, conditionally trigger change effects
        this.#runSetFx();
        if (this.#hasChange) {
            this.#runChangeFx();
        }
    }

    /** 
     * Get a deep clone of current state to prevent external mutation 
     */
    get() {
        return this.#deepClone(this.#data);
    }

    // Aliases for get()
    get data() { return this.get(); }
    get value() { return this.get(); }
    get hasChange() { return this.#hasChange; }

    /** Get current state version number */
    get version() { return this.#version; }

    /**
     * Subscribe to all set() operations (even if no change occurred)
     * @param {Function} callback - Receives {hasChange, current, version}
     * @param {boolean} executeOnInit - Immediately invoke with current state
     */
    onSetFx(callback, executeOnInit = false) {
        if (typeof callback === 'function') {
            this.#onSetEffectsList.push(callback);
            if (executeOnInit) {
                try {
                    // Compare current state with initial state for hasChange
                    callback({
                        hasChange: !this.#isEqual(this.#data, this.#initialData),
                        data: this.#data,
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
        return this.onSetFx(callback, executeOnInit);
    }

    /**
     * Subscribe to state changes (only triggered when state actually changes)
     * @param {Function} callback - Receives {current, version}
     * @param {boolean} executeOnInit - Immediately invoke with current state
     */
    onChangeFx(callback, executeOnInit = false) {
        if (typeof callback === 'function') {
            this.#onChangeEffectsList.push(callback);
            if (executeOnInit) {
                try {
                    callback({
                        data: this.#data,
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
    watchChange(callback, executeOnInit = false) { return this.onChangeFx(callback, executeOnInit); }
    watchChanges(callback, executeOnInit = false) { return this.onChangeFx(callback, executeOnInit); }


    /**
     * Trigger effects manually. Can specify 'set' or 'change' effects.
     * @param {string} fx - Type of effects to trigger ('set' or 'change')
     */
    triggerFx(hasChange = null) {
        this.triggerSetFx(hasChange);
        if (this.#hasChange) {
            this.triggerChangeFx();
        }
    }

    /**
     * Trigger set effects manually.
     */
    triggerSetFx(hasChange = null) {
        this.#hasChange = (hasChange === null) ? this.#hasChange : Boolean(hasChange);
        this.#runSetFx();
    }

    /**
     * Trigger change effects manually.
     */
    triggerChangeFx() {
        this.#runChangeFx();
    }

    /**
     * Reset state to initial value or provided value
     * @param {any|null} newData - If null, resets to initial state
     */
    reset(newData = null) {
        const oldData = this.#data;
        // Clone input or use initial state clone
        newData = newData === null
            ? this.#deepClone(this.#initialData)
            : this.#deepClone(newData);

        this.#hasChange = !this.#isEqual(oldData, newData);

        if (this.#hasChange) {
            this.#version += 1;
        }

        this.#data = newData;
        this.#runSetFx();

        if (this.#hasChange) {
            this.#runChangeFx();
        }
    }

    /** 
     * Trigger all set subscriptions (called on every set()) 
     * @private
     */
    #runSetFx() {
        this.#onSetEffectsList.forEach(callback => {
            try {
                callback({
                    hasChange: this.#hasChange,
                    data: this.#data,
                    version: this.#version
                });
            } catch (error) {
                console.error('Error in uponSet callback:', error);
            }
        });
    }

    /** 
     * Trigger all change subscriptions (called only when state changes) 
     * @private
     */
    #runChangeFx() {
        this.#onChangeEffectsList.forEach(callback => {
            try {
                callback({
                    data: this.#data,
                    version: this.#version
                });
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

        if (structuredClone) return structuredClone(value);

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