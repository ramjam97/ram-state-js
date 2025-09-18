
# RamStateJs

Version: 2.4.0  
GitHub: https://github.com/ramjam97/ram-state-js  
Author: Ram Jam

---

## 📌 Introduction

A **vanilla JavaScript state management library** inspired by React’s ``useState``, ``useEffect``, and ``useMemo`` – but without any framework.
It helps you manage **stateful data** and **DOM bindings** easily with reactive watchers and side effects.

## 🚀 Features

- ✅ ``useState`` → Create reactive state with DOM binding support.
- ✅ ``useEffect`` → Run side effects when dependencies change.
- ✅ ``useMemo`` → Cache computed values with dependency tracking.
- ✅ ``useButton`` → Manage ``loading`` & ``disabled`` states for buttons.
- ✅ Automatic DOM binding for ``<input>``, ``<select>``, ``<textarea>``.
- ✅ Watchers with cleanup support.
- ✅ Internal scheduler to batch updates (avoids unnecessary re-renders).

---

## ⚙️ Installation
### Option 1: Download
Download the minified file and include it in your project:

```html
<script src="ram-state.min.js"></script>
```

### Option 2: CDN
Use the jsDelivr CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/ramjam97/ram-state-js@v2.4.0/dist/ram-state.min.js"></script>
```


### Initialize RamState

```js
const { useState, useEffect } = RamState();
```

---

## 🚀 Usage

### 1. ``useState``

```js
const { useState } = RamState();

const name = useState("John", "#nameInput");

// Watch every set (always fires)
name.watch(({ value, hasChange }) => {
  console.log("Set →", value, "changed:", hasChange);

  // clean up (optional)
  return () => console.log('clean up:', value);
});

// Watch only when value changes
name.watchEffect(({ value }) => {
  console.log("Changed →", value);
  
  // clean up (optional)
  return () => console.log('clean up:', value);
}, true);

// Update state
name.value;     // "John"
name.set("Jane");
```

✅ Automatically syncs with DOM if you provide a selector.

```html
<input id="nameInput" type="text" />

```

### 2. ``useEffect``

```js
const { useState, useEffect } = RamState();

const count = useState(0);

// Re-run whenever count changes
useEffect(() => {
  console.log("Count changed:", count.value);

  // clean up (optional)
  return () => console.log('clean up');
}, [count]);

// Runs once at mount
useEffect(() => {
  console.log("Mounted");
}, []);

// Run on every state change
useEffect(() => {
  console.log("Something changed!");

  // clean up (optional)
  return () => console.log('clean up');
});

```


### 3. ``useMemo``
```js
const { useState, useMemo } = RamState();

const num1 = useState(10);
const num2 = useState(20);

const sum = useMemo(() => num1.value + num2.value, [num1, num2]);

sum.watch(({ value }) => {
  console.log("Sum updated:", value);
});

console.log(sum.value); // 30

num1.set(50); 
// auto recomputes → Sum updated: 70

```

### 4. ``useButton``
```js
const { useButton } = RamState();

// Link to a button by selector
const saveBtn = useButton("#saveBtn", {
  loading: { html: "Saving...", icon: " ⏳" },
  disabled: { class: "btn-disabled" }
});

// Watch button state
saveBtn.watch(({ state }) => {
  console.log("Button set:", state);
});

// Watch only when it changes
saveBtn.watchEffect(({ state }) => {
  console.log("Button changed:", state);
}, true);

// Trigger state changes
saveBtn.loading(true);   // shows "Saving... ⏳"
setTimeout(() => saveBtn.loading(false), 2000);

```
✅ Works with multiple buttons too:
```html
const multiBtn = useButton(".submitBtn");
multiBtn.disabled(true);
```
🧪 Example HTML
```html
<input id="nameInput" placeholder="Type your name..." />
<button id="saveBtn">Save</button>
```



## 🔑 API Reference

## `RamState(options?)`
Creates a new instance.
```js
const { useState, useEffect, useMemo, useButton } = RamState({ debug: true });
```
**Options**
| Key   | Type    | Default | Description               |
| ----- | ------- | ------- | ------------------------- |
| debug | boolean | `true`  | Logs version info on init |




## `useState(initialValue, selector?)`
Creates a reactive state.   

**Parameters**
- ``initialValue`` → Initial state value.
- ``selector?`` → Optional CSS selector to auto-bind DOM element.



**API**
| Method / Prop                              | Description                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `.value` (getter)                          | Returns current state.                                                      |
| `.set(valueOrFn)`                          | Updates state. Accepts value or updater `(prev) => next`.                   |
| `.watch(cb)`                               | Fires on every `.set()` (even if unchanged).                                |
| `.watchEffect(cb, executeOnMount = false)` | Fires only when value changes. Runs immediately if `executeOnMount = true`. |



## ``useEffect(callback, deps?)``
Runs a side effect when dependencies change.    

**Parameters**
- ``callback`` → Effect function (can return cleanup).
- ``deps`` → Array of state dependencies, or ``null`` for all states.



## ``useMemo(factory, deps)``
Caches computed values and recomputes when dependencies change.

**Parameters**
- ``factory`` → Function that computes the value.
- ``deps`` → Array of state dependencies.


| Method / Prop     | Description                           |
| ----------------- | ------------------------------------- |
| `.value` (getter) | Returns memoized value.               |
| `.watch(cb)`      | Subscribes to memoized value updates. |



## ``useButton(selectorOrDOM, options?)``
Manages button states (``loading``, ``disabled``).

**Parameters**
- ``selectorOrDOM`` → DOM element or CSS selector (supports multiple).
- ``options`` → Customize button behavior.
```js
{
  state: { disabled: false, loading: false },
  disabled: { class: "disabled" },
  loading: { html: "", icon: "", class: "loading" }
}

```
**API**
| Method / Prop                              | Description                                          |
| ------------------------------------------ | ---------------------------------------------------- |
| `.value` (getter)                          | Returns `{ disabled, loading }`.                     |
| `.disabled(true/false)`                    | Toggles disabled state.                              |
| `.loading(true/false)`                     | Toggles loading state (also disables while loading). |
| `.watch(cb)`                               | Fires on every `.set()`.                             |
| `.watchEffect(cb, executeOnMount = false)` | Fires only on state changes.                         |


---


## 📝 Changelog v2.4.0
- 🔄 **New Scheduler** → batches state updates to reduce re-renders.
- 🆕 ``useButton`` **API** → manage button states (loading, disabled).
- 🆕 ``useMemo`` **API** → memoize computed values with dependency tracking.
- ⚡ Optimized DOM updates → only updates if value differs.
- 🛡 Improved error handling for watchers and effects.
- 🧹 Cleanup support in watchers.

---


## 📜 License

MIT License