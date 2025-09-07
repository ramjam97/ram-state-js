/*!
 * RamStateJs v2.0.0
 * Description: RamStateJs is a lightweight state management library designed specifically for vanilla JavaScript.
 * Author: Ram Jam
 * GitHub: https://github.com/ramjam97/ram-state-js
 */
function RamState() {

    const allStates = new Set();
    const globalEffects = [];

    function useState(initialValue, selector = null) {

        let data = initialValue;

        const sideEffect = {
            always: [],
            onChange: []
        };

        const element = selector ? document.querySelector(selector) : null;

        // 🔗 Bind state to element if found
        if (element) {
            // initialize DOM from state
            syncDom(element, data);

            // DOM → State
            element.addEventListener("input", () => {
                const newVal = extractDomValue(element);
                set(newVal);
            });
            element.addEventListener("change", () => {
                const newVal = extractDomValue(element);
                set(newVal);
            });
        }


        function get() {
            return data;
        }

        function set(value) {

            if (typeof value === "function") {
                value = value(data);
            }

            const hasChange = !isEqual(data, value);
            data = value;

            // State → DOM
            if (element) syncDom(element, data);

            // local watchers (always)
            sideEffect.always.forEach(w => {
                if (typeof w.cleanup === "function") {
                    safeRunCleanUp(w.cleanup);
                }
                w.cleanup = safeRun(w.cb, { data, hasChange });
            });

            // local watchers (onChange only if value changed)
            if (hasChange) {
                sideEffect.onChange.forEach(w => {
                    if (typeof w.cleanup === "function") {
                        safeRunCleanUp(w.cleanup);
                    }
                    w.cleanup = safeRun(w.cb, { data });
                });
            }

            // global watchers
            globalEffects.forEach(({ run, deps }) => {
                if (deps === null) {
                    run();
                } else if (hasChange && deps.length > 0 && deps.includes(stateAPI)) {
                    run();
                }
                // deps === [] -> skip (already ran once at mount)
            });

            return data;
        }

        function watch(cb, executeOnMount = false) {

            if (typeof cb !== "function") {
                console.warn("watch callback must be a function");
                return;
            }
            const watcher = { cb, cleanup: null };
            sideEffect.always.push(watcher);
            if (executeOnMount) {
                watcher.cleanup = safeRun(cb, { data, hasChange: false });
            }

        }

        function watchEffect(cb, executeOnMount = false) {
            if (typeof cb !== "function") {
                console.warn("watchEffect callback must be a function");
                return;
            }
            const watcher = { cb, cleanup: null };
            sideEffect.onChange.push(watcher);
            if (executeOnMount) {
                watcher.cleanup = safeRun(cb, { data });
            }
        }

        const stateAPI = { get, set, watch, watchEffect };
        allStates.add(stateAPI);

        return stateAPI;
    }

    function useEffect(cb, deps = null) {
        if (typeof cb !== "function") {
            console.warn("useEffect callback must be a function");
            return;
        }

        let cleanup;
        function run() {
            if (typeof cleanup === "function") {
                safeRunCleanUp(cleanup);
            }
            cleanup = safeRun(cb);
        }

        const effect = { run, deps };
        globalEffects.push(effect);

        // ✅ always run once at mount
        run();
    }

    // 🔹 Helper: extract value from input/select/checkbox
    const extractDomValue = (el) => {
        if (el instanceof HTMLInputElement) {
            if (el.type === "checkbox") return el.checked;
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
    }

    // 🔹 Helper: sync DOM element with state
    const syncDom = (el, value) => {
        if (el instanceof HTMLInputElement) {
            if (el.type === "checkbox") {
                el.checked = !!value;
            } else {
                el.value = value ?? "";
            }
        } else if (el instanceof HTMLSelectElement) {
            if (el.multiple && Array.isArray(value)) {
                [...el.options].forEach(opt => {
                    opt.selected = value.includes(opt.value);
                });
            } else {
                el.value = value ?? "";
            }
        } else if (el instanceof HTMLTextAreaElement) {
            el.value = value ?? "";
        }
    }

    // helpers
    const isEqual = (a, b) => {

        if (a === b) return true;
        if (typeof a !== typeof b) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length && a.every((v, i) => isEqual(v, b[i]));
        }

        if (a && b && typeof a === "object") {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(k => isEqual(a[k], b[k]));
        }

        return false;
    }

    // helpers
    const safeRun = (cb, payload) => {
        try {
            const result = payload ? cb(payload) : cb()
            return result ? result : null;
        } catch (err) {
            console.error("RamState callback error:", err);
            return null;
        }
    }

    const safeRunCleanUp = (cb) => {
        try {
            cb();
        } catch (err) {
            console.error("RamState cleanup error:", err);
        }
    }

    console.log("RamState initialized 🚀");

    return { useState, useEffect };
}