[![Hits](https://hits.sh/github.com/ramjam97/ram-state-js.svg)](https://hits.sh/github.com/ramjam97/ram-state-js/)


# RamStateJs

Version: 4.0.0  
GitHub: https://github.com/ramjam97/ram-state-js  
Author: Ram Jam

---

## 📌 Introduction

A **vanilla JavaScript state management library** inspired by React’s ``useState``, ``useEffect``, and ``useMemo`` – but without any framework.   

It helps you manage **stateful data** and **DOM bindings** easily with reactive watchers and side effects.


## 🚀 Features

✅ Framework-independent (pure JavaScript)
- ✅ Reactive states (`useState`)
- ✅ Derived/computed states (`useMemo`)
- ✅ Reactive side effects (`useEffect`)
- ✅ Automatic DOM synchronization (`input`, `checkbox`, `radio`, `select`, `textarea`)
- ✅ View binding via `{ selector: callback }` map
- ✅ Watchers and cleanup support
- ✅ Optimized batched updates using a microtask queue

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

console.log(version) // v4.0.0
```


---

## 🚀 Usage

### 1. `useState(initialValue, model?, view?)`
Creates a reactive state that can be **bound** to **DOM elements** and **watched** for updates.

#### Example 1: Basic Example
```js
const { useState } = RamState();

const name = useState("Ram Jam", "#username");

name.watchEffect(({ value }) => console.log("Name changed:", value));
```

#### Example 2: Checkbox Binding
```html
<input type="checkbox" id="toggle" />
<span id="status"></span>

<script>
  const { useState } = RamState();

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
  const { useState } = RamState();

  const gender = useState("male", 'input[name="gender"]');
  gender.watchEffect(({ value }) => console.log("Selected:", value));
</script>
```

#### Example 4: Multiple Select
```html
<select id="fruits" multiple>
  <option value="apple">Apple</option>
  <option value="orange">Orange</option>
  <option value="banana">Banana</option>
</select>

<script>
  const { useState } = RamState();

  const fruits = useState(["apple"], "#fruits");
  fruits.watchEffect(({ value }) => console.log("Selected fruits:", value));
</script>
```

#### Example 5: View Configuration (DOM Rendering)
```html
<div id="counter"></div>
<div id="mirror"></div>

<script>
  const { useState } = RamState();

  const counter = useState(0, null, {
    "#counter": ({ state }) => state,
    "#mirror": ({ state }) => `Count: ${state}`,
  });

  setInterval(() => counter.set(v => v + 1), 1000);
</script>
```

### 🧭 Watchers
**useState** provides two types of local watchers: `.watch()` and `.watchEffect()`, both supporting cleanup functions that automatically run before each re-execution.

#### `.watch(cb)`
Runs every time `.set()` is called — even if the value didn’t actually change.

- Executes immediately once upon registration `(hasChange = false)`
- Then runs on every `.set()` call
- The callback receives:
```js
{ model, value, hasChange }
```
- If your callback **returns a function**, that function is treated as a **cleanup**, which will run before the watcher re-executes
- Does **not** return an unwatch/stop function

**Example:**
```js
counter.watch(({ value }) => {
  console.log('watch counter:', value);
  return () => console.log('watch clean up value:', value);
});
```

#### `.watchEffect(cb, opt?)`

Runs only when the value **actually changes**.  
Supports `{ immediate: true }` to trigger once right away when registered.
- Executes only when `state.set()` changes the value `(hasChange = true)`
- If `opt.immediate` is `true`, runs once on registration
- The callback receives:
```js
{ model, value }
```
- Supports cleanup functions (returned from callback)
- Does **not** return an unwatch/stop function


**Example:**
```js
counter.watchEffect(({ value }) => {
  console.log('watchEffect counter:', value);
  return () => console.log('watchEffect clean up value:', value);
}, { immediate: true });
```

#### 🧹 Cleanup Behavior
Both watchers support returning a cleanup function:
```js
return () => { /* cleanup logic before next call */ }
```
- Cleanup runs **automatically before** the watcher re-runs
- There’s **no API yet to remove** a watcher — they persist for the lifetime of the state
- Cleanups make it easy to manage event listeners, timers, or subscriptions within watchers

---


### 2. `useMemo(factory, deps)`
Creates a derived/computed state that automatically re-computes when its dependencies change.

```js
const { useState, useMemo } = RamState();

const num1 = useState(10);
const num2 = useState(20);

const sum = useMemo(() => num1.value + num2.value, [num1, num2]);

sum.watch(({ value }) => console.log("Sum updated:", value));

num1.set(50); // → auto recomputes → "Sum updated: 70"
```


### 3. `useEffect(cb, deps?)`
Runs a side effect when specific dependencies change, similar to React’s `useEffect`.   
If no dependencies are provided, it reacts to **all states**.

```js
const { useState, useEffect } = RamState();

const count = useState(0);

// Runs once at mount
useEffect(() => {
  console.log("Mounted");
}, []);

// Runs when count changes
useEffect(() => {
  console.log("Count changed:", count.value);
  return () => console.log("Clean up previous effect");
}, [count]);

// Runs on every state change
useEffect(() => console.log("Something changed!"));
```



## 🔑 API Reference

## `RamState()`
Initializes the library instance.
```js
const { version, useState, useMemo, useEffect } = RamState();
```



## `useState(initialValue, model?, view?)`
Creates a new reactive state.

**Parameters**   
| Name           | Type                                 | Description                                                         |
| -------------- | ------------------------------------ | ------------------------------------------------------------------- |
| `initialValue` | any                                  | Initial value for the state                                         |
| `model?`       | string / HTMLElement / HTMLElement[] | DOM element(s) or selector(s) to bind the state to                  |
| `view?`        | object                               | Optional configuration object mapping selectors to render callbacks |


**Returns**   
A reactive state object with the following API:

| Property / Method        | Description                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| `.value`                 | Get current state value                                                  |
| `.set(valueOrFn)`        | Update state. Accepts direct value or updater function `(prev) => next`. |
| `.model`                 | Array of bound DOM elements                                              |
| `.view`                  | Array of view bindings `{ dom, run }`                                    |
| `.watch(cb)`             | Run on every `.set()` call (even unchanged).                             |
| `.watchEffect(cb, opt?)` | Run only when value changes. Supports `{ immediate: true }`.             |

**DOM Binding Behavior**

| Element Type                             | Behavior                                                 |
| ---------------------------------------- | -------------------------------------------------------- |
| `<input type="text">`                    | Two-way binding of text value                            |
| `<input type="checkbox">`                | Boolean value binding                                    |
| `<input type="radio">`                   | Syncs by comparing `value` attribute with state          |
| `<select>`                               | Single or multiple select support                        |
| `<textarea>`                             | Two-way text binding                                     |
| Other elements (`<div>`, `<span>`, etc.) | Text or HTML rendered via `view` config or `textContent` |


---


## `useMemo(factory, deps)`
Computes and memoizes a derived value.

| Method       | Description                         |
| ------------ | ----------------------------------- |
| `.value`     | Current memoized value              |
| `.watch(cb)` | Subscribe to computed value changes |


---


## `useEffect(cb, deps?)`
Runs side effects with optional cleanup.

| Parameter | Description                                           |
| --------- | ----------------------------------------------------- |
| `cb`      | Callback function (can return a cleanup function)     |
| `deps?`   | Array of state dependencies, or `null` for all states |

---

## ⚡ Performance

RamState batches multiple updates in a **microtask queue**, ensuring efficient DOM updates and reduced layout thrashing.            
All DOM updates, view renders, and watchers are executed asynchronously using:

```js
Promise.resolve().then(flush);
```

## 🧱 Error Handling

All watcher, effect, and render callbacks are executed safely inside a `try/catch` wrapper.   
Any errors are logged with the prefix:

```text
[RamState] error:
```

---

## 📜 License

MIT License 