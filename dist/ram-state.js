/*!
 * RamStateJs v2.4.0
 * Description: A vanilla JavaScript state management library inspired by React’s useState, useEffect, and useMemo – but without any framework. It helps you manage stateful data and DOM bindings easily with reactive watchers and side effects.
 * Author: Ram Jam
 * GitHub: https://github.com/ramjam97/ram-state-js
 * Build Date: 2025-09-18 10:00:24 (Asia/Manila)
 */
function RamState(opt = {}) {

    // library version
    const version = "v2.4.0";

    // Keep track of all states (useState & useButton)
    const allStates = new Set();

    // group schedule to minimize re-renders
    const scheduleJob = createScheduler();

    // GLOBAL HELPER ------------------------------------------------> START


    // HELPER: create scheduler
    function createScheduler() {
        let queue = new Set();
        let isFlushing = false;

        function flush() {
            isFlushing = true;
            queue.forEach((job) => job());
            queue.clear();
            isFlushing = false;
        }

        return function schedule(job) {
            queue.add(job);
            if (!isFlushing) {
                Promise.resolve().then(flush);
            }
        };
    }


    // HELPER: deep equality
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

    // HELPER: Run callback
    const safeRun = (cb, payload) => {
        try {
            const result = payload ? cb(payload) : cb()
            return typeof result === 'function' ? result : null;
        } catch (err) {
            console.error("RamState callback error:", err);
            return null;
        }
    }

    // HELPER: Run cleanup
    const safeRunCleanUp = (cb) => {
        try {
            if (typeof cb === "function") cb();
        } catch (err) {
            console.error("RamState cleanup error:", err);
        }
    }


    // GLOBAL HELPER ------------------------------------------------> END



    // API: useState
    function useState(initialValue, selector = null) {

        let data = initialValue;

        const sideEffect = { onSet: [], onChange: [] };

        const dom = selector ? document.querySelector(selector) : null;

        // HELPER: Bind state to element if found
        if (dom) {
            // initialize DOM from state
            syncDomModel(dom, data);

            // DOM → State
            dom.addEventListener("input", () => {
                const newVal = extractDomValue(dom);
                stateAPI.set(newVal);
            });
            dom.addEventListener("change", () => {
                const newVal = extractDomValue(dom);
                stateAPI.set(newVal);
            });
        }

        // HELPER: Generate watch parameters
        const getWatchParams = hasChange => ({ dom, value: data, hasChange });

        // HELPER: Generate watch effects parameters
        const getWatchEffectParams = () => ({ dom, value: data });


        // HELPER: extract value from input/select/checkbox
        function extractDomValue(el) {
            if (el instanceof HTMLInputElement) {
                if (el.type === "checkbox") {
                    return el.checked;
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
        }


        // HELPER: sync DOM element with state
        function syncDomModel(el, value) {
            if (el instanceof HTMLInputElement) {
                if (el.type === "checkbox") {
                    const checked = Boolean(value);
                    if (el.checked !== checked) {
                        el.checked = checked;
                    }
                    return;
                }
            }
            if (el instanceof HTMLSelectElement) {
                if (el.multiple && Array.isArray(value)) {
                    const values = new Set(value.map(String)); // normalize
                    Array.from(el.options).forEach(opt => {
                        const shouldSelect = values.has(opt.value);
                        if (opt.selected !== shouldSelect) {
                            opt.selected = shouldSelect;
                        }
                    });
                    return;
                }
            }
            // fallback: text, textarea, single-select, etc.
            const newValue = value ?? "";
            if (el.value !== newValue) {
                el.value = newValue;
            }
        }

        const stateAPI = {
            dom,
            get value() {
                return data;
            },
            set(value) {
                if (typeof value === "function") {
                    value = value(data);
                }

                const hasChange = !isEqual(data, value);

                data = value;

                // State → DOM
                if (dom) syncDomModel(dom, data);

                // local watchers (onSet)
                sideEffect.onSet.forEach(w => {
                    safeRunCleanUp(w.cleanup);
                    w.cleanup = safeRun(w.cb, getWatchParams(hasChange));
                });

                // local watchers (onChange only if value changed)
                if (hasChange) {
                    sideEffect.onChange.forEach(w => {
                        safeRunCleanUp(w.cleanup);
                        w.cleanup = safeRun(w.cb, getWatchEffectParams());
                    });
                }

                return data;
            },
            watch(cb) {
                if (typeof cb !== "function") {
                    console.warn("watch callback must be a function");
                    return;
                }
                sideEffect.onSet.push({ cb, cleanup: safeRun(cb, getWatchParams(false)) });
            },
            watchEffect(cb, executeOnMount = false) {
                if (typeof cb !== "function") {
                    console.warn("watchEffect callback must be a function");
                    return;
                }

                const watcher = { cb, cleanup: null };
                if (executeOnMount) {
                    watcher.cleanup = safeRun(cb, getWatchEffectParams());
                }
                sideEffect.onChange.push(watcher);
            }
        };

        allStates.add(stateAPI);

        return stateAPI;

    } // useState() end


    // API: useButton
    function useButton(selectorOrDOM, opt = {}) {

        // HELPER: build options structure
        const options = {
            state: {
                disabled: opt?.state?.disabled ?? false,
                loading: opt?.state?.loading ?? false
            },
            disabled: {
                class: opt?.disabled?.class ?? "disabled",
            },
            loading: {
                html: opt?.loading?.html ?? "",
                icon: opt?.loading?.icon ?? "",
                class: opt?.loading?.class ?? "loading",
            }
        }

        // API: DOM elements with state and default attributes
        const elements = [...getDomElements(selectorOrDOM)].map(item => {

            if (typeof options.loading.html === 'function') {
                options.loading.html = options.loading.html(item.innerHTML);
            }

            return {
                el: item,
                default: {
                    html: item.innerHTML
                },
                loading: {
                    html: options.loading.html || item.innerHTML,
                    icon: options.loading.icon,
                    class: options.loading.class
                },
                disabled: {
                    class: options.disabled.class
                }
            }
        });

        // API: get DOM elements
        const dom = elements.map(item => item.el);

        // HELPER: init state object
        let state = {
            disabled: options.state.disabled,
            loading: options.state.loading,
        };

        // HELPER: side effects placeholder
        const sideEffect = { onSet: [], onChange: [] };

        // HELPER: Generate watch parameters
        const getWatchParams = hasChange => ({ dom, state, hasChange });

        // HELPER: Generate watch effects parameters
        const getWatchEffectParams = () => ({ dom, state });

        // HELPER: update DOM
        const updateRender = (stateData) => {
            elements.forEach(item => {

                const { el } = item;

                const configDefault = item.default;
                const configLoading = item.loading;
                const configDisabled = item.disabled;

                el.disabled = stateData.disabled || stateData.loading;
                el.classList.toggle(configLoading.class, stateData.loading);
                el.classList.toggle(configDisabled.class, stateData.disabled);
                el.innerHTML = (stateData.loading ? configLoading.html : configDefault.html)
                    + (stateData.loading ? configLoading.icon : '');
            });
        }

        // HELPER: setters
        function set(value) {

            const hasChange = !isEqual(state, value);
            state = value;

            // State → DOM
            updateRender(state);

            // local watchers (onSet)
            sideEffect.onSet.forEach(w => {
                safeRunCleanUp(w.cleanup);
                w.cleanup = safeRun(w.cb, getWatchParams(hasChange));
            });

            // local watchers (onChange only if value changed)
            if (hasChange) {
                sideEffect.onChange.forEach(w => {
                    safeRunCleanUp(w.cleanup);
                    w.cleanup = safeRun(w.cb, getWatchEffectParams());
                });
            }

            return state;
        }

        // HELPER: get DOM elements and return as array of elements
        function getDomElements() {
            if (selectorOrDOM instanceof HTMLElement) return [selectorOrDOM];
            if (typeof selectorOrDOM === "string") return Array.from(document.querySelectorAll(selectorOrDOM));
            return [];
        }

        const stateAPI = {
            dom,
            get value() {
                return state;
            },
            disabled(isDisabled = true) {
                return set({ ...state, ...{ disabled: isDisabled } })
            },
            loading(isLoading = true) {
                return set({ ...state, ...{ loading: isLoading, disabled: isLoading } })
            },
            watch(cb) {
                if (typeof cb !== "function") {
                    console.warn("watch callback must be a function");
                    return;
                }
                sideEffect.onSet.push({ cb, cleanup: safeRun(cb, getWatchParams(false)) });
            },
            watchEffect(cb, executeOnMount = false) {
                if (typeof cb !== "function") {
                    console.warn("watchEffect callback must be a function");
                    return;
                }
                const watcher = { cb, cleanup: null };
                if (executeOnMount) {
                    watcher.cleanup = safeRun(cb, getWatchEffectParams());
                }
                sideEffect.onChange.push(watcher);
            }
        };

        allStates.add(stateAPI);

        return stateAPI;

    } // useButton() end

    // API: global watcher
    function useEffect(cb, deps = null) {

        if (typeof cb !== "function") {
            console.warn("useEffect callback must be a function");
            return;
        }

        let cleanup;

        function effect() {
            safeRunCleanUp(cleanup);
            cleanup = safeRun(cb);
        }

        if (deps === null || deps === undefined) {
            // deps is undefined or null
            allStates.forEach((dep) => dep?.watchEffect(() => scheduleJob(effect)));
        } else if (Array.isArray(deps)) {
            // deps is not empty array
            deps.forEach((dep) => dep?.watchEffect(() => scheduleJob(effect)));
        }

        // deps is empty array or on-mount
        effect();

    } // useEffect() end

    // API: useMemo
    function useMemo(factory, deps = []) {

        let memoizedValue;

        // side effects
        let sideEffect = [];

        // HELPER: Generate watch effects parameters
        const getWatchEffectParams = () => ({ value: memoizedValue });

        function compute() {

            memoizedValue = factory();

            // local watchers
            sideEffect.forEach(w => {
                safeRunCleanUp(w.cleanup);
                w.cleanup = safeRun(w.cb, getWatchEffectParams());
            });

            return memoizedValue;
        }

        // auto-subscribe to deps
        deps.forEach((dep) => dep?.watchEffect(() => scheduleJob(compute)));

        // initial compute
        compute();

        return {
            get value() {
                return memoizedValue;
            },
            watch(cb) {
                if (typeof cb !== "function") {
                    console.warn("watchEffect callback must be a function");
                    return;
                }
                sideEffect.push({ cb, cleanup: safeRun(cb, getWatchEffectParams()) });
            }
        };

    }// useMemo() end

    if (opt.debug ?? true) console.log('%cRamState', 'color:cyan', version, 'initialized 🚀');

    return {
        useState,
        useEffect,
        useMemo,
        useButton
    };

}
