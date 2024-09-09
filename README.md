# RamStateJs v1.3.0
RamStateJs is a lightweight state management library designed specifically for vanilla JavaScript. It provides a simple and efficient way to manage and update state without the need for additional frameworks. It supports both direct and functional updates, offers easy state retrieval, allows side effects to be triggered on state changes, and includes version tracking.


## Features

- **Setters:** Update state directly or using a function.
- **Getters:** Retrieve the current state using a method or a property.
- **Version Tracking:** Track the version of the state with each update.
- **Side Effects:** Execute functions whenever the state changes.
- **Watchers:** Similar to side effects, execute functions on state setting or changing.
- **Reset:** Reset the state to its initial value or a new value, and trigger side effects if defined.


## Usage/Examples
### Instance
Create a new state instance with an initial value.

#### Primitive Values

```javascript
const rNumber = new RamState(10);           // Number
const rString = new RamState("hello");      // String
const rBoolean = new RamState(true);        // Boolean
const rNull = new RamState(null);           // Null
const rUndefined = new RamState(undefined); // Undefined
```

#### Complex Values
```javascript
const rObject = new RamState({ key: 'value' });         // Object
const rArray = new RamState([1, 2, 3]);                 // Array
const rDate = new RamState(new Date());                 // Date
const rRegExp = new RamState(/abc/i);                   // RegExp
const rSet = new RamState(new Set([1, 2, 3]));          // Set
const rMap = new RamState(new Map([['key', 'value']])); // Map
```

### Setters
Update the state directly or using a function.
```javascript
const rCounter = new RamState(0);   // instance variable counter as integer
rCounter.set(5);                    // Direct update
rCounter.set(val => val + 5);       // Functional update
```

### Getters
Retrieve the current state.
```javascript
console.log(rCounter.get());    // Using method
console.log(rCounter.value);    // Using property
console.log(rCounter.current);  // Using property
```

### Version
Access the current version of the state.
```javascript
console.log(rCounter.version);  // Get the version number
```

### Side Effects
#### uponSet / watch
Execute a function whenever the state is set, regardless of whether there is a change. The function is also executed immediately upon setting the **`uponSet`** or **`watch`** callback if **`executeOnInit`** is **`true`**.

##### Example
```javascript
rCounter.uponSet(context => {
    const { version, current, previous, hasChange } = context;
    console.log(`State was set`);
    if (hasChange) {
        console.log(`Data changed from ${previous} to ${current}`);
    } else {
        console.log(`Data remained the same`);
    }
}, true); // Executes immediately upon setting
```
You can use **`watch`** as an alias to **`uponSet`**:
```javascript
rCounter.watch(context => {
    // Similar behavior as `uponSet`
}, true);
```

#### uponChange / watchChange
Execute a function whenever the state changes. The function is also executed immediately upon setting the **`uponChange`** or **`watchChange`** callback if **`executeOnInit`** is **`true`**.
##### Example
```javascript
rCounter.uponChange(context => {
    const { version, current, previous } = context;
    console.log(`Data changed from ${previous} to ${current}`);
    console.log(`Version: ${version}`);
}, true); // Executes immediately upon setting
```
You can use **`watchChange`** as an alias to **`uponChange`**:
```javascript
rCounter.watchChange(context => {
    // Similar behavior as `uponChange`
}, true);
```

### Reset
Reset the state to its initial value or a new value. This method will trigger **`uponSet`** / **`watch`** and **`uponChange`** / **`watchChange`** effects. The **`uponSet`** / **`watch`** effect is triggered regardless of whether the state has changed. The **`uponChange`** / **`watchChange`** effect is triggered only if the new value differs from the current state.

#### Reset to initial value
If no parameter is provided, the state resets to the initial value provided during the instance creation.
```javascript
rCounter.reset(); // Resets to the initial value
```

#### Reset to a new value
You can also reset the state to a new value by providing it as a parameter.
```javascript
rCounter.reset(10); // Resets to the new value 10
```

## Installation
### How to Add RamStateJs to Your Project
To add RamStateJs to your project, you can simply download the **`ram-state.min.js`** file from the repository and include it in your project.

1. Download **`ram-state.min.js`**: 
Download the file from the repository and place it in your project directory.

2. Include RamStateJs in Your Project:
Add the following script tag to your HTML file.

```html
<script src="path/to/ram-state.min.js"></script>
```

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.