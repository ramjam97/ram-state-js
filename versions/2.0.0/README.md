
# RamStateJs

Lightweight state management library for **vanilla JavaScript**.

Version: 1.0.0  
GitHub: https://github.com/ramjam97/ram-state-js  
Author: Ram Jam

---

## 📌 Introduction

RamStateJs provides a simple and efficient way to manage state in plain JavaScript applications.  
It is inspired by React's `useState` and `useEffect` but works natively with DOM elements.

- Supports direct and functional updates
- Works with inputs, selects, textareas, and checkboxes
- Automatic DOM binding (two-way sync)
- Watchers for local effects
- Global effects with dependency tracking
- Cleanup support
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
<script src="https://cdn.jsdelivr.net/gh/ramjam97/ram-state-js@v1.0.0/dist/ram-state.min.js"></script>
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

console.log(counter.get()); // 0
counter.set(5);
console.log(counter.get()); // 5
```

Functional updates:

```js
counter.set(prev => prev + 1);
```

---

### 2. Bind State to DOM

```html
<input id="nameInput" type="text">
```

```js
const name = useState("", "#nameInput");

name.watch(({ data }) => {
  console.log("Name updated:", data);
});
```

- State → DOM: Updates input value when state changes  
- DOM → State: Updates state when input changes

---

### 3. Watch vs WatchEffect

```js
const age = useState(18);

// watch → runs on every set
age.watch(({ data, hasChange }) => {
  console.log("watch:", data, "changed?", hasChange);
});

// watchEffect → runs only when value changes
age.watchEffect(({ data }) => {
  console.log("watchEffect:", data);
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
  console.log("First changed:", first.get());
}, [first]);
```

---

### 5. Cleanup Example

Both local watchers and global effects can return a cleanup function:

```js
const message = useState("Hello");

message.watchEffect(({ data }) => {
  const interval = setInterval(() => {
    console.log("Repeating:", data);
  }, 1000);

  // cleanup
  return () => clearInterval(interval);
}, true);
```

---

## 🔑 API Reference

### `useState(initialValue, selector?)`
Creates a state instance.

- `initialValue`: starting value of the state  
- `selector`: optional CSS selector to bind state to a DOM element

Returns an object:
- `.get()` → get current value
- `.set(value | fn)` → update value (direct or functional)
- `.watch(cb, executeOnMount?)` → runs on every `.set()`
- `.watchEffect(cb, executeOnMount?)` → runs only when value changes

---

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
