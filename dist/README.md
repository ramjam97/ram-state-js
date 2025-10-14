
# RamStateJs

Version: 4.0.0  
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
<script src="https://cdn.jsdelivr.net/gh/ramjam97/ram-state-js@v4.0.0/dist/ram-state.min.js"></script>
```


### Initialize RamState

```js
const { version, useState, useMemo, useEffect } = RamState();

// ramstate version
console.log(version) // v4.0.0
```


---

## 🚀 Usage

### 1. ``useState``

#### Example 1: Basic Example
```js
const { useState } = RamState();

const name = useState("Ram Jam", "#username");

name.watchEffect(({ value }) => {
  console.log("Name changed:", value);
});

name.watch(({ value }) => {
  console.log("Name changed:", value);
});
```

#### Example 2: Checkbox Binding
```html
<input type="checkbox" id="toggle" />
<span id="status"></span>

<script>
    const active = useState(false, "#toggle");
    active.watchEffect(({ value }) => {
        document.querySelector("#status").textContent = value ? "Active" : "Inactive";
    });
</script>
```

#### Example 3: Radio Button Binding
```html
<label><input type="radio" name="gender" value="male" /> Male</label>
<label><input type="radio" name="gender" value="female" /> Female</label>

<script>
    const gender = useState("male", 'input[name="gender"]');
    gender.watchEffect(({ value }) => console.log("Selected:", value));
</script>
```

#### Example 4: Multiple Select Example
```html
<select id="fruits" multiple>
  <option value="apple">Apple</option>
  <option value="orange">Orange</option>
  <option value="banana">Banana</option>
</select>

<script>
    const fruits = useState(["apple"], "#fruits");
    fruits.watchEffect(({ value }) => console.log("Selected fruits:", value));
</script>
```

#### Example 5: Render Callback Example
```html
<div id="display"></div>

<script>
    const counter = useState(0, "#display", value => `Count: ${value}`);
    setInterval(() => counter.set(v => v + 1), 1000);
</script>
```

### Watch Callbacks
#### ``watch(cb)``
Runs **every time** ``set()`` is called (even if value didn’t change).
```js
state.watch(({ value, hasChange }) => {
  console.log("Set called, value:", value, "changed?", hasChange);
});
```

#### ``watchEffect(cb, executeOnMount?)``
Runs **only when the value changes**.
```js
state.watchEffect(({ value }) => {
  console.log("Value changed to:", value);
});
```

---


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

## `RamState()`
Creates a new instance.
```js
const { version, useState, useMemo, useEffect } = RamState();
```



## `useState(initialValue, selectorsOrDOM?, renderCb?)`
Creates a reactive state.   

**Parameters**
- ``initialValue``: ``any`` → Initial state value.
- ``selectorsOrDOM?``: (``null``|``string``|``array``) → DOM element or CSS selector (supports multiple).
- ``renderCb?``: (``null``|``function``) → (optional) A render function called when binding non-input elements (like <div>). Receives the latest state value and should return the HTML string or text to display.



**API**
| Method / Prop                              | Description                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `.value` (getter)                          | Returns current state.                                                      |
| `.dom` (getter)                            | Returns array of DOM Elements.                                              |
| `.set(valueOrFn)`                          | Updates state. Accepts value or updater `(prev) => next`.                   |
| `.watch(cb)`                               | Fires on every `.set()` (even if unchanged).                                |
| `.watchEffect(cb, executeOnMount = false)` | Fires only when value changes. Runs immediately if `executeOnMount = true`. |


**Binding Behavior**    
The state automatically syncs both directions between JS and DOM:   
**Supported Bindings:**
| Element                                      | Behavior                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| **`<input type="text">`**                    | Updates value both ways.                                                      |
| **`<input type="checkbox">`**                | Binds boolean value.                                                          |
| **`<input type="radio">`**                   | Syncs by comparing the radio’s `value` with state’s value.                    |
| **`<select>`**                               | Supports single and multiple selection (`multiple` attribute).                |
| **`<textarea>`**                             | Binds text content both ways.                                                 |
| **Other elements (`<div>`, `<span>`, etc.)** | Automatically updates text via `textContent` or custom via `renderCb(value)`. |

---



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


## 📜 License

MIT License 