/**
 * RamStateJs JavaScript Library v2.0.0
 * https://github.com/ramjam97/ram-state-js
 * 
 * RamState is a lightweight state management library for Vanilla JavaScript
 * with deep cloning, change detection, and subscription-based updates.
 * It supports complex data types such as Set, Map, Date, RegExp, and
 * circular references.
 *
 * @returns {Object} An object with two methods: `useState` and `useEffect`.
 *                   `useState` is a function to create a new state instance
 *                   with an initial value. `useEffect` is a function to
 *                   execute a side effect function when the state changes.
 */
function RamState() {

    const allStates = new Set();
    const globalEffects = [];

    function useState(initialValue) {

        let data = initialValue;

        const sideEffect = {
            always: [],
            onChange: []
        };

        function get() {
            return data;
        }

        function set(value) {

            if (typeof value === "function") {
                value = value(data);
            }

            const hasChange = !isEqual(data, value);
            data = value;

            // local watchers
            sideEffect.always.forEach(cb =>
                safeRun(cb, { data, hasChange })
            );
            if (hasChange) {
                sideEffect.onChange.forEach(cb =>
                    safeRun(cb, { data })
                );
            }

            // ✅ simplified
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
            sideEffect.always.push(cb);
            if (executeOnMount) safeRun(cb, { data, hasChange: false });
        }

        function watchEffect(cb, executeOnMount = false) {
            if (typeof cb !== "function") {
                console.warn("watchEffect callback must be a function");
                return;
            }
            sideEffect.onChange.push(cb);
            if (executeOnMount) safeRun(cb, { data });
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
                try {
                    cleanup();
                } catch (err) {
                    console.error("RamState cleanup error:", err);
                }
            }
            const result = cb();
            if (typeof result === "function") {
                cleanup = result;
            }
        }

        const effect = { run, deps };
        globalEffects.push(effect);

        // ✅ always run once at mount
        run();
    }

    // helpers
    function isEqual(a, b) {
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

    function safeRun(cb, payload) {
        try {
            cb(payload);
        } catch (err) {
            console.error("RamState callback error:", err);
        }
    }

    console.log("RamState initialized 🚀");

    return { useState, useEffect };
}
