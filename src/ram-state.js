function RamState() {
    const libraryName = 'RamState', /* Library Name */
        version = "v4.0.0",         /* Library version */
        allStates = new Set(),      /* Keep track of all states (useState & useButton) */
        scheduleJob = (() => {      /* Group schedule to minimize re-renders */
            let queue = new Set(), flushing = false;
            const flush = () => {
                queue.forEach(fn => fn());
                queue.clear();
                flushing = false;
            };
            return job => {
                queue.add(job);
                if (!flushing) {
                    flushing = true;
                    Promise.resolve().then(flush);
                }
            };
        })();

    // HELPER: deep equality
    const isEqual = (a, b) => {
        if (a === b) return true;
        if (a == null || b == null || typeof a !== typeof b) return false;
        if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => isEqual(v, b[i]));
        if (typeof a === "object") {
            const keysA = Object.keys(a), keysB = Object.keys(b);
            return keysA.length === keysB.length && keysA.every(k => isEqual(a[k], b[k]));
        }
        return false;
    }

    // HELPER: Safely run callback or cleanup
    const safeExec = (cb, payload) => {
        try {
            if (typeof cb !== "function") return null;
            const result = payload !== undefined ? cb(payload) : cb();
            return typeof result === "function" ? result : null;
        } catch (err) {
            msg(err, 'error');
            return null;
        }
    };

    const msg = (msg = null, type = "info") => {
        if (!msg) return;
        switch (type) {
            case 'warn':
                console.warn(`[${libraryName}] error:`, msg);
                break;
            case 'error':
                console.error(`[${libraryName}] error:`, msg);
                break;
            default:
                console.log(`[${libraryName}] error:`, msg);
                break;
        }
    }

    // HELPER: convert to array
    const toArray = x => Array.isArray(x) ? x : [x];

    // HELPER: get DOM elements and return as array
    const getDomElements = (input = null) => {
        if (!input) return [];
        if (input instanceof HTMLElement) return [input];
        if (typeof input === "string") return [...document.querySelectorAll(input)];
        if (Array.isArray(input)) {
            return input.flatMap(
                item => item instanceof HTMLElement ? [item] :
                    typeof item === "string" ? [...document.querySelectorAll(item)] : []
            );
        }
        return [];
    };

    // HELPER: extract value from input/select/checkbox
    const extractDomValue = el => {
        if (el instanceof HTMLInputElement) {
            if (el.type === "checkbox") {
                return el.checked;
            }
            if (el.type === "radio") {
                if (el.checked) return el.value;
                return null;
            }
            return el.value;
        }
        if (el instanceof HTMLSelectElement) {
            if (el.multiple) {
                return [...el.selectedOptions].map(o => o.value);
            }
            return el.value;
        }
        if (el instanceof HTMLTextAreaElement) {
            return el.value;
        }
        return null; // fallback
    };


    // HELPER: sync DOM element with state
    const syncDomElement = (el, value) => {
        if (el === null) return;
        if (el instanceof HTMLInputElement) {
            if (el.type === "checkbox") {
                const checked = Boolean(value);
                if (el.checked !== checked) el.checked = checked;
                return;
            }
            if (el.type === "radio") {
                const shouldCheck = el.value === String(value);
                if (el.checked !== shouldCheck) el.checked = shouldCheck;
                return;
            }
        }
        if (el instanceof HTMLSelectElement && el.multiple && Array.isArray(value)) {
            const values = new Set(value.map(String)); // normalize
            [...el.options].forEach(opt => {
                const shouldSelect = values.has(opt.value);
                if (opt.selected !== shouldSelect) {
                    opt.selected = shouldSelect;
                }
            });
            return;
        }
        const newVal = value ?? "";
        if ("value" in el && el.value !== newVal) el.value = newVal;
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
            if (el.textContent !== newVal) el.textContent = newVal;
        }
    };

    // API: useState
    function useState(initialValue, model = null, view = {}) {

        let data = initialValue;
        const sideEffect = { onSet: [], onChange: [] },
            domModel = getDomElements(model),
            viewConfig = [];

        if (view instanceof Object && !Array.isArray(view)) {
            for (const [selector, callback] of Object.entries(view)) {
                for (const el of getDomElements(selector)) {
                    viewConfig.push({
                        dom: el,
                        run: () => safeExec(callback, { state: data, el })
                    });
                }
            }
        } else {
            msg(`Invalid view configuration type: ${typeof view}`, 'warn');
        }

        // HELPER: sync DOM from state
        const syncModel = () => domModel.forEach(el => scheduleJob(() => syncDomElement(el, data)));
        const syncViewModel = () => viewConfig.forEach(item => scheduleJob(item.run));

        // HELPER: Bind state to element if found
        syncModel();
        syncViewModel();

        // HELPER: Bind DOM events
        domModel.forEach(el => {
            const handler = () => scheduleJob(() => stateAPI.set(extractDomValue(el)));
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                el.addEventListener('input', handler);
                el.addEventListener('change', handler);
            } else if (el instanceof HTMLSelectElement) {
                el.addEventListener('change', handler);
            }
        });

        // HELPER: Generate watch parameters
        const getWatchPayload = hasChange => ({ model: domModel, value: data, hasChange });

        // HELPER: Generate watch effects parameters
        const getWatchEffectPayload = () => ({ model: domModel, value: data });

        const stateAPI = {
            model: domModel,
            view: viewConfig,
            get value() { return data; },
            set(value) {
                if (typeof value === "function") value = value(data);

                const hasChange = !isEqual(data, value);
                data = value;

                // local watchers (onSet)
                sideEffect.onSet.forEach(w => {
                    safeExec(w.cleanup);
                    w.cleanup = safeExec(w.cb, getWatchPayload(hasChange));
                });

                // local watchers (onChange only if value changed)
                if (hasChange) {

                    // State → DOM
                    syncModel();
                    syncViewModel();

                    sideEffect.onChange.forEach(w => {
                        safeExec(w.cleanup);
                        w.cleanup = safeExec(w.cb, getWatchEffectPayload());
                    });
                }
                return data;
            },
            watch(cb) {
                if (typeof cb !== "function") return msg('watch callback must be a function', 'warn');
                sideEffect.onSet.push({ cb, cleanup: safeExec(cb, getWatchPayload(false)) });
            },
            watchEffect(cb, opt = { immediate: false }) {
                if (typeof cb !== "function") return msg('watchEffect callback must be a function', 'warn');
                const watcher = { cb, cleanup: null };
                if (opt?.immediate) watcher.cleanup = safeExec(cb, getWatchEffectPayload());
                sideEffect.onChange.push(watcher);
            }
        };
        allStates.add(stateAPI);
        return stateAPI;
    } // useState() end

    // API: useMemo
    function useMemo(factory, deps = []) {

        if (typeof factory !== "function") return msg('useMemo factory must be a function', 'warn');

        let memo, sideEffect = [];

        // HELPER: Generate watch effects parameters
        const getWatchEffectPayload = () => ({ value: memo });

        function compute() {
            memo = factory();
            // local watchers
            sideEffect.forEach(w => {
                safeExec(w.cleanup);
                w.cleanup = safeExec(w.cb, getWatchEffectPayload());
            });
            return memo;
        }

        // auto-subscribe to deps
        toArray(deps).forEach(dep => {
            const fn = () => scheduleJob(compute);
            (typeof dep.watchEffect === "function" ? dep.watchEffect : dep.watch)?.(fn);
        });

        compute(); // initial compute

        return {
            get value() { return memo; },
            watch(cb) {
                if (typeof cb !== "function") return msg("watch callback must be a function", 'warn');
                sideEffect.push({ cb, cleanup: safeExec(cb, getWatchEffectPayload()) });
            }
        };

    }// useMemo() end

    // API: global watcher
    function useEffect(cb, deps = null) {

        if (typeof cb !== "function") return msg("useEffect callback must be a function", 'warn');

        let cleanup;
        function effect() { safeExec(cleanup); cleanup = safeExec(cb); }

        // attach watchers to deps or all states if deps is undefined
        toArray(deps === null ? [...allStates] : deps).forEach(dep => {
            const fn = () => scheduleJob(effect);
            (typeof dep.watchEffect === "function" ? dep.watchEffect : dep.watch)?.(fn);
        });

        effect(); // deps is empty array or on-mount

    } // useEffect() end

    console.log(`%c${libraryName}`, 'color:cyan', version, 'initialized 🚀');

    return {
        version,
        useState,
        useMemo,
        useEffect,
    };
}