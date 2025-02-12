/*!
 * RamStateContext JavaScript Library v2.0.0
 * Consolidates RamState functionality directly into RamStateContext
 */

class RamStateContext {

    #initialStates;
    #renderTimeout;

    static reservedKeys = new Set(['states', 'initialStates']);

    constructor(initialState = {}, option = {}) {
        this.states = {}; // Store all state data and effects
        this.#initialStates = {}; // Keep track of initial state values

        // Initialize all provided initial states
        this.initStates(initialState);

        // initialize config
        this.config(option);

    }

    config(option = {}) {
        this.debug = option.debug || false;
    }

    // Add or retrieve a state dynamically
    #create(key, initialValue) {

        if (RamStateContext.reservedKeys.has(key.toLowerCase())) {
            console.warn(`State key "${key}" is reserved and cannot be used.`);
            return null;
        }

        if (this[key] !== undefined) {
            console.warn(`The key "${key}" conflicts with an existing property or method.`);
            return null;
        }

        if (this.states[key]) {
            console.warn(`State with key "${key}" already exists.`);
            return this.states[key];
        }

        const state = this.#generateStateProps(initialValue);
        this.states[key] = state;
        this.#initialStates[key] = this.#deepClone(initialValue);

        // Add dynamic property access
        Object.defineProperty(this, key, {
            get: () => this.#createAccessor(key),
            enumerable: true,
        });

        return this.#createAccessor(key);
    }

    add(key, initialValue, render = true) {
        if (typeof key !== 'string' || key.trim() === '') {
            console.error('Invalid key: Key must be a non-empty string.');
            return;
        }
        this.#create(key, initialValue);
        if (render) {
            this.#renderHTML();
        }
    }

    // Set multiple initial states
    initStates(initialState, render = true) {
        Object.entries(initialState).forEach(([key, value]) => {
            this.#create(key, value);
        });
        if (render) {
            this.#renderHTML();
        }
    }

    // Internal: Initialize a state structure
    #generateStateProps(initialValue) {
        return {
            value: this.#deepClone(initialValue),
            version: 0,
            onSetEffects: [],
            onChangeEffects: [],
        };
    }

    // Internal: Create accessor object for a state
    #createAccessor(key) {
        const self = this;

        return {
            get: () => this.#deepClone(this.states[key].value),
            get value() {
                return self.#deepClone(self.states[key].value)
            },
            set: (param) => this.#updateState(key, param),
            onSet: (callback, executeOnInit = false) => this.#addEffect(key, 'onSetEffects', callback, executeOnInit),
            onChange: (callback, executeOnInit = false) => this.#addEffect(key, 'onChangeEffects', callback, executeOnInit),
            reset: (newData = null) => this.#resetState(key, newData),
            get version() {
                return self.states[key].version;
            },
        };
    }

    // Internal: Update state value
    #updateState(key, param) {
        const state = this.states[key];
        const oldData = state.value;
        const newData = typeof param === 'function' ? param(this.#deepClone(oldData)) : this.#deepClone(param);
        const hasChange = !this.#isEqual(oldData, newData);

        if (hasChange) {
            state.version += 1;
            state.value = newData;
        }

        this.#triggerEffects(state.onSetEffects, { hasChange, current: newData, previous: oldData, version: state.version });

        if (hasChange) {
            this.#triggerEffects(state.onChangeEffects, { current: newData, previous: oldData, version: state.version });
        }
    }

    // Internal: Reset state to initial or new value
    #resetState(key, newData = null) {
        const state = this.states[key];
        const oldData = state.value;
        const resetValue = newData === null ? this.#deepClone(this.#initialStates[key]) : this.#deepClone(newData);

        const hasChange = !this.#isEqual(oldData, resetValue);

        if (hasChange) {
            state.version += 1;
        }

        state.value = resetValue;

        this.#triggerEffects(state.onSetEffects, { hasChange, current: resetValue, previous: oldData, version: state.version });

        if (hasChange) {
            this.#triggerEffects(state.onChangeEffects, { current: resetValue, previous: oldData, version: state.version });
        }
    }

    // Internal: Add effect to a state
    #addEffect(key, effectType, callback, executeOnInit) {
        if (typeof callback === 'function') {
            this.states[key][effectType].push(callback);
            if (executeOnInit) {
                try {
                    callback({
                        hasChange: effectType === 'onSetEffects' ? false : null,
                        current: this.states[key].value,
                        previous: this.#initialStates[key],
                        version: this.states[key].version,
                    });
                } catch (error) {
                    this.#debugLog('error', `Error in initial ${effectType} callback for state "${key}":`, error);
                }
            }
        } else {
            this.#debugLog('warn', `Callback provided to ${effectType} is not a function`);
        }
    }

    // Internal: Trigger effects
    #triggerEffects(effects, context) {
        effects.forEach(callback => {
            try {
                callback(context);
            } catch (error) {
                this.#debugLog('error', `Error in effect callback:`, error);
            }
        });
        this.#debounceRenderHTML();
    }

    #debounceRenderHTML() {
        if (this.#renderTimeout) clearTimeout(this.#renderTimeout);
        this.#renderTimeout = setTimeout(() => this.#renderHTML(), 100);
    }

    #renderHTML() {

        const textAttr = 'rs-text';
        const valueAttr = 'rs-value';
        const showAttr = 'rs-show';

        const updates = [];
        document.querySelectorAll(`[${textAttr}]`).forEach(element => {
            try {
                const textValue = element.getAttribute(textAttr);
                const parsedValue = this.#safeEvaluate(textValue);
                if (!this.#isEqual(String(element.textContent || null), String(parsedValue))) {
                    updates.push(() => {
                        this.#debugLog('info', `[${textAttr}] -> "${textValue}" update:`, element.textContent || '""', '->', parsedValue);
                        element.textContent = parsedValue;
                    });
                }
            } catch (error) {
                this.#debugLog('warn', `[${textAttr}] error:`, error?.message);
            }
        });

        document.querySelectorAll(`[${valueAttr}]`).forEach(element => {
            try {
                const textValue = element.getAttribute(valueAttr);
                const parsedValue = this.#safeEvaluate(textValue);
                if (!this.#isEqual(String(element.value || null), String(parsedValue))) {
                    updates.push(() => {
                        this.#debugLog('info', `[${valueAttr}] -> "${textValue}" update:`, element.value || '""', '->', parsedValue);
                        element.value = parsedValue;
                    });
                }
            } catch (error) {
                this.#debugLog('warn', `[${valueAttr}] error:`, error?.message);
            }
        });

        document.querySelectorAll(`[${showAttr}]`).forEach(element => {
            const condition = element.getAttribute(showAttr);
            try {
                const visible = !!this.#safeEvaluate(condition);

                if (visible) {
                    if (element.style.display === 'none') {
                        updates.push(() => {
                            this.#debugLog('info', `[${showAttr}] -> "${condition}" update:`, 'display: none -> block');
                            element.style.display = 'block';
                        });
                    }
                } else {
                    if (element.style.display !== 'none') {
                        updates.push(() => {
                            this.#debugLog('info', `[${showAttr}] -> "${condition}" update:`, 'display: block -> none');
                            element.style.display = 'none';
                        });
                    }
                }
            } catch (error) {
                if (element.style.display !== 'none') {
                    updates.push(() => {
                        this.#debugLog('info', `[${showAttr}] -> "${condition}" initialized:`, 'display: block -> none');
                        element.style.display = 'none';
                    });
                }
                this.#debugLog('warn', `[${showAttr}] error:`, error?.message);
            }
        });

        updates.forEach((update, index) => {
            // console.log(index + 1, ' of ', updates.length);
            update();
        });

        if (updates.length > 0) {
            this.#debugLog('info', `rending html`);
        } else {
            this.#debugLog('info', `no html rendering needed`);
        }

    }

    // #safeEvaluate(expression) {
    //     if (!expression) return null;
    //     try {
    //         return new Function(`return ${expression}`)();
    //     } catch (error) {
    //         throw new Error(`"${expression}" -> ${error.message}`);
    //     }
    // }
    #safeEvaluate(expression) {
        if (!expression) return null;
        const allowedKeys = Object.keys(this.states);
        try {
            const func = new Function(...allowedKeys, `return ${expression}`);
            return func(...allowedKeys.map(key => this.states[key].value));
        } catch (error) {
            throw new Error(`"${expression}" -> ${error.message}`);
        }
    }

    // Utility: Deep clone
    #deepClone(value, hash = new WeakMap()) {
        if (Object(value) !== value) return value;
        if (value instanceof Date) return new Date(value);
        if (value instanceof RegExp) return new RegExp(value);
        if (value instanceof Set) return new Set([...value].map(item => this.#deepClone(item, hash)));
        if (value instanceof Map) return new Map([...value].map(([key, val]) => [this.#deepClone(key, hash), this.#deepClone(val, hash)]));

        if (hash.has(value)) return hash.get(value);

        const clone = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
        hash.set(value, clone);

        return Object.assign(clone, ...Object.keys(value).map(key => ({ [key]: this.#deepClone(value[key], hash) })));
    }

    #debugLog(level, ...messages) {
        if (this.debug) {
            console[level](...messages);
        }
    }

    // Utility: Compare equality
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
}
