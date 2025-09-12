function RamState(opt = {}) {

    // library version
    const version = "v2.4.0";

    // Keep track of all states
    const allStates = new Set();
    const globalEffects = [];

    // GLOBAL HELPER ------> START

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


    // HELPER: run global watchers
    const runGlobalEffects = (stateAPI, hasChange = true) => {
        globalEffects.forEach(({ run, deps }) => {
            if (deps === null) {
                run();
            } else if (hasChange && deps.length > 0 && deps.includes(stateAPI)) {
                run();
            }
            // deps === [] -> skip (already ran once at mount)
        });
    }

    // GLOBAL HELPER ------> END



    // API: useState
    function useState(initialValue, selector = null) {

        let data = initialValue;

        const sideEffect = {
            always: [],
            onChange: []
        };

        const dom = selector ? document.querySelector(selector) : null;

        // Bind state to element if found
        if (dom) {
            // initialize DOM from state
            syncDom(dom, data);

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
        function syncDom(el, value) {
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
                if (dom) syncDom(dom, data);

                // local watchers (always)
                sideEffect.always.forEach(w => {
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

                // excute global watchers
                runGlobalEffects(stateAPI, hasChange);

                return data;
            },
            watch(cb, executeOnMount = false) {
                if (typeof cb !== "function") {
                    console.warn("watch callback must be a function");
                    return;
                }
                const watcher = { cb, cleanup: null };
                if (executeOnMount) {
                    watcher.cleanup = safeRun(cb, getWatchParams(false));
                }
                sideEffect.always.push(watcher);
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

    // API: global watcher
    function useEffect(cb, deps = null) {

        if (typeof cb !== "function") {
            console.warn("useEffect callback must be a function");
            return;
        }

        let cleanup;

        const effect = {
            deps,
            run() {
                safeRunCleanUp(cleanup);
                cleanup = safeRun(cb);
            }
        };
        globalEffects.push(effect);

        /* 
        * always run once at mount
        * deps === []
        */
        effect.run();
    } // useEffect() end

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
        const sideEffect = {
            always: [],
            onChange: []
        };

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

            // local watchers (always)
            sideEffect.always.forEach(w => {
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

            // excute global watchers
            runGlobalEffects(stateAPI, hasChange);

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
            watch(cb, executeOnMount = false) {
                if (typeof cb !== "function") {
                    console.warn("watch callback must be a function");
                    return;
                }
                const watcher = { cb, cleanup: null };
                if (executeOnMount) {
                    watcher.cleanup = safeRun(cb, getWatchParams(false));
                }
                sideEffect.always.push(watcher);
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


    // API: useMemo
    function useMemo(factory, deps = []) {

        let memoizedValue;

        // side effects
        let sideEffect = { onChange: [] };

        // HELPER: Generate watch effects parameters
        const getWatchEffectParams = () => ({ value: memoizedValue });

        function compute() {
            
            memoizedValue = factory();

            // local watchers
            sideEffect.onChange.forEach(w => {
                safeRunCleanUp(w.cleanup);
                w.cleanup = safeRun(w.cb, getWatchEffectParams());
            });

            // execute global watchers
            runGlobalEffects(valueAPI, true);

            return memoizedValue;
        }

        // auto-subscribe to deps
        deps.forEach((dep) => dep?.watchEffect(() => compute()));

        // API: useMemo 
        const valueAPI = {
            get value() {
                return memoizedValue;
            },
            watchEffect(cb) {
                if (typeof cb !== "function") {
                    console.warn("watchEffect callback must be a function");
                    return;
                }
                const watcher = { cb, cleanup: null };
                watcher.cleanup = safeRun(cb, getWatchEffectParams());
                sideEffect.onChange.push(watcher);
            }
        };

        // initial compute
        compute();

        return valueAPI;

    }// useMemo() end

    if (opt.debug ?? true) console.log(`RamState ${version} initialized 🚀`);

    return {
        useState,
        useEffect,
        useMemo,
        useButton
    };

}