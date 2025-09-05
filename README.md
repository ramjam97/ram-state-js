# RamStateJs JavaScript Library

## Overview

RamStateJs is a lightweight state management library for Vanilla JavaScript, offering deep cloning, change detection, and subscription-based updates. It supports complex data types such as `Set`, `Map`, `Date`, and `RegExp`, while also handling circular references.

**Version:** 1.6.0\
**Repository:** [GitHub](https://github.com/ramjam97/ram-state-js)\
**Release Date:** 2025-02-27

## Features

- **Deep Cloning**: Ensures state integrity by preventing external mutations.
- **Change Detection**: Updates are tracked efficiently with a version counter.
- **Subscription-Based Updates**: Callbacks for both `set()` operations and actual state changes.
- **Complex Data Type Support**: Handles `Set`, `Map`, `Date`, `RegExp`, and circular references.
- **Manual Effect Triggers**: Allows manual invocation of state-based effects.

## Installation

Include the script directly in your project:

```html
<script src="https://cdn.jsdelivr.net/gh/ramjam97/ram-state-js@master/versions/2.0.0/ram-state.min.js"></script>
```

## Usage

### Creating a State Instance

```js
const counter = new RamState(0);
```

### Setting a Value

```js
counter.set(5);
counter.set(val => val + 1); // Functional update
```

### Getting a Value

```js
console.log(counter.get()); // 6
console.log(counter.data);  // 6 (Alias for get())
```

### Watching for Updates

```js
counter.onSet(({ hasChange, data, version }) => {
    console.log(`State updated: ${data} (Version: ${version}, Changed: ${hasChange})`);
});

counter.onChange(({ data, version }) => {
    console.log(`State changed: ${data} (Version: ${version})`);
});
```

### Resetting State

```js
counter.reset(); // Resets to initial value
counter.reset(10); // Sets new initial value
```

### Triggering Effects Manually

```js
counter.trigger();      // Triggers both set and change effects
counter.triggerSet();   // Triggers only set effects
counter.triggerChange(); // Triggers only change effects
```

## API Reference

### `new RamState(initialData)`

Creates a new state instance with the provided initial value.

### `.set(valueOrUpdater)`

Updates the state with a new value or a function `(prevState) => newState`.

### `.get()` or `.data`

Retrieves the current state as a deep clone.

### `.onSet(callback, executeOnInit = false)`

Subscribes to all `set()` calls, even if no change occurs.

- `callback({ hasChange, data, version })`
- `executeOnInit` (optional) immediately invokes the callback with the current state.

### `.onChange(callback, executeOnInit = false)`

Subscribes to actual state changes.

- `callback({ data, version })`
- `executeOnInit` (optional) immediately invokes the callback with the current state.

### `.reset(newData = null)`

Resets the state to its initial value or a provided new value.

### `.trigger(hasChange = null)`

Manually triggers both `set` and `change` effects.

### `.triggerSet(hasChange = null)`

Manually triggers `set` effects.

### `.triggerChange()`

Manually triggers `change` effects.

---

For more details, visit the official [GitHub repository](https://github.com/ramjam97/ram-state-js). 🚀

