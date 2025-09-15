
# RamStateJs

Lightweight state management library for **vanilla JavaScript**.

Version: 2.3.0  
GitHub: https://github.com/ramjam97/ram-state-js  
Author: Ram Jam

---

## 📌 Introduction

RamStateJs is a lightweight state management library for vanilla JavaScript. It provides a simple API to manage local and global state with watchers, effects, and DOM binding, inspired by React’s useState and useEffect.

RamStateJs is a lightweight state management library for vanilla JavaScript. It provides a simple API to manage local and global state with watchers, effects, DOM binding, and button states — inspired by React’s ``useState`` and ``useEffect``.

- Supports direct and functional updates
- Works with inputs, selects, textareas, and checkboxes
- Automatic DOM binding (two-way sync)
- Watchers for local effects
- Global effects with dependency tracking
- Cleanup support
- ``useButton`` for button state handling (loading, disabled)
- Lightweight, no dependencies

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

### 1. Basic State

```js
const counter = useState(0);

console.log(counter.value); // 0
counter.set(5);
console.log(counter.value); // 5
```

Functional updates:

```js
counter.set(v => v + 1);
```

---

### 2. Bind State to DOM

```html
<input id="nameInput" type="text">
```

```js
const name = useState("", "#nameInput");

name.watch(({ value }) => {
  console.log("Name updated:", value);
});
```

- State → DOM: Updates input value when state changes  
- DOM → State: Updates state when input changes

---

### 3. Watch vs WatchEffect

```js
const age = useState(18);

// watch → runs on every set
age.watch(({ value, hasChange }) => {
  console.log("watch:", value, "changed?", hasChange);
});

// watchEffect → runs only when value changes
age.watchEffect(({ value }) => {
  console.log("watchEffect:", value);
});
```

---

### 4. Global Effects (useEffect)

```js
const first = useState("A");
const second = useState("B");

// runs once at mount
useEffect(() => {
  console.log("Mounted");
}, []);

// runs whenever ANY state updates
useEffect(() => {
  console.log("Global effect triggered");
}, null);

// runs only when `first` changes
useEffect(() => {
  console.log("First changed:", first.value);
}, [first]);

// runs only when `first` and `second` changes
useEffect(() => {
  console.log("First changed:", first.value);
  console.log("Second changed:", second.value);
}, [first, second]);

```

---

### 5. Cleanup Example

Both local watchers and global effects can return a cleanup function:

```js
const message = useState("Hello");

message.watchEffect(({ value }) => {
  
  const interval = setInterval(() => {
    console.log("Repeating:", value);
  }, 1000);

  // cleanup
  return () => clearInterval(interval);
}, true);
```

---

### 6. Button State (useButton)

```html
<button id="submitBtn">Submit</button>
```

```js
const btn = useButton("#submitBtn", {
  state: { disabled: false, loading: false },
  loading: { html: "Loading...", icon: "⏳" }
});

// disable button
btn.disabled(true);

// enable loading state
btn.loading(true);

// watch changes
btn.watch(({ state }) => {
  console.log("Button state changed:", state);
});

```
- Automatically toggles ``disabled`` and ``loading`` 
- Replaces button inner HTML when loading 
- Provides watchers just like ``useState`` 

---

## 🔑 API Reference

### `useState(initialValue, selector?)`
Creates a state instance.

- `initialValue`: starting value of the state  
- `selector`: optional CSS selector to bind state to a DOM element

Returns an object:
- `.value` → get current value
- `.set(value | fn)` → update value (direct or functional)
- `.watch(cb, executeOnMount?)` → runs on every `.set()`
- `.watchEffect(cb, executeOnMount?)` → runs only when value changes
- `.dom` → bound DOM element (if any)
---

### `useButton(selectorOrDOM, options?)`
Manages button state (loading, disabled).

- `selectorOrDOM`: CSS selector or DOM element(s)  
- `options`: 
  - `state.disabled`: initial disabled state  
  - `state.loading`: initial loading state  
  - `disabled.class`: classname for disabled state, default ``disabled``  
  - `loading.class`: classname for loading state, default ``loading``
  - `loading.html`: HTML/text to show while loading  
  - `loading.icon`: icon to append while loading  

Returns:
- `.dom`: → return array of elements from ``querySelectorAll`` 
- `.value`: → get current button state
- ``.disabled(bool)`` → enable/disable button
- ``.loading(bool)`` → enable/disable button with loading indicator
- `.watch(cb, executeOnMount?)` → runs on every `.disabled()` and ``.loading()``
- `.watchEffect(cb, executeOnMount?)` → runs only when value changes


### `useEffect(cb, deps?)`
Registers a global side effect.

- `cb`: callback function (can return cleanup)  
- `deps`:  
  - `null`: runs on all state changes  
  - `[]`: runs only once at mount  
  - `[state, ...]`: runs when specific states change  

---

## 🛠 Helpers

- Deep equality check for arrays/objects
- Automatic two-way binding with supported DOM elements
- Safe execution with error handling

---

## 📜 License

MIT License