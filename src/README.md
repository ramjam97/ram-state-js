
# RamStateJs

Version: 3.0.0  
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
- ✅ Automatic DOM binding for input-like elements (``<input>``, ``<select>``, ``<textarea>``) including regular elements (``<div>``, ``<span>``, ``<p>``, etc.)
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
<script src="https://cdn.jsdelivr.net/gh/ramjam97/ram-state-js@v3.0.0/dist/ram-state.min.js"></script>
```


### Initialize RamState

```js
const { version, useState, useMemo, useEffect } = RamState();

// ramstate version
console.log(version) // v3.0.0
```


---

## 🚀 Usage

### 1. ``useState``

#### Example 1: Basic
```js
const { useState } = RamState();

const counter = useState(0);

// update state value
counter.set(1);

// update state value using function
counter.set(c => c+1);

// get current state value
console.log(counter.value); // 2

// watch every set (always fires)
counter.watch(({ value, hasChange }) => {
  
  console.log("Set →", value, "changed:", hasChange);
  
  return () => console.log("Clean up"); // cleanup (optional)

});

// watch only when value changes
counter.watchEffect(({ value }) => {
  
  console.log("Changed →", value);
  
  return () => console.log("Clean up"); // cleanup 

}, true);
```


#### Example 2: Data Binding for regular elements (div, span, p, etc.)
```js
const { useState } = RamState();

const counter = useState(0, "#counterText");
```
✅ Automatically syncs with DOM if you provide a selector.
```html
<span id="counterText"></span>
```



#### Example 3: Data Binding for Input-like elements (input, select, textarea)
```js
const { useState } = RamState();

// example of multiple DOM Bindings

// example 1: using string
const name = useState("John", "#nameInput,.nameText"); 

// example 2: using array of strings
const name = useState("John", ["#nameInput", '.nameText']);

// example 3: using array of strings and DOM Element
const name = useState("John", ["#nameInput", document.querySelector('.nameText')]);
```

✅ Automatically syncs with DOM if you provide a selector.

```html
<input id="nameInput" type="text" />
<span class="nameText"></span>

```


### 2. ``useMemo``
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
console.log(sum.value); // 70

```


### 3. ``useEffect``

```js
const { useState, useMemo, useEffect } = RamState();

const count = useState(0);


// runs once at mount
useEffect(() => {
  console.log("Mounted");
}, []);

// re-run whenever count changes
useEffect(() => {
  
  console.log("Count changed:", count.value);
  
  // clean up (optional)
  return () => console.log('clean up');

}, [count]);

// run on every state change
useEffect(() => {
  
  console.log("Something changed!");
  
  // clean up (optional)
  return () => console.log('clean up');

});
```





## 🔑 API Reference

## `RamState(options?)`
Creates a new instance.
```js
const { version, useState, useMemo, useEffect } = RamState();
```



## `useState(initialValue, selectorsOrDOM?)`
Creates a reactive state.   

**Parameters**
- ``initialValue``: ``any`` → Initial state value.
- ``selectorsOrDOM?``: (``null``|``string``|``array``) → DOM element or CSS selector (supports multiple).


**API**
| Method / Prop                              | Description                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `.value` (getter)                          | Returns current state.                                                      |
| `.dom` (getter)                            | Returns array of DOM Elements.                                              |
| `.set(valueOrFn)`                          | Updates state. Accepts value or updater `(prev) => next`.                   |
| `.watch(cb)`                               | Fires on every `.set()` (even if unchanged).                                |
| `.watchEffect(cb, executeOnMount = false)` | Fires only when value changes. Runs immediately if `executeOnMount = true`. |




## ``useMemo(factory, deps)``
Caches computed values and recomputes when dependencies change.

**Parameters**
- ``factory``: ``function`` → Function that computes the value.
- ``deps``: ``array`` → Array of state dependencies.


| Method / Prop     | Description                           |
| ----------------- | ------------------------------------- |
| `.value` (getter) | Returns memoized value.               |
| `.watch(cb)`      | Subscribes to memoized value updates. |




## ``useEffect(callback, deps?)``
Runs a side effect when dependencies change.    

**Parameters**
- ``callback``: ``function`` → Effect function (can return cleanup).
- ``deps``: (``null``|``array``) → Array of state dependencies, or ``null`` for all states.



---
---


## 📜 License

MIT License 