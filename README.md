# RamStateJs JavaScript Library

**Version: 1.5.1**  
**GitHub Repository:** [RamStateJs](https://github.com/ramjam97/ram-state-js)  
**Release Date:** 2024-08-05  

RamStateJs is a lightweight state management library for Vanilla JavaScript with deep cloning, change detection, and subscription-based updates. Handles complex data types `Set`, `Map`, `Date`, `RegExp`, and circular references.

## Features
- Deep cloning to prevent unintended mutations.
- State change detection with optimized updates.
- Subscription-based state watching (`uponSet`, `uponChange`).
- Supports complex data types (Set, Map, Date, RegExp).
- Handles circular references.
- Aliases for commonly used methods (`watch`, `watchChange`).

## Script Tag
```html
<script src="https://cdn.jsdelivr.net/gh/ramjam97/ram-state-js@master/ram-state.min.js"></script>
```

## Usage
### Creating a State Instance
```js
const counter = new RamState(0);
```

### Setting the State
```js
counter.set(10); // Updates state to 10
```
Using a function to update state:
```js
counter.set(prev => prev + 1); // Increments the state
```

### Getting the State
```js
console.log(counter.get()); // 11
console.log(counter.value); // 11
console.log(counter.current); // 11
```

### Watching for Any Set Operation
```js
counter.uponSet(({ hasChange, current, previous, version }) => {
    console.log(`Version: ${version}, Changed: ${hasChange}`);
    console.log(`Previous: ${previous}, Current: ${current}`);
});
```
Alias:
```js
counter.watch(callback);
```

### Watching for State Changes Only
```js
counter.uponChange(({ current, previous, version }) => {
    console.log(`State changed to: ${current}, Previous: ${previous}, Version: ${version}`);
});
```
Aliases:
```js
counter.watchChange(callback);
counter.watchChanges(callback);
```

### Resetting the State
```js
counter.reset(); // Resets to initial value
counter.reset(5); // Resets to 5
```

## API Reference
### `set(value | function)`
Updates the state. Accepts a direct value or a function that returns the new state.

### `get()` / `value` / `current`
Returns a deep clone of the current state.

### `version`
Returns the current version number of the state.

### `uponSet(callback, executeOnInit = false)`
Subscribes to all `set()` operations, even if no actual change occurs. Callback receives an object:
```js
{
    hasChange: boolean,
    current: any,
    previous: any,
    version: number
}
```
Alias: `watch(callback, executeOnInit)`

### `uponChange(callback, executeOnInit = false)`
Subscribes only when the state actually changes. Callback receives:
```js
{
    current: any,
    previous: any,
    version: number
}
```
Aliases: `watchChange(callback, executeOnInit)`, `watchChanges(callback, executeOnInit)`

### `triggerEffects(fx = null | '' | 'set' | 'change')`
Manually triggers effects associated with the state. Useful for re-running effects after external changes.

- If `fx` is equal to `'set'`, it triggers only the set side effects.
- If `fx` is equal to `'change'`, it triggers only the change side effects.

### `triggerSetEffects()`
Manually triggers set side effects, equivalent to `triggerEffects('set')`.

### `triggerChangeEffects()`
Manually triggers change side effects, equivalent to `triggerEffects('change')`.

### `reset(newData = null)`
Resets state to initial value or provided value. Triggers `uponSet` and `uponChange` appropriately.

## Links
- [GitHub Repository](https://github.com/ramjam97/ram-state-js)