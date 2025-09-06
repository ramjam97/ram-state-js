# RamStateJs v2.0.0

A lightweight state management library for Vanilla JavaScript inspired by React's `useState` and `useEffect` APIs.

## Repository
https://github.com/ramjam97/ram-state-js/blob/master/versions/2.0.0/ram-state.min.js

## Features
- Minimal, dependency-free state management.
- `useState` for creating reactive state variables.
- `useEffect` for running side effects with dependency tracking.
- Local watchers (`watch` and `watchEffect`) for fine-grained subscriptions.
- Cleanup support in `useEffect` (similar to React).
- Deep equality check to prevent unnecessary updates.

## Installation
Simply include the `RamState.js` file in your project or install via npm (future release).

```html
<script src="https://cdn.jsdelivr.net/gh/ramjam97/ram-state-js@master/versions/2.0.0/ram-state.min.js"></script>
```

## Usage

### Initializing
```js
const { useState, useEffect } = RamState();
```

### Creating State
```js
const count = useState(0);

console.log(count.get()); // 0

count.set(5);
console.log(count.get()); // 5
```

### Updating State with a Function
```js
count.set(prev => prev + 1);
```

### Watching State Locally
```js
count.watch(({ data, hasChange }) => {
  console.log("Always triggered:", data, "Changed?", hasChange);
}, true);

count.watchEffect(({ data }) => {
  console.log("Only when changed:", data);
}, true);
```

### Global Side Effects
```js
useEffect(() => {
  console.log("Runs once on mount");
}, []);

useEffect(() => {
  console.log("Runs on every state change");
}, null);

useEffect(() => {
  console.log("Runs only when count changes:", count.get());
}, [count]);
```

### Cleanup in `useEffect`
```js
useEffect(() => {
  const id = setInterval(() => {
    console.log("Tick:", count.get());
  }, 1000);

  return () => clearInterval(id); // cleanup
}, [count]);
```

## API Reference

### `useState(initialValue)`
Creates a reactive state object.

Returns:
- `get()` → get current value
- `set(valueOrFn)` → set new value (accepts value or updater function)
- `watch(cb, executeOnMount)` → always runs callback when state updates
- `watchEffect(cb, executeOnMount)` → runs callback only when value changes

### `useEffect(cb, deps)`
Registers a global effect.

- `cb` → effect callback, may return a cleanup function.
- `deps`:
  - `null` → run on every state change.
  - `[]` → run once at mount.
  - `[state1, state2]` → run when any of the listed states change.




For more details, visit the official [GitHub repository](https://github.com/ramjam97/ram-state-js). 🚀
