/*!
 * RamStateJs v3.0.0
 * Description: A vanilla JavaScript state management library inspired by React’s useState, useEffect, and useMemo – but without any framework. It helps you manage stateful data and DOM bindings easily with reactive watchers and side effects.
 * Author: Ram Jam
 * GitHub: https://github.com/ramjam97/ram-state-js
 * Build Date: 2025-10-03 17:57:27 (Asia/Manila)
 */
function RamState() {

    const version = "v3.0.0",   /* Library version */
        allStates = new Set(),  /* Keep track of all states (useState & useButton) */
        scheduleJob = (() => {  /* Group schedule to minimize re-renders */
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
            console.error("RamState execution error:", err);
            return null;
        }
    };

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
    const syncDomModel = (el, value) => {
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
    function useState(initialValue, selectorsOrDom = null) {

        let data = initialValue;
        const sideEffect = { onSet: [], onChange: [] }, dom = getDomElements(selectorsOrDom);

        // HELPER: Bind state to element if found
        dom.forEach(el => {
            syncDomModel(el, data); // initialize DOM from state
            ['input', 'change'].forEach(evt => el.addEventListener(evt, () => stateAPI.set(extractDomValue(el))));
        });

        // HELPER: Generate watch parameters
        const getWatchData = hasChange => ({ dom, value: data, hasChange });

        // HELPER: Generate watch effects parameters
        const getWatchEffectData = () => ({ dom, value: data });

        const stateAPI = {
            dom,
            get value() { return data; },
            set(value) {
                if (typeof value === "function") value = value(data);
                const hasChange = !isEqual(data, value);
                data = value;

                // State → DOM
                dom.forEach(el => syncDomModel(el, data));

                // local watchers (onSet)
                sideEffect.onSet.forEach(w => {
                    safeExec(w.cleanup);
                    w.cleanup = safeExec(w.cb, getWatchData(hasChange));
                });

                // local watchers (onChange only if value changed)
                if (hasChange) {
                    sideEffect.onChange.forEach(w => {
                        safeExec(w.cleanup);
                        w.cleanup = safeExec(w.cb, getWatchEffectData());
                    });
                }
                return data;
            },
            watch(cb) {
                if (typeof cb !== "function") return console.warn("watch callback must be a function");
                sideEffect.onSet.push({ cb, cleanup: safeExec(cb, getWatchData(false)) });
            },
            watchEffect(cb, executeOnMount = false) {
                if (typeof cb !== "function") return console.warn("watchEffect callback must be a function");
                const watcher = { cb, cleanup: null };
                if (executeOnMount) watcher.cleanup = safeExec(cb, getWatchEffectData());
                sideEffect.onChange.push(watcher);
            }
        };
        allStates.add(stateAPI);
        return stateAPI;
    } // useState() end

    // API: useMemo
    function useMemo(factory, deps = []) {

        if (typeof factory !== "function") return console.warn("useMemo factory must be a function");

        let memo, sideEffect = [];

        // HELPER: Generate watch effects parameters
        const getWatchEffectData = () => ({ value: memo });

        function compute() {
            memo = factory();
            // local watchers
            sideEffect.forEach(w => {
                safeExec(w.cleanup);
                w.cleanup = safeExec(w.cb, getWatchEffectData());
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
                if (typeof cb !== "function") return console.warn("watch callback must be a function");
                sideEffect.push({ cb, cleanup: safeExec(cb, getWatchEffectData()) });
            }
        };

    }// useMemo() end

    // API: global watcher
    function useEffect(cb, deps = null) {

        if (typeof cb !== "function") return console.warn("useEffect callback must be a function");

        let cleanup;

        function effect() { safeExec(cleanup); cleanup = safeExec(cb); }

        // attach watchers to deps or all states if deps is undefined
        toArray(deps === null ? allStates : deps).forEach(dep => {
            const fn = () => scheduleJob(effect);
            (typeof dep.watchEffect === "function" ? dep.watchEffect : dep.watch)?.(fn);
        });

        effect(); // deps is empty array or on-mount

    } // useEffect() end
    console.log('%cRamState', 'color:cyan', version, 'initialized 🚀');
    return {
        version,
        useState,
        useMemo,
        useEffect,
    };
}